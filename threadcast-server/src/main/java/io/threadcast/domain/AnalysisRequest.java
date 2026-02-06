package io.threadcast.domain;

import io.threadcast.domain.enums.AnalysisStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "analysis_request")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AnalysisRequest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id")
    private Mission mission;

    @Column(length = 300)
    private String missionTitle;

    @Column(columnDefinition = "TEXT")
    private String missionDescription;

    @Column(nullable = false, length = 50)
    private String analysisType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AnalysisStatus status = AnalysisStatus.QUEUED;

    @Column(columnDefinition = "TEXT")
    private String resultJson;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    private LocalDateTime processedAt;

    private LocalDateTime completedAt;

    public static AnalysisRequest create(Workspace workspace, Mission mission,
                                         String missionTitle, String missionDescription,
                                         String analysisType) {
        return AnalysisRequest.builder()
                .workspace(workspace)
                .mission(mission)
                .missionTitle(missionTitle)
                .missionDescription(missionDescription)
                .analysisType(analysisType)
                .build();
    }

    public void startProcessing() {
        this.status = AnalysisStatus.PROCESSING;
        this.processedAt = LocalDateTime.now();
    }

    public void complete(String resultJson) {
        this.status = AnalysisStatus.COMPLETED;
        this.resultJson = resultJson;
        this.completedAt = LocalDateTime.now();
    }

    public void fail(String errorMessage) {
        this.status = AnalysisStatus.FAILED;
        this.errorMessage = errorMessage;
        this.completedAt = LocalDateTime.now();
    }
}
