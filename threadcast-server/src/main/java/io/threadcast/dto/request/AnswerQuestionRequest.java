package io.threadcast.dto.request;

import lombok.Data;

@Data
public class AnswerQuestionRequest {

    private String answer;
    private String customAnswer;
    private boolean autoDecide;
}
