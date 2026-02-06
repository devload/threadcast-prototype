package io.threadcast.dto.request;

import lombok.Data;

import java.util.UUID;

/**
 * Request for Workspace Agent to analyze a mission and generate context-aware todos.
 */
@Data
public class WorkspaceAgentAnalyzeRequest {

    /**
     * Type of analysis to perform.
     */
    public enum AnalysisType {
        MISSION_TODOS,    // Generate todos for a mission
        TODO_CONTEXT,     // Analyze context for a specific todo
        PROJECT_SCAN      // Scan project structure
    }

    private UUID workspaceId;
    private UUID missionId;
    private String missionTitle;
    private String missionDescription;
    private AnalysisType analysisType = AnalysisType.MISSION_TODOS;

    /**
     * Optional: specific todo ID for TODO_CONTEXT analysis.
     */
    private UUID todoId;
}
