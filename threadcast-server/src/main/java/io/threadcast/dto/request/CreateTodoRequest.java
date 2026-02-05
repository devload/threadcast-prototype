package io.threadcast.dto.request;

import io.threadcast.domain.enums.Complexity;
import io.threadcast.domain.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateTodoRequest {

    @NotNull(message = "Mission ID is required")
    private UUID missionId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Priority priority = Priority.MEDIUM;

    private Complexity complexity = Complexity.MEDIUM;

    private Integer orderIndex;

    private Integer estimatedTime;

    private List<UUID> dependencies;
}
