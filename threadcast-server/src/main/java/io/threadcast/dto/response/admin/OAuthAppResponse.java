package io.threadcast.dto.response.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OAuthAppResponse {
    private UUID id;
    private String name;
    private String description;
    private String clientId;
    private String clientSecret;
    private String redirectUri;
    private String homepageUrl;
    private String logoUrl;
    private boolean firstParty;
    private LocalDateTime createdAt;
}
