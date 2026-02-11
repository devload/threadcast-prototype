package io.threadcast.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TotpVerifyRequest {

    @NotBlank(message = "TOTP code is required")
    private String code;

    private String tempToken;
}
