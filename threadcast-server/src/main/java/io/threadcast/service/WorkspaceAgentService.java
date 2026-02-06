package io.threadcast.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.sessioncast.core.SessionCastClient;
import io.threadcast.domain.Workspace;
import io.threadcast.dto.response.WorkspaceAgentStatusResponse;
import io.threadcast.repository.WorkspaceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;

/**
 * Service for managing Workspace Agents.
 *
 * A Workspace Agent is a Claude Code instance running in a tmux session
 * that can analyze project code and provide context-aware suggestions.
 *
 * NEW Architecture (HTTP Callback):
 * 1. PM Agent polls commands from Backend (/api/pm-agent/command)
 * 2. PM Agent spawns Workspace Agent and passes callback URL
 * 3. Workspace Agent performs analysis
 * 4. Workspace Agent sends results via HTTP POST to callback URL
 * 5. Backend notifies Frontend via WebSocket
 */
@Slf4j
@Service
public class WorkspaceAgentService {

    private static final String BASE_DIR = "/tmp/threadcast";
    private static final int SPAWN_WAIT_SECONDS = 8;

    private final SessionCastClient sessionCast;
    private final WorkspaceRepository workspaceRepository;
    private final ObjectMapper objectMapper;

    @Value("${server.port:21000}")
    private int serverPort;

    @Value("${threadcast.callback.host:localhost}")
    private String callbackHost;

    // Track active agents: workspaceId -> AgentInfo
    private final Map<UUID, AgentInfo> activeAgents = new ConcurrentHashMap<>();

    public WorkspaceAgentService(
            SessionCastClient sessionCast,
            WorkspaceRepository workspaceRepository) {
        this.sessionCast = sessionCast;
        this.workspaceRepository = workspaceRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * Get session name for a workspace agent.
     */
    public String getSessionName(UUID workspaceId) {
        return "workspace-agent-" + workspaceId.toString().substring(0, 8);
    }

    /**
     * Get request directory for a workspace.
     */
    private Path getRequestDir(UUID workspaceId) {
        return Paths.get(BASE_DIR, "workspace-" + workspaceId.toString());
    }

    /**
     * Get the callback URL for analysis results.
     */
    public String getCallbackUrl() {
        return String.format("http://%s:%d/api/webhooks/analysis-callback", callbackHost, serverPort);
    }

    /**
     * Spawn a Workspace Agent for the given workspace.
     */
    @Transactional(readOnly = true)
    public CompletableFuture<WorkspaceAgentStatusResponse> spawnAgent(UUID workspaceId, String projectPath) {
        // Check if already running
        if (activeAgents.containsKey(workspaceId)) {
            AgentInfo existing = activeAgents.get(workspaceId);
            log.info("Workspace Agent already running for {}", workspaceId);
            return CompletableFuture.completedFuture(buildStatusResponse(workspaceId, existing));
        }

        // Get workspace to verify it exists and get path
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found: " + workspaceId));

        String workDir = projectPath != null ? projectPath : workspace.getPath();
        String sessionName = getSessionName(workspaceId);
        Path requestDir = getRequestDir(workspaceId);

        // Create request directory
        try {
            Files.createDirectories(requestDir);
        } catch (IOException e) {
            return CompletableFuture.failedFuture(
                    new RuntimeException("Failed to create request directory: " + e.getMessage()));
        }

        // Create agent info
        AgentInfo agentInfo = new AgentInfo(
                workspaceId,
                sessionName,
                workDir,
                LocalDateTime.now(),
                WorkspaceAgentStatusResponse.AgentStatus.STARTING
        );
        activeAgents.put(workspaceId, agentInfo);

        // Spawn agent in tmux
        return sessionCast.createSession(sessionName, workDir)
                .thenCompose(name -> {
                    log.info("Created tmux session: {}", name);
                    return launchClaudeAgent(name, workspaceId, workDir);
                })
                .thenApply(v -> {
                    agentInfo.status = WorkspaceAgentStatusResponse.AgentStatus.IDLE;
                    agentInfo.lastActivityAt = LocalDateTime.now();
                    log.info("Workspace Agent spawned for {}: session={}", workspaceId, sessionName);
                    return buildStatusResponse(workspaceId, agentInfo);
                })
                .exceptionally(e -> {
                    log.error("Failed to spawn Workspace Agent: {}", e.getMessage());
                    activeAgents.remove(workspaceId);
                    return WorkspaceAgentStatusResponse.builder()
                            .workspaceId(workspaceId)
                            .status(WorkspaceAgentStatusResponse.AgentStatus.ERROR)
                            .errorMessage(e.getMessage())
                            .build();
                });
    }

    /**
     * Launch Claude Code in the tmux session with workspace agent mode.
     * Now includes callback URL in environment.
     */
    private CompletableFuture<Void> launchClaudeAgent(String sessionName, UUID workspaceId, String workDir) {
        Path requestDir = getRequestDir(workspaceId);
        String callbackUrl = getCallbackUrl();

        // Environment setup + Claude launch command
        String launchCommand = String.format(
                "export THREADCAST_WORKSPACE_ID=%s && " +
                "export THREADCAST_REQUEST_DIR=%s && " +
                "export THREADCAST_CALLBACK_URL=%s && " +
                "export THREADCAST_MODE=workspace_agent && " +
                "claude --dangerously-skip-permissions",
                workspaceId, requestDir, callbackUrl
        );

        return sessionCast.sendKeys(sessionName, launchCommand, true)
                .thenCompose(v -> {
                    // Wait for Claude to initialize
                    return CompletableFuture.runAsync(() -> {
                        try {
                            Thread.sleep(SPAWN_WAIT_SECONDS * 1000L);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    });
                });
    }

    /**
     * Send an analysis command to the Workspace Agent.
     * The agent will perform analysis and send results via HTTP callback.
     *
     * @param workspaceId Workspace ID
     * @param requestId Analysis request ID
     * @param missionTitle Mission title
     * @param missionDescription Mission description
     * @param callbackUrl URL to send results to
     */
    public CompletableFuture<Void> sendAnalysisCommand(
            UUID workspaceId,
            String requestId,
            String missionTitle,
            String missionDescription,
            String callbackUrl) {

        AgentInfo agentInfo = activeAgents.get(workspaceId);
        if (agentInfo == null || agentInfo.status == WorkspaceAgentStatusResponse.AgentStatus.NOT_RUNNING) {
            return CompletableFuture.failedFuture(
                    new IllegalStateException("No active Workspace Agent for workspace: " + workspaceId));
        }

        String sessionName = agentInfo.sessionName;

        // Update agent state
        agentInfo.status = WorkspaceAgentStatusResponse.AgentStatus.ANALYZING;
        agentInfo.currentRequestId = requestId;
        agentInfo.lastActivityAt = LocalDateTime.now();

        // Build the analysis prompt with HTTP callback instruction
        String analysisPrompt = buildAnalysisPrompt(requestId, missionTitle, missionDescription, callbackUrl);

        return sessionCast.sendKeys(sessionName, analysisPrompt, true)
                .thenRun(() -> log.info("Analysis command sent to agent: workspaceId={}, requestId={}", workspaceId, requestId))
                .whenComplete((v, error) -> {
                    if (error != null) {
                        agentInfo.status = WorkspaceAgentStatusResponse.AgentStatus.IDLE;
                        agentInfo.currentRequestId = null;
                    }
                });
    }

    /**
     * Build the analysis prompt to send to Claude.
     * Instructs the agent to send results via HTTP callback.
     */
    private String buildAnalysisPrompt(String requestId, String missionTitle, String missionDescription, String callbackUrl) {
        return String.format(
                "WORKSPACE AGENT ANALYSIS REQUEST\\n" +
                "================================\\n\\n" +
                "Request ID: %s\\n" +
                "Mission: %s\\n" +
                "Description: %s\\n\\n" +
                "INSTRUCTIONS:\\n" +
                "1. Analyze the project codebase for this mission\\n" +
                "2. Identify relevant files, patterns, and tech stack\\n" +
                "3. Generate Todo suggestions with complexity and time estimates\\n" +
                "4. Send results via HTTP POST using curl:\\n\\n" +
                "curl -X POST '%s' \\\\\\n" +
                "  -H 'Content-Type: application/json' \\\\\\n" +
                "  -d '{\\n" +
                "    \\\"requestId\\\": \\\"%s\\\",\\n" +
                "    \\\"status\\\": \\\"SUCCESS\\\",\\n" +
                "    \\\"analysis\\\": {\\n" +
                "      \\\"suggestedTodos\\\": [\\n" +
                "        {\\n" +
                "          \\\"title\\\": \\\"Todo title\\\",\\n" +
                "          \\\"description\\\": \\\"Detailed description\\\",\\n" +
                "          \\\"complexity\\\": \\\"LOW|MEDIUM|HIGH\\\",\\n" +
                "          \\\"estimatedTime\\\": 45,\\n" +
                "          \\\"relatedFiles\\\": [\\\"src/path/file.ts\\\"],\\n" +
                "          \\\"reasoning\\\": \\\"Why this todo is needed\\\"\\n" +
                "        }\\n" +
                "      ],\\n" +
                "      \\\"projectInsights\\\": {\\n" +
                "        \\\"framework\\\": \\\"React/Vue/etc\\\",\\n" +
                "        \\\"stateManagement\\\": \\\"Zustand/Redux/etc\\\",\\n" +
                "        \\\"styling\\\": \\\"Tailwind/CSS/etc\\\"\\n" +
                "      }\\n" +
                "    }\\n" +
                "  }'\\n\\n" +
                "IMPORTANT: Execute the curl command after analysis is complete.",
                requestId, missionTitle, missionDescription, callbackUrl, requestId
        );
    }

    /**
     * Mark agent as idle (called when analysis callback is received).
     */
    public void markAgentIdle(UUID workspaceId) {
        AgentInfo agentInfo = activeAgents.get(workspaceId);
        if (agentInfo != null) {
            agentInfo.status = WorkspaceAgentStatusResponse.AgentStatus.IDLE;
            agentInfo.currentRequestId = null;
            agentInfo.lastActivityAt = LocalDateTime.now();
        }
    }

    /**
     * Get the status of a Workspace Agent.
     */
    public WorkspaceAgentStatusResponse getStatus(UUID workspaceId) {
        AgentInfo agentInfo = activeAgents.get(workspaceId);
        if (agentInfo == null) {
            return WorkspaceAgentStatusResponse.notRunning(workspaceId);
        }
        return buildStatusResponse(workspaceId, agentInfo);
    }

    /**
     * Check if an agent is alive for a workspace.
     */
    public boolean isAgentAlive(UUID workspaceId) {
        AgentInfo agentInfo = activeAgents.get(workspaceId);
        return agentInfo != null &&
               agentInfo.status != WorkspaceAgentStatusResponse.AgentStatus.NOT_RUNNING &&
               agentInfo.status != WorkspaceAgentStatusResponse.AgentStatus.ERROR;
    }

    /**
     * Stop a Workspace Agent.
     */
    public CompletableFuture<Void> stopAgent(UUID workspaceId) {
        AgentInfo agentInfo = activeAgents.remove(workspaceId);
        if (agentInfo == null) {
            log.info("No active agent to stop for workspace: {}", workspaceId);
            return CompletableFuture.completedFuture(null);
        }

        String sessionName = agentInfo.sessionName;
        log.info("Stopping Workspace Agent for {}: session={}", workspaceId, sessionName);

        return sessionCast.killSession(sessionName)
                .thenRun(() -> {
                    // Clean up request directory
                    try {
                        Path requestDir = getRequestDir(workspaceId);
                        if (Files.exists(requestDir)) {
                            Files.walk(requestDir)
                                    .sorted((a, b) -> b.compareTo(a))
                                    .map(Path::toFile)
                                    .forEach(File::delete);
                        }
                    } catch (IOException e) {
                        log.warn("Failed to clean up request directory: {}", e.getMessage());
                    }
                    log.info("Stopped Workspace Agent for workspace: {}", workspaceId);
                });
    }

    /**
     * Get all active agents.
     */
    public Map<UUID, AgentInfo> getActiveAgents() {
        return Map.copyOf(activeAgents);
    }

    private WorkspaceAgentStatusResponse buildStatusResponse(UUID workspaceId, AgentInfo info) {
        return WorkspaceAgentStatusResponse.builder()
                .workspaceId(workspaceId)
                .status(info.status)
                .sessionName(info.sessionName)
                .projectPath(info.projectPath)
                .startedAt(info.startedAt)
                .lastActivityAt(info.lastActivityAt)
                .currentRequestId(info.currentRequestId)
                .build();
    }

    /**
     * Internal class to track agent state.
     */
    public static class AgentInfo {
        public final UUID workspaceId;
        public final String sessionName;
        public final String projectPath;
        public final LocalDateTime startedAt;
        public volatile WorkspaceAgentStatusResponse.AgentStatus status;
        public volatile LocalDateTime lastActivityAt;
        public volatile String currentRequestId;

        public AgentInfo(UUID workspaceId, String sessionName, String projectPath,
                        LocalDateTime startedAt, WorkspaceAgentStatusResponse.AgentStatus status) {
            this.workspaceId = workspaceId;
            this.sessionName = sessionName;
            this.projectPath = projectPath;
            this.startedAt = startedAt;
            this.status = status;
            this.lastActivityAt = startedAt;
        }
    }
}
