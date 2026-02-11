package io.threadcast.dto.response.admin;

import io.threadcast.domain.Workspace;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AdminWorkspaceResponse {
    private UUID id;
    private String name;
    private String description;
    private String ownerName;
    private String ownerEmail;
    private int missionCount;
    private int todoCount;
    private int autonomy;
    private LocalDateTime createdAt;

    public static AdminWorkspaceResponse from(Workspace workspace) {
        int totalTodos = workspace.getMissions() != null
                ? workspace.getMissions().stream()
                    .mapToInt(m -> m.getTodos() != null ? m.getTodos().size() : 0)
                    .sum()
                : 0;

        return AdminWorkspaceResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .description(workspace.getDescription())
                .ownerName(workspace.getOwner() != null ? workspace.getOwner().getName() : "")
                .ownerEmail(workspace.getOwner() != null ? workspace.getOwner().getEmail() : "")
                .missionCount(workspace.getMissions() != null ? workspace.getMissions().size() : 0)
                .todoCount(totalTodos)
                .autonomy(workspace.getAutonomy())
                .createdAt(workspace.getCreatedAt())
                .build();
    }
}
