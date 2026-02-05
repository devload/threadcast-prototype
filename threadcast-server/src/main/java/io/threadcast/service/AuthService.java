package io.threadcast.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.threadcast.domain.User;
import io.threadcast.domain.Workspace;
import io.threadcast.dto.request.LoginRequest;
import io.threadcast.dto.request.OAuthCallbackRequest;
import io.threadcast.dto.request.RegisterRequest;
import io.threadcast.dto.response.AuthResponse;
import io.threadcast.dto.response.UserResponse;
import io.threadcast.exception.BadRequestException;
import io.threadcast.exception.UnauthorizedException;
import io.threadcast.repository.UserRepository;
import io.threadcast.repository.WorkspaceRepository;
import io.threadcast.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${sessioncast.oauth.auth-url}")
    private String sessioncastAuthUrl;

    @Value("${sessioncast.oauth.client-id}")
    private String sessioncastClientId;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .autonomyLevel(3)
                .build();

        user = userRepository.save(user);

        // Create default workspace (path는 나중에 사용자가 설정)
        String defaultPath = System.getProperty("user.home") + "/.threadcast/workspaces/" + user.getId();
        Workspace workspace = Workspace.create("My Workspace", "Default workspace", defaultPath, user);
        workspaceRepository.save(workspace);

        return generateAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        return generateAuthResponse(user);
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        var userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .expiresIn(86400)
                .build();
    }

    private AuthResponse generateAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(86400)
                .user(UserResponse.from(user))
                .build();
    }

    @Transactional
    public AuthResponse handleOAuthCallback(OAuthCallbackRequest request) {
        log.info("Processing OAuth callback for redirect_uri: {}", request.getRedirectUri());

        // 1. Exchange authorization code for access token
        String accessToken = exchangeCodeForToken(request);

        // 2. Get user info from SessionCast
        JsonNode userInfo = getUserInfo(accessToken);

        String sessioncastId = userInfo.get("sub").asText();
        String email = userInfo.get("email").asText();
        String name = userInfo.has("name") ? userInfo.get("name").asText() : email.split("@")[0];
        String avatarUrl = userInfo.has("picture") ? userInfo.get("picture").asText() : null;

        log.info("OAuth user info - sub: {}, email: {}, name: {}", sessioncastId, email, name);

        // 3. Find or create user
        User user = userRepository.findByEmail(email)
                .map(existingUser -> {
                    // Update SessionCast ID if not set
                    if (existingUser.getSessioncastId() == null) {
                        existingUser.setSessioncastId(sessioncastId);
                        existingUser.setOauthProvider("sessioncast");
                        if (avatarUrl != null && existingUser.getAvatarUrl() == null) {
                            existingUser.setAvatarUrl(avatarUrl);
                        }
                        return userRepository.save(existingUser);
                    }
                    return existingUser;
                })
                .orElseGet(() -> createOAuthUser(sessioncastId, email, name, avatarUrl));

        return generateAuthResponse(user);
    }

    private String exchangeCodeForToken(OAuthCallbackRequest request) {
        String tokenUrl = sessioncastAuthUrl + "/oauth/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", sessioncastClientId);
        body.add("code", request.getCode());
        body.add("redirect_uri", request.getRedirectUri());
        body.add("code_verifier", request.getCodeVerifier());

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    tokenUrl, HttpMethod.POST, entity, String.class);

            JsonNode tokenResponse = objectMapper.readTree(response.getBody());
            return tokenResponse.get("access_token").asText();
        } catch (Exception e) {
            log.error("Failed to exchange code for token", e);
            throw new UnauthorizedException("Failed to authenticate with SessionCast: " + e.getMessage());
        }
    }

    private JsonNode getUserInfo(String accessToken) {
        String userInfoUrl = sessioncastAuthUrl + "/oauth/userinfo";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    userInfoUrl, HttpMethod.GET, entity, String.class);

            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            log.error("Failed to get user info", e);
            throw new UnauthorizedException("Failed to get user info from SessionCast: " + e.getMessage());
        }
    }

    private User createOAuthUser(String sessioncastId, String email, String name, String avatarUrl) {
        log.info("Creating new OAuth user: {}", email);

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString())) // Random password for OAuth users
                .name(name)
                .avatarUrl(avatarUrl)
                .sessioncastId(sessioncastId)
                .oauthProvider("sessioncast")
                .autonomyLevel(3)
                .build();

        user = userRepository.save(user);

        // Create default workspace
        String defaultPath = System.getProperty("user.home") + "/.threadcast/workspaces/" + user.getId();
        Workspace workspace = Workspace.create("My Workspace", "Default workspace", defaultPath, user);
        workspaceRepository.save(workspace);

        return user;
    }
}
