package io.threadcast.service.admin;

import io.threadcast.domain.SystemSettings;
import io.threadcast.dto.request.admin.UpdateSettingsRequest;
import io.threadcast.dto.response.admin.AdminSettingsResponse;
import io.threadcast.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminSettingsService {

    private final SystemSettingsRepository settingsRepository;

    private static final Map<String, String> DEFAULTS = Map.of(
            "siteName", "ThreadCast",
            "supportEmail", "support@threadcast.io",
            "defaultAutonomy", "50",
            "maxWorkspacesPerUser", "10",
            "maintenanceMode", "false",
            "registrationEnabled", "true",
            "emailVerificationRequired", "false"
    );

    @Transactional(readOnly = true)
    public AdminSettingsResponse getSettings() {
        Map<String, String> settings = settingsRepository.findAll().stream()
                .collect(Collectors.toMap(
                        SystemSettings::getSettingKey,
                        SystemSettings::getSettingValue));

        return AdminSettingsResponse.builder()
                .siteName(settings.getOrDefault("siteName", DEFAULTS.get("siteName")))
                .supportEmail(settings.getOrDefault("supportEmail", DEFAULTS.get("supportEmail")))
                .defaultAutonomy(Integer.parseInt(
                        settings.getOrDefault("defaultAutonomy", DEFAULTS.get("defaultAutonomy"))))
                .maxWorkspacesPerUser(Integer.parseInt(
                        settings.getOrDefault("maxWorkspacesPerUser", DEFAULTS.get("maxWorkspacesPerUser"))))
                .maintenanceMode(Boolean.parseBoolean(
                        settings.getOrDefault("maintenanceMode", DEFAULTS.get("maintenanceMode"))))
                .registrationEnabled(Boolean.parseBoolean(
                        settings.getOrDefault("registrationEnabled", DEFAULTS.get("registrationEnabled"))))
                .emailVerificationRequired(Boolean.parseBoolean(
                        settings.getOrDefault("emailVerificationRequired", DEFAULTS.get("emailVerificationRequired"))))
                .build();
    }

    @Transactional
    public AdminSettingsResponse updateSettings(UpdateSettingsRequest request) {
        if (request.getSiteName() != null) {
            saveSetting("siteName", request.getSiteName());
        }
        if (request.getSupportEmail() != null) {
            saveSetting("supportEmail", request.getSupportEmail());
        }
        if (request.getDefaultAutonomy() != null) {
            saveSetting("defaultAutonomy", String.valueOf(request.getDefaultAutonomy()));
        }
        if (request.getMaxWorkspacesPerUser() != null) {
            saveSetting("maxWorkspacesPerUser", String.valueOf(request.getMaxWorkspacesPerUser()));
        }
        if (request.getMaintenanceMode() != null) {
            saveSetting("maintenanceMode", String.valueOf(request.getMaintenanceMode()));
        }
        if (request.getRegistrationEnabled() != null) {
            saveSetting("registrationEnabled", String.valueOf(request.getRegistrationEnabled()));
        }
        if (request.getEmailVerificationRequired() != null) {
            saveSetting("emailVerificationRequired", String.valueOf(request.getEmailVerificationRequired()));
        }

        return getSettings();
    }

    private void saveSetting(String key, String value) {
        SystemSettings setting = settingsRepository.findById(key)
                .orElse(SystemSettings.builder().settingKey(key).build());
        setting.setSettingValue(value);
        settingsRepository.save(setting);
    }
}
