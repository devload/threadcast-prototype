package io.threadcast.domain;

import io.threadcast.domain.enums.CommandStatus;
import io.threadcast.domain.enums.CommandType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "pm_agent_command")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PmAgentCommand extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommandType type;

    @Column(columnDefinition = "TEXT")
    private String payloadJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CommandStatus status = CommandStatus.PENDING;

    private LocalDateTime acknowledgedAt;

    private LocalDateTime completedAt;

    public static PmAgentCommand create(Workspace workspace, CommandType type, String payloadJson) {
        return PmAgentCommand.builder()
                .workspace(workspace)
                .type(type)
                .payloadJson(payloadJson)
                .build();
    }

    public void acknowledge() {
        this.status = CommandStatus.ACKNOWLEDGED;
        this.acknowledgedAt = LocalDateTime.now();
    }

    public void complete() {
        this.status = CommandStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }
}
