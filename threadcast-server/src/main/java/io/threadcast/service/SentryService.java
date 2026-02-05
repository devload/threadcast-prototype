package io.threadcast.service;

import io.threadcast.domain.SentryIntegration;
import io.threadcast.domain.Workspace;
import io.threadcast.dto.request.SentryConnectRequest;
import io.threadcast.dto.request.SentryTestRequest;
import io.threadcast.dto.response.SentryIntegrationResponse;
import io.threadcast.exception.BadRequestException;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.SentryIntegrationRepository;
import io.threadcast.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SentryService {

    private static final String SENTRY_API_BASE = "https://sentry.io/api/0";

    private final SentryIntegrationRepository sentryIntegrationRepository;
    private final WorkspaceRepository workspaceRepository;
    private final RestTemplate restTemplate;

    @Transactional(readOnly = true)
    public Optional<SentryIntegrationResponse> getStatus(UUID workspaceId) {
        return sentryIntegrationRepository.findByWorkspaceId(workspaceId)
                .map(SentryIntegrationResponse::from);
    }

    public Map<String, Object> testConnection(SentryTestRequest request) {
        try {
            HttpHeaders headers = createHeaders(request.getAuthToken());
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    SENTRY_API_BASE + "/organizations/" + request.getOrganizationSlug() + "/",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                return Map.of(
                        "success", true,
                        "organizationName", body.getOrDefault("name", request.getOrganizationSlug())
                );
            }
            return Map.of("success", false, "message", "연결 실패");
        } catch (Exception e) {
            log.warn("Sentry connection test failed: {}", e.getMessage());
            return Map.of("success", false, "message", "연결 실패: " + e.getMessage());
        }
    }

    @Transactional
    public SentryIntegrationResponse connect(SentryConnectRequest request) {
        // Verify connection first
        Map<String, Object> testResult = testConnection(
                createTestRequest(request.getAuthToken(), request.getOrganizationSlug())
        );

        if (!Boolean.TRUE.equals(testResult.get("success"))) {
            throw new BadRequestException("Sentry 연결 실패: " + testResult.get("message"));
        }

        Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                .orElseThrow(() -> new NotFoundException("Workspace not found"));

        // Remove existing integration if exists
        sentryIntegrationRepository.findByWorkspaceId(request.getWorkspaceId())
                .ifPresent(sentryIntegrationRepository::delete);

        SentryIntegration integration = SentryIntegration.builder()
                .workspace(workspace)
                .organizationSlug(request.getOrganizationSlug())
                .projectSlug(request.getProjectSlug())
                .authToken(request.getAuthToken())
                .connected(true)
                .build();

        integration = sentryIntegrationRepository.save(integration);
        log.info("Sentry integration created for workspace: {}", workspace.getId());

        return SentryIntegrationResponse.from(integration);
    }

    @Transactional
    public void disconnect(UUID workspaceId) {
        sentryIntegrationRepository.deleteByWorkspaceId(workspaceId);
        log.info("Sentry integration disconnected for workspace: {}", workspaceId);
    }

    private HttpHeaders createHeaders(String authToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(authToken);
        return headers;
    }

    private SentryTestRequest createTestRequest(String authToken, String orgSlug) {
        SentryTestRequest req = new SentryTestRequest();
        req.setAuthToken(authToken);
        req.setOrganizationSlug(orgSlug);
        return req;
    }
}
