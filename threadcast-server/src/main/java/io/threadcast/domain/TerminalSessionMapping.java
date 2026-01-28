package io.threadcast.domain;

import io.threadcast.domain.enums.SessionStatus;
import io.threadcast.domain.enums.StepType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Maps Todo to terminal session information.
 * Tracks the relationship between:
 * - ThreadCast Todo UUID
 * - SessionCast tmux session name
 * - SwiftCast trace IDs (sentry-trace)
 */
@Entity
@Table(name = "terminal_session_mapping", indexes = {
    @Index(name = "idx_tmux_session_name", columnList = "tmuxSessionName"),
    @Index(name = "idx_session_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TerminalSessionMapping extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "todo_id", nullable = false, unique = true)
    private Todo todo;

    @Column(nullable = false, length = 100)
    private String tmuxSessionName;

    /**
     * List of SwiftCast trace IDs associated with this session.
     * Multiple trace IDs can exist if the session spans multiple API requests.
     */
    @ElementCollection
    @CollectionTable(
        name = "terminal_session_trace_ids",
        joinColumns = @JoinColumn(name = "mapping_id")
    )
    @Column(name = "trace_id", length = 64)
    @Builder.Default
    private List<String> swiftcastTraceIds = new ArrayList<>();

    /**
     * SwiftCast/Claude conversation session ID.
     * Set when Claude Code starts via Custom Task "/tasks register_session".
     * Used to validate incoming Hooks belong to this Todo's session.
     */
    @Column(length = 128)
    private String swiftcastSessionId;

    /**
     * Last activity timestamp for this session.
     */
    private LocalDateTime lastActivityAt;

    /**
     * Current status of the session.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

    /**
     * Total API token usage for this session.
     */
    @Builder.Default
    private Long totalInputTokens = 0L;

    @Builder.Default
    private Long totalOutputTokens = 0L;

    /**
     * Current step assigned by PM.
     * Set when PM sends a step prompt to Claude.
     * Used to determine which step to complete when session_complete arrives.
     * This is the source of truth for step progression, not SwiftCast's tool-based tracking.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private StepType currentPmStep;

    /**
     * Create a new session mapping for a Todo.
     */
    public static TerminalSessionMapping create(Todo todo, String tmuxSessionName) {
        return TerminalSessionMapping.builder()
                .todo(todo)
                .tmuxSessionName(tmuxSessionName)
                .lastActivityAt(LocalDateTime.now())
                .build();
    }

    /**
     * Add a SwiftCast trace ID to this session.
     */
    public void addTraceId(String traceId) {
        if (traceId != null && !swiftcastTraceIds.contains(traceId)) {
            swiftcastTraceIds.add(traceId);
        }
    }

    /**
     * Update activity timestamp.
     */
    public void updateActivity() {
        this.lastActivityAt = LocalDateTime.now();
    }

    /**
     * Add token usage.
     */
    public void addTokenUsage(long inputTokens, long outputTokens) {
        this.totalInputTokens += inputTokens;
        this.totalOutputTokens += outputTokens;
        updateActivity();
    }

    /**
     * Mark session as stopped.
     */
    public void stop() {
        this.status = SessionStatus.STOPPED;
        updateActivity();
    }

    /**
     * Mark session as error.
     */
    public void markError() {
        this.status = SessionStatus.ERROR;
        updateActivity();
    }

    /**
     * Set the current PM-assigned step.
     * Called when PM sends a step prompt to Claude.
     */
    public void setCurrentPmStep(StepType stepType) {
        this.currentPmStep = stepType;
        updateActivity();
    }

    /**
     * Clear the current PM step after completion.
     */
    public void clearCurrentPmStep() {
        this.currentPmStep = null;
    }
}
