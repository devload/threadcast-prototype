package io.threadcast.dto.request;

import io.threadcast.domain.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateMissionRequest {

    @NotNull(message = "Workspace ID is required")
    private UUID workspaceId;

    @NotBlank(message = "Title is required")
    @Size(max = 300, message = "Title must be less than 300 characters")
    private String title;

    private String description;

    private Priority priority = Priority.MEDIUM;

    // JIRA 연동 정보 (선택)
    private String jiraIssueKey;
    private String jiraIssueUrl;
}
