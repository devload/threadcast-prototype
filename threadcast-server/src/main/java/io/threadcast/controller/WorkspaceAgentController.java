package io.threadcast.controller;

import io.threadcast.dto.request.TeamLaunchRequest;
import io.threadcast.dto.request.WorkspaceAgentSpawnRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.WorkspaceAgentStatusResponse;
import io.threadcast.service.TeamLaunchService;
import io.threadcast.service.WorkspaceAgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * REST Controller for Workspace Agent operations.
 *
 * Workspace Agents are Claude Code instances running in tmux sessions
 * that analyze project codebases to provide context-aware suggestions.
 *
 * Note: Analysis requests are now handled via the new AnalysisController
 * which uses HTTP callbacks instead of file-based polling.
 */
@RestController
@RequestMapping("/api/workspace-agent")
@RequiredArgsConstructor
public class WorkspaceAgentController {

    private final WorkspaceAgentService workspaceAgentService;
    private final TeamLaunchService teamLaunchService;

    /**
     * Spawn a new Workspace Agent for a workspace.
     *
     * @param request Contains workspaceId and optional projectPath
     * @return Agent status after spawn
     */
    @PostMapping("/spawn")
    public CompletableFuture<ResponseEntity<ApiResponse<WorkspaceAgentStatusResponse>>> spawn(
            @Valid @RequestBody WorkspaceAgentSpawnRequest request
    ) {
        return workspaceAgentService.spawnAgent(request.getWorkspaceId(), request.getProjectPath())
                .thenApply(status -> ResponseEntity.ok(ApiResponse.success(status)));
    }

    /**
     * Get the status of a Workspace Agent.
     *
     * @param workspaceId Workspace ID
     * @return Current agent status
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<WorkspaceAgentStatusResponse>> getStatus(
            @RequestParam UUID workspaceId
    ) {
        WorkspaceAgentStatusResponse status = workspaceAgentService.getStatus(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    /**
     * Stop a running Workspace Agent.
     *
     * @param workspaceId Workspace ID
     * @return Success response
     */
    @PostMapping("/stop")
    public CompletableFuture<ResponseEntity<ApiResponse<Void>>> stop(
            @RequestParam UUID workspaceId
    ) {
        return workspaceAgentService.stopAgent(workspaceId)
                .thenApply(v -> ResponseEntity.ok(ApiResponse.success(null)));
    }

    /**
     * Check if an agent is alive.
     *
     * @param workspaceId Workspace ID
     * @return Boolean indicating if agent is running
     */
    @GetMapping("/alive")
    public ResponseEntity<ApiResponse<Boolean>> isAlive(
            @RequestParam UUID workspaceId
    ) {
        boolean alive = workspaceAgentService.isAgentAlive(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(alive));
    }

    /**
     * Get the callback URL for analysis results.
     * Used by PM Agent to pass to Workspace Agent.
     */
    @GetMapping("/callback-url")
    public ResponseEntity<ApiResponse<Map<String, String>>> getCallbackUrl() {
        String url = workspaceAgentService.getCallbackUrl();
        return ResponseEntity.ok(ApiResponse.success(Map.of("callbackUrl", url)));
    }

    // --- Team Mode Endpoints ---

    /**
     * Launch Claude Code Team mode for a mission.
     * Generates TASKS.md and starts Claude Code with team coordination.
     *
     * @param request Contains missionId and workspaceId
     * @return Team session info
     */
    @PostMapping("/launch-team")
    public CompletableFuture<ResponseEntity<ApiResponse<Map<String, Object>>>> launchTeam(
            @Valid @RequestBody TeamLaunchRequest request,
            @RequestHeader("Authorization") String authHeader
    ) {
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        return teamLaunchService.launchTeam(request.getMissionId(), request.getWorkspaceId(), token)
                .thenApply(session -> {
                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("missionId", session.missionId);
                    data.put("sessionName", session.sessionName);
                    data.put("tasksFilePath", session.tasksFilePath);
                    data.put("status", session.status.name());
                    data.put("startedAt", session.startedAt);
                    if (session.errorMessage != null) {
                        data.put("errorMessage", session.errorMessage);
                    }
                    return ResponseEntity.ok(ApiResponse.success(data));
                });
    }

    /**
     * Get the status of a team session for a mission.
     *
     * @param missionId Mission ID
     * @return Team session status
     */
    @GetMapping("/team-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTeamStatus(
            @RequestParam UUID missionId
    ) {
        TeamLaunchService.TeamSession session = teamLaunchService.getTeamStatus(missionId);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("missionId", session.missionId);
        data.put("sessionName", session.sessionName);
        data.put("status", session.status.name());
        data.put("startedAt", session.startedAt);
        if (session.errorMessage != null) {
            data.put("errorMessage", session.errorMessage);
        }
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * Stop a running team session.
     *
     * @param missionId Mission ID
     * @return Success response
     */
    @PostMapping("/stop-team")
    public CompletableFuture<ResponseEntity<ApiResponse<Void>>> stopTeam(
            @RequestParam UUID missionId
    ) {
        return teamLaunchService.stopTeam(missionId)
                .thenApply(v -> ResponseEntity.ok(ApiResponse.success(null)));
    }
}
