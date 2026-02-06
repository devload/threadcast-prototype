package io.threadcast.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SentryImportRequest {
    @NotNull
    private UUID workspaceId;

    @NotBlank
    private String issueId;

    private UUID missionId;  // null이면 새 Mission 생성, 있으면 해당 Mission에 Todo로 추가
}
