package io.threadcast.dto.response;

import io.threadcast.domain.Project;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProjectResponse {

    private UUID id;
    private UUID workspaceId;
    private String name;
    private String description;
    private String path;           // Relative path from workspace root
    private String absolutePath;   // Full absolute path
    private String language;
    private String buildTool;
    private int todoCount;
    private int activeTodoCount;
    private LocalDateTime createdAt;

    public static ProjectResponse from(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .workspaceId(project.getWorkspace().getId())
                .name(project.getName())
                .description(project.getDescription())
                .path(project.getPath())
                .absolutePath(project.getAbsolutePath())
                .language(project.getLanguage())
                .buildTool(project.getBuildTool())
                .todoCount(project.getTodos() != null ? project.getTodos().size() : 0)
                .activeTodoCount(project.getTodos() != null ?
                        (int) project.getTodos().stream()
                                .filter(t -> t.getStatus() == io.threadcast.domain.enums.TodoStatus.THREADING)
                                .count() : 0)
                .createdAt(project.getCreatedAt())
                .build();
    }
}
