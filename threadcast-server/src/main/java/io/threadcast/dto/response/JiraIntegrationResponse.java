package io.threadcast.dto.response;

import io.threadcast.domain.JiraIntegration;
import io.threadcast.domain.enums.JiraAuthType;
import io.threadcast.domain.enums.JiraInstanceType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JIRA 연동 정보 응답 DTO
 */
@Data
@Builder
public class JiraIntegrationResponse {

    private UUID id;
    private UUID workspaceId;
    private JiraInstanceType instanceType;
    private String baseUrl;
    private JiraAuthType authType;
    private String email;
    private String defaultProjectKey;
    private Boolean syncEnabled;
    private LocalDateTime lastSyncAt;
    private String lastStatusMessage;
    private boolean connected;
    private LocalDateTime createdAt;

    public static JiraIntegrationResponse from(JiraIntegration integration) {
        return JiraIntegrationResponse.builder()
                .id(integration.getId())
                .workspaceId(integration.getWorkspace().getId())
                .instanceType(integration.getInstanceType())
                .baseUrl(integration.getBaseUrl())
                .authType(integration.getAuthType())
                .email(integration.getEmail())
                .defaultProjectKey(integration.getDefaultProjectKey())
                .syncEnabled(integration.getSyncEnabled())
                .lastSyncAt(integration.getLastSyncAt())
                .lastStatusMessage(integration.getLastStatusMessage())
                .connected(true)
                .createdAt(integration.getCreatedAt())
                .build();
    }

    public static JiraIntegrationResponse notConnected() {
        return JiraIntegrationResponse.builder()
                .connected(false)
                .build();
    }
}
