package io.threadcast.dto.request;

import lombok.Data;

import java.util.UUID;

/**
 * Request to spawn a Workspace Agent for a workspace.
 * The agent will run in a tmux session with Claude Code.
 */
@Data
public class WorkspaceAgentSpawnRequest {

    private UUID workspaceId;

    /**
     * Project path to run the agent in.
     * If not provided, uses the workspace's configured path.
     */
    private String projectPath;
}
