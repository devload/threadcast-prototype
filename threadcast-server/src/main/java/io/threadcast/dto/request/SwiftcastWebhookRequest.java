package io.threadcast.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class SwiftcastWebhookRequest {
    private String event;

    @JsonProperty("todo_id")
    private String todoId;

    @JsonProperty("session_id")
    private String sessionId;

    private Long timestamp;
    private JsonNode data;
}
