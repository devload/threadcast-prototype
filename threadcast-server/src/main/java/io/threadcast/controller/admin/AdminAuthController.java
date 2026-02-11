package io.threadcast.controller.admin;

import io.threadcast.dto.request.admin.TotpVerifyRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.admin.AdminAuthCheckResponse;
import io.threadcast.dto.response.admin.AdminUserResponse;
import io.threadcast.dto.response.admin.TotpSetupResponse;
import io.threadcast.security.UserPrincipal;
import io.threadcast.service.admin.AdminAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;
    private final Environment environment;

    @GetMapping("/oauth/google")
    public ResponseEntity<Void> redirectToGoogle() {
        String authUrl = adminAuthService.getGoogleAuthUrl();
        return ResponseEntity.status(302)
                .header("Location", authUrl)
                .build();
    }

    @PostMapping("/auth/check")
    public ResponseEntity<ApiResponse<AdminAuthCheckResponse>> checkAuth(
            @RequestBody Map<String, String> request) {
        String tempToken = request.get("tempToken");
        AdminAuthCheckResponse response = adminAuthService.checkAuth(tempToken);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/2fa/setup")
    public ResponseEntity<ApiResponse<TotpSetupResponse>> setupTotp(
            @AuthenticationPrincipal UserPrincipal principal) {
        TotpSetupResponse response = adminAuthService.setupTotp(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyTotp(
            @Valid @RequestBody TotpVerifyRequest request) {
        Map<String, String> response = adminAuthService.verifyTotpAndIssueToken(
                request.getCode(), request.getTempToken());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getCurrentAdmin(
            @AuthenticationPrincipal UserPrincipal principal) {
        AdminUserResponse response = adminAuthService.getCurrentAdmin(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/mock-login")
    public ResponseEntity<ApiResponse<Map<String, String>>> mockLogin() {
        String[] activeProfiles = environment.getActiveProfiles();
        boolean isDevProfile = Arrays.stream(activeProfiles)
                .anyMatch(p -> p.equals("local") || p.equals("dev") || p.equals("demo"));

        if (!isDevProfile) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("FORBIDDEN", "Mock login is only available in dev profiles"));
        }

        Map<String, String> response = adminAuthService.mockLogin();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
