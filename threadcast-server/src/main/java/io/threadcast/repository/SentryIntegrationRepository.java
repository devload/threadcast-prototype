package io.threadcast.repository;

import io.threadcast.domain.SentryIntegration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SentryIntegrationRepository extends JpaRepository<SentryIntegration, UUID> {
    Optional<SentryIntegration> findByWorkspaceId(UUID workspaceId);
    void deleteByWorkspaceId(UUID workspaceId);
}
