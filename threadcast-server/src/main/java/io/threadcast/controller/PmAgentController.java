package io.threadcast.controller;

import io.threadcast.domain.PmAgent;
import io.threadcast.dto.request.CommandAckRequest;
import io.threadcast.dto.request.PmAgentHeartbeatRequest;
import io.threadcast.dto.request.PmAgentRegisterRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.CommandPollResponse;
import io.threadcast.dto.response.PmAgentStatusResponse;
import io.threadcast.service.AnalysisService;
import io.threadcast.service.PmAgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * PM Agent 관리 API 컨트롤러
 */
@RestController
@RequestMapping("/api/pm-agent")
@RequiredArgsConstructor
@Slf4j
public class PmAgentController {

    private final PmAgentService pmAgentService;
    private final AnalysisService analysisService;

    /**
     * PM Agent 등록/재연결
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<PmAgentStatusResponse>> register(
            @Valid @RequestBody PmAgentRegisterRequest request) {
        try {
            PmAgent agent = pmAgentService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(PmAgentStatusResponse.from(agent)));
        } catch (Exception e) {
            log.error("Failed to register PM Agent", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("REGISTRATION_FAILED", e.getMessage()));
        }
    }

    /**
     * PM Agent 연결 해제
     */
    @PostMapping("/disconnect")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> disconnect(
            @RequestParam UUID workspaceId) {
        try {
            pmAgentService.disconnect(workspaceId);
            return ResponseEntity.ok(ApiResponse.success(Map.of("disconnected", true)));
        } catch (Exception e) {
            log.error("Failed to disconnect PM Agent", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("DISCONNECT_FAILED", e.getMessage()));
        }
    }

    /**
     * Heartbeat 수신
     */
    @PostMapping("/heartbeat")
    public ResponseEntity<ApiResponse<PmAgentStatusResponse>> heartbeat(
            @RequestParam UUID workspaceId,
            @RequestBody(required = false) PmAgentHeartbeatRequest request) {
        try {
            if (request == null) {
                request = new PmAgentHeartbeatRequest();
            }
            PmAgent agent = pmAgentService.heartbeat(workspaceId, request);
            return ResponseEntity.ok(ApiResponse.success(PmAgentStatusResponse.from(agent)));
        } catch (Exception e) {
            log.error("Failed to process heartbeat", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("HEARTBEAT_FAILED", e.getMessage()));
        }
    }

    /**
     * PM Agent 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<PmAgentStatusResponse>> getStatus(
            @RequestParam UUID workspaceId) {
        PmAgentStatusResponse status = pmAgentService.getStatus(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    /**
     * PM Agent 명령 폴링
     * PM Agent가 처리할 대기 중인 명령을 가져옴
     */
    @GetMapping("/command")
    public ResponseEntity<ApiResponse<CommandPollResponse>> pollCommands(
            @RequestParam UUID workspaceId) {
        try {
            CommandPollResponse response = analysisService.pollCommands(workspaceId);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("Failed to poll commands for workspace: {}", workspaceId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("POLL_FAILED", e.getMessage()));
        }
    }

    /**
     * PM Agent 명령 확인 (Acknowledge)
     * PM Agent가 명령을 수신하고 처리 시작했음을 알림
     */
    @PostMapping("/command/ack")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> acknowledgeCommand(
            @Valid @RequestBody CommandAckRequest request) {
        try {
            analysisService.acknowledgeCommand(request);
            return ResponseEntity.ok(ApiResponse.success(Map.of("acknowledged", true)));
        } catch (Exception e) {
            log.error("Failed to acknowledge command: {}", request.getCommandId(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("ACK_FAILED", e.getMessage()));
        }
    }
}
