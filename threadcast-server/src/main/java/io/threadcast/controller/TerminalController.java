package io.threadcast.controller;

import io.threadcast.dto.request.SendKeysRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.TerminalStatusResponse;
import io.threadcast.service.terminal.TodoTerminalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * REST API for managing Todo terminal sessions.
 */
@Slf4j
@RestController
@RequestMapping("/api/todos/{todoId}/terminal")
@RequiredArgsConstructor
public class TerminalController {

    private final TodoTerminalService terminalService;
    private final ExecutorService sseExecutor = Executors.newCachedThreadPool();

    /**
     * Start a terminal session for a Todo.
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<String>> startSession(
            @PathVariable String todoId,
            @RequestParam(defaultValue = "true") boolean launchClaude) {
        try {
            String sessionName = terminalService.startSession(todoId)
                .get(10, java.util.concurrent.TimeUnit.SECONDS);

            return ResponseEntity.ok(ApiResponse.success(sessionName));
        } catch (Exception e) {
            log.error("Failed to start terminal for todo {}: {}", todoId, e.getMessage());
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("TERMINAL_START_ERROR", "Failed to start terminal: " + e.getMessage()));
        }
    }

    /**
     * Stop the terminal session for a Todo.
     */
    @DeleteMapping("/stop")
    public ResponseEntity<ApiResponse<Void>> stopSession(@PathVariable String todoId) {
        try {
            terminalService.stopSession(todoId)
                .get(5, java.util.concurrent.TimeUnit.SECONDS);

            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("Failed to stop terminal for todo {}: {}", todoId, e.getMessage());
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("TERMINAL_STOP_ERROR", "Failed to stop terminal: " + e.getMessage()));
        }
    }

    /**
     * Send keys to the Todo's terminal.
     */
    @PostMapping("/sendkeys")
    public ResponseEntity<ApiResponse<Void>> sendKeys(
            @PathVariable String todoId,
            @Valid @RequestBody SendKeysRequest request) {
        try {
            terminalService.sendKeys(todoId, request.getKeys(), request.isEnter())
                .get(5, java.util.concurrent.TimeUnit.SECONDS);

            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("Failed to send keys to todo {}: {}", todoId, e.getMessage());
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("TERMINAL_SENDKEYS_ERROR", "Failed to send keys: " + e.getMessage()));
        }
    }

    /**
     * Get current terminal screen content (one-time capture).
     */
    @GetMapping("/screen")
    public ResponseEntity<ApiResponse<String>> getScreen(@PathVariable String todoId) {
        try {
            String screen = terminalService.captureScreen(todoId);
            return ResponseEntity.ok(ApiResponse.success(screen));
        } catch (Exception e) {
            log.error("Failed to capture screen for todo {}: {}", todoId, e.getMessage());
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("TERMINAL_SCREEN_ERROR", "Failed to capture screen: " + e.getMessage()));
        }
    }

    /**
     * Stream terminal screen updates via Server-Sent Events.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamScreen(@PathVariable String todoId) {
        SseEmitter emitter = new SseEmitter(0L);  // No timeout

        sseExecutor.execute(() -> {
            try {
                var subscription = terminalService.subscribeToScreen(todoId, data -> {
                    try {
                        emitter.send(SseEmitter.event()
                            .name("screen")
                            .data(data.getBase64Content()));
                    } catch (IOException e) {
                        log.debug("SSE send failed for todo {}: {}", todoId, e.getMessage());
                        emitter.completeWithError(e);
                    }
                });

                emitter.onCompletion(subscription::dispose);
                emitter.onTimeout(subscription::dispose);
                emitter.onError(e -> subscription.dispose());

            } catch (Exception e) {
                log.error("Failed to start screen stream for todo {}: {}", todoId, e.getMessage());
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    /**
     * Get terminal status for a Todo.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<TerminalStatusResponse>> getStatus(@PathVariable String todoId) {
        TerminalStatusResponse status = TerminalStatusResponse.builder()
            .connected(terminalService.isConnected())
            .sessionName(terminalService.getSessionName(todoId))
            .sessionActive(terminalService.isSessionActive(todoId))
            .activeSessions(terminalService.getActiveSessions())
            .build();

        return ResponseEntity.ok(ApiResponse.success(status));
    }

    /**
     * Reconnect to SessionCast relay (admin endpoint).
     */
    @PostMapping("/reconnect")
    public ResponseEntity<ApiResponse<Void>> reconnect() {
        try {
            terminalService.reconnect()
                .get(10, java.util.concurrent.TimeUnit.SECONDS);

            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("Failed to reconnect to relay: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("TERMINAL_RECONNECT_ERROR", "Failed to reconnect: " + e.getMessage()));
        }
    }

    /**
     * Answer an AI question by sending keys to the terminal.
     * Converts common answers to appropriate key inputs:
     * - "yes", "y", "true" -> "y"
     * - "no", "n", "false" -> "n"
     * - Other values are sent as-is
     */
    @PostMapping("/answer")
    public ResponseEntity<ApiResponse<Void>> answerQuestion(
            @PathVariable String todoId,
            @RequestParam String answer) {
        try {
            // Convert answer to terminal key
            String key = convertAnswerToKey(answer);

            terminalService.sendKeys(todoId, key, true)
                .get(5, java.util.concurrent.TimeUnit.SECONDS);

            log.info("Sent answer to todo {}: {} -> {}", todoId, answer, key);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("Failed to send answer to todo {}: {}", todoId, e.getMessage());
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("TERMINAL_ANSWER_ERROR", "Failed to send answer: " + e.getMessage()));
        }
    }

    /**
     * Convert human-readable answer to terminal key input.
     */
    private String convertAnswerToKey(String answer) {
        if (answer == null) return "";

        String normalized = answer.toLowerCase().trim();

        return switch (normalized) {
            case "yes", "y", "true", "ok", "확인", "예" -> "y";
            case "no", "n", "false", "cancel", "취소", "아니오" -> "n";
            case "enter", "continue", "proceed", "진행" -> "";  // Just press Enter
            case "escape", "esc", "quit", "종료" -> "Escape";
            default -> answer;  // Send as-is for custom answers
        };
    }
}
