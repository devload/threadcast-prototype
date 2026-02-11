package io.threadcast.dto.response.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminAuthCheckResponse {
    private boolean isAdmin;
    private boolean totpEnabled;
    private String tempToken;
}
