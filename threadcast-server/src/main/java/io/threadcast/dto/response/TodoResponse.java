package io.threadcast.dto.response;

import io.threadcast.domain.Todo;
import io.threadcast.domain.TodoStep;
import io.threadcast.domain.enums.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TodoResponse {

    private UUID id;
    private UUID missionId;
    private String missionTitle;
    private UUID projectId;         // 작업할 프로젝트 (optional)
    private String projectName;     // 프로젝트 이름
    private String workingPath;     // 실제 작업 경로 (project or workspace)
    private String worktreePath;    // 이 Todo의 worktree 경로
    private String title;
    private String description;
    private TodoStatus status;
    private Priority priority;
    private Complexity complexity;
    private Integer orderIndex;
    private Integer estimatedTime;
    private Integer actualTime;
    private String currentStep;
    private List<StepResponse> steps;
    private List<DependencyResponse> dependencies;
    private List<UUID> dependentIds;  // Todos that depend on this one
    private Boolean isBlocked;        // Has unmet dependencies
    private Boolean isReadyToStart;   // PENDING with all dependencies met
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @Data
    @Builder
    public static class StepResponse {
        private UUID id;
        private UUID todoId;
        private StepType stepType;
        private StepStatus status;
        private String notes;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
    }

    @Data
    @Builder
    public static class DependencyResponse {
        private UUID id;
        private String title;
        private TodoStatus status;
    }

    public static TodoResponse from(Todo todo) {
        return from(todo, true);
    }

    public static TodoResponse from(Todo todo, boolean includeDetails) {
        var project = todo.getProject();
        TodoResponseBuilder builder = TodoResponse.builder()
                .id(todo.getId())
                .missionId(todo.getMission().getId())
                .missionTitle(todo.getMission().getTitle())
                .projectId(project != null ? project.getId() : null)
                .projectName(project != null ? project.getName() : null)
                .workingPath(todo.getWorkingPath())
                .worktreePath(todo.getWorktreePath())
                .title(todo.getTitle())
                .description(todo.getDescription())
                .status(todo.getStatus())
                .priority(todo.getPriority())
                .complexity(todo.getComplexity())
                .orderIndex(todo.getOrderIndex())
                .estimatedTime(todo.getEstimatedTime())
                .actualTime(todo.getActualTime())
                .currentStep(todo.getCurrentStep() != null ? todo.getCurrentStep().name() : null)
                .createdAt(todo.getCreatedAt())
                .startedAt(todo.getStartedAt())
                .completedAt(todo.getCompletedAt());

        if (includeDetails && todo.getSteps() != null) {
            List<StepResponse> stepResponses = todo.getSteps().stream()
                    .map(TodoResponse::mapStep)
                    .toList();
            builder.steps(stepResponses);
        }

        if (includeDetails && todo.getDependencies() != null) {
            List<DependencyResponse> depResponses = todo.getDependencies().stream()
                    .map(d -> DependencyResponse.builder()
                            .id(d.getId())
                            .title(d.getTitle())
                            .status(d.getStatus())
                            .build())
                    .toList();
            builder.dependencies(depResponses);
        }

        // Set dependency state flags
        builder.isBlocked(todo.isBlocked());
        builder.isReadyToStart(todo.isReadyToStart());

        return builder.build();
    }

    private static StepResponse mapStep(TodoStep step) {
        return StepResponse.builder()
                .id(step.getId())
                .todoId(step.getTodo().getId())
                .stepType(step.getStepType())
                .status(step.getStatus())
                .notes(step.getOutput())
                .startedAt(step.getStartedAt())
                .completedAt(step.getCompletedAt())
                .build();
    }
}
