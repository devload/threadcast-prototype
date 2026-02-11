package io.threadcast.controller.admin;

import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.admin.AdminDashboardResponse;
import io.threadcast.service.admin.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboard() {
        AdminDashboardResponse response = dashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
