package io.threadcast.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class SentryConnectRequest {
    @NotBlank
    private UUID workspaceId;

    @NotBlank
    private String authToken;

    @NotBlank
    private String organizationSlug;

    private String projectSlug;
}
