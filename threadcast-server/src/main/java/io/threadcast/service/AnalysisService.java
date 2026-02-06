package io.threadcast.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.threadcast.domain.AnalysisRequest;
import io.threadcast.domain.Mission;
import io.threadcast.domain.PmAgentCommand;
import io.threadcast.domain.Workspace;
import io.threadcast.domain.enums.AnalysisStatus;
import io.threadcast.domain.enums.CommandStatus;
import io.threadcast.domain.enums.CommandType;
import io.threadcast.dto.request.AnalysisCallbackRequest;
import io.threadcast.dto.request.CommandAckRequest;
import io.threadcast.dto.request.CreateAnalysisRequest;
import io.threadcast.dto.response.AnalysisRequestResponse;
import io.threadcast.dto.response.CommandPollResponse;
import io.threadcast.dto.response.PmAgentCommandResponse;
import io.threadcast.exception.BadRequestException;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.AnalysisRequestRepository;
import io.threadcast.repository.MissionRepository;
import io.threadcast.repository.PmAgentCommandRepository;
import io.threadcast.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final AnalysisRequestRepository analysisRequestRepository;
    private final PmAgentCommandRepository commandRepository;
    private final WorkspaceRepository workspaceRepository;
    private final MissionRepository missionRepository;
    private final WebSocketService webSocketService;
    private final ObjectMapper objectMapper;

    @Value("${server.port:21000}")
    private int serverPort;

    @Value("${threadcast.callback.host:localhost}")
    private String callbackHost;

    /**
     * 분석 요청을 생성하고 PM Agent 명령 큐에 추가
     */
    @Transactional
    public AnalysisRequestResponse createAnalysisRequest(CreateAnalysisRequest request) {
        Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + request.getWorkspaceId()));

        Mission mission = null;
        String missionTitle = request.getMissionTitle();
        String missionDescription = request.getMissionDescription();

        if (request.getMissionId() != null) {
            mission = missionRepository.findById(request.getMissionId())
                    .orElseThrow(() -> new NotFoundException("Mission not found: " + request.getMissionId()));
            missionTitle = mission.getTitle();
            missionDescription = mission.getDescription();
        }

        // AnalysisRequest 엔티티 생성
        AnalysisRequest analysisRequest = AnalysisRequest.create(
                workspace, mission, missionTitle, missionDescription, request.getAnalysisType());
        analysisRequest = analysisRequestRepository.save(analysisRequest);

        // PM Agent용 명령 생성
        PmAgentCommand command = createAnalyzeCommand(workspace, analysisRequest, missionTitle, missionDescription);
        commandRepository.save(command);

        log.info("Analysis request created: {} for workspace: {}", analysisRequest.getId(), workspace.getId());

        return AnalysisRequestResponse.from(analysisRequest);
    }

    private PmAgentCommand createAnalyzeCommand(Workspace workspace, AnalysisRequest analysisRequest,
                                                 String missionTitle, String missionDescription) {
        String callbackUrl = String.format("http://%s:%d/api/webhooks/analysis-callback", callbackHost, serverPort);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("requestId", analysisRequest.getId().toString());
        payload.put("missionId", analysisRequest.getMission() != null ? analysisRequest.getMission().getId().toString() : null);
        payload.put("missionTitle", missionTitle);
        payload.put("missionDescription", missionDescription);
        payload.put("projectPath", workspace.getPath());
        payload.put("callbackUrl", callbackUrl);

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize payload", e);
        }

        return PmAgentCommand.create(workspace, CommandType.ANALYZE_MISSION, payloadJson);
    }

    /**
     * PM Agent가 명령을 폴링
     */
    @Transactional(readOnly = true)
    public CommandPollResponse pollCommands(UUID workspaceId) {
        List<PmAgentCommand> pendingCommands = commandRepository
                .findByWorkspaceIdAndStatus(workspaceId, CommandStatus.PENDING);

        List<PmAgentCommandResponse> responses = pendingCommands.stream()
                .map(cmd -> {
                    Object payload = parsePayload(cmd.getPayloadJson());
                    return PmAgentCommandResponse.from(cmd, payload);
                })
                .collect(Collectors.toList());

        return CommandPollResponse.of(responses);
    }

    private Object parsePayload(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(payloadJson, Map.class);
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse payload JSON: {}", e.getMessage());
            return payloadJson;
        }
    }

    /**
     * PM Agent가 명령 확인
     */
    @Transactional
    public void acknowledgeCommand(CommandAckRequest request) {
        PmAgentCommand command = commandRepository.findById(request.getCommandId())
                .orElseThrow(() -> new NotFoundException("Command not found: " + request.getCommandId()));

        if ("PROCESSING".equals(request.getStatus())) {
            command.acknowledge();
            commandRepository.save(command);

            // 관련 AnalysisRequest도 처리 중으로 변경
            updateAnalysisRequestToProcessing(command);

            log.info("Command acknowledged: {}", command.getId());
        } else if ("COMPLETED".equals(request.getStatus())) {
            command.complete();
            commandRepository.save(command);
            log.info("Command completed: {}", command.getId());
        }
    }

    private void updateAnalysisRequestToProcessing(PmAgentCommand command) {
        if (command.getType() == CommandType.ANALYZE_MISSION) {
            Map<String, Object> payload = (Map<String, Object>) parsePayload(command.getPayloadJson());
            if (payload != null && payload.containsKey("requestId")) {
                UUID requestId = UUID.fromString((String) payload.get("requestId"));
                analysisRequestRepository.findById(requestId).ifPresent(ar -> {
                    ar.startProcessing();
                    analysisRequestRepository.save(ar);
                });
            }
        }
    }

    /**
     * Workspace Agent가 분석 결과를 콜백
     */
    @Transactional
    public void handleAnalysisCallback(AnalysisCallbackRequest request) {
        AnalysisRequest analysisRequest = analysisRequestRepository.findById(request.getRequestId())
                .orElseThrow(() -> new NotFoundException("Analysis request not found: " + request.getRequestId()));

        if ("SUCCESS".equals(request.getStatus())) {
            String resultJson;
            try {
                resultJson = objectMapper.writeValueAsString(request.getAnalysis());
            } catch (JsonProcessingException e) {
                resultJson = request.getAnalysis() != null ? request.getAnalysis().toString() : null;
            }
            analysisRequest.complete(resultJson);
            log.info("Analysis completed successfully: {}", analysisRequest.getId());
        } else if ("FAILED".equals(request.getStatus())) {
            analysisRequest.fail(request.getErrorMessage());
            log.warn("Analysis failed: {} - {}", analysisRequest.getId(), request.getErrorMessage());
        }

        analysisRequestRepository.save(analysisRequest);

        // 관련 Command도 완료 처리
        completeRelatedCommand(analysisRequest);

        // WebSocket으로 Frontend에 알림
        webSocketService.notifyAnalysisCompleted(
                analysisRequest.getWorkspace().getId(),
                analysisRequest.getId(),
                analysisRequest.getStatus().name(),
                request.getAnalysis()
        );
    }

    private void completeRelatedCommand(AnalysisRequest analysisRequest) {
        // ANALYZE_MISSION 타입의 ACKNOWLEDGED 상태 명령 찾기
        List<PmAgentCommand> commands = commandRepository.findByWorkspaceIdAndTypeAndStatus(
                analysisRequest.getWorkspace().getId(),
                CommandType.ANALYZE_MISSION,
                CommandStatus.ACKNOWLEDGED
        );

        for (PmAgentCommand cmd : commands) {
            Map<String, Object> payload = (Map<String, Object>) parsePayload(cmd.getPayloadJson());
            if (payload != null && payload.containsKey("requestId")) {
                UUID requestId = UUID.fromString((String) payload.get("requestId"));
                if (requestId.equals(analysisRequest.getId())) {
                    cmd.complete();
                    commandRepository.save(cmd);
                    break;
                }
            }
        }
    }

    /**
     * 분석 요청 상태 조회
     */
    @Transactional(readOnly = true)
    public AnalysisRequestResponse getAnalysisRequest(UUID requestId) {
        AnalysisRequest analysisRequest = analysisRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Analysis request not found: " + requestId));
        return AnalysisRequestResponse.from(analysisRequest);
    }

    /**
     * 워크스페이스의 최근 분석 요청 목록 조회
     */
    @Transactional(readOnly = true)
    public List<AnalysisRequestResponse> getRecentAnalysisRequests(UUID workspaceId, int limit) {
        List<AnalysisRequest> requests = analysisRequestRepository
                .findByWorkspaceIdAndStatusIn(workspaceId,
                        Arrays.asList(AnalysisStatus.QUEUED, AnalysisStatus.PROCESSING, AnalysisStatus.COMPLETED, AnalysisStatus.FAILED));

        return requests.stream()
                .limit(limit)
                .map(AnalysisRequestResponse::from)
                .collect(Collectors.toList());
    }
}
