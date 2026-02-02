package io.threadcast.service;

import io.threadcast.domain.Mission;
import io.threadcast.domain.Todo;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.repository.TodoRepository;
import io.threadcast.service.terminal.TodoTerminalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for orchestrating Todo execution based on dependencies.
 * When a Todo completes, this service:
 * 1. Finds all todos that depended on it
 * 2. Checks if they are now ready to start
 * 3. If mission.autoStartEnabled is true and mission is THREADING, auto-starts them
 * 4. Starts terminal session with Claude Code for auto-started todos
 * 5. Notifies frontend via WebSocket
 */
@Slf4j
@Service
public class TodoOrchestrationService {

    private final TodoRepository todoRepository;
    private final TimelineService timelineService;
    private final WebSocketService webSocketService;
    private final TodoTerminalService terminalService;

    public TodoOrchestrationService(
            TodoRepository todoRepository,
            TimelineService timelineService,
            WebSocketService webSocketService,
            @Lazy TodoTerminalService terminalService) {
        this.todoRepository = todoRepository;
        this.timelineService = timelineService;
        this.webSocketService = webSocketService;
        this.terminalService = terminalService;
    }

    /**
     * Called when a todo is completed (status changed to WOVEN).
     * Handles orchestration of dependent todos.
     */
    @Transactional
    public void onTodoCompleted(Todo completedTodo) {
        log.info("Todo completed: {} ({})", completedTodo.getTitle(), completedTodo.getId());

        Mission mission = completedTodo.getMission();

        // Find all todos that depend on this one
        List<Todo> dependents = todoRepository.findDependents(completedTodo);

        for (Todo dependent : dependents) {
            if (dependent.isReadyToStart()) {
                log.info("Dependent todo is now ready: {} ({})", dependent.getTitle(), dependent.getId());

                // Check if auto-start is enabled and mission is threading
                if (Boolean.TRUE.equals(mission.getAutoStartEnabled())
                        && mission.getStatus() == MissionStatus.THREADING) {
                    autoStartTodo(dependent);
                }

                // Notify frontend that this todo is ready to start
                webSocketService.notifyTodoReadyToStart(mission.getId(), dependent);
            }
        }
    }

    /**
     * Automatically start a todo (transition from PENDING to THREADING).
     * Also starts terminal session with Claude Code.
     */
    private void autoStartTodo(Todo todo) {
        log.info("Auto-starting todo: {} ({})", todo.getTitle(), todo.getId());

        TodoStatus previousStatus = todo.getStatus();
        todo.startThreading();
        todoRepository.save(todo);

        // Record timeline event
        timelineService.recordTodoStarted(todo);

        // Notify via WebSocket
        webSocketService.notifyTodoStatusChanged(
                todo.getMission().getId(),
                todo,
                previousStatus
        );

        // Start terminal session with Claude Code
        String todoId = todo.getId().toString();
        String workDir = todo.getMission().getWorkspace().getPath();
        terminalService.startSession(todoId, workDir, true)
            .thenRun(() -> log.info("Terminal session started for auto-started todo: {}", todoId))
            .exceptionally(e -> {
                log.error("Failed to start terminal for todo {}: {}", todoId, e.getMessage());
                return null;
            });
    }

    /**
     * Check all pending todos in a mission and start any that are ready.
     * Useful when mission starts threading or when manually triggered.
     */
    @Transactional
    public void startReadyTodos(Mission mission) {
        if (!Boolean.TRUE.equals(mission.getAutoStartEnabled())) {
            log.debug("Auto-start disabled for mission: {}", mission.getId());
            return;
        }

        if (mission.getStatus() != MissionStatus.THREADING) {
            log.debug("Mission is not threading: {}", mission.getId());
            return;
        }

        List<Todo> readyTodos = todoRepository.findReadyToStart(mission.getId());

        for (Todo todo : readyTodos) {
            autoStartTodo(todo);
        }
    }
}
