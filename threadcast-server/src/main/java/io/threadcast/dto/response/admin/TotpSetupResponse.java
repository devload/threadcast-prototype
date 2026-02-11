package io.threadcast.dto.response.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TotpSetupResponse {
    private String qrCodeDataUrl;
    private String secret;
}
