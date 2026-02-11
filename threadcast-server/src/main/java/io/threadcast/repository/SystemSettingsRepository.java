package io.threadcast.repository;

import io.threadcast.domain.SystemSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingsRepository extends JpaRepository<SystemSettings, String> {
}
