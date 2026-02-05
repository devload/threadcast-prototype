package io.threadcast.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JIRA 이슈와 ThreadCast Mission/Todo 매핑
 * 하나의 JIRA 이슈는 하나의 Mission 또는 Todo에만 매핑됨
 */
@Entity
@Table(name = "jira_issue_mapping", indexes = {
        @Index(name = "idx_jira_mapping_issue_key", columnList = "jira_issue_key"),
        @Index(name = "idx_jira_mapping_mission", columnList = "mission_id"),
        @Index(name = "idx_jira_mapping_todo", columnList = "todo_id")
})
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class JiraIssueMapping extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_id", nullable = false)
    private JiraIntegration integration;

    /**
     * JIRA 이슈 키 (예: PROJ-123)
     */
    @Column(name = "jira_issue_key", nullable = false, length = 50)
    private String jiraIssueKey;

    /**
     * JIRA 이슈 ID (내부 ID)
     */
    @Column(name = "jira_issue_id", nullable = false, length = 50)
    private String jiraIssueId;

    /**
     * JIRA 이슈 타입 (Epic, Story, Task, Bug 등)
     */
    @Column(name = "jira_issue_type", length = 50)
    private String jiraIssueType;

    /**
     * JIRA 이슈 요약 (제목) - 캐시용
     */
    @Column(length = 500)
    private String jiraSummary;

    /**
     * JIRA 이슈 상태 - 캐시용
     */
    @Column(length = 50)
    private String jiraStatus;

    /**
     * JIRA 이슈 URL
     */
    @Column(length = 500)
    private String jiraUrl;

    /**
     * 매핑된 엔티티 타입
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MappedEntityType entityType;

    /**
     * 매핑된 Mission (Epic → Mission 매핑 시)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id")
    private Mission mission;

    /**
     * 매핑된 Todo (Story/Task/Bug → Todo 매핑 시)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "todo_id")
    private Todo todo;

    /**
     * 마지막 동기화 시간
     */
    private LocalDateTime lastSyncAt;

    /**
     * 동기화 방향
     * - JIRA_TO_TC: JIRA → ThreadCast (Import)
     * - TC_TO_JIRA: ThreadCast → JIRA (향후 Export 지원 시)
     * - BIDIRECTIONAL: 양방향 (향후 지원)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SyncDirection syncDirection = SyncDirection.JIRA_TO_TC;

    /**
     * 매핑된 엔티티 타입
     */
    public enum MappedEntityType {
        MISSION,
        TODO
    }

    /**
     * 동기화 방향
     */
    public enum SyncDirection {
        JIRA_TO_TC,
        TC_TO_JIRA,
        BIDIRECTIONAL
    }

    /**
     * Mission 매핑 생성
     */
    public static JiraIssueMapping createForMission(JiraIntegration integration,
                                                     String issueKey, String issueId,
                                                     String issueType, String summary,
                                                     String status, String url,
                                                     Mission mission) {
        return JiraIssueMapping.builder()
                .integration(integration)
                .jiraIssueKey(issueKey)
                .jiraIssueId(issueId)
                .jiraIssueType(issueType)
                .jiraSummary(summary)
                .jiraStatus(status)
                .jiraUrl(url)
                .entityType(MappedEntityType.MISSION)
                .mission(mission)
                .lastSyncAt(LocalDateTime.now())
                .build();
    }

    /**
     * Todo 매핑 생성
     */
    public static JiraIssueMapping createForTodo(JiraIntegration integration,
                                                  String issueKey, String issueId,
                                                  String issueType, String summary,
                                                  String status, String url,
                                                  Todo todo) {
        return JiraIssueMapping.builder()
                .integration(integration)
                .jiraIssueKey(issueKey)
                .jiraIssueId(issueId)
                .jiraIssueType(issueType)
                .jiraSummary(summary)
                .jiraStatus(status)
                .jiraUrl(url)
                .entityType(MappedEntityType.TODO)
                .todo(todo)
                .lastSyncAt(LocalDateTime.now())
                .build();
    }

    /**
     * JIRA 이슈 정보 업데이트
     */
    public void updateJiraInfo(String summary, String status) {
        this.jiraSummary = summary;
        this.jiraStatus = status;
        this.lastSyncAt = LocalDateTime.now();
    }
}
