package io.threadcast.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CommandAckRequest {

    @NotNull(message = "Command ID is required")
    private UUID commandId;

    @NotBlank(message = "Status is required")
    private String status;
}
