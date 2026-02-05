package io.threadcast.dto.response;

import io.threadcast.domain.SentryIntegration;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SentryIntegrationResponse {
    private UUID id;
    private String organizationSlug;
    private String projectSlug;
    private Boolean connected;
    private LocalDateTime lastSyncAt;

    public static SentryIntegrationResponse from(SentryIntegration integration) {
        return SentryIntegrationResponse.builder()
                .id(integration.getId())
                .organizationSlug(integration.getOrganizationSlug())
                .projectSlug(integration.getProjectSlug())
                .connected(integration.getConnected())
                .lastSyncAt(integration.getLastSyncAt())
                .build();
    }
}
