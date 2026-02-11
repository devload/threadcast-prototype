package io.threadcast.repository;

import io.threadcast.domain.OAuthApp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OAuthAppRepository extends JpaRepository<OAuthApp, UUID> {

    Optional<OAuthApp> findByClientId(String clientId);
}
