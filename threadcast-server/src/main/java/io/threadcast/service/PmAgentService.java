package io.threadcast.service;

import io.threadcast.domain.PmAgent;
import io.threadcast.domain.Workspace;
import io.threadcast.domain.enums.PmAgentStatus;
import io.threadcast.dto.request.PmAgentRegisterRequest;
import io.threadcast.dto.request.PmAgentHeartbeatRequest;
import io.threadcast.dto.response.PmAgentStatusResponse;
import io.threadcast.repository.PmAgentRepository;
import io.threadcast.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PmAgentService {

    private final PmAgentRepository pmAgentRepository;
    private final WorkspaceRepository workspaceRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final int HEARTBEAT_TIMEOUT_SECONDS = 60;

    /**
     * PM Agent 등록/재연결
     */
    @Transactional
    public PmAgent register(PmAgentRegisterRequest request) {
        Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found: " + request.getWorkspaceId()));

        PmAgent agent = pmAgentRepository.findByWorkspaceId(request.getWorkspaceId())
                .orElseGet(() -> PmAgent.builder()
                        .workspace(workspace)
                        .machineId(request.getMachineId())
                        .build());

        agent.connect(
                request.getMachineId(),
                request.getLabel(),
                request.getAgentVersion()
        );

        PmAgent saved = pmAgentRepository.save(agent);

        // WebSocket으로 상태 변경 알림
        broadcastStatus(request.getWorkspaceId(), saved);

        log.info("PM Agent registered: workspaceId={}, machineId={}, label={}",
                request.getWorkspaceId(), request.getMachineId(), request.getLabel());

        return saved;
    }

    /**
     * PM Agent 연결 해제
     */
    @Transactional
    public void disconnect(UUID workspaceId) {
        pmAgentRepository.findByWorkspaceId(workspaceId).ifPresent(agent -> {
            agent.disconnect();
            pmAgentRepository.save(agent);

            // WebSocket으로 상태 변경 알림
            broadcastStatus(workspaceId, agent);

            log.info("PM Agent disconnected: workspaceId={}, machineId={}",
                    workspaceId, agent.getMachineId());
        });
    }

    /**
     * Heartbeat 수신
     */
    @Transactional
    public PmAgent heartbeat(UUID workspaceId, PmAgentHeartbeatRequest request) {
        PmAgent agent = pmAgentRepository.findByWorkspaceId(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("PM Agent not found for workspace: " + workspaceId));

        agent.heartbeat();

        if (request.getCurrentTodoId() != null) {
            agent.startWork(request.getCurrentTodoId(), request.getCurrentTodoTitle());
        } else if (agent.getStatus() == PmAgentStatus.WORKING) {
            agent.finishWork();
        }

        if (request.getActiveTodoCount() != null) {
            agent.updateActiveTodoCount(request.getActiveTodoCount());
        }

        PmAgent saved = pmAgentRepository.save(agent);

        // 상태 변경 시에만 브로드캐스트
        broadcastStatus(workspaceId, saved);

        return saved;
    }

    /**
     * PM Agent 상태 조회
     */
    @Transactional(readOnly = true)
    public PmAgentStatusResponse getStatus(UUID workspaceId) {
        Optional<PmAgent> agentOpt = pmAgentRepository.findByWorkspaceId(workspaceId);

        if (agentOpt.isEmpty()) {
            return PmAgentStatusResponse.notConnected();
        }

        PmAgent agent = agentOpt.get();
        return PmAgentStatusResponse.from(agent);
    }

    /**
     * 작업 시작 알림
     */
    @Transactional
    public void notifyWorkStarted(UUID workspaceId, UUID todoId, String todoTitle) {
        pmAgentRepository.findByWorkspaceId(workspaceId).ifPresent(agent -> {
            agent.startWork(todoId, todoTitle);
            pmAgentRepository.save(agent);
            broadcastStatus(workspaceId, agent);
        });
    }

    /**
     * 작업 완료 알림
     */
    @Transactional
    public void notifyWorkFinished(UUID workspaceId) {
        pmAgentRepository.findByWorkspaceId(workspaceId).ifPresent(agent -> {
            agent.finishWork();
            pmAgentRepository.save(agent);
            broadcastStatus(workspaceId, agent);
        });
    }

    /**
     * 타임아웃된 Agent 정리 (60초마다 실행)
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupTimedOutAgents() {
        LocalDateTime threshold = LocalDateTime.now().minusSeconds(HEARTBEAT_TIMEOUT_SECONDS);
        List<PmAgent> timedOutAgents = pmAgentRepository.findTimedOutAgents(threshold);

        for (PmAgent agent : timedOutAgents) {
            log.warn("PM Agent timed out: workspaceId={}, machineId={}, lastHeartbeat={}",
                    agent.getWorkspace().getId(), agent.getMachineId(), agent.getLastHeartbeat());

            agent.disconnect();
            pmAgentRepository.save(agent);
            broadcastStatus(agent.getWorkspace().getId(), agent);
        }

        if (!timedOutAgents.isEmpty()) {
            log.info("Cleaned up {} timed out PM Agents", timedOutAgents.size());
        }
    }

    /**
     * WebSocket으로 상태 브로드캐스트
     */
    private void broadcastStatus(UUID workspaceId, PmAgent agent) {
        try {
            PmAgentStatusResponse status = PmAgentStatusResponse.from(agent);
            messagingTemplate.convertAndSend(
                    "/topic/workspace/" + workspaceId + "/pm-agent",
                    status
            );
        } catch (Exception e) {
            log.warn("Failed to broadcast PM Agent status: {}", e.getMessage());
        }
    }
}
