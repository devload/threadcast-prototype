package io.threadcast.service;

import io.sessioncast.core.SessionCastClient;
import io.threadcast.domain.Mission;
import io.threadcast.domain.Workspace;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.MissionRepository;
import io.threadcast.repository.WorkspaceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for launching Claude Code Team mode to execute a Mission's tasks.
 *
 * Instead of sending individual prompts via tmux sendKeys, this service:
 * 1. Generates a TASKS.md file from the Mission's Todos
 * 2. Launches Claude Code with Team mode enabled
 * 3. Claude Code reads TASKS.md and distributes work to Worker agents
 * 4. Workers report progress via existing MCP tools (threadcast_worker_*)
 */
@Slf4j
@Service
public class TeamLaunchService {

    private static final int LAUNCH_WAIT_SECONDS = 5;

    private final SessionCastClient sessionCast;
    private final TeamTaskGenerator taskGenerator;
    private final MissionRepository missionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${server.port:21000}")
    private int serverPort;

    @Value("${threadcast.callback.host:localhost}")
    private String callbackHost;

    @Value("${threadcast.callback.scheme:http}")
    private String callbackScheme;

    @Value("${threadcast.callback.port:#{null}}")
    private Integer callbackPort;

    // Track active team sessions: missionId -> TeamSession
    private final Map<UUID, TeamSession> activeSessions = new ConcurrentHashMap<>();

    public TeamLaunchService(
            SessionCastClient sessionCast,
            TeamTaskGenerator taskGenerator,
            MissionRepository missionRepository,
            WorkspaceRepository workspaceRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.sessionCast = sessionCast;
        this.taskGenerator = taskGenerator;
        this.missionRepository = missionRepository;
        this.workspaceRepository = workspaceRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Launch Claude Code Team mode for a mission.
     *
     * @param missionId Mission to execute
     * @param workspaceId Workspace context
     * @return CompletableFuture with the team session info
     */
    @Transactional(readOnly = true)
    public CompletableFuture<TeamSession> launchTeam(UUID missionId, UUID workspaceId, String token) {
        // Check for existing session
        TeamSession existing = activeSessions.get(missionId);
        if (existing != null && existing.status != TeamSessionStatus.STOPPED) {
            log.info("Team session already running for mission {}", missionId);
            return CompletableFuture.completedFuture(existing);
        }

        Mission mission = missionRepository.findByIdWithTodos(missionId);
        if (mission == null) {
            throw new NotFoundException("Mission not found: " + missionId);
        }

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + workspaceId));

        // 1. Generate TASKS.md
        String apiUrl = buildApiUrl();
        Path tasksFile = taskGenerator.generateTasksFile(missionId, apiUrl);
        log.info("TASKS.md generated at: {}", tasksFile);

        // 2. Create tmux session
        String sessionName = "team-" + missionId.toString().substring(0, 8);
        String workDir = workspace.getPath();

        TeamSession session = new TeamSession(
                missionId, workspaceId, sessionName,
                tasksFile.toString(), workDir,
                LocalDateTime.now(), TeamSessionStatus.STARTING
        );
        activeSessions.put(missionId, session);

        // 3. Launch Claude Code Team mode in tmux
        return sessionCast.createSession(sessionName, workDir)
                .thenCompose(name -> {
                    log.info("Created tmux session for team: {}", name);
                    return launchClaudeTeam(name, missionId, workspaceId, tasksFile, workDir, token);
                })
                .thenApply(v -> {
                    session.status = TeamSessionStatus.RUNNING;
                    log.info("Claude Code Team launched for mission {}", missionId);

                    notifyTeamLaunched(missionId, sessionName);

                    return session;
                })
                .exceptionally(e -> {
                    log.error("Failed to launch team for mission {}: {}", missionId, e.getMessage());
                    session.status = TeamSessionStatus.ERROR;
                    session.errorMessage = e.getMessage();
                    return session;
                });
    }

    /**
     * Launch Claude Code in interactive mode, then send the prompt.
     *
     * Two-step process (same pattern as WorkspaceAgentService):
     * 1. Start Claude Code interactively with environment variables
     * 2. Wait for initialization, then send the prompt via sendKeys
     */
    private CompletableFuture<Void> launchClaudeTeam(
            String sessionName, UUID missionId, UUID workspaceId,
            Path tasksFile, String workDir, String token) {

        String apiUrl = buildApiUrl();

        // Step 1: Start Claude Code interactively
        // THREADCAST_TOKEN is critical: the MCP server reads it to authenticate API calls
        String launchCommand = String.format(
                "export THREADCAST_WORKSPACE_ID=%s && " +
                "export THREADCAST_MISSION_ID=%s && " +
                "export THREADCAST_API_URL=%s && " +
                "export THREADCAST_TOKEN=%s && " +
                "export THREADCAST_MODE=team_lead && " +
                "claude --dangerously-skip-permissions",
                workspaceId, missionId, apiUrl, token
        );

        // Step 2: Build prompt (written to file for reference, sent via sendKeys)
        String prompt = String.format(
                "Read the file %s and execute all tasks. " +
                "Use team mode: create a team, spawn threadcast-worker agents for parallel tasks, " +
                "and coordinate execution respecting dependency order. " +
                "Each worker must use MCP tools to report progress. " +
                "Monitor all workers and ensure all tasks complete successfully.",
                tasksFile.toAbsolutePath()
        );

        return sessionCast.sendKeys(sessionName, launchCommand, true)
                .thenCompose(v -> {
                    // Wait for Claude Code to initialize
                    return CompletableFuture.runAsync(() -> {
                        try {
                            Thread.sleep(LAUNCH_WAIT_SECONDS * 1000L);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    });
                })
                .thenCompose(v -> {
                    // Send the prompt to the running Claude Code session
                    log.info("Sending team prompt to session {}", sessionName);
                    return sessionCast.sendKeys(sessionName, prompt, true);
                });
    }

    /**
     * Get the status of a team session.
     */
    public TeamSession getTeamStatus(UUID missionId) {
        TeamSession session = activeSessions.get(missionId);
        if (session == null) {
            return new TeamSession(missionId, null, null, null, null,
                    null, TeamSessionStatus.NOT_STARTED);
        }
        return session;
    }

    /**
     * Stop a running team session.
     */
    public CompletableFuture<Void> stopTeam(UUID missionId) {
        TeamSession session = activeSessions.remove(missionId);
        if (session == null) {
            log.info("No active team session for mission: {}", missionId);
            return CompletableFuture.completedFuture(null);
        }

        log.info("Stopping team session for mission {}: {}", missionId, session.sessionName);

        return sessionCast.killSession(session.sessionName)
                .thenRun(() -> {
                    session.status = TeamSessionStatus.STOPPED;
                    log.info("Team session stopped for mission: {}", missionId);
                });
    }

    private void notifyTeamLaunched(UUID missionId, String sessionName) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("missionId", missionId.toString());
        payload.put("sessionName", sessionName);
        payload.put("status", "RUNNING");

        Map<String, Object> event = new HashMap<>();
        event.put("eventId", UUID.randomUUID().toString());
        event.put("eventType", "TEAM_LAUNCHED");
        event.put("timestamp", LocalDateTime.now());
        event.put("payload", payload);

        messagingTemplate.convertAndSend("/topic/missions/" + missionId, event);
    }

    private String buildApiUrl() {
        int port = callbackPort != null ? callbackPort : serverPort;
        return String.format("%s://%s:%d/api", callbackScheme, callbackHost, port);
    }

    // --- Inner types ---

    public enum TeamSessionStatus {
        NOT_STARTED,
        STARTING,
        RUNNING,
        STOPPED,
        ERROR
    }

    public static class TeamSession {
        public final UUID missionId;
        public final UUID workspaceId;
        public final String sessionName;
        public final String tasksFilePath;
        public final String workDir;
        public final LocalDateTime startedAt;
        public volatile TeamSessionStatus status;
        public volatile String errorMessage;

        public TeamSession(UUID missionId, UUID workspaceId, String sessionName,
                           String tasksFilePath, String workDir,
                           LocalDateTime startedAt, TeamSessionStatus status) {
            this.missionId = missionId;
            this.workspaceId = workspaceId;
            this.sessionName = sessionName;
            this.tasksFilePath = tasksFilePath;
            this.workDir = workDir;
            this.startedAt = startedAt;
            this.status = status;
        }
    }
}
