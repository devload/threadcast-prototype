package io.threadcast.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OAuthCallbackRequest {

    @NotBlank(message = "Authorization code is required")
    private String code;

    @NotBlank(message = "Code verifier is required")
    private String codeVerifier;

    @NotBlank(message = "Redirect URI is required")
    private String redirectUri;
}
