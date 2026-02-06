package io.threadcast.service;

import io.threadcast.domain.Mission;
import io.threadcast.domain.TimelineEvent;
import io.threadcast.domain.Todo;
import io.threadcast.domain.enums.ActorType;
import io.threadcast.domain.enums.EventType;
import io.threadcast.dto.response.TimelineEventResponse;
import io.threadcast.repository.TimelineEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
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
    public void recordMissionDropped(Mission mission) {
        TimelineEvent event = TimelineEvent.create(
                mission.getWorkspace(),
                mission,
                null,
                EventType.MISSION_DROPPED,
                ActorType.USER,
                "Mission dropped: " + mission.getTitle(),
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

    /**
     * Record step progress from SwiftCast tool usage events.
     * Shows real-time AI activity in timeline (e.g., "Reading files", "Writing code").
     *
     * @param todo The todo being worked on
     * @param stepType The inferred step type (ANALYSIS, IMPLEMENTATION, etc.)
     * @param status IN_PROGRESS or COMPLETED
     * @param message Description of what Claude is doing
     */
    @Transactional
    public void recordStepProgress(Todo todo, String stepType, String status, String message) {
        log.info("recordStepProgress called: todoId={}, stepType={}, status={}, message={}",
            todo.getId(), stepType, status, message);

        // Skip COMPLETED events to reduce noise - only show active work
        if ("COMPLETED".equals(status)) {
            log.debug("Skipping COMPLETED status event");
            return;
        }

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("stepType", stepType);
        metadata.put("status", status);

        // Create title from message, e.g., "Using Read" -> "📖 Reading files"
        String title = formatStepMessage(stepType, message);

        TimelineEvent event = TimelineEvent.create(
                todo.getMission().getWorkspace(),
                todo.getMission(),
                todo,
                EventType.AI_ACTIVITY,
                ActorType.AI,
                title,
                metadata
        );
        timelineEventRepository.save(event);
        webSocketService.notifyTimelineEvent(todo.getMission().getWorkspace().getId(), event);
        webSocketService.notifyTodoTimelineEvent(todo.getId(), event);
    }

    private String formatStepMessage(String stepType, String message) {
        // Map tool usage to user-friendly descriptions
        if (message.contains("Read")) {
            return "📖 파일 읽는 중...";
        } else if (message.contains("Write") || message.contains("Edit")) {
            return "✏️ 코드 작성 중...";
        } else if (message.contains("Bash")) {
            return "⚡ 명령어 실행 중...";
        } else if (message.contains("Glob") || message.contains("Grep")) {
            return "🔍 파일 검색 중...";
        } else if (message.contains("analysis")) {
            return "🔬 분석 중...";
        } else if (message.contains("implementation")) {
            return "🛠️ 구현 중...";
        } else {
            return "🤖 " + (message.isEmpty() ? stepType + " 진행 중..." : message);
        }
    }

    /**
     * Record AI activity/work summary from Claude's response.
     * Called when SwiftCast sends usage_logged webhook with response summary.
     *
     * @param todo The todo being worked on
     * @param summary Claude's response summary (first ~200 chars of response)
     * @param model The model used (e.g., claude-opus-4-5)
     * @param inputTokens Number of input tokens
     * @param outputTokens Number of output tokens
     */
    @Transactional
    public void recordAIActivity(Todo todo, String summary, String model, long inputTokens, long outputTokens) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("model", model);
        metadata.put("inputTokens", inputTokens);
        metadata.put("outputTokens", outputTokens);

        // Create a clean title from summary (first 80 chars, no newlines)
        String title = summary;
        if (title != null && !title.isEmpty()) {
            title = title.replace("\n", " ").replace("\r", "");
            if (title.length() > 80) {
                title = title.substring(0, 77) + "...";
            }
        } else {
            title = "AI processing...";
        }

        log.info("Recording AI activity: todoId={}, missionId={}, workspaceId={}",
            todo.getId(), todo.getMission().getId(), todo.getMission().getWorkspace().getId());

        TimelineEvent event = TimelineEvent.create(
                todo.getMission().getWorkspace(),
                todo.getMission(),
                todo,
                EventType.AI_ACTIVITY,
                ActorType.AI,
                title,
                metadata
        );
        TimelineEvent saved = timelineEventRepository.save(event);
        log.info("AI activity saved: eventId={}, todoId={}", saved.getId(),
            saved.getTodo() != null ? saved.getTodo().getId() : "null");

        webSocketService.notifyTimelineEvent(todo.getMission().getWorkspace().getId(), event);

        // Also notify todo-specific channel
        webSocketService.notifyTodoTimelineEvent(todo.getId(), event);
    }
}
