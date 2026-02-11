package io.threadcast.dto.request.admin;

import lombok.Data;

@Data
public class UpdateSettingsRequest {

    private String siteName;
    private String supportEmail;
    private Integer defaultAutonomy;
    private Integer maxWorkspacesPerUser;
    private Boolean maintenanceMode;
    private Boolean registrationEnabled;
    private Boolean emailVerificationRequired;
}
