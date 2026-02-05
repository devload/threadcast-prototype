package io.threadcast.dto.response;

import io.threadcast.domain.TimelineEvent;
import io.threadcast.domain.enums.ActorType;
import io.threadcast.domain.enums.EventType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class TimelineEventResponse {

    private UUID id;
    private EventType eventType;
    private ActorType actorType;
    private String title;       // For frontend compatibility
    private String description; // Same as title for now
    private UUID missionId;
    private String missionTitle;
    private UUID todoId;
    private String todoTitle;
    private Map<String, Object> metadata;
    private LocalDateTime createdAt;

    public static TimelineEventResponse from(TimelineEvent event) {
        TimelineEventResponseBuilder builder = TimelineEventResponse.builder()
                .id(event.getId())
                .eventType(event.getEventType())
                .actorType(event.getActorType())
                .title(event.getDescription())       // Map description to title
                .description(event.getDescription())
                .metadata(event.getMetadata())
                .createdAt(event.getCreatedAt());

        if (event.getMission() != null) {
            builder.missionId(event.getMission().getId())
                    .missionTitle(event.getMission().getTitle());
        }

        if (event.getTodo() != null) {
            builder.todoId(event.getTodo().getId())
                    .todoTitle(event.getTodo().getTitle());
        }

        return builder.build();
    }
}
