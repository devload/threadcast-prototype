package io.threadcast.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * JIRA Epic Import 요청 DTO
 * Epic을 Mission으로, 하위 이슈들을 Todos로 일괄 Import
 */
@Data
public class JiraEpicImportRequest {

    @NotNull(message = "Workspace ID is required")
    private UUID workspaceId;

    @NotBlank(message = "Epic key is required")
    private String epicKey;

    /**
     * 하위 이슈들도 함께 Import 여부 (기본값: true)
     */
    private Boolean includeChildren = true;

    /**
     * 이슈 타입별 필터 (선택, 비어있으면 모든 타입)
     * 예: ["Story", "Task", "Bug"]
     */
    private java.util.List<String> issueTypes;

    /**
     * 완료된 이슈도 Import 여부 (기본값: false)
     */
    private Boolean includeCompleted = false;
}
