package io.threadcast.controller;

import io.threadcast.domain.User;
import io.threadcast.dto.request.LoginRequest;
import io.threadcast.dto.request.OAuthCallbackRequest;
import io.threadcast.dto.request.RegisterRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.AuthResponse;
import io.threadcast.dto.response.UserResponse;
import io.threadcast.repository.UserRepository;
import io.threadcast.security.UserPrincipal;
import io.threadcast.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal UserPrincipal principal) {
        // JWT is stateless, so logout is primarily handled client-side by removing tokens.
        // This endpoint exists to complete the API contract and for future token blacklisting.
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/oauth/callback")
    public ResponseEntity<ApiResponse<AuthResponse>> oauthCallback(@Valid @RequestBody OAuthCallbackRequest request) {
        AuthResponse response = authService.handleOAuthCallback(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        // Return 401 if not authenticated
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }

        // Return 401 if user no longer exists (e.g., after DB reset)
        return userRepository.findById(principal.getId())
                .map(user -> ResponseEntity.ok(ApiResponse.success(UserResponse.from(user))))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("UNAUTHORIZED", "User session expired")));
    }
}
