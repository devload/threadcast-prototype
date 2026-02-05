package io.threadcast.controller;

import io.threadcast.domain.JiraIntegration;
import io.threadcast.domain.JiraIssueMapping;
import io.threadcast.domain.enums.JiraAuthType;
import io.threadcast.dto.request.JiraConnectRequest;
import io.threadcast.dto.request.JiraEpicImportRequest;
import io.threadcast.dto.request.JiraImportRequest;
import io.threadcast.dto.request.JiraOAuthCallbackRequest;
import io.threadcast.dto.response.*;
import io.threadcast.repository.JiraIntegrationRepository;
import io.threadcast.service.JiraAuthService;
import io.threadcast.service.JiraService;
import io.threadcast.service.JiraSyncService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * JIRA 연동 API 컨트롤러
 */
@RestController
@RequestMapping("/api/jira")
@RequiredArgsConstructor
@Slf4j
public class JiraController {

    private final JiraAuthService jiraAuthService;
    private final JiraService jiraService;
    private final JiraSyncService jiraSyncService;
    private final JiraIntegrationRepository jiraIntegrationRepository;

    // ==================== 연결 관리 ====================

    /**
     * JIRA 연결 상태 확인
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<JiraIntegrationResponse>> getStatus(
            @RequestParam UUID workspaceId) {
        return jiraIntegrationRepository.findByWorkspaceId(workspaceId)
                .map(integration -> ResponseEntity.ok(ApiResponse.success(JiraIntegrationResponse.from(integration))))
                .orElse(ResponseEntity.ok(ApiResponse.success(JiraIntegrationResponse.notConnected())));
    }

    /**
     * OAuth 인증 URL 생성 (JIRA Cloud)
     */
    @GetMapping("/oauth/authorize")
    public ResponseEntity<ApiResponse<Map<String, String>>> getOAuthUrl(
            @RequestParam UUID workspaceId) {
        String authUrl = jiraAuthService.getOAuthAuthorizationUrl(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("authUrl", authUrl)));
    }

    /**
     * OAuth 콜백 처리 (JIRA Cloud)
     */
    @PostMapping("/oauth/callback")
    public ResponseEntity<ApiResponse<JiraIntegrationResponse>> handleOAuthCallback(
            @Valid @RequestBody JiraOAuthCallbackRequest request) {
        try {
            JiraIntegration integration = jiraAuthService.handleOAuthCallback(
                    request.getWorkspaceId(), request.getCode()
            );
            return ResponseEntity.ok(ApiResponse.success(JiraIntegrationResponse.from(integration)));
        } catch (Exception e) {
            log.error("OAuth callback failed", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("OAUTH_FAILED", e.getMessage()));
        }
    }

    /**
     * JIRA 연결 (API Token 또는 PAT)
     */
    @PostMapping("/connect")
    public ResponseEntity<ApiResponse<JiraIntegrationResponse>> connect(
            @Valid @RequestBody JiraConnectRequest request) {
        try {
            JiraIntegration integration;

            if (request.getAuthType() == JiraAuthType.API_TOKEN) {
                integration = jiraAuthService.connectWithApiToken(
                        request.getWorkspaceId(),
                        request.getInstanceType(),
                        request.getBaseUrl(),
                        request.getEmail(),
                        request.getApiToken()
                );
            } else if (request.getAuthType() == JiraAuthType.PAT) {
                integration = jiraAuthService.connectWithPat(
                        request.getWorkspaceId(),
                        request.getInstanceType(),
                        request.getBaseUrl(),
                        request.getApiToken()
                );
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("INVALID_AUTH_TYPE",
                                "Use /oauth/authorize for OAuth2 authentication"));
            }

            if (request.getDefaultProjectKey() != null) {
                integration.setDefaultProjectKey(request.getDefaultProjectKey());
                jiraIntegrationRepository.save(integration);
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(JiraIntegrationResponse.from(integration)));
        } catch (Exception e) {
            log.error("JIRA connection failed", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("CONNECTION_FAILED", e.getMessage()));
        }
    }

    /**
     * JIRA 연결 해제
     */
    @DeleteMapping("/disconnect")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> disconnect(
            @RequestParam UUID workspaceId) {
        jiraAuthService.disconnect(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("disconnected", true)));
    }

    /**
     * 연결 테스트 (기존 연결)
     */
    @PostMapping("/test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testConnection(
            @RequestParam UUID workspaceId) {
        boolean connected = jiraService.testConnection(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "connected", connected,
                "workspaceId", workspaceId.toString()
        )));
    }

    /**
     * 자격 증명 테스트 (연결 전)
     * 저장하지 않고 JIRA 연결 가능 여부만 확인
     */
    @PostMapping("/test-credentials")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testCredentials(
            @Valid @RequestBody JiraConnectRequest request) {
        try {
            Map<String, Object> result = jiraAuthService.testCredentials(
                    request.getInstanceType(),
                    request.getBaseUrl(),
                    request.getAuthType(),
                    request.getEmail(),
                    request.getApiToken()
            );
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.warn("Credential test failed: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "success", false,
                    "message", e.getMessage()
            )));
        }
    }

    // ==================== 프로젝트/이슈 조회 ====================

    /**
     * 프로젝트 목록 조회
     */
    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<List<JiraProjectResponse>>> getProjects(
            @RequestParam UUID workspaceId) {
        try {
            List<JiraProjectResponse> projects = jiraService.getProjects(workspaceId);
            return ResponseEntity.ok(ApiResponse.success(projects));
        } catch (Exception e) {
            log.error("Failed to get JIRA projects", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("FETCH_FAILED", e.getMessage()));
        }
    }

    /**
     * JQL 검색
     */
    @GetMapping("/issues/search")
    public ResponseEntity<ApiResponse<List<JiraIssueResponse>>> searchIssues(
            @RequestParam UUID workspaceId,
            @RequestParam String jql,
            @RequestParam(defaultValue = "50") int maxResults) {
        try {
            List<JiraIssueResponse> issues = jiraService.searchIssues(workspaceId, jql, maxResults);
            return ResponseEntity.ok(ApiResponse.success(issues));
        } catch (Exception e) {
            log.error("Failed to search JIRA issues", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("SEARCH_FAILED", e.getMessage()));
        }
    }

    /**
     * 단일 이슈 조회
     */
    @GetMapping("/issues/{issueKey}")
    public ResponseEntity<ApiResponse<JiraIssueResponse>> getIssue(
            @RequestParam UUID workspaceId,
            @PathVariable String issueKey) {
        try {
            JiraIssueResponse issue = jiraService.getIssue(workspaceId, issueKey);
            return ResponseEntity.ok(ApiResponse.success(issue));
        } catch (Exception e) {
            log.error("Failed to get JIRA issue: {}", issueKey, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("NOT_FOUND", e.getMessage()));
        }
    }

    // ==================== Import ====================

    /**
     * 단일 이슈 Import
     */
    @PostMapping("/import/issue")
    public ResponseEntity<ApiResponse<JiraImportResultResponse>> importIssue(
            @Valid @RequestBody JiraImportRequest request) {
        try {
            JiraImportResultResponse result;

            if (request.getTargetType() == JiraIssueMapping.MappedEntityType.MISSION) {
                result = jiraSyncService.importIssueAsMission(
                        request.getWorkspaceId(), request.getIssueKey()
                );
            } else {
                if (request.getMissionId() == null) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(ApiResponse.error("MISSING_MISSION_ID",
                                    "Mission ID is required when importing as Todo"));
                }
                result = jiraSyncService.importIssueAsTodo(
                        request.getWorkspaceId(), request.getIssueKey(),
                        request.getMissionId(), request.getOrderIndex()
                );
            }

            if (!result.isSuccess()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("IMPORT_FAILED", result.getErrorMessage()));
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Failed to import JIRA issue: {}", request.getIssueKey(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("IMPORT_FAILED", e.getMessage()));
        }
    }

    /**
     * Epic Import (Mission + Todos)
     */
    @PostMapping("/import/epic")
    public ResponseEntity<ApiResponse<JiraImportResultResponse>> importEpic(
            @Valid @RequestBody JiraEpicImportRequest request) {
        try {
            JiraImportResultResponse result = jiraSyncService.importEpic(
                    request.getWorkspaceId(),
                    request.getEpicKey(),
                    request.getIncludeChildren() != null ? request.getIncludeChildren() : true,
                    request.getIssueTypes(),
                    request.getIncludeCompleted() != null ? request.getIncludeCompleted() : false
            );

            if (!result.isSuccess()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("IMPORT_FAILED", result.getErrorMessage()));
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Failed to import JIRA epic: {}", request.getEpicKey(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("IMPORT_FAILED", e.getMessage()));
        }
    }

    // ==================== 매핑 관리 ====================

    /**
     * 매핑 목록 조회
     */
    @GetMapping("/mappings")
    public ResponseEntity<ApiResponse<List<JiraIssueMappingResponse>>> getMappings(
            @RequestParam UUID workspaceId) {
        List<JiraIssueMappingResponse> mappings = jiraSyncService.getMappings(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(mappings));
    }

    /**
     * 매핑 삭제 (Unlink)
     */
    @DeleteMapping("/mappings/{mappingId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> unlinkMapping(
            @PathVariable UUID mappingId) {
        jiraSyncService.unlinkMapping(mappingId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("unlinked", true)));
    }

    /**
     * 기본 프로젝트 키 설정
     */
    @PatchMapping("/default-project")
    public ResponseEntity<ApiResponse<JiraIntegrationResponse>> setDefaultProject(
            @RequestParam UUID workspaceId,
            @RequestParam String projectKey) {
        return jiraIntegrationRepository.findByWorkspaceId(workspaceId)
                .map(integration -> {
                    integration.setDefaultProjectKey(projectKey);
                    jiraIntegrationRepository.save(integration);
                    return ResponseEntity.ok(ApiResponse.success(JiraIntegrationResponse.from(integration)));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("NOT_CONNECTED", "JIRA is not connected")));
    }
}
