package io.threadcast.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sentry_integrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SentryIntegration extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false)
    private String organizationSlug;

    @Column
    private String projectSlug;

    @Column(nullable = false, length = 512)
    private String authToken;

    @Column
    private LocalDateTime lastSyncAt;

    @Builder.Default
    @Column(nullable = false)
    private Boolean connected = true;
}
