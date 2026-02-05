package io.threadcast.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.threadcast.domain.enums.Complexity;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AIAnalysisResponse {

    private UUID missionId;
    private List<SuggestedTodo> suggestedTodos;
    private List<AIQuestionSuggestion> questions;
    private double confidence;
    private double analysisTime;

    @Data
    @Builder
    public static class SuggestedTodo {
        private String id;
        private String title;
        private String description;
        private Complexity complexity;
        private int estimatedTime;
        @JsonProperty("isUncertain")
        private boolean isUncertain;
        private String uncertainReason;
    }

    @Data
    @Builder
    public static class AIQuestionSuggestion {
        private String id;
        private String question;
        private String context;
        private String relatedTodoId;
        private List<String> options;
    }
}
