package io.threadcast.dto.request;

import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.SearchType;
import io.threadcast.domain.enums.TodoStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class SearchRequest {

    @NotBlank(message = "Search query is required")
    @Size(min = 2, max = 200, message = "Query must be between 2 and 200 characters")
    private String q;

    @NotNull(message = "Workspace ID is required")
    private UUID workspaceId;

    private SearchType type = SearchType.ALL;

    private MissionStatus missionStatus;

    private TodoStatus todoStatus;

    private Integer page = 0;

    private Integer size = 20;
}
