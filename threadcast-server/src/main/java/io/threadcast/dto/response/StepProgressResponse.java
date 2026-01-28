package io.threadcast.dto.response;

import io.threadcast.domain.TodoStep;
import io.threadcast.domain.enums.StepStatus;
import io.threadcast.domain.enums.StepType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for step progress updates.
 * Sent via WebSocket to notify frontend of step changes.
 */
@Data
@Builder
public class StepProgressResponse {

    private UUID todoId;
    private UUID missionId;
    private UUID stepId;
    private StepType stepType;
    private StepStatus status;

    /**
     * Progress percentage (0-100) within the current step.
     */
    private Integer progress;

    /**
     * Human-readable message describing current activity.
     */
    private String message;

    /**
     * Step output (for completed steps).
     */
    private String output;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    /**
     * Overall Todo completion stats.
     */
    private Integer completedSteps;
    private Integer totalSteps;

    public static StepProgressResponse from(TodoStep step, Integer progress, String message) {
        int completedCount = (int) step.getTodo().getSteps().stream()
                .filter(s -> s.getStatus() == StepStatus.COMPLETED)
                .count();

        return StepProgressResponse.builder()
                .todoId(step.getTodo().getId())
                .missionId(step.getTodo().getMission().getId())
                .stepId(step.getId())
                .stepType(step.getStepType())
                .status(step.getStatus())
                .progress(progress)
                .message(message)
                .output(step.getOutput())
                .startedAt(step.getStartedAt())
                .completedAt(step.getCompletedAt())
                .completedSteps(completedCount)
                .totalSteps(step.getTodo().getSteps().size())
                .build();
    }
}
