package io.threadcast.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SentryTestRequest {
    @NotBlank
    private String authToken;

    @NotBlank
    private String organizationSlug;
}
