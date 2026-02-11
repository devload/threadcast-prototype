package io.threadcast.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateUserStatusRequest {

    @NotBlank(message = "Status is required")
    private String status;
}
