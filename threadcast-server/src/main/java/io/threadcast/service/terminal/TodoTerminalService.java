package io.threadcast.service.terminal;

import io.sessioncast.core.SessionCastClient;
import io.sessioncast.core.event.Disposable;
import io.sessioncast.core.screen.ScreenData;
import io.sessioncast.core.tmux.TmuxController;
import io.threadcast.domain.TerminalSessionMapping;
import io.threadcast.domain.Todo;
import io.threadcast.repository.TerminalSessionMappingRepository;
import io.threadcast.repository.TodoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/**
 * Service for managing tmux terminal sessions for Todos.
 * Integrates with SessionCast for real-time terminal streaming.
 */
@Slf4j
@Service
public class TodoTerminalService {

    private final SessionCastClient sessionCast;
    private final TmuxController tmuxController;
    private final TodoRepository todoRepository;
    private final TerminalSessionMappingRepository mappingRepository;
    private final io.threadcast.service.StepProgressService stepProgressService;

    // Track active sessions: todoId -> sessionName
    private final Map<String, String> activeSessions = new ConcurrentHashMap<>();

    // Track screen subscriptions
    private final Map<String, Disposable> screenSubscriptions = new ConcurrentHashMap<>();

    public TodoTerminalService(
            SessionCastClient sessionCast,
            TmuxController tmuxController,
            TodoRepository todoRepository,
            TerminalSessionMappingRepository mappingRepository,
            @org.springframework.context.annotation.Lazy io.threadcast.service.StepProgressService stepProgressService) {
        this.sessionCast = sessionCast;
        this.tmuxController = tmuxController;
        this.todoRepository = todoRepository;
        this.mappingRepository = mappingRepository;
        this.stepProgressService = stepProgressService;

        // Connect to relay on service init
        connectToRelay();
    }

    private void connectToRelay() {
        sessionCast.connect()
            .thenRun(() -> log.info("Connected to SessionCast relay"))
            .exceptionally(e -> {
                log.warn("Failed to connect to SessionCast relay: {}", e.getMessage());
                return null;
            });
    }

    /**
     * Get session name for a Todo.
     */
    public String getSessionName(String todoId) {
        return "todo-" + todoId;
    }

    /**
     * Start a terminal session for a Todo.
     *
     * @param todoId     The Todo ID
     * @param workDir    Working directory for the session
     * @param autoLaunchClaude Whether to automatically launch Claude Code
     * @return CompletableFuture with session name
     */
    @Transactional
    public CompletableFuture<String> startSession(String todoId, String workDir, boolean autoLaunchClaude) {
        String sessionName = getSessionName(todoId);

        if (activeSessions.containsKey(todoId)) {
            log.info("Session already exists for todo: {}", todoId);
            return CompletableFuture.completedFuture(sessionName);
        }

        // Todo와 Mission 정보 조회 (트랜잭션 내에서 미리 가져옴)
        UUID todoUuid = UUID.fromString(todoId);
        Todo todo = todoRepository.findById(todoUuid)
            .orElseThrow(() -> new IllegalArgumentException("Todo not found: " + todoId));
        String missionId = todo.getMission().getId().toString();
        String missionTitle = todo.getMission().getTitle();
        String todoTitle = todo.getTitle();
        String todoDescription = todo.getDescription() != null ? todo.getDescription() : "";

        return sessionCast.createSession(sessionName, workDir)
            .thenCompose(name -> {
                activeSessions.put(todoId, sessionName);

                // 매핑 테이블에 저장
                saveSessionMapping(todo, sessionName);

                log.info("Created terminal session for todo {}: {}", todoId, sessionName);

                if (autoLaunchClaude) {
                    // Launch Claude Code with environment variables and TODO info
                    return launchClaudeWithEnv(name, todoId, missionId, missionTitle, todoTitle, todoDescription);
                }

                return CompletableFuture.completedFuture(name);
            });
    }

    /**
     * Launch Claude Code with ThreadCast environment variables.
     * Uses --dangerously-skip-permissions for automation.
     */
    private CompletableFuture<String> launchClaudeWithEnv(
            String sessionName, String todoId, String missionId,
            String missionTitle, String todoTitle, String todoDescription) {

        // 환경변수 설정 + Claude 실행 명령 (--dangerously-skip-permissions for automation)
        // Note: SENTRY_TRACE is NOT set - Claude uses its natural session_id
        // register_session custom task will map Claude's session_id to our todo_id
        String launchCommand = String.format(
            "export THREADCAST_TODO_ID=%s && " +
            "export THREADCAST_MISSION_ID=%s && " +
            "export THREADCAST_SESSION=%s && " +
            "claude --dangerously-skip-permissions",
            todoId, missionId, sessionName
        );

        return sessionCast.sendKeys(sessionName, launchCommand, true)
            .thenCompose(v -> {
                log.info("Launched Claude Code in session: {} (todoId={}, missionId={})",
                    sessionName, todoId, missionId);

                // Wait for Claude Code to initialize
                return CompletableFuture.runAsync(() -> {
                    try {
                        Thread.sleep(5000); // Wait 5 seconds for Claude to fully start
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
            })
            .thenCompose(v -> {
                // Clear session to force new session_id generation
                log.info("Sending /clear to start fresh session");
                return sessionCast.sendKeys(sessionName, "/clear", true);
            })
            .thenCompose(v -> {
                // Wait for clear to complete and new session to start
                return CompletableFuture.runAsync(() -> {
                    try {
                        Thread.sleep(3000); // Wait 3 seconds for new session
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
            })
            .thenCompose(v -> {
                // Send Custom Task to register session ID mapping
                // This allows SwiftCast to send us the Claude session ID
                // Using ">>swiftcast" prefix to trigger SwiftCast custom task
                String registerCommand = String.format(
                    ">>swiftcast register_session --todo-id=%s --session-name=%s",
                    todoId, sessionName
                );
                log.info("Sending session registration task: {}", registerCommand);
                return sessionCast.sendKeys(sessionName, registerCommand, true);
            })
            .thenCompose(v -> {
                // Wait for session registration to complete
                return CompletableFuture.runAsync(() -> {
                    try {
                        Thread.sleep(3000); // Wait 3 seconds for register_session to complete
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
            })
            .thenCompose(v -> {
                // Start first step (ANALYSIS) before sending prompt
                try {
                    stepProgressService.startFirstStep(UUID.fromString(todoId));
                } catch (Exception e) {
                    log.warn("Failed to start first step: {}", e.getMessage());
                }
                return sendTodoPrompt(sessionName, missionTitle, todoTitle, todoDescription);
            })
            .thenApply(v -> sessionName);
    }

    /**
     * Send TODO prompt to Claude Code session.
     * Sends the prompt and then an extra Enter to submit (Claude Code multi-line mode).
     */
    private CompletableFuture<Void> sendTodoPrompt(String sessionName,
            String missionTitle, String todoTitle, String todoDescription) {
        try {
            // Build the prompt for Claude Code (single line to avoid multi-line issues)
            String prompt = String.format(
                "[ThreadCast TODO] Mission: %s / TODO: %s / 설명: %s - 위 TODO를 완료해주세요.",
                missionTitle, todoTitle, todoDescription
            );

            log.info("Sending TODO prompt to session {}: {}", sessionName, todoTitle);

            // Send prompt with Enter, wait, then send another Enter to submit
            return sessionCast.sendKeys(sessionName, prompt, true)
                .thenCompose(v -> {
                    // Wait 500ms then send Enter to submit
                    try {
                        Thread.sleep(500);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    return sessionCast.sendKeys(sessionName, "", true); // Empty string + Enter = just Enter
                });
        } catch (Exception e) {
            log.error("Failed to send TODO prompt: {}", e.getMessage());
            return CompletableFuture.completedFuture(null);
        }
    }

    /**
     * Register session mapping with SwiftCast proxy.
     * This allows SwiftCast to associate API requests with the correct Todo.
     */
    private void registerSwiftCastMapping(String traceId, String todoId, String missionId) {
        try {
            // SwiftCast proxy runs on localhost:32080
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            String jsonBody = String.format(
                "{\"session_id\":\"%s\",\"todo_id\":\"%s\",\"mission_id\":\"%s\"}",
                traceId, todoId, missionId
            );

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("http://localhost:32080/_swiftcast/threadcast/mapping"))
                .header("Content-Type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

            java.net.http.HttpResponse<String> response = client.send(request,
                java.net.http.HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                log.info("Registered SwiftCast mapping: traceId={}, todoId={}", traceId, todoId);
            } else {
                log.warn("Failed to register SwiftCast mapping: status={}, body={}",
                    response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.warn("Failed to register SwiftCast mapping (SwiftCast may not be running): {}",
                e.getMessage());
        }
    }

    /**
     * Save session mapping to database.
     */
    private void saveSessionMapping(Todo todo, String sessionName) {
        // 기존 매핑이 있으면 재사용 (상태만 업데이트)
        Optional<TerminalSessionMapping> existingMapping = mappingRepository.findByTodoId(todo.getId());
        if (existingMapping.isPresent()) {
            TerminalSessionMapping mapping = existingMapping.get();
            mapping.setTmuxSessionName(sessionName);
            mapping.setStatus(io.threadcast.domain.enums.SessionStatus.ACTIVE);
            mapping.updateActivity();
            mappingRepository.save(mapping);
            log.info("Updated existing session mapping: todoId={}, session={}", todo.getId(), sessionName);
        } else {
            TerminalSessionMapping mapping = TerminalSessionMapping.create(todo, sessionName);
            mappingRepository.save(mapping);
            log.info("Saved new session mapping: todoId={}, session={}", todo.getId(), sessionName);
        }
    }

    /**
     * Start a terminal session for a Todo (with default settings).
     */
    @Transactional(readOnly = true)
    public CompletableFuture<String> startSession(String todoId) {
        // Get Todo to find workspace/project path
        String workDir;
        try {
            UUID uuid = UUID.fromString(todoId);
            Optional<Todo> todoOpt = todoRepository.findById(uuid);
            workDir = todoOpt
                .map(todo -> "/tmp/threadcast/" + todo.getMission().getId())
                .orElse("/tmp/threadcast");
        } catch (IllegalArgumentException e) {
            workDir = "/tmp/threadcast";
        }

        return startSession(todoId, workDir, true);
    }

    /**
     * Stop the terminal session for a Todo.
     */
    @Transactional
    public CompletableFuture<Void> stopSession(String todoId) {
        String sessionName = activeSessions.remove(todoId);
        if (sessionName == null) {
            log.warn("No active session for todo: {}", todoId);
            return CompletableFuture.completedFuture(null);
        }

        // Remove screen subscription
        Disposable subscription = screenSubscriptions.remove(todoId);
        if (subscription != null) {
            subscription.dispose();
        }

        // 매핑 상태 업데이트
        try {
            UUID todoUuid = UUID.fromString(todoId);
            mappingRepository.findByTodoId(todoUuid)
                .ifPresent(mapping -> {
                    mapping.stop();
                    mappingRepository.save(mapping);
                    log.info("Updated mapping status to STOPPED for todo: {}", todoId);
                });
        } catch (IllegalArgumentException e) {
            log.warn("Invalid todoId format, skipping mapping update: {}", todoId);
        }

        return sessionCast.killSession(sessionName)
            .thenRun(() -> log.info("Stopped terminal session for todo: {}", todoId));
    }

    /**
     * Add SwiftCast trace ID to session mapping.
     * Called when SwiftCast reports a new API request with a trace ID.
     *
     * @param todoId  The Todo ID
     * @param traceId The SwiftCast trace ID (sentry-trace)
     */
    @Transactional
    public void addTraceId(String todoId, String traceId) {
        try {
            UUID todoUuid = UUID.fromString(todoId);
            mappingRepository.findByTodoId(todoUuid)
                .ifPresentOrElse(
                    mapping -> {
                        mapping.addTraceId(traceId);
                        mappingRepository.save(mapping);
                        log.info("Added trace ID to mapping: todoId={}, traceId={}...",
                            todoId, traceId.length() > 12 ? traceId.substring(0, 12) : traceId);
                    },
                    () -> log.warn("No mapping found for todoId: {}", todoId)
                );
        } catch (IllegalArgumentException e) {
            log.warn("Invalid todoId format: {}", todoId);
        }
    }

    /**
     * Add token usage to session mapping.
     *
     * @param todoId       The Todo ID
     * @param inputTokens  Input token count
     * @param outputTokens Output token count
     */
    @Transactional
    public void addTokenUsage(String todoId, long inputTokens, long outputTokens) {
        try {
            UUID todoUuid = UUID.fromString(todoId);
            mappingRepository.findByTodoId(todoUuid)
                .ifPresent(mapping -> {
                    mapping.addTokenUsage(inputTokens, outputTokens);
                    mappingRepository.save(mapping);
                    log.debug("Added token usage for todo {}: input={}, output={}",
                        todoId, inputTokens, outputTokens);
                });
        } catch (IllegalArgumentException e) {
            log.warn("Invalid todoId format: {}", todoId);
        }
    }

    /**
     * Get session mapping by Todo ID.
     */
    public Optional<TerminalSessionMapping> getMapping(String todoId) {
        try {
            UUID todoUuid = UUID.fromString(todoId);
            return mappingRepository.findByTodoIdWithTodoAndMission(todoUuid);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /**
     * Get session mapping by tmux session name.
     */
    public Optional<TerminalSessionMapping> getMappingBySessionName(String sessionName) {
        return mappingRepository.findByTmuxSessionName(sessionName);
    }

    /**
     * Get session mapping by SwiftCast trace ID.
     */
    public Optional<TerminalSessionMapping> getMappingByTraceId(String traceId) {
        return mappingRepository.findBySwiftcastTraceId(traceId);
    }

    /**
     * Register SwiftCast session ID for a Todo.
     * Called from Custom Task "/tasks register_session" when Claude Code starts.
     * This maps Claude's conversation session ID to our todoId for Hook validation.
     *
     * @param todoId              The Todo ID
     * @param swiftcastSessionId  Claude's session ID from SwiftCast
     */
    @Transactional
    public void registerSwiftCastSessionId(String todoId, String swiftcastSessionId) {
        try {
            UUID todoUuid = UUID.fromString(todoId);
            mappingRepository.findByTodoId(todoUuid)
                .ifPresentOrElse(
                    mapping -> {
                        mapping.setSwiftcastSessionId(swiftcastSessionId);
                        mapping.updateActivity();
                        mappingRepository.save(mapping);
                        log.info("Updated SwiftCast session ID: todoId={}, sessionId={}...",
                            todoId, swiftcastSessionId.substring(0, Math.min(12, swiftcastSessionId.length())));
                    },
                    () -> {
                        // Create new mapping if it doesn't exist
                        Todo todo = todoRepository.findById(todoUuid)
                            .orElseThrow(() -> new RuntimeException("Todo not found: " + todoId));

                        TerminalSessionMapping newMapping = TerminalSessionMapping.builder()
                            .todo(todo)
                            .tmuxSessionName("swiftcast-" + todoId.substring(0, 8))
                            .swiftcastSessionId(swiftcastSessionId)
                            .build();
                        newMapping.updateActivity();
                        mappingRepository.save(newMapping);
                        log.info("Created new mapping with SwiftCast session ID: todoId={}, sessionId={}...",
                            todoId, swiftcastSessionId.substring(0, Math.min(12, swiftcastSessionId.length())));
                    }
                );
        } catch (IllegalArgumentException e) {
            log.warn("Invalid todoId format: {}", todoId);
        }
    }

    /**
     * Get session mapping by SwiftCast session ID.
     */
    public Optional<TerminalSessionMapping> getMappingBySwiftcastSessionId(String swiftcastSessionId) {
        return mappingRepository.findBySwiftcastSessionId(swiftcastSessionId);
    }

    /**
     * Send keys to a Todo's terminal session.
     *
     * @param todoId The Todo ID
     * @param keys   Keys to send
     * @param enter  Whether to press Enter after
     */
    public CompletableFuture<Void> sendKeys(String todoId, String keys, boolean enter) {
        String sessionName = activeSessions.get(todoId);
        if (sessionName == null) {
            return CompletableFuture.failedFuture(
                new IllegalStateException("No active session for todo: " + todoId)
            );
        }

        return sessionCast.sendKeys(sessionName, keys, enter);
    }

    /**
     * Send keys to a Todo's terminal (with Enter).
     */
    public CompletableFuture<Void> sendKeys(String todoId, String keys) {
        return sendKeys(todoId, keys, true);
    }

    /**
     * Subscribe to screen updates for a Todo.
     *
     * @param todoId  The Todo ID
     * @param handler Handler for screen data
     * @return Disposable subscription
     */
    public Disposable subscribeToScreen(String todoId, Consumer<ScreenData> handler) {
        String sessionName = activeSessions.get(todoId);
        if (sessionName == null) {
            throw new IllegalStateException("No active session for todo: " + todoId);
        }

        Disposable subscription = sessionCast.onScreen(sessionName, handler);
        screenSubscriptions.put(todoId, subscription);
        return subscription;
    }

    /**
     * Get current screen content for a Todo (one-time capture).
     */
    public String captureScreen(String todoId) {
        String sessionName = activeSessions.get(todoId);
        if (sessionName == null) {
            throw new IllegalStateException("No active session for todo: " + todoId);
        }

        return tmuxController.capturePane(sessionName, true);
    }

    /**
     * Check if a session is active for a Todo.
     */
    public boolean isSessionActive(String todoId) {
        return activeSessions.containsKey(todoId);
    }

    /**
     * Get all active session mappings.
     */
    public Map<String, String> getActiveSessions() {
        return Map.copyOf(activeSessions);
    }

    /**
     * Check if connected to SessionCast relay.
     */
    public boolean isConnected() {
        return sessionCast.isConnected();
    }

    /**
     * Reconnect to relay if disconnected.
     */
    public CompletableFuture<Void> reconnect() {
        if (!sessionCast.isConnected()) {
            return sessionCast.connect();
        }
        return CompletableFuture.completedFuture(null);
    }
}
