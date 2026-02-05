package io.threadcast.dto.request;

import io.threadcast.domain.enums.Priority;
import lombok.Data;

@Data
public class UpdateTodoRequest {

    private String title;
    private String description;
    private Priority priority;
}
