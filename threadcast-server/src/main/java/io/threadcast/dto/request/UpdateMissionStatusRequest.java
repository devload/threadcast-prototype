package io.threadcast.dto.request;

import io.threadcast.domain.enums.MissionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateMissionStatusRequest {

    @NotNull(message = "Status is required")
    private MissionStatus status;
}
