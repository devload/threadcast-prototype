package io.threadcast.dto.response.admin;

import io.threadcast.domain.Mission;
import io.threadcast.domain.enums.TodoStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AdminMissionResponse {
    private UUID id;
    private String title;
    private String description;
    private String workspaceName;
    private UUID workspaceId;
    private String status;
    private String priority;
    private int progress;
    private TodoStats todoStats;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @Data
    @Builder
    public static class TodoStats {
        private long pending;
        private long threading;
        private long woven;
        private long tangled;
    }

    public static AdminMissionResponse from(Mission mission) {
        TodoStats stats = TodoStats.builder()
                .pending(mission.getTodos() != null
                        ? mission.getTodos().stream().filter(t -> t.getStatus() == TodoStatus.PENDING).count() : 0)
                .threading(mission.getTodos() != null
                        ? mission.getTodos().stream().filter(t -> t.getStatus() == TodoStatus.THREADING).count() : 0)
                .woven(mission.getTodos() != null
                        ? mission.getTodos().stream().filter(t -> t.getStatus() == TodoStatus.WOVEN).count() : 0)
                .tangled(mission.getTodos() != null
                        ? mission.getTodos().stream().filter(t -> t.getStatus() == TodoStatus.TANGLED).count() : 0)
                .build();

        return AdminMissionResponse.builder()
                .id(mission.getId())
                .title(mission.getTitle())
                .description(mission.getDescription())
                .workspaceName(mission.getWorkspace() != null ? mission.getWorkspace().getName() : "")
                .workspaceId(mission.getWorkspace() != null ? mission.getWorkspace().getId() : null)
                .status(mission.getStatus().name())
                .priority(mission.getPriority().name())
                .progress(mission.getProgress())
                .todoStats(stats)
                .createdAt(mission.getCreatedAt())
                .startedAt(mission.getStartedAt())
                .completedAt(mission.getCompletedAt())
                .build();
    }
}
