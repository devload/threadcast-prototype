package io.threadcast.dto.response.admin;

import io.threadcast.domain.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AdminUserResponse {
    private UUID id;
    private String email;
    private String name;
    private String role;
    private String status;
    private String avatarUrl;
    private int workspaceCount;
    private int autonomyLevel;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    public static AdminUserResponse from(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .status(user.getStatus())
                .avatarUrl(user.getAvatarUrl())
                .workspaceCount(user.getWorkspaces() != null ? user.getWorkspaces().size() : 0)
                .autonomyLevel(user.getAutonomyLevel())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
