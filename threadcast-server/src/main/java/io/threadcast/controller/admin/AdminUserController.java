package io.threadcast.controller.admin;

import io.threadcast.dto.request.admin.UpdateUserRoleRequest;
import io.threadcast.dto.request.admin.UpdateUserStatusRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.admin.AdminUserResponse;
import io.threadcast.service.admin.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {
        Map<String, Object> response = userService.getUsers(page, size, search, role, status, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        AdminUserResponse response = userService.updateUserRole(id, request.getRole());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        AdminUserResponse response = userService.updateUserStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
