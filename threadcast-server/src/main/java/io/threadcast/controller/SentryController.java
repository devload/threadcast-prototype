package io.threadcast.controller;

import io.threadcast.dto.request.SentryConnectRequest;
import io.threadcast.dto.request.SentryTestRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.SentryIntegrationResponse;
import io.threadcast.service.SentryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sentry")
@RequiredArgsConstructor
public class SentryController {

    private final SentryService sentryService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<SentryIntegrationResponse>> getStatus(
            @RequestParam UUID workspaceId
    ) {
        return sentryService.getStatus(workspaceId)
                .map(integration -> ResponseEntity.ok(ApiResponse.success(integration)))
                .orElse(ResponseEntity.ok(ApiResponse.success(null)));
    }

    @PostMapping("/test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testConnection(
            @Valid @RequestBody SentryTestRequest request
    ) {
        Map<String, Object> result = sentryService.testConnection(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/connect")
    public ResponseEntity<ApiResponse<SentryIntegrationResponse>> connect(
            @Valid @RequestBody SentryConnectRequest request
    ) {
        SentryIntegrationResponse response = sentryService.connect(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<ApiResponse<Void>> disconnect(
            @RequestParam UUID workspaceId
    ) {
        sentryService.disconnect(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
