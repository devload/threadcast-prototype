package io.threadcast.controller;

import io.threadcast.domain.PmAgent;
import io.threadcast.dto.request.PmAgentHeartbeatRequest;
import io.threadcast.dto.request.PmAgentRegisterRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.PmAgentStatusResponse;
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
}
