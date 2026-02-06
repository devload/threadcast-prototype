package io.threadcast.service;

import io.threadcast.domain.AIQuestion;
import io.threadcast.domain.Mission;
import io.threadcast.domain.TimelineEvent;
import io.threadcast.domain.Todo;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.dto.response.AIQuestionResponse;
import io.threadcast.dto.response.MissionResponse;
import io.threadcast.dto.response.TimelineEventResponse;
import io.threadcast.dto.response.TodoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyMissionCreated(UUID workspaceId, Mission mission) {
        Map<String, Object> event = createEvent("MISSION_CREATED", MissionResponse.from(mission));
        messagingTemplate.convertAndSend("/topic/workspaces/" + workspaceId, event);
    }

    public void notifyMissionStatusChanged(UUID workspaceId, Mission mission, MissionStatus previousStatus) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("missionId", mission.getId());
        payload.put("previousStatus", previousStatus);
        payload.put("newStatus", mission.getStatus());
        payload.put("progress", mission.getProgress());
        payload.put("startedAt", mission.getStartedAt());
        payload.put("completedAt", mission.getCompletedAt());

        Map<String, Object> event = createEvent("MISSION_STATUS_CHANGED", payload);
        messagingTemplate.convertAndSend("/topic/workspaces/" + workspaceId, event);
        messagingTemplate.convertAndSend("/topic/missions/" + mission.getId(), event);
    }

    public void notifyMissionDeleted(UUID workspaceId, UUID missionId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("missionId", missionId);

        Map<String, Object> event = createEvent("MISSION_DELETED", payload);
        messagingTemplate.convertAndSend("/topic/workspaces/" + workspaceId, event);
    }

    public void notifyTodoCreated(UUID missionId, Todo todo) {
        Map<String, Object> event = createEvent("TODO_CREATED", TodoResponse.from(todo, false));
        messagingTemplate.convertAndSend("/topic/missions/" + missionId, event);
    }

    public void notifyTodoStatusChanged(UUID missionId, Todo todo, TodoStatus previousStatus) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("todoId", todo.getId());
        payload.put("missionId", missionId);
        payload.put("previousStatus", previousStatus);
        payload.put("newStatus", todo.getStatus());
        payload.put("startedAt", todo.getStartedAt());
        payload.put("completedAt", todo.getCompletedAt());
        payload.put("currentStep", todo.getCurrentStep());

        Map<String, Object> event = createEvent("TODO_STATUS_CHANGED", payload);
        messagingTemplate.convertAndSend("/topic/missions/" + missionId, event);
        messagingTemplate.convertAndSend("/topic/todos/" + todo.getId(), event);
    }

    public void notifyTodoUpdated(UUID missionId, Todo todo) {
        Map<String, Object> event = createEvent("TODO_UPDATED", TodoResponse.from(todo, false));
        messagingTemplate.convertAndSend("/topic/missions/" + missionId, event);
        messagingTemplate.convertAndSend("/topic/todos/" + todo.getId(), event);
    }

    public void notifyTodoDeleted(UUID missionId, UUID todoId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("todoId", todoId);
        payload.put("missionId", missionId);

        Map<String, Object> event = createEvent("TODO_DELETED", payload);
        messagingTemplate.convertAndSend("/topic/missions/" + missionId, event);
    }

    public void notifyTimelineEvent(UUID workspaceId, TimelineEvent timelineEvent) {
        Map<String, Object> event = createEvent("TIMELINE_EVENT", TimelineEventResponse.from(timelineEvent));
        messagingTemplate.convertAndSend("/topic/timeline/" + workspaceId, event);
    }

    /**
     * Notify timeline event for a specific todo.
     * Used for AI activity updates during weaving.
     */
    public void notifyTodoTimelineEvent(UUID todoId, TimelineEvent timelineEvent) {
        Map<String, Object> event = createEvent("TIMELINE_EVENT", TimelineEventResponse.from(timelineEvent));
        messagingTemplate.convertAndSend("/topic/todos/" + todoId + "/timeline", event);
        // Also send to main todo topic for UI updates
        messagingTemplate.convertAndSend("/topic/todos/" + todoId, event);
    }

    public void notifyQuestionCreated(UUID workspaceId, AIQuestion question) {
        Map<String, Object> event = createEvent("AI_QUESTION_CREATED", AIQuestionResponse.from(question));
        messagingTemplate.convertAndSend("/topic/ai/questions/" + workspaceId, event);
        messagingTemplate.convertAndSend("/topic/todos/" + question.getTodo().getId(), event);
    }

    public void notifyQuestionAnswered(UUID workspaceId, AIQuestion question) {
        Map<String, Object> event = createEvent("AI_QUESTION_ANSWERED", AIQuestionResponse.from(question));
        messagingTemplate.convertAndSend("/topic/ai/questions/" + workspaceId, event);
        messagingTemplate.convertAndSend("/topic/todos/" + question.getTodo().getId(), event);
    }

    /**
     * Notify frontend about step progress update.
     * Sends to both mission topic and specific todo topic.
     */
    public void notifyStepProgress(UUID missionId, io.threadcast.dto.response.StepProgressResponse progress) {
        Map<String, Object> event = createEvent("STEP_PROGRESS", progress);
        messagingTemplate.convertAndSend("/topic/missions/" + missionId, event);
        messagingTemplate.convertAndSend("/topic/todos/" + progress.getTodoId(), event);
    }

    /**
     * Notify that a todo is now ready to start (all dependencies met).
     */
    public void notifyTodoReadyToStart(UUID missionId, Todo todo) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("todoId", todo.getId());
        payload.put("missionId", missionId);
        payload.put("title", todo.getTitle());
        payload.put("status", todo.getStatus());

        Map<String, Object> event = createEvent("TODO_READY_TO_START", payload);
        messagingTemplate.convertAndSend("/topic/missions/" + missionId, event);
        log.info("Notified todo ready to start: {} ({})", todo.getTitle(), todo.getId());
    }

    /**
     * Notify that a todo's dependencies have changed.
     */
    public void notifyTodoDependenciesChanged(UUID missionId, Todo todo) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("todoId", todo.getId());
        payload.put("missionId", missionId);
        payload.put("dependencyIds", todo.getDependencies().stream()
                .map(Todo::getId)
                .toList());
        payload.put("isBlocked", todo.isBlocked());
        payload.put("isReadyToStart", todo.isReadyToStart());

        Map<String, Object> event = createEvent("TODO_DEPENDENCIES_CHANGED", payload);
        messagingTemplate.convertAndSend("/topic/missions/" + missionId, event);
        messagingTemplate.convertAndSend("/topic/todos/" + todo.getId(), event);
        log.info("Notified todo dependencies changed: {} ({})", todo.getTitle(), todo.getId());
    }

    /**
     * Notify frontend that an analysis request has been completed.
     */
    public void notifyAnalysisCompleted(UUID workspaceId, UUID requestId, String status, Object analysis) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("requestId", requestId);
        payload.put("status", status);
        payload.put("analysis", analysis);

        Map<String, Object> event = createEvent("ANALYSIS_COMPLETED", payload);
        messagingTemplate.convertAndSend("/topic/workspaces/" + workspaceId + "/analysis", event);
        messagingTemplate.convertAndSend("/topic/workspaces/" + workspaceId, event);
        log.info("Notified analysis completed: {} (status: {})", requestId, status);
    }

    /**
     * Notify frontend that an analysis request status has changed.
     */
    public void notifyAnalysisStatusChanged(UUID workspaceId, UUID requestId, String status) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("requestId", requestId);
        payload.put("status", status);

        Map<String, Object> event = createEvent("ANALYSIS_STATUS_CHANGED", payload);
        messagingTemplate.convertAndSend("/topic/workspaces/" + workspaceId + "/analysis", event);
        log.info("Notified analysis status changed: {} -> {}", requestId, status);
    }

    private Map<String, Object> createEvent(String eventType, Object payload) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventId", UUID.randomUUID().toString());
        event.put("eventType", eventType);
        event.put("timestamp", LocalDateTime.now());
        event.put("payload", payload);
        return event;
    }
}
