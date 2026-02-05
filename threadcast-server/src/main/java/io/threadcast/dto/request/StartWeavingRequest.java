package io.threadcast.dto.request;

import io.threadcast.domain.enums.Complexity;
import io.threadcast.domain.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class StartWeavingRequest {

    @NotEmpty(message = "Todos list is required")
    private List<TodoProposal> todos;

    @Data
    public static class TodoProposal {
        @NotBlank(message = "Title is required")
        private String title;
        private String description;
        private Complexity complexity = Complexity.MEDIUM;
        private Priority priority = Priority.MEDIUM;
        private Integer estimatedTime;
        private Integer orderIndex;
        private List<UUID> dependencies;
    }
}
