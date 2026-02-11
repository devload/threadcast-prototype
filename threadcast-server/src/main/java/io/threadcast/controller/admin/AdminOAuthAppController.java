package io.threadcast.controller.admin;

import io.threadcast.dto.request.admin.CreateOAuthAppRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.admin.OAuthAppResponse;
import io.threadcast.service.admin.AdminOAuthAppService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/oauth-apps")
@RequiredArgsConstructor
public class AdminOAuthAppController {

    private final AdminOAuthAppService oauthAppService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OAuthAppResponse>>> listApps() {
        List<OAuthAppResponse> apps = oauthAppService.listApps();
        return ResponseEntity.ok(ApiResponse.success(apps));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OAuthAppResponse>> createApp(
            @Valid @RequestBody CreateOAuthAppRequest request) {
        OAuthAppResponse response = oauthAppService.createApp(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteApp(@PathVariable UUID id) {
        oauthAppService.deleteApp(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/regenerate-secret")
    public ResponseEntity<ApiResponse<OAuthAppResponse>> regenerateSecret(@PathVariable UUID id) {
        OAuthAppResponse response = oauthAppService.regenerateSecret(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
