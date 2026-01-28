package io.threadcast.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.threadcast.domain.enums.StepStatus;
import io.threadcast.domain.enums.StepType;
import lombok.Data;

/**
 * Webhook request for step progress updates from AI workers (SwiftCast/SessionCast).
 *
 * AI Worker sends this when entering/completing a step during Todo execution.
 *
 * Example payload:
 * {
 *   "todo_id": "550e8400-e29b-41d4-a716-446655440000",
 *   "step_type": "IMPLEMENTATION",
 *   "status": "IN_PROGRESS",
 *   "progress": 45,
 *   "message": "Implementing JWT token generation...",
 *   "session_id": "swiftcast-session-123"
 * }
 */
@Data
public class StepUpdateWebhookRequest {

    @JsonProperty("todo_id")
    private String todoId;

    @JsonProperty("step_type")
    private StepType stepType;

    /**
     * Step status: PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED
     */
    private StepStatus status;

    /**
     * Progress percentage (0-100) within the current step.
     * Optional - only meaningful for IN_PROGRESS status.
     */
    private Integer progress;

    /**
     * Human-readable message describing current activity.
     * e.g., "Analyzing code structure...", "Writing unit tests..."
     */
    private String message;

    /**
     * Output or result of the step (for COMPLETED status).
     * May contain code, logs, or summary text.
     */
    private String output;

    /**
     * Session ID from the AI worker (SwiftCast/SessionCast).
     * Used for tracing and correlation.
     */
    @JsonProperty("session_id")
    private String sessionId;

    /**
     * Timestamp when this event occurred (Unix milliseconds).
     * If not provided, server uses current time.
     */
    private Long timestamp;
}
