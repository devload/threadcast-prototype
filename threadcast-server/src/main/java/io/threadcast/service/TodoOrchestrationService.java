package io.threadcast.service;

import io.threadcast.domain.Mission;
import io.threadcast.domain.Todo;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.repository.TodoRepository;
import io.threadcast.service.terminal.TodoTerminalService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for orchestrating Todo execution based on dependencies.
 * When a Todo completes, this service:
 * 1. Commits changes in the Todo's worktree
 * 2. Finds all todos that depended on it
 * 3. Checks if they are now ready to start
 * 4. If mission.autoStartEnabled is true and mission is THREADING, auto-starts them
 * 5. Creates worktree and starts terminal session with Claude Code for auto-started todos
 * 6. Notifies frontend via WebSocket
 */
@Slf4j
@Service
public class TodoOrchestrationService {

    private final TodoRepository todoRepository;
    private final TimelineService timelineService;
    private final WebSocketService webSocketService;
    private final TodoTerminalService terminalService;
    private final GitWorktreeService worktreeService;

    public TodoOrchestrationService(
            TodoRepository todoRepository,
            TimelineService timelineService,
            WebSocketService webSocketService,
            @Lazy TodoTerminalService terminalService,
            GitWorktreeService worktreeService) {
        this.todoRepository = todoRepository;
        this.timelineService = timelineService;
        this.webSocketService = webSocketService;
        this.terminalService = terminalService;
        this.worktreeService = worktreeService;
    }

    /**
     * Called when a todo is completed (status changed to WOVEN).
     * Handles orchestration of dependent todos.
     */
    @Transactional
    public void onTodoCompleted(Todo completedTodo) {
        log.info("Todo completed: {} ({})", completedTodo.getTitle(), completedTodo.getId());

        // Commit changes in the completed Todo's worktree
        worktreeService.commitWorktree(completedTodo)
            .thenRun(() -> log.info("Worktree committed for todo: {}", completedTodo.getId()))
            .exceptionally(e -> {
                log.error("Failed to commit worktree for todo {}: {}", completedTodo.getId(), e.getMessage());
                return null;
            });

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
     * Creates worktree and starts terminal session with Claude Code.
     */
    private void autoStartTodo(Todo todo) {
        log.info("Auto-starting todo: {} ({})", todo.getTitle(), todo.getId());

        TodoStatus previousStatus = todo.getStatus();
        todo.startThreading();

        // Record timeline event
        timelineService.recordTodoStarted(todo);

        // Notify via WebSocket
        webSocketService.notifyTodoStatusChanged(
                todo.getMission().getId(),
                todo,
                previousStatus
        );

        String todoId = todo.getId().toString();

        // Save the todo first
        todoRepository.save(todo);

        // Create worktree first, then start terminal session in the worktree
        worktreeService.createWorktree(todo)
            .thenCompose(worktreePath -> {
                log.info("Worktree created for todo {}: {}", todoId, worktreePath);

                // Start terminal session in the worktree directory
                return terminalService.startSession(todoId, worktreePath, true);
            })
            .thenRun(() -> log.info("Terminal session started in worktree for todo: {}", todoId))
            .exceptionally(e -> {
                log.error("Failed to setup worktree/terminal for todo {}: {}", todoId, e.getMessage());
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
