package io.threadcast.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Request from SwiftCast Custom Task for session mapping.
 * Contains Claude's session_id and our custom args (todoId, sessionName).
 */
@Data
public class SessionMappingRequest {
    
    @JsonProperty("session_id")
    private String sessionId;
    
    private String path;
    private String model;
    private String args;  // "--todo-id=XXX --session-name=YYY"
}
