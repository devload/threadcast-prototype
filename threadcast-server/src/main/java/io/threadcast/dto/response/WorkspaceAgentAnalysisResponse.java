package io.threadcast.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.threadcast.domain.enums.Complexity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Response from Workspace Agent analysis.
 * Contains context-aware todo suggestions based on actual project code analysis.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceAgentAnalysisResponse {

    public enum AnalysisStatus {
        SUCCESS,
        TIMEOUT,
        ERROR
    }

    private String requestId;
    private AnalysisStatus status;
    private UUID missionId;
    private Analysis analysis;
    private String errorMessage;
    private double analysisTimeSeconds;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Analysis {
        private List<SuggestedTodo> suggestedTodos;
        private ProjectInsights projectInsights;
        private List<UncertainItem> uncertainItems;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestedTodo {
        private String title;
        private String description;
        private Complexity complexity;
        private int estimatedTime;
        private List<String> relatedFiles;
        private String reasoning;

        @JsonProperty("isUncertain")
        private boolean isUncertain;
        private String uncertainReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectInsights {
        private String framework;
        private String stateManagement;
        private String styling;
        private List<String> existingPatterns;
        private Map<String, String> techStack;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UncertainItem {
        private int todoIndex;
        private String question;
        private List<String> options;
        private String recommendation;
        private String category;
    }
}
