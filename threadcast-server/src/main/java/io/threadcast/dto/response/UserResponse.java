package io.threadcast.dto.response;

import io.threadcast.domain.User;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserResponse {

    private UUID id;
    private String email;
    private String name;
    private String avatarUrl;
    private Integer autonomyLevel;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .autonomyLevel(user.getAutonomyLevel())
                .build();
    }
}
