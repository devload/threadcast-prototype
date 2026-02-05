package io.threadcast.dto.response;

import io.threadcast.domain.PmAgent;
import io.threadcast.domain.enums.PmAgentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PmAgentStatusResponse {

    private UUID id;
    private UUID workspaceId;
    private String machineId;
    private String label;
    private PmAgentStatus status;
    private boolean online;
    private LocalDateTime lastHeartbeat;
    private UUID currentTodoId;
    private String currentTodoTitle;
    private Integer activeTodoCount;
    private String agentVersion;
    private LocalDateTime connectedAt;
    private LocalDateTime disconnectedAt;

    public static PmAgentStatusResponse from(PmAgent agent) {
        return PmAgentStatusResponse.builder()
                .id(agent.getId())
                .workspaceId(agent.getWorkspace().getId())
                .machineId(agent.getMachineId())
                .label(agent.getLabel())
                .status(agent.getEffectiveStatus())
                .online(agent.isOnline())
                .lastHeartbeat(agent.getLastHeartbeat())
                .currentTodoId(agent.getCurrentTodoId())
                .currentTodoTitle(agent.getCurrentTodoTitle())
                .activeTodoCount(agent.getActiveTodoCount())
                .agentVersion(agent.getAgentVersion())
                .connectedAt(agent.getConnectedAt())
                .disconnectedAt(agent.getDisconnectedAt())
                .build();
    }

    public static PmAgentStatusResponse notConnected() {
        return PmAgentStatusResponse.builder()
                .status(PmAgentStatus.DISCONNECTED)
                .online(false)
                .activeTodoCount(0)
                .build();
    }
}
