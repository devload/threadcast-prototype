package io.threadcast.controller;

import io.threadcast.dto.request.WorkspaceAgentSpawnRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.WorkspaceAgentStatusResponse;
import io.threadcast.service.WorkspaceAgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
