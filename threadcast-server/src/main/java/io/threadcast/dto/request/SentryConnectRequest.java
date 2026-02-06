package io.threadcast.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SentryConnectRequest {
    @NotNull
    private UUID workspaceId;

    @NotBlank
    private String authToken;

    @NotBlank
    private String organizationSlug;

    private String projectSlug;
}
