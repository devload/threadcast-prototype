package io.threadcast.dto.response.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminSettingsResponse {
    private String siteName;
    private String supportEmail;
    private int defaultAutonomy;
    private int maxWorkspacesPerUser;
    private boolean maintenanceMode;
    private boolean registrationEnabled;
    private boolean emailVerificationRequired;
}
