package io.threadcast.service.admin;

import io.threadcast.domain.User;
import io.threadcast.domain.enums.UserRole;
import io.threadcast.dto.response.admin.AdminAuthCheckResponse;
import io.threadcast.dto.response.admin.AdminUserResponse;
import io.threadcast.dto.response.admin.TotpSetupResponse;
import io.threadcast.exception.BadRequestException;
import io.threadcast.exception.UnauthorizedException;
import io.threadcast.repository.UserRepository;
import io.threadcast.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final TotpService totpService;

    @Value("${threadcast.admin.allowed-domain:sessioncast.io}")
    private String allowedDomain;

    @Value("${threadcast.admin.redirect-url:http://localhost:5174}")
    private String adminRedirectUrl;

    @Value("${threadcast.admin.google.client-id:}")
    private String googleClientId;

    @Value("${threadcast.admin.google.client-secret:}")
    private String googleClientSecret;

    public String getGoogleAuthUrl() {
        return "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + googleClientId
                + "&redirect_uri=" + adminRedirectUrl + "/api/admin/oauth/google/callback"
                + "&response_type=code"
                + "&scope=openid%20email%20profile"
                + "&access_type=offline";
    }

    public AdminAuthCheckResponse checkAuth(String tempToken) {
        if (tempToken == null || tempToken.isEmpty()) {
            return AdminAuthCheckResponse.builder()
                    .isAdmin(false)
                    .totpEnabled(false)
                    .build();
        }

        if (!jwtTokenProvider.validateToken(tempToken)) {
            throw new UnauthorizedException("Invalid or expired token");
        }

        UUID userId = jwtTokenProvider.getUserIdFromToken(tempToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        return AdminAuthCheckResponse.builder()
                .isAdmin(isAdmin)
                .totpEnabled(user.getTotpEnabled())
                .tempToken(tempToken)
                .build();
    }

    @Transactional
    public TotpSetupResponse setupTotp(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        String secret = totpService.generateSecret();
        user.setTotpSecret(secret);
        userRepository.save(user);

        String qrCodeDataUrl = totpService.getQrCodeDataUrl(secret, user.getEmail());

        return TotpSetupResponse.builder()
                .qrCodeDataUrl(qrCodeDataUrl)
                .secret(secret)
                .build();
    }

    @Transactional
    public Map<String, String> verifyTotpAndIssueToken(String code, String tempToken) {
        if (!jwtTokenProvider.validateToken(tempToken)) {
            throw new UnauthorizedException("Invalid or expired token");
        }

        UUID userId = jwtTokenProvider.getUserIdFromToken(tempToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (user.getTotpSecret() == null) {
            throw new BadRequestException("TOTP not set up. Please set up 2FA first.");
        }

        if (!totpService.verifyCode(user.getTotpSecret(), code)) {
            throw new BadRequestException("Invalid TOTP code");
        }

        if (!user.getTotpEnabled()) {
            user.setTotpEnabled(true);
            userRepository.save(user);
        }

        String adminToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), "ADMIN");

        return Map.of("token", adminToken);
    }

    @Transactional
    public Map<String, String> mockLogin() {
        User adminUser = userRepository.findByEmail("admin@threadcast.io")
                .orElseGet(() -> {
                    User newAdmin = User.builder()
                            .email("admin@threadcast.io")
                            .passwordHash("mock")
                            .name("Admin User")
                            .role(UserRole.ADMIN)
                            .totpEnabled(true)
                            .status("active")
                            .build();
                    return userRepository.save(newAdmin);
                });

        if (adminUser.getRole() != UserRole.ADMIN) {
            adminUser.setRole(UserRole.ADMIN);
            userRepository.save(adminUser);
        }

        String token = jwtTokenProvider.generateAccessToken(
                adminUser.getId(), adminUser.getEmail(), "ADMIN");

        return Map.of("token", token);
    }

    public AdminUserResponse getCurrentAdmin(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return AdminUserResponse.from(user);
    }

    public void validateAdminDomain(String email) {
        if (email == null || !email.endsWith("@" + allowedDomain)) {
            throw new UnauthorizedException(
                    "Access denied. Only @" + allowedDomain + " emails are allowed.");
        }
    }
}
