package io.threadcast.dto.request;

import io.threadcast.domain.JiraIssueMapping.MappedEntityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * JIRA 이슈 Import 요청 DTO
 */
@Data
public class JiraImportRequest {

    @NotNull(message = "Workspace ID is required")
    private UUID workspaceId;

    @NotBlank(message = "JIRA issue key is required")
    private String issueKey;

    /**
     * 대상 엔티티 타입 (MISSION 또는 TODO)
     */
    @NotNull(message = "Target entity type is required")
    private MappedEntityType targetType;

    /**
     * TODO로 Import 시 부모 Mission ID (필수)
     */
    private UUID missionId;

    /**
     * TODO로 Import 시 순서 인덱스 (선택, 기본값: 마지막)
     */
    private Integer orderIndex;
}
