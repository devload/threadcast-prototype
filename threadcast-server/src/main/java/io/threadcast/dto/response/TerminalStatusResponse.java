package io.threadcast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TerminalStatusResponse {

    private boolean connected;
    private String sessionName;
    private boolean sessionActive;
    private Map<String, String> activeSessions;
}
