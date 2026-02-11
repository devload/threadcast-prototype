package io.threadcast.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * Request to launch Claude Code Team mode for a mission.
 */
@Data
public class TeamLaunchRequest {

    @NotNull
    private UUID missionId;

    @NotNull
    private UUID workspaceId;
}
