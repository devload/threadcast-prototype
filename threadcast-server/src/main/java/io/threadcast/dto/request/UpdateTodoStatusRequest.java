package io.threadcast.dto.request;

import io.threadcast.domain.enums.TodoStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateTodoStatusRequest {

    @NotNull(message = "Status is required")
    private TodoStatus status;
}
