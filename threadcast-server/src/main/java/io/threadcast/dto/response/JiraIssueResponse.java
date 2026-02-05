package io.threadcast.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * JIRA 이슈 응답 DTO
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JiraIssueResponse {

    /**
     * 이슈 ID
     */
    private String id;

    /**
     * 이슈 키 (예: PROJ-123)
     */
    private String key;

    /**
     * 이슈 제목
     */
    private String summary;

    /**
     * 이슈 설명 (Markdown 또는 HTML)
     */
    private String description;

    /**
     * 이슈 타입 (Epic, Story, Task, Bug 등)
     */
    private String issueType;

    /**
     * 이슈 타입 아이콘 URL
     */
    private String issueTypeIconUrl;

    /**
     * 상태 (To Do, In Progress, Done 등)
     */
    private String status;

    /**
     * 상태 카테고리 (new, indeterminate, done)
     */
    private String statusCategory;

    /**
     * 우선순위 (Highest, High, Medium, Low, Lowest)
     */
    private String priority;

    /**
     * 우선순위 아이콘 URL
     */
    private String priorityIconUrl;

    /**
     * 담당자 이름
     */
    private String assignee;

    /**
     * 보고자 이름
     */
    private String reporter;

    /**
     * 프로젝트 키
     */
    private String projectKey;

    /**
     * 프로젝트 이름
     */
    private String projectName;

    /**
     * Epic 키 (이 이슈가 속한 Epic)
     */
    private String epicKey;

    /**
     * Epic 이름
     */
    private String epicName;

    /**
     * 스토리 포인트
     */
    private Double storyPoints;

    /**
     * 예상 시간 (초)
     */
    private Long timeEstimate;

    /**
     * 기록된 시간 (초)
     */
    private Long timeSpent;

    /**
     * 레이블 목록
     */
    private List<String> labels;

    /**
     * 컴포넌트 목록
     */
    private List<String> components;

    /**
     * JIRA 웹 URL
     */
    private String webUrl;

    /**
     * 생성 시간
     */
    private LocalDateTime createdAt;

    /**
     * 수정 시간
     */
    private LocalDateTime updatedAt;

    /**
     * 이미 ThreadCast에 Import되었는지 여부
     */
    private Boolean imported;

    /**
     * Import된 경우 매핑된 엔티티 타입
     */
    private String mappedEntityType;

    /**
     * Import된 경우 매핑된 엔티티 ID
     */
    private String mappedEntityId;
}
