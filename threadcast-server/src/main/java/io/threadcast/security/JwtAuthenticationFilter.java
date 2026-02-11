package io.threadcast.security;

import io.threadcast.domain.WorkspaceApiKey;
import io.threadcast.service.WorkspaceApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String API_KEY_PREFIX = "tcak_";

    private final JwtTokenProvider jwtTokenProvider;
    private final WorkspaceApiKeyService workspaceApiKeyService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = getTokenFromRequest(request);

            if (StringUtils.hasText(token)) {
                if (token.startsWith(API_KEY_PREFIX)) {
                    authenticateWithApiKey(token, request);
                } else {
                    authenticateWithJwt(token, request);
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticateWithJwt(String jwt, HttpServletRequest request) {
        if (jwtTokenProvider.validateToken(jwt)) {
            UUID userId = jwtTokenProvider.getUserIdFromToken(jwt);
            String email = jwtTokenProvider.getEmailFromToken(jwt);
            String role = jwtTokenProvider.getRoleFromToken(jwt);

            UserPrincipal principal = new UserPrincipal(userId, email, role);
            setAuthentication(principal, request);
        }
    }

    private void authenticateWithApiKey(String rawKey, HttpServletRequest request) {
        Optional<WorkspaceApiKey> apiKeyOpt = workspaceApiKeyService.validateKey(rawKey);
        if (apiKeyOpt.isPresent()) {
            WorkspaceApiKey apiKey = apiKeyOpt.get();
            var user = apiKey.getCreatedBy();

            UserPrincipal principal = new UserPrincipal(user.getId(), user.getEmail(), user.getRole().name());
            setAuthentication(principal, request);

            workspaceApiKeyService.updateLastUsed(apiKey);
        }
    }

    private void setAuthentication(UserPrincipal principal, HttpServletRequest request) {
        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + principal.getRole())
        );
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
