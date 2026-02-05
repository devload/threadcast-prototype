package io.threadcast.service;

import io.threadcast.domain.JiraIntegration;
import io.threadcast.domain.JiraIssueMapping;
import io.threadcast.domain.enums.JiraInstanceType;
import io.threadcast.dto.response.JiraIssueResponse;
import io.threadcast.dto.response.JiraProjectResponse;
import io.threadcast.repository.JiraIntegrationRepository;
import io.threadcast.repository.JiraIssueMappingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * JIRA REST API 클라이언트 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JiraService {

    private final JiraAuthService jiraAuthService;
    private final JiraIntegrationRepository jiraIntegrationRepository;
    private final JiraIssueMappingRepository jiraIssueMappingRepository;
    private final RestTemplate jiraRestTemplate;

    private static final DateTimeFormatter JIRA_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSZ");

    /**
     * JIRA 연결 상태 확인
     */
    public boolean testConnection(UUID workspaceId) {
        return jiraIntegrationRepository.findByWorkspaceId(workspaceId)
                .map(integration -> {
                    try {
                        getCurrentUser(integration);
                        integration.setLastStatusMessage("Connected");
                        jiraIntegrationRepository.save(integration);
                        return true;
                    } catch (Exception e) {
                        integration.setLastStatusMessage("Connection failed: " + e.getMessage());
                        jiraIntegrationRepository.save(integration);
                        return false;
                    }
                })
                .orElse(false);
    }

    /**
     * 현재 사용자 정보 조회
     */
    public Map<String, Object> getCurrentUser(JiraIntegration integration) {
        String url = getApiUrl(integration, "/rest/api/2/myself");
        return executeGet(integration, url, Map.class);
    }

    /**
     * 프로젝트 목록 조회
     */
    public List<JiraProjectResponse> getProjects(UUID workspaceId) {
        JiraIntegration integration = getIntegration(workspaceId);

        // JIRA Cloud와 Server는 API 엔드포인트가 다름
        String url = integration.getInstanceType() == JiraInstanceType.CLOUD
                ? getApiUrl(integration, "/rest/api/3/project/search")
                : getApiUrl(integration, "/rest/api/2/project");

        if (integration.getInstanceType() == JiraInstanceType.CLOUD) {
            // Cloud: /rest/api/3/project/search 는 페이지네이션 응답
            Map<String, Object> response = executeGet(integration, url, Map.class);
            List<Map<String, Object>> projects = (List<Map<String, Object>>) response.get("values");
            return projects.stream()
                    .map(this::mapToProjectResponse)
                    .collect(Collectors.toList());
        } else {
            // Server: /rest/api/2/project 는 배열 응답
            List<Map<String, Object>> projects = executeGet(integration, url, List.class);
            return projects.stream()
                    .map(this::mapToProjectResponse)
                    .collect(Collectors.toList());
        }
    }

    /**
     * JQL 검색
     */
    public List<JiraIssueResponse> searchIssues(UUID workspaceId, String jql, int maxResults) {
        JiraIntegration integration = getIntegration(workspaceId);

        List<String> fieldsList = new ArrayList<>(Arrays.asList(
                "summary", "description", "issuetype", "status", "priority",
                "assignee", "reporter", "project", "labels", "components",
                "created", "updated", "customfield_10014", "timeoriginalestimate", "timespent"
        ));

        Map<String, Object> response;

        if (integration.getInstanceType() == JiraInstanceType.CLOUD) {
            fieldsList.add("parent");
            // JIRA Cloud: POST /rest/api/3/search/jql
            String url = getApiUrl(integration, "/rest/api/3/search/jql");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("jql", jql);
            requestBody.put("maxResults", maxResults);
            requestBody.put("fields", fieldsList);

            log.debug("Searching JIRA Cloud with POST: {}", url);
            response = executePost(integration, url, requestBody, Map.class);
        } else {
            fieldsList.add("customfield_10008"); // Epic Link (Server)
            // JIRA Server: GET /rest/api/2/search
            String url = getApiUrl(integration, "/rest/api/2/search");
            url += "?jql=" + encodeUrl(jql);
            url += "&maxResults=" + maxResults;
            url += "&fields=" + String.join(",", fieldsList);

            log.debug("Searching JIRA Server with GET: {}", url);
            response = executeGet(integration, url, Map.class);
        }

        List<Map<String, Object>> issues = (List<Map<String, Object>>) response.get("issues");

        if (issues == null) {
            return Collections.emptyList();
        }

        return issues.stream()
                .map(issue -> mapToIssueResponse(issue, integration))
                .collect(Collectors.toList());
    }

    /**
     * 단일 이슈 조회
     */
    public JiraIssueResponse getIssue(UUID workspaceId, String issueKey) {
        JiraIntegration integration = getIntegration(workspaceId);

        String url = getApiUrl(integration, "/rest/api/2/issue/" + issueKey);
        url += "?fields=summary,description,issuetype,status,priority,assignee,reporter,project,labels,components,created,updated,customfield_10014,timeoriginalestimate,timespent";

        if (integration.getInstanceType() == JiraInstanceType.CLOUD) {
            url += ",parent";
        } else {
            url += ",customfield_10008";
        }

        Map<String, Object> issue = executeGet(integration, url, Map.class);
        return mapToIssueResponse(issue, integration);
    }

    /**
     * Epic의 하위 이슈 조회
     */
    public List<JiraIssueResponse> getEpicChildren(UUID workspaceId, String epicKey,
                                                    List<String> issueTypes, boolean includeCompleted) {
        JiraIntegration integration = getIntegration(workspaceId);

        // Epic Link JQL 생성 (Cloud와 Server 다름)
        String jql;
        if (integration.getInstanceType() == JiraInstanceType.CLOUD) {
            jql = String.format("\"Parent Link\" = %s OR parent = %s", epicKey, epicKey);
        } else {
            // Server - Epic Link 커스텀 필드 사용 (설치마다 다를 수 있음)
            jql = String.format("\"Epic Link\" = %s", epicKey);
        }

        // 이슈 타입 필터
        if (issueTypes != null && !issueTypes.isEmpty()) {
            String types = issueTypes.stream()
                    .map(t -> "\"" + t + "\"")
                    .collect(Collectors.joining(", "));
            jql += " AND issuetype IN (" + types + ")";
        }

        // 완료된 이슈 제외
        if (!includeCompleted) {
            jql += " AND statusCategory != Done";
        }

        jql += " ORDER BY rank ASC";

        return searchIssues(workspaceId, jql, 100);
    }

    // ==================== Private Methods ====================

    private JiraIntegration getIntegration(UUID workspaceId) {
        return jiraIntegrationRepository.findByWorkspaceId(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("JIRA integration not found for workspace: " + workspaceId));
    }

    private String getApiUrl(JiraIntegration integration, String path) {
        return integration.getApiBaseUrl() + path;
    }

    private <T> T executeGet(JiraIntegration integration, String url, Class<T> responseType) {
        HttpHeaders headers = jiraAuthService.createAuthHeaders(integration);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<T> response = jiraRestTemplate.exchange(
                    url, HttpMethod.GET, request, responseType
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("JIRA API call failed: {} - {}", url, e.getMessage());
            throw new RuntimeException("JIRA API call failed: " + e.getMessage(), e);
        }
    }

    private <T> T executePost(JiraIntegration integration, String url, Object body, Class<T> responseType) {
        HttpHeaders headers = jiraAuthService.createAuthHeaders(integration);
        HttpEntity<Object> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<T> response = jiraRestTemplate.exchange(
                    url, HttpMethod.POST, request, responseType
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("JIRA API POST failed: {} - {}", url, e.getMessage());
            throw new RuntimeException("JIRA API call failed: " + e.getMessage(), e);
        }
    }

    private String encodeUrl(String value) {
        try {
            return java.net.URLEncoder.encode(value, "UTF-8");
        } catch (Exception e) {
            return value;
        }
    }

    private JiraProjectResponse mapToProjectResponse(Map<String, Object> project) {
        JiraProjectResponse.JiraProjectResponseBuilder builder = JiraProjectResponse.builder()
                .id((String) project.get("id"))
                .key((String) project.get("key"))
                .name((String) project.get("name"))
                .projectTypeKey((String) project.get("projectTypeKey"));

        // Avatar URL
        Map<String, Object> avatarUrls = (Map<String, Object>) project.get("avatarUrls");
        if (avatarUrls != null) {
            builder.avatarUrl((String) avatarUrls.get("48x48"));
        }

        // Lead
        Map<String, Object> lead = (Map<String, Object>) project.get("lead");
        if (lead != null) {
            builder.leadName((String) lead.get("displayName"));
        }

        return builder.build();
    }

    private JiraIssueResponse mapToIssueResponse(Map<String, Object> issue, JiraIntegration integration) {
        String key = (String) issue.get("key");
        String id = (String) issue.get("id");
        Map<String, Object> fields = (Map<String, Object>) issue.get("fields");

        JiraIssueResponse.JiraIssueResponseBuilder builder = JiraIssueResponse.builder()
                .id(id)
                .key(key)
                .summary((String) fields.get("summary"));

        // Description (Object 또는 String)
        Object description = fields.get("description");
        if (description instanceof String) {
            builder.description((String) description);
        } else if (description instanceof Map) {
            // Atlassian Document Format (ADF) - 간단히 텍스트 추출
            builder.description(extractTextFromAdf((Map<String, Object>) description));
        }

        // Issue Type
        Map<String, Object> issuetype = (Map<String, Object>) fields.get("issuetype");
        if (issuetype != null) {
            builder.issueType((String) issuetype.get("name"))
                   .issueTypeIconUrl((String) issuetype.get("iconUrl"));
        }

        // Status
        Map<String, Object> status = (Map<String, Object>) fields.get("status");
        if (status != null) {
            builder.status((String) status.get("name"));
            Map<String, Object> statusCategory = (Map<String, Object>) status.get("statusCategory");
            if (statusCategory != null) {
                builder.statusCategory((String) statusCategory.get("key"));
            }
        }

        // Priority
        Map<String, Object> priority = (Map<String, Object>) fields.get("priority");
        if (priority != null) {
            builder.priority((String) priority.get("name"))
                   .priorityIconUrl((String) priority.get("iconUrl"));
        }

        // Assignee
        Map<String, Object> assignee = (Map<String, Object>) fields.get("assignee");
        if (assignee != null) {
            builder.assignee((String) assignee.get("displayName"));
        }

        // Reporter
        Map<String, Object> reporter = (Map<String, Object>) fields.get("reporter");
        if (reporter != null) {
            builder.reporter((String) reporter.get("displayName"));
        }

        // Project
        Map<String, Object> project = (Map<String, Object>) fields.get("project");
        if (project != null) {
            builder.projectKey((String) project.get("key"))
                   .projectName((String) project.get("name"));
        }

        // Epic (Cloud: parent, Server: customfield_10008)
        if (integration.getInstanceType() == JiraInstanceType.CLOUD) {
            Map<String, Object> parent = (Map<String, Object>) fields.get("parent");
            if (parent != null) {
                builder.epicKey((String) parent.get("key"));
                Map<String, Object> parentFields = (Map<String, Object>) parent.get("fields");
                if (parentFields != null) {
                    builder.epicName((String) parentFields.get("summary"));
                }
            }
        } else {
            Object epicLink = fields.get("customfield_10008");
            if (epicLink instanceof String) {
                builder.epicKey((String) epicLink);
            }
        }

        // Story Points (customfield_10014 - 일반적인 필드)
        Object storyPoints = fields.get("customfield_10014");
        if (storyPoints instanceof Number) {
            builder.storyPoints(((Number) storyPoints).doubleValue());
        }

        // Time Tracking
        Object timeEstimate = fields.get("timeoriginalestimate");
        if (timeEstimate instanceof Number) {
            builder.timeEstimate(((Number) timeEstimate).longValue());
        }

        Object timeSpent = fields.get("timespent");
        if (timeSpent instanceof Number) {
            builder.timeSpent(((Number) timeSpent).longValue());
        }

        // Labels
        List<String> labels = (List<String>) fields.get("labels");
        builder.labels(labels != null ? labels : Collections.emptyList());

        // Components
        List<Map<String, Object>> components = (List<Map<String, Object>>) fields.get("components");
        if (components != null) {
            builder.components(components.stream()
                    .map(c -> (String) c.get("name"))
                    .collect(Collectors.toList()));
        }

        // URL
        builder.webUrl(integration.getBaseUrl() + "/browse/" + key);

        // Dates
        String created = (String) fields.get("created");
        if (created != null) {
            builder.createdAt(parseJiraDate(created));
        }

        String updated = (String) fields.get("updated");
        if (updated != null) {
            builder.updatedAt(parseJiraDate(updated));
        }

        // Check if already imported
        Optional<JiraIssueMapping> mapping = jiraIssueMappingRepository.findByJiraIssueKey(key);
        if (mapping.isPresent()) {
            builder.imported(true)
                   .mappedEntityType(mapping.get().getEntityType().name())
                   .mappedEntityId(mapping.get().getEntityType() == JiraIssueMapping.MappedEntityType.MISSION
                           ? mapping.get().getMission().getId().toString()
                           : mapping.get().getTodo().getId().toString());
        } else {
            builder.imported(false);
        }

        return builder.build();
    }

    private String extractTextFromAdf(Map<String, Object> adf) {
        if (adf == null) return null;

        StringBuilder text = new StringBuilder();
        List<Map<String, Object>> content = (List<Map<String, Object>>) adf.get("content");
        if (content != null) {
            for (Map<String, Object> block : content) {
                extractTextFromAdfNode(block, text);
            }
        }
        return text.toString().trim();
    }

    private void extractTextFromAdfNode(Map<String, Object> node, StringBuilder text) {
        String type = (String) node.get("type");

        if ("text".equals(type)) {
            text.append(node.get("text"));
        }

        List<Map<String, Object>> content = (List<Map<String, Object>>) node.get("content");
        if (content != null) {
            for (Map<String, Object> child : content) {
                extractTextFromAdfNode(child, text);
            }
            // 블록 요소 뒤에 줄바꿈 추가
            if ("paragraph".equals(type) || "heading".equals(type) || "bulletList".equals(type) || "orderedList".equals(type)) {
                text.append("\n");
            }
        }
    }

    private LocalDateTime parseJiraDate(String dateStr) {
        try {
            return LocalDateTime.parse(dateStr.replaceAll("\\+\\d{4}$", ""),
                    DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"));
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
            } catch (Exception e2) {
                return null;
            }
        }
    }
}
