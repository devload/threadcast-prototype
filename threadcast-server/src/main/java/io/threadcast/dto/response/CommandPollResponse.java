package io.threadcast.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CommandPollResponse {

    private List<PmAgentCommandResponse> commands;

    public static CommandPollResponse of(List<PmAgentCommandResponse> commands) {
        return CommandPollResponse.builder()
                .commands(commands)
                .build();
    }
}
