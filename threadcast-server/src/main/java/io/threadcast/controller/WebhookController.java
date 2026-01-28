package io.threadcast.controller;

import io.threadcast.domain.enums.StepStatus;
import io.threadcast.domain.enums.StepType;
import io.threadcast.dto.request.StepUpdateWebhookRequest;
import io.threadcast.dto.request.SwiftcastWebhookRequest;
import io.threadcast.dto.response.StepProgressResponse;
import io.threadcast.service.StepProgressService;
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
        if (request.getTodoId() == null) {
            log.debug("Usage logged without todoId, skipping");
            return;
        }

        // trace_id 매핑에 추가
        terminalService.addTraceId(request.getTodoId(), request.getSessionId());

        // 사용량 정보 추출
        var data = request.getData();
        String model = data.has("model") ? data.get("model").asText() : "unknown";
        long inputTokens = data.has("input_tokens") ? data.get("input_tokens").asLong() : 0;
        long outputTokens = data.has("output_tokens") ? data.get("output_tokens").asLong() : 0;

        // 토큰 사용량 추가
        terminalService.addTokenUsage(request.getTodoId(), inputTokens, outputTokens);

        // WebSocket으로 프론트엔드에 알림
        notifyUsageUpdate(request.getTodoId(), model, inputTokens, outputTokens);

        log.info("Usage recorded: todoId={}, model={}, in={}, out={}",
            request.getTodoId(), model, inputTokens, outputTokens);
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
     * Converts SwiftCast format to StepUpdateWebhookRequest.
     */
    private void handleStepUpdateFromSwiftcast(SwiftcastWebhookRequest request) {
        if (request.getTodoId() == null) {
            log.warn("Step update without todoId, skipping");
            return;
        }

        var data = request.getData();

        StepUpdateWebhookRequest stepRequest = new StepUpdateWebhookRequest();
        stepRequest.setTodoId(request.getTodoId());
        stepRequest.setSessionId(request.getSessionId());
        stepRequest.setTimestamp(request.getTimestamp());

        // Parse step type
        if (data.has("step_type")) {
            try {
                stepRequest.setStepType(StepType.valueOf(data.get("step_type").asText().toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid step_type: {}", data.get("step_type").asText());
                return;
            }
        }

        // Parse status
        if (data.has("status")) {
            try {
                stepRequest.setStatus(StepStatus.valueOf(data.get("status").asText().toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status: {}", data.get("status").asText());
                return;
            }
        }

        // Parse optional fields
        if (data.has("progress")) {
            stepRequest.setProgress(data.get("progress").asInt());
        }
        if (data.has("message")) {
            stepRequest.setMessage(data.get("message").asText());
        }
        if (data.has("output")) {
            stepRequest.setOutput(data.get("output").asText());
        }

        // Process the step update
        stepProgressService.processStepUpdate(stepRequest);
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
}
