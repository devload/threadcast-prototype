package io.threadcast.dto.response;

import io.threadcast.domain.AIQuestion;
import io.threadcast.domain.enums.QuestionCategory;
import io.threadcast.domain.enums.QuestionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class AIQuestionResponse {

    private UUID id;
    private UUID todoId;
    private String todoTitle;
    private String question;
    private String context;
    private QuestionStatus status;
    private QuestionCategory category;
    private List<Map<String, String>> options;
    private AnswerResponse answer;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class AnswerResponse {
        private String answer;
        private String answeredBy;
        private LocalDateTime answeredAt;
    }

    public static AIQuestionResponse from(AIQuestion question) {
        AIQuestionResponseBuilder builder = AIQuestionResponse.builder()
                .id(question.getId())
                .todoId(question.getTodo().getId())
                .todoTitle(question.getTodo().getTitle())
                .question(question.getQuestion())
                .context(question.getContext())
                .status(question.getStatus())
                .category(question.getCategory())
                .options(question.getOptions())
                .createdAt(question.getCreatedAt());

        if (question.getAnswer() != null) {
            builder.answer(AnswerResponse.builder()
                    .answer(question.getAnswer().getAnswer())
                    .answeredBy(question.getAnswer().getAnsweredBy().name())
                    .answeredAt(question.getAnswer().getCreatedAt())
                    .build());
        }

        return builder.build();
    }
}
