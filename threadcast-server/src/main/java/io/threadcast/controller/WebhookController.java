package io.threadcast.controller;

import io.threadcast.domain.Todo;
import io.threadcast.domain.enums.StepStatus;
import io.threadcast.domain.enums.StepType;
import io.threadcast.dto.request.SessionMappingRequest;
import io.threadcast.dto.request.StepUpdateWebhookRequest;
import io.threadcast.dto.request.SwiftcastWebhookRequest;
import io.threadcast.dto.response.StepProgressResponse;
import io.threadcast.repository.TodoRepository;
import io.threadcast.service.StepProgressService;
import io.threadcast.service.TimelineService;
import io.threadcast.service.terminal.TodoTerminalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Webhook receiver for SwiftCast events.
 * Handles usage logging and AI question detection.
 */
@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final TodoTerminalService terminalService;
    private final StepProgressService stepProgressService;
    private final TimelineService timelineService;
    private final TodoRepository todoRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Step progress update webhook from AI workers.
     * Called when AI enters/completes a step during Todo execution.
     *
     * @param request Step update details
     * @return Updated step progress
     */
    @PostMapping("/step-update")
    public ResponseEntity<StepProgressResponse> handleStepUpdate(
            @RequestBody StepUpdateWebhookRequest request) {

        log.info("Received step update: todoId={}, step={}, status={}, progress={}",
                request.getTodoId(),
                request.getStepType(),
                request.getStatus(),
                request.getProgress());

        try {
            StepProgressResponse response = stepProgressService.processStepUpdate(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to process step update: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Session mapping from SwiftCast Custom Task.
     * Called when Claude Code starts and sends "/tasks register_session" command.
     * Maps Claude's session_id to our todoId for Hook validation.
     *
     * @param request Contains session_id (Claude's) and args (--todo-id=XXX)
     */
    @PostMapping("/session-mapping")
    public ResponseEntity<Map<String, Object>> handleSessionMapping(
            @RequestBody SessionMappingRequest request) {

        log.info("Received session mapping: sessionId={}, args={}",
            request.getSessionId() != null ? request.getSessionId().substring(0, Math.min(12, request.getSessionId().length())) + "..." : "null",
            request.getArgs());

        try {
            // Parse args: --todo-id=XXX --session-name=YYY
            String todoId = null;
            String sessionName = null;

            if (request.getArgs() != null) {
                for (String arg : request.getArgs().split("\\s+")) {
                    if (arg.startsWith("--todo-id=")) {
                        todoId = arg.substring("--todo-id=".length());
                    } else if (arg.startsWith("--session-name=")) {
                        sessionName = arg.substring("--session-name=".length());
                    }
                }
            }

            if (todoId == null || request.getSessionId() == null) {
                log.warn("Missing todoId or sessionId in session mapping request");
                return ResponseEntity.badRequest().body(Map.of("error", "Missing todoId or sessionId"));
            }

            // Save the mapping: SwiftCast session_id -> todoId
            terminalService.registerSwiftCastSessionId(todoId, request.getSessionId());

            log.info("Session mapping registered: todoId={}, swiftcastSessionId={}",
                todoId, request.getSessionId().substring(0, Math.min(12, request.getSessionId().length())) + "...");

            Map<String, Object> response = new HashMap<>();
            response.put("status", "ok");
            response.put("todoId", todoId);
            response.put("sessionName", sessionName);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to process session mapping: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/swiftcast")
    public ResponseEntity<Void> handleSwiftcastWebhook(
            @RequestBody SwiftcastWebhookRequest request) {

        log.info("Received SwiftCast webhook: event={}, todoId={}, sessionId={}",
            request.getEvent(),
            request.getTodoId(),
            request.getSessionId() != null ?
                request.getSessionId().substring(0, Math.min(12, request.getSessionId().length())) + "..." :
                "null");

        try {
            switch (request.getEvent()) {
                case "usage_logged":
                    handleUsageLogged(request);
                    break;
                case "ai_question_detected":
                    handleAIQuestion(request);
                    break;
                case "session_created":
                    handleSessionCreated(request);
                    break;
                case "step_update":
                    handleStepUpdateFromSwiftcast(request);
                    break;
                case "session_complete":
                    handleSessionComplete(request);
                    break;
                default:
                    log.warn("Unknown webhook event: {}", request.getEvent());
            }
        } catch (Exception e) {
            log.error("Failed to process webhook: {}", e.getMessage(), e);
            // Webhook은 실패해도 200 반환 (재시도 방지)
        }

        return ResponseEntity.ok().build();
    }

    private void handleUsageLogged(SwiftcastWebhookRequest request) {
        String todoId = request.getTodoId();

        // todoId가 없으면 sessionId로 매핑 조회
        if (todoId == null && request.getSessionId() != null) {
            var mapping = terminalService.getMappingBySwiftcastSessionId(request.getSessionId());
            if (mapping.isPresent()) {
                todoId = mapping.get().getTodo().getId().toString();
                log.info("Resolved todoId from sessionId: {} -> {}",
                    request.getSessionId().substring(0, Math.min(12, request.getSessionId().length())) + "...",
                    todoId);
            }
        }

        if (todoId == null) {
            log.debug("Usage logged without todoId and no mapping found, skipping");
            return;
        }

        final String resolvedTodoId = todoId;

        // trace_id 매핑에 추가
        terminalService.addTraceId(resolvedTodoId, request.getSessionId());

        // 사용량 정보 추출
        var data = request.getData();
        String model = data.has("model") ? data.get("model").asText() : "unknown";
        long inputTokens = data.has("input_tokens") ? data.get("input_tokens").asLong() : 0;
        long outputTokens = data.has("output_tokens") ? data.get("output_tokens").asLong() : 0;

        // 토큰 사용량 추가
        terminalService.addTokenUsage(resolvedTodoId, inputTokens, outputTokens);

        // WebSocket으로 프론트엔드에 알림
        notifyUsageUpdate(resolvedTodoId, model, inputTokens, outputTokens);

        // response_summary가 있으면 AI 활동 타임라인에 기록
        String responseSummary = data.has("response_summary") ? data.get("response_summary").asText() : null;
        log.info("Checking response_summary: {}", responseSummary != null ? "present" : "null");
        if (responseSummary != null && !responseSummary.isEmpty()) {
            try {
                UUID todoUuid = UUID.fromString(resolvedTodoId);
                var todoOpt = todoRepository.findByIdWithMissionAndWorkspace(todoUuid);
                log.info("Todo lookup result: {}", todoOpt.isPresent() ? "found" : "not found");
                todoOpt.ifPresent(todo -> {
                    timelineService.recordAIActivity(todo, responseSummary, model, inputTokens, outputTokens);
                    log.info("AI activity recorded: todoId={}, summary={}",
                        resolvedTodoId,
                        responseSummary.length() > 50 ? responseSummary.substring(0, 50) + "..." : responseSummary);
                });
            } catch (Exception e) {
                log.warn("Failed to record AI activity: {}", e.getMessage(), e);
            }
        }

        log.info("Usage recorded: todoId={}, model={}, in={}, out={}",
            resolvedTodoId, model, inputTokens, outputTokens);
    }

    private void handleAIQuestion(SwiftcastWebhookRequest request) {
        if (request.getTodoId() == null) {
            log.warn("AI question detected without todoId, cannot process");
            return;
        }

        var data = request.getData();
        String question = data.has("question") ? data.get("question").asText() : "";
        String context = data.has("context") ? data.get("context").asText() : "";

        // WebSocket으로 프론트엔드에 알림
        notifyAIQuestion(request.getTodoId(), question, context);

        log.info("AI question detected: todoId={}, question={}",
            request.getTodoId(),
            question.length() > 50 ? question.substring(0, 50) + "..." : question);
    }

    private void handleSessionCreated(SwiftcastWebhookRequest request) {
        if (request.getTodoId() == null) return;

        terminalService.addTraceId(request.getTodoId(), request.getSessionId());
        log.info("Session created: todoId={}", request.getTodoId());
    }

    /**
     * Handle step_update event from SwiftCast webhook.
     *
     * Records AI activity (tool usage) to timeline for real-time progress tracking.
     * NOTE: This does NOT control step progression - PM manages that via session_complete.
     * Step type here reflects Claude's current tool usage, not the PM-assigned step.
     */
    private void handleStepUpdateFromSwiftcast(SwiftcastWebhookRequest request) {
        if (request.getTodoId() == null) {
            log.debug("Step update without todoId, skipping");
            return;
        }

        var data = request.getData();
        String stepType = data.has("step_type") ? data.get("step_type").asText() : "unknown";
        String status = data.has("status") ? data.get("status").asText() : "unknown";
        String message = data.has("message") ? data.get("message").asText() : "";

        log.debug("SwiftCast step_update: todoId={}, step={}, status={}, message={}",
            request.getTodoId(), stepType, status, message);

        // Record to timeline for real-time progress visibility
        try {
            UUID todoUuid = UUID.fromString(request.getTodoId());
            log.debug("Looking up todo: {}", todoUuid);
            var todoOpt = todoRepository.findByIdWithMissionAndWorkspace(todoUuid);
            if (todoOpt.isPresent()) {
                log.info("Recording step progress to timeline: todoId={}, step={}, message={}",
                    request.getTodoId(), stepType, message);
                timelineService.recordStepProgress(todoOpt.get(), stepType, status, message);
            } else {
                log.warn("Todo not found for step progress: {}", request.getTodoId());
            }
        } catch (Exception e) {
            log.error("Failed to record step progress to timeline: {}", e.getMessage(), e);
        }
    }

    /**
     * Notify frontend about usage update via WebSocket.
     */
    private void notifyUsageUpdate(String todoId, String model, long inputTokens, long outputTokens) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("todoId", todoId);
        payload.put("model", model);
        payload.put("inputTokens", inputTokens);
        payload.put("outputTokens", outputTokens);

        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "USAGE_UPDATE");
        event.put("payload", payload);

        messagingTemplate.convertAndSend("/topic/todos/" + todoId, event);
    }

    /**
     * Notify frontend about AI question via WebSocket.
     */
    private void notifyAIQuestion(String todoId, String question, String context) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("todoId", todoId);
        payload.put("question", question);
        payload.put("context", context);

        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "AI_QUESTION_DETECTED");
        event.put("payload", payload);

        messagingTemplate.convertAndSend("/topic/todos/" + todoId, event);
    }

    /**
     * Handle session_complete event from SwiftCast.
     * Called when Claude finishes with stop_reason "end_turn".
     *
     * Session 검증: Hook의 sessionId가 해당 todoId에 등록된 SwiftCast session ID와 매칭되는지 확인
     */
    private void handleSessionComplete(SwiftcastWebhookRequest request) {
        if (request.getTodoId() == null) {
            log.warn("Session complete without todoId, skipping");
            return;
        }

        String sessionId = request.getSessionId();
        String todoId = request.getTodoId();

        if (sessionId == null) {
            log.warn("Session complete without sessionId, skipping: todoId={}", todoId);
            return;
        }

        // Session 검증: Hook의 sessionId가 등록된 SwiftCast session ID와 매칭되는지 확인
        var mappingOpt = terminalService.getMapping(todoId);
        if (mappingOpt.isEmpty()) {
            log.warn("No session mapping found for todoId={}, processing anyway", todoId);
        } else {
            var mapping = mappingOpt.get();
            String registeredSessionId = mapping.getSwiftcastSessionId();

            if (registeredSessionId == null) {
                // 아직 Custom Task로 session ID 등록 안됨 - 초기 상태
                log.info("Session ID not yet registered via Custom Task for todoId={}, processing anyway", todoId);
            } else if (!registeredSessionId.equals(sessionId)) {
                // 다른 Claude session에서 온 Hook - 무시
                log.warn("Session mismatch! Hook sessionId={} does not match registered sessionId={} for todoId={}",
                    sessionId.substring(0, Math.min(12, sessionId.length())) + "...",
                    registeredSessionId.substring(0, Math.min(12, registeredSessionId.length())) + "...",
                    todoId);
                return;
            } else {
                log.debug("Session verified: todoId={}, sessionId={}...", todoId,
                    sessionId.substring(0, Math.min(12, sessionId.length())));
            }
        }

        var data = request.getData();
        String stopReason = data.has("stop_reason") ? data.get("stop_reason").asText() : "unknown";

        log.info("Session complete: todoId={}, stop_reason={}", todoId, stopReason);

        try {
            // Complete the session - mark current step as COMPLETED and start next step
            stepProgressService.completeSession(UUID.fromString(todoId));

            // Notify frontend via WebSocket
            notifySessionComplete(todoId, stopReason);
        } catch (Exception e) {
            log.error("Failed to complete session: {}", e.getMessage(), e);
        }
    }

    /**
     * Notify frontend about session completion via WebSocket.
     */
    private void notifySessionComplete(String todoId, String stopReason) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("todoId", todoId);
        payload.put("stopReason", stopReason);
        payload.put("status", "WOVEN");

        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "SESSION_COMPLETE");
        event.put("payload", payload);

        messagingTemplate.convertAndSend("/topic/todos/" + todoId, event);
    }
}
