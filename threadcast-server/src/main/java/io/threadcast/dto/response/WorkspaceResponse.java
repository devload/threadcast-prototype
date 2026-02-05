package io.threadcast.dto.response;

import io.threadcast.domain.Workspace;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.TodoStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class WorkspaceResponse {
    private UUID id;
    private String name;
    private String description;
    private String path;  // Workspace root 경로
    private UUID ownerId;
    private WorkspaceStats stats;
    private List<ProjectSummary> projects;
    private List<MissionSummary> recentMissions;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class WorkspaceStats {
        private int projectCount;
        private int missionCount;
        private int activeMissionCount;
        private int completedMissionCount;
        private int totalTodoCount;
        private int activeTodoCount;
    }

    @Data
    @Builder
    public static class ProjectSummary {
        private UUID id;
        private String name;
        private String path;
        private String language;
        private int todoCount;
    }

    @Data
    @Builder
    public static class MissionSummary {
        private UUID id;
        private String title;
        private MissionStatus status;
        private int progress;
        private LocalDateTime createdAt;
    }

    public static WorkspaceResponse from(Workspace workspace) {
        return from(workspace, false);
    }

    public static WorkspaceResponse from(Workspace workspace, boolean includeDetails) {
        WorkspaceResponseBuilder builder = WorkspaceResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .description(workspace.getDescription())
                .path(workspace.getPath())
                .ownerId(workspace.getOwner().getId())
                .createdAt(workspace.getCreatedAt());

        // Calculate stats
        int projectCount = workspace.getProjects() != null ? workspace.getProjects().size() : 0;
        int missionCount = workspace.getMissions() != null ? workspace.getMissions().size() : 0;
        int activeMissionCount = workspace.getMissions() != null ?
                (int) workspace.getMissions().stream()
                        .filter(m -> m.getStatus() == MissionStatus.THREADING)
                        .count() : 0;
        int completedMissionCount = workspace.getMissions() != null ?
                (int) workspace.getMissions().stream()
                        .filter(m -> m.getStatus() == MissionStatus.WOVEN)
                        .count() : 0;

        int totalTodoCount = 0;
        int activeTodoCount = 0;
        if (workspace.getMissions() != null) {
            for (var mission : workspace.getMissions()) {
                if (mission.getTodos() != null) {
                    totalTodoCount += mission.getTodos().size();
                    activeTodoCount += mission.getTodos().stream()
                            .filter(t -> t.getStatus() == TodoStatus.THREADING)
                            .count();
                }
            }
        }

        builder.stats(WorkspaceStats.builder()
                .projectCount(projectCount)
                .missionCount(missionCount)
                .activeMissionCount(activeMissionCount)
                .completedMissionCount(completedMissionCount)
                .totalTodoCount(totalTodoCount)
                .activeTodoCount(activeTodoCount)
                .build());

        if (includeDetails) {
            // Include project summaries (without todo counts to avoid lazy loading issues)
            if (workspace.getProjects() != null) {
                List<ProjectSummary> projectSummaries = workspace.getProjects().stream()
                        .map(p -> ProjectSummary.builder()
                                .id(p.getId())
                                .name(p.getName())
                                .path(p.getPath())
                                .language(p.getLanguage())
                                .todoCount(0) // TODO: Add proper query for todo count
                                .build())
                        .toList();
                builder.projects(projectSummaries);
            }

            // Include recent missions (last 5)
            if (workspace.getMissions() != null) {
                List<MissionSummary> missionSummaries = workspace.getMissions().stream()
                        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                        .limit(5)
                        .map(m -> MissionSummary.builder()
                                .id(m.getId())
                                .title(m.getTitle())
                                .status(m.getStatus())
                                .progress(m.getProgress())
                                .createdAt(m.getCreatedAt())
                                .build())
                        .toList();
                builder.recentMissions(missionSummaries);
            }
        }

        return builder.build();
    }
}
