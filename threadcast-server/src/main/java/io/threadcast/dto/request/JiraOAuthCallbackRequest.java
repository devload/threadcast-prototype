package io.threadcast.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * JIRA OAuth 콜백 요청 DTO
 */
@Data
public class JiraOAuthCallbackRequest {

    @NotNull(message = "Workspace ID is required")
    private UUID workspaceId;

    @NotBlank(message = "Authorization code is required")
    private String code;

    /**
     * CSRF 방지용 state 값
     */
    private String state;
}
