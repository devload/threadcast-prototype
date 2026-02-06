package io.threadcast.dto.response;

import io.threadcast.domain.AnalysisRequest;
import io.threadcast.domain.enums.AnalysisStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AnalysisRequestResponse {

    private UUID id;
    private UUID workspaceId;
    private UUID missionId;
    private String missionTitle;
    private String missionDescription;
    private String analysisType;
    private AnalysisStatus status;
    private String resultJson;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    private LocalDateTime completedAt;

    public static AnalysisRequestResponse from(AnalysisRequest request) {
        return AnalysisRequestResponse.builder()
                .id(request.getId())
                .workspaceId(request.getWorkspace().getId())
                .missionId(request.getMission() != null ? request.getMission().getId() : null)
                .missionTitle(request.getMissionTitle())
                .missionDescription(request.getMissionDescription())
                .analysisType(request.getAnalysisType())
                .status(request.getStatus())
                .resultJson(request.getResultJson())
                .errorMessage(request.getErrorMessage())
                .createdAt(request.getCreatedAt())
                .processedAt(request.getProcessedAt())
                .completedAt(request.getCompletedAt())
                .build();
    }
}
