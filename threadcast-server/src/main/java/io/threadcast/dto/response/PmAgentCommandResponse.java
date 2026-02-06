package io.threadcast.dto.response;

import io.threadcast.domain.PmAgentCommand;
import io.threadcast.domain.enums.CommandStatus;
import io.threadcast.domain.enums.CommandType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PmAgentCommandResponse {

    private UUID commandId;
    private CommandType type;
    private Object payload;
    private CommandStatus status;
    private LocalDateTime createdAt;

    public static PmAgentCommandResponse from(PmAgentCommand command, Object payload) {
        return PmAgentCommandResponse.builder()
                .commandId(command.getId())
                .type(command.getType())
                .payload(payload)
                .status(command.getStatus())
                .createdAt(command.getCreatedAt())
                .build();
    }
}
