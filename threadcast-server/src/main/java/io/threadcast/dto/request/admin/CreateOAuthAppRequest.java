package io.threadcast.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateOAuthAppRequest {

    @NotBlank(message = "App name is required")
    private String name;

    private String description;

    @NotBlank(message = "Redirect URI is required")
    private String redirectUri;

    private String homepageUrl;

    private String logoUrl;

    private Boolean firstParty = false;
}
