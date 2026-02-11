package io.threadcast.controller.admin;

import io.threadcast.dto.request.admin.UpdateSettingsRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.admin.AdminSettingsResponse;
import io.threadcast.service.admin.AdminSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
public class AdminSettingsController {

    private final AdminSettingsService settingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminSettingsResponse>> getSettings() {
        AdminSettingsResponse response = settingsService.getSettings();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<AdminSettingsResponse>> updateSettings(
            @RequestBody UpdateSettingsRequest request) {
        AdminSettingsResponse response = settingsService.updateSettings(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
