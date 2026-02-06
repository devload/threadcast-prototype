package io.threadcast.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateAnalysisRequest {

    @NotNull(message = "Workspace ID is required")
    private UUID workspaceId;

    private UUID missionId;

    private String missionTitle;

    private String missionDescription;

    @NotBlank(message = "Analysis type is required")
    private String analysisType;
}
