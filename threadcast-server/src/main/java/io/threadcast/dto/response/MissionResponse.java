package io.threadcast.dto.response;

import io.threadcast.domain.Mission;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.Priority;
import io.threadcast.domain.enums.TodoStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class MissionResponse {

    private UUID id;
    private UUID workspaceId;
    private String workspacePath;  // 프로젝트 root 경로
    private String title;
    private String description;
    private MissionStatus status;
    private Priority priority;
    private Integer progress;
    private Integer estimatedTime;
    private TodoStats todoStats;
    private List<TodoSummary> todos;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Boolean autoStartEnabled;
    private String jiraIssueKey;
    private String jiraIssueUrl;

    @Data
    @Builder
    public static class TodoStats {
        private int total;
        private int pending;
        private int threading;
        private int woven;
        private int tangled;
    }

    @Data
    @Builder
    public static class TodoSummary {
        private UUID id;
        private String title;
        private TodoStatus status;
        private String complexity;
        private Integer orderIndex;
        private String currentStep;
    }

    public static MissionResponse from(Mission mission) {
        return from(mission, false);
    }

    public static MissionResponse from(Mission mission, boolean includeTodos) {
        MissionResponseBuilder builder = MissionResponse.builder()
                .id(mission.getId())
                .workspaceId(mission.getWorkspace() != null ? mission.getWorkspace().getId() : null)
                .workspacePath(mission.getWorkspace() != null ? mission.getWorkspace().getPath() : null)
                .title(mission.getTitle())
                .description(mission.getDescription())
                .status(mission.getStatus())
                .priority(mission.getPriority())
                .progress(mission.getProgress())
                .estimatedTime(mission.getEstimatedTime())
                .createdAt(mission.getCreatedAt())
                .startedAt(mission.getStartedAt())
                .completedAt(mission.getCompletedAt())
                .autoStartEnabled(mission.getAutoStartEnabled())
                .jiraIssueKey(mission.getJiraIssueKey())
                .jiraIssueUrl(mission.getJiraIssueUrl());

        if (mission.getTodos() != null && !mission.getTodos().isEmpty()) {
            TodoStats stats = TodoStats.builder()
                    .total(mission.getTodos().size())
                    .pending((int) mission.getTodos().stream()
                            .filter(t -> t.getStatus() == TodoStatus.PENDING).count())
                    .threading((int) mission.getTodos().stream()
                            .filter(t -> t.getStatus() == TodoStatus.THREADING).count())
                    .woven((int) mission.getTodos().stream()
                            .filter(t -> t.getStatus() == TodoStatus.WOVEN).count())
                    .tangled((int) mission.getTodos().stream()
                            .filter(t -> t.getStatus() == TodoStatus.TANGLED).count())
                    .build();
            builder.todoStats(stats);

            if (includeTodos) {
                List<TodoSummary> todoSummaries = mission.getTodos().stream()
                        .map(t -> TodoSummary.builder()
                                .id(t.getId())
                                .title(t.getTitle())
                                .status(t.getStatus())
                                .complexity(t.getComplexity().name())
                                .orderIndex(t.getOrderIndex())
                                .currentStep(t.getCurrentStep() != null ? t.getCurrentStep().name() : null)
                                .build())
                        .toList();
                builder.todos(todoSummaries);
            }
        } else {
            builder.todoStats(TodoStats.builder()
                    .total(0).pending(0).threading(0).woven(0).tangled(0).build());
        }

        return builder.build();
    }
}
