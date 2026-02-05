package io.threadcast.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * JIRA Import 결과 응답 DTO
 */
@Data
@Builder
public class JiraImportResultResponse {

    /**
     * Import 성공 여부
     */
    private boolean success;

    /**
     * Import된 Mission (Epic Import 시)
     */
    private MissionInfo mission;

    /**
     * Import된 Todo (단일 이슈 Import 시)
     */
    private TodoInfo todo;

    /**
     * Epic Import 시 생성된 Todo 목록
     */
    private List<TodoInfo> todos;

    /**
     * 생성된 매핑 정보
     */
    private JiraIssueMappingResponse mapping;

    /**
     * Epic Import 시 생성된 매핑 목록
     */
    private List<JiraIssueMappingResponse> mappings;

    /**
     * 에러 메시지 (실패 시)
     */
    private String errorMessage;

    /**
     * 건너뛴 이슈 수 (이미 Import된 경우)
     */
    private int skippedCount;

    @Data
    @Builder
    public static class MissionInfo {
        private UUID id;
        private String title;
        private String status;
    }

    @Data
    @Builder
    public static class TodoInfo {
        private UUID id;
        private String title;
        private String status;
        private String jiraIssueKey;
    }
}
