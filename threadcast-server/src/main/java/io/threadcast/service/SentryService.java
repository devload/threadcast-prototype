package io.threadcast.service;

import io.threadcast.domain.Mission;
import io.threadcast.domain.SentryIntegration;
import io.threadcast.domain.Todo;
import io.threadcast.domain.Workspace;
import io.threadcast.domain.enums.Complexity;
import io.threadcast.domain.enums.Priority;
import io.threadcast.dto.request.SentryConnectRequest;
import io.threadcast.dto.request.SentryImportRequest;
import io.threadcast.dto.request.SentryTestRequest;
import io.threadcast.dto.response.MissionResponse;
import io.threadcast.dto.response.SentryIntegrationResponse;
import io.threadcast.dto.response.SentryIssueResponse;
import io.threadcast.dto.response.TodoResponse;
import io.threadcast.exception.BadRequestException;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.MissionRepository;
import io.threadcast.repository.SentryIntegrationRepository;
import io.threadcast.repository.TodoRepository;
import io.threadcast.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SentryService {

    private static final String SENTRY_API_BASE = "https://sentry.io/api/0";

    private final SentryIntegrationRepository sentryIntegrationRepository;
    private final WorkspaceRepository workspaceRepository;
    private final MissionRepository missionRepository;
    private final TodoRepository todoRepository;
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

    /**
     * Fetch issues from Sentry
     */
    @Transactional(readOnly = true)
    public List<SentryIssueResponse> fetchIssues(UUID workspaceId, String query, Integer limit) {
        SentryIntegration integration = sentryIntegrationRepository.findByWorkspaceId(workspaceId)
                .orElseThrow(() -> new NotFoundException("Sentry integration not found"));

        try {
            HttpHeaders headers = createHeaders(integration.getAuthToken());
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            // Build URL with query parameters
            StringBuilder url = new StringBuilder(SENTRY_API_BASE)
                    .append("/organizations/")
                    .append(integration.getOrganizationSlug())
                    .append("/issues/");

            List<String> params = new ArrayList<>();
            if (query != null && !query.isBlank()) {
                params.add("query=" + query);
            }
            if (integration.getProjectSlug() != null && !integration.getProjectSlug().isBlank()) {
                params.add("project=" + integration.getProjectSlug());
            }
            params.add("limit=" + (limit != null ? limit : 25));

            if (!params.isEmpty()) {
                url.append("?").append(String.join("&", params));
            }

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url.toString(),
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().stream()
                        .map(SentryIssueResponse::from)
                        .collect(Collectors.toList());
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed to fetch Sentry issues: {}", e.getMessage());
            throw new BadRequestException("Sentry 이슈 조회 실패: " + e.getMessage());
        }
    }

    /**
     * Get single issue details from Sentry
     */
    @Transactional(readOnly = true)
    public SentryIssueResponse getIssueDetails(UUID workspaceId, String issueId) {
        SentryIntegration integration = sentryIntegrationRepository.findByWorkspaceId(workspaceId)
                .orElseThrow(() -> new NotFoundException("Sentry integration not found"));

        try {
            HttpHeaders headers = createHeaders(integration.getAuthToken());
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    SENTRY_API_BASE + "/issues/" + issueId + "/",
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return SentryIssueResponse.from(response.getBody());
            }
            throw new NotFoundException("Sentry issue not found: " + issueId);
        } catch (NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Failed to fetch Sentry issue details: {}", e.getMessage());
            throw new BadRequestException("Sentry 이슈 상세 조회 실패: " + e.getMessage());
        }
    }

    /**
     * Import Sentry issue as Mission or Todo
     */
    @Transactional
    public Object importIssue(SentryImportRequest request) {
        SentryIntegration integration = sentryIntegrationRepository.findByWorkspaceId(request.getWorkspaceId())
                .orElseThrow(() -> new NotFoundException("Sentry integration not found"));

        // Fetch issue details from Sentry
        SentryIssueResponse issue = getIssueDetails(request.getWorkspaceId(), request.getIssueId());

        Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                .orElseThrow(() -> new NotFoundException("Workspace not found"));

        // Determine priority based on Sentry level
        Priority priority = mapLevelToPriority(issue.getLevel());

        // Build description from Sentry issue
        StringBuilder description = new StringBuilder();
        description.append("**Sentry Issue**: [").append(issue.getShortId()).append("](").append(issue.getPermalink()).append(")\n\n");
        if (issue.getCulprit() != null) {
            description.append("**Location**: `").append(issue.getCulprit()).append("`\n\n");
        }
        description.append("**Level**: ").append(issue.getLevel()).append("\n");
        description.append("**Events**: ").append(issue.getCount()).append("\n");
        if (issue.getUserCount() != null && issue.getUserCount() > 0) {
            description.append("**Affected Users**: ").append(issue.getUserCount()).append("\n");
        }
        description.append("**First Seen**: ").append(issue.getFirstSeen()).append("\n");
        description.append("**Last Seen**: ").append(issue.getLastSeen()).append("\n");

        if (request.getMissionId() == null) {
            // Create new Mission from issue
            Mission mission = Mission.builder()
                    .workspace(workspace)
                    .title("[Sentry] " + issue.getTitle())
                    .description(description.toString())
                    .priority(priority)
                    .sentryIssueId(issue.getId())
                    .sentryIssueUrl(issue.getPermalink())
                    .build();
            mission = missionRepository.save(mission);

            // Update last sync time
            integration.setLastSyncAt(LocalDateTime.now());
            sentryIntegrationRepository.save(integration);

            log.info("Created Mission from Sentry issue: {} -> {}", issue.getShortId(), mission.getId());
            return MissionResponse.from(mission);
        } else {
            // Add as Todo to existing Mission
            Mission mission = missionRepository.findById(request.getMissionId())
                    .orElseThrow(() -> new NotFoundException("Mission not found"));

            Integer maxOrder = todoRepository.findMaxOrderIndexByMissionId(mission.getId());
            int orderIndex = (maxOrder != null ? maxOrder : 0) + 1;

            Todo todo = Todo.create(
                    mission,
                    "[Sentry] " + issue.getTitle(),
                    description.toString(),
                    priority,
                    mapLevelToComplexity(issue.getLevel()),
                    orderIndex,
                    null
            );
            todo = todoRepository.save(todo);

            // Store Sentry issue reference in todo meta
            String meta = String.format("{\"sentry\":{\"issueId\":\"%s\",\"shortId\":\"%s\",\"permalink\":\"%s\"}}",
                    issue.getId(), issue.getShortId(), issue.getPermalink());
            todo.setMeta(meta);
            todo = todoRepository.save(todo);

            // Update last sync time
            integration.setLastSyncAt(LocalDateTime.now());
            sentryIntegrationRepository.save(integration);

            log.info("Created Todo from Sentry issue: {} -> {}", issue.getShortId(), todo.getId());
            return TodoResponse.from(todo);
        }
    }

    private Priority mapLevelToPriority(String level) {
        if (level == null) return Priority.MEDIUM;
        return switch (level.toLowerCase()) {
            case "fatal", "error" -> Priority.HIGH;
            case "warning" -> Priority.MEDIUM;
            default -> Priority.LOW;
        };
    }

    private Complexity mapLevelToComplexity(String level) {
        if (level == null) return Complexity.MEDIUM;
        return switch (level.toLowerCase()) {
            case "fatal" -> Complexity.HIGH;
            case "error" -> Complexity.MEDIUM;
            default -> Complexity.LOW;
        };
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
