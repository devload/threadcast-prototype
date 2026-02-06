package io.threadcast.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AnalysisCallbackRequest {

    @NotNull(message = "Request ID is required")
    private UUID requestId;

    @NotBlank(message = "Status is required")
    private String status;

    private Object analysis;

    private String errorMessage;
}
