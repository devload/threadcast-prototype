package io.threadcast.service;

import io.threadcast.domain.Mission;
import io.threadcast.domain.TimelineEvent;
import io.threadcast.domain.Todo;
import io.threadcast.domain.enums.ActorType;
import io.threadcast.domain.enums.EventType;
import io.threadcast.dto.response.TimelineEventResponse;
import io.threadcast.repository.TimelineEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TimelineService {

    private final TimelineEventRepository timelineEventRepository;
    private final WebSocketService webSocketService;

    @Transactional(readOnly = true)
    public Page<TimelineEventResponse> getRecentActivity(Pageable pageable) {
        Page<TimelineEvent> events = timelineEventRepository.findAllByOrderByCreatedAtDesc(pageable);
        return events.map(TimelineEventResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<TimelineEventResponse> getTimeline(UUID workspaceId, UUID missionId, UUID todoId,
                                                    EventType eventType, ActorType actorType,
                                                    Pageable pageable) {
        Page<TimelineEvent> events;

        if (todoId != null) {
            events = timelineEventRepository.findByTodoIdOrderByCreatedAtDesc(todoId, pageable);
        } else if (missionId != null) {
            events = timelineEventRepository.findByMissionIdOrderByCreatedAtDesc(missionId, pageable);
        } else if (eventType != null) {
            events = timelineEventRepository.findByWorkspaceIdAndEventTypeOrderByCreatedAtDesc(
                    workspaceId, eventType, pageable);
        } else if (actorType != null) {
            events = timelineEventRepository.findByWorkspaceIdAndActorTypeOrderByCreatedAtDesc(
                    workspaceId, actorType, pageable);
        } else {
            events = timelineEventRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId, pageable);
        }

        return events.map(TimelineEventResponse::from);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTodayStats(UUID workspaceId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        Map<String, Object> stats = new HashMap<>();
        stats.put("date", LocalDate.now());
        stats.put("todosWoven", timelineEventRepository.countByWorkspaceIdAndEventTypeAndDateRange(
                workspaceId, EventType.TODO_COMPLETED, startOfDay, endOfDay));
        stats.put("todosStarted", timelineEventRepository.countByWorkspaceIdAndEventTypeAndDateRange(
                workspaceId, EventType.TODO_STARTED, startOfDay, endOfDay));
        stats.put("todosFailed", timelineEventRepository.countByWorkspaceIdAndEventTypeAndDateRange(
                workspaceId, EventType.TODO_FAILED, startOfDay, endOfDay));
        stats.put("filesCreated", timelineEventRepository.countByWorkspaceIdAndEventTypeAndDateRange(
                workspaceId, EventType.FILE_CREATED, startOfDay, endOfDay));
        stats.put("filesModified", timelineEventRepository.countByWorkspaceIdAndEventTypeAndDateRange(
                workspaceId, EventType.FILE_MODIFIED, startOfDay, endOfDay));
        stats.put("aiQuestionsAsked", timelineEventRepository.countByWorkspaceIdAndEventTypeAndDateRange(
                workspaceId, EventType.AI_QUESTION, startOfDay, endOfDay));
        stats.put("commentsAdded", timelineEventRepository.countByWorkspaceIdAndEventTypeAndDateRange(
                workspaceId, EventType.COMMENT_ADDED, startOfDay, endOfDay));

        return stats;
    }

    @Transactional
    public void recordMissionCreated(Mission mission) {
        TimelineEvent event = TimelineEvent.create(
                mission.getWorkspace(),
                mission,
                null,
                EventType.MISSION_CREATED,
                ActorType.USER,
                "Mission created: " + mission.getTitle(),
                null
        );
        timelineEventRepository.save(event);
        webSocketService.notifyTimelineEvent(mission.getWorkspace().getId(), event);
    }

    @Transactional
    public void recordMissionStarted(Mission mission) {
        TimelineEvent event = TimelineEvent.create(
                mission.getWorkspace(),
                mission,
                null,
                EventType.MISSION_STARTED,
                ActorType.SYSTEM,
                "Mission threading started: " + mission.getTitle(),
                null
        );
        timelineEventRepository.save(event);
        webSocketService.notifyTimelineEvent(mission.getWorkspace().getId(), event);
    }

    @Transactional
    public void recordMissionCompleted(Mission mission) {
        TimelineEvent event = TimelineEvent.create(
                mission.getWorkspace(),
                mission,
                null,
                EventType.MISSION_COMPLETED,
                ActorType.SYSTEM,
                "Mission woven: " + mission.getTitle(),
                null
        );
        timelineEventRepository.save(event);
        webSocketService.notifyTimelineEvent(mission.getWorkspace().getId(), event);
    }

    @Transactional
    public void recordTodoCreated(Todo todo) {
        TimelineEvent event = TimelineEvent.create(
                todo.getMission().getWorkspace(),
                todo.getMission(),
                todo,
                EventType.TODO_CREATED,
                ActorType.SYSTEM,
                "Todo created: " + todo.getTitle(),
                null
        );
        timelineEventRepository.save(event);
        webSocketService.notifyTimelineEvent(todo.getMission().getWorkspace().getId(), event);
    }

    @Transactional
    public void recordTodoStarted(Todo todo) {
        TimelineEvent event = TimelineEvent.create(
                todo.getMission().getWorkspace(),
                todo.getMission(),
                todo,
                EventType.TODO_STARTED,
                ActorType.AI,
                "Todo threading started: " + todo.getTitle(),
                null
        );
        timelineEventRepository.save(event);
        webSocketService.notifyTimelineEvent(todo.getMission().getWorkspace().getId(), event);
    }

    @Transactional
    public void recordTodoCompleted(Todo todo) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("actualTime", todo.getActualTime());
        metadata.put("estimatedTime", todo.getEstimatedTime());

        TimelineEvent event = TimelineEvent.create(
                todo.getMission().getWorkspace(),
                todo.getMission(),
                todo,
                EventType.TODO_COMPLETED,
                ActorType.AI,
                "Todo woven: " + todo.getTitle(),
                metadata
        );
        timelineEventRepository.save(event);
        webSocketService.notifyTimelineEvent(todo.getMission().getWorkspace().getId(), event);
    }

    @Transactional
    public void recordTodoFailed(Todo todo) {
        TimelineEvent event = TimelineEvent.create(
                todo.getMission().getWorkspace(),
                todo.getMission(),
                todo,
                EventType.TODO_FAILED,
                ActorType.AI,
                "Todo tangled: " + todo.getTitle(),
                null
        );
        timelineEventRepository.save(event);
        webSocketService.notifyTimelineEvent(todo.getMission().getWorkspace().getId(), event);
    }

    @Transactional
    public void recordStepEvent(Todo todo, io.threadcast.domain.TodoStep step, String title, String message) {
        EventType eventType = switch (step.getStatus()) {
            case IN_PROGRESS -> EventType.STEP_STARTED;
            case COMPLETED -> EventType.STEP_COMPLETED;
            default -> EventType.STEP_STARTED;
        };

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("stepType", step.getStepType().name());
        metadata.put("stepStatus", step.getStatus().name());
        if (message != null) {
            metadata.put("message", message);
        }

        TimelineEvent event = TimelineEvent.create(
                todo.getMission().getWorkspace(),
                todo.getMission(),
                todo,
                eventType,
                ActorType.AI,
                title,
                metadata
        );
        timelineEventRepository.save(event);
        webSocketService.notifyTimelineEvent(todo.getMission().getWorkspace().getId(), event);
    }
}
