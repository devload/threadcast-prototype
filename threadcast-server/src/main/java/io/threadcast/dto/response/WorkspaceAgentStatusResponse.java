package io.threadcast.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response containing the status of a Workspace Agent.
 */
@Data
@Builder
public class WorkspaceAgentStatusResponse {

    public enum AgentStatus {
        NOT_RUNNING,    // Agent not spawned
        STARTING,       // Agent is starting up
        IDLE,           // Agent is ready and waiting
        ANALYZING,      // Agent is performing analysis
        ERROR           // Agent encountered an error
    }

    private UUID workspaceId;
    private AgentStatus status;
    private String sessionName;
    private String projectPath;
    private LocalDateTime startedAt;
    private LocalDateTime lastActivityAt;

    /**
     * Current analysis request ID if analyzing.
     */
    private String currentRequestId;

    /**
     * Error message if status is ERROR.
     */
    private String errorMessage;

    public static WorkspaceAgentStatusResponse notRunning(UUID workspaceId) {
        return WorkspaceAgentStatusResponse.builder()
                .workspaceId(workspaceId)
                .status(AgentStatus.NOT_RUNNING)
                .build();
    }
}
