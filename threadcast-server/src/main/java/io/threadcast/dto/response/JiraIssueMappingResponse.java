package io.threadcast.dto.response;

import io.threadcast.domain.JiraIssueMapping;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JIRA 이슈 매핑 응답 DTO
 */
@Data
@Builder
public class JiraIssueMappingResponse {

    private UUID id;
    private String jiraIssueKey;
    private String jiraIssueId;
    private String jiraIssueType;
    private String jiraSummary;
    private String jiraStatus;
    private String jiraUrl;
    private String entityType;
    private UUID missionId;
    private String missionTitle;
    private UUID todoId;
    private String todoTitle;
    private String syncDirection;
    private LocalDateTime lastSyncAt;
    private LocalDateTime createdAt;

    public static JiraIssueMappingResponse from(JiraIssueMapping mapping) {
        JiraIssueMappingResponseBuilder builder = JiraIssueMappingResponse.builder()
                .id(mapping.getId())
                .jiraIssueKey(mapping.getJiraIssueKey())
                .jiraIssueId(mapping.getJiraIssueId())
                .jiraIssueType(mapping.getJiraIssueType())
                .jiraSummary(mapping.getJiraSummary())
                .jiraStatus(mapping.getJiraStatus())
                .jiraUrl(mapping.getJiraUrl())
                .entityType(mapping.getEntityType().name())
                .syncDirection(mapping.getSyncDirection().name())
                .lastSyncAt(mapping.getLastSyncAt())
                .createdAt(mapping.getCreatedAt());

        if (mapping.getMission() != null) {
            builder.missionId(mapping.getMission().getId())
                   .missionTitle(mapping.getMission().getTitle());
        }

        if (mapping.getTodo() != null) {
            builder.todoId(mapping.getTodo().getId())
                   .todoTitle(mapping.getTodo().getTitle());
        }

        return builder.build();
    }
}
