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
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.UUID;

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
    private final TransactionTemplate transactionTemplate;

    public TodoOrchestrationService(
            TodoRepository todoRepository,
            TimelineService timelineService,
            WebSocketService webSocketService,
            @Lazy TodoTerminalService terminalService,
            GitWorktreeService worktreeService,
            TransactionTemplate transactionTemplate) {
        this.todoRepository = todoRepository;
        this.timelineService = timelineService;
        this.webSocketService = webSocketService;
        this.terminalService = terminalService;
        this.worktreeService = worktreeService;
        this.transactionTemplate = transactionTemplate;
    }

    /**
     * Called when a todo is completed (status changed to WOVEN).
     * Handles orchestration of dependent todos.
     *
     * IMPORTANT: Commit must complete before starting next todo,
     * otherwise the next todo's worktree creation will delete the uncommitted worktree.
     */
    @Transactional
    public void onTodoCompleted(Todo completedTodo) {
        log.info("Todo completed: {} ({})", completedTodo.getTitle(), completedTodo.getId());

        // Capture values before async - avoid LazyInitializationException
        final UUID todoId = completedTodo.getId();
        final UUID missionId = completedTodo.getMission().getId();
        final boolean autoStartEnabled = Boolean.TRUE.equals(completedTodo.getMission().getAutoStartEnabled());
        final MissionStatus missionStatus = completedTodo.getMission().getStatus();

        // Commit changes in the completed Todo's worktree, THEN start next todos
        worktreeService.commitWorktree(completedTodo)
            .thenRun(() -> {
                log.info("Worktree committed for todo: {}", todoId);
                startDependentTodos(todoId, missionId, autoStartEnabled, missionStatus);
            })
            .exceptionally(e -> {
                log.error("Failed to commit worktree for todo {}: {}", todoId, e.getMessage());
                // Still try to start dependent todos even if commit failed
                startDependentTodos(todoId, missionId, autoStartEnabled, missionStatus);
                return null;
            });
    }

    /**
     * Find and start todos that depend on the completed todo.
     * Called from async context after worktree commit.
     * Uses atomic database operation to prevent race conditions.
     */
    private void startDependentTodos(UUID completedTodoId, UUID missionId, boolean autoStartEnabled, MissionStatus missionStatus) {
        // Reload the completed todo to get fresh data
        Todo completedTodo = todoRepository.findById(completedTodoId).orElse(null);
        if (completedTodo == null) {
            log.warn("Completed todo not found: {}", completedTodoId);
            return;
        }

        // Find all todos that depend on this one
        List<Todo> dependents = todoRepository.findDependents(completedTodo);
        log.info("Found {} dependents for todo {}", dependents.size(), completedTodoId);

        for (Todo dependent : dependents) {
            UUID dependentId = dependent.getId();
            String dependentTitle = dependent.getTitle();

            log.info("Checking dependent: {} ({}), status={}, dependencies={}",
                dependentTitle, dependentId, dependent.getStatus(),
                dependent.getDependencies().stream()
                    .map(d -> d.getTitle() + ":" + d.getStatus())
                    .toList());

            // Check if dependencies are met first (this is safe - dependencies don't change)
            if (!dependent.areDependenciesMet()) {
                log.info("Dependent todo {} has unmet dependencies, skipping", dependentTitle);
                continue;
            }

            // Check if auto-start is enabled and mission is threading
            if (autoStartEnabled && missionStatus == MissionStatus.THREADING) {
                // Use atomic operation to start the todo - prevents race condition
                // This will only succeed if the todo is currently PENDING
                tryAtomicAutoStart(dependentId, dependentTitle, missionId);
            } else {
                // Just notify if manual start is required
                if (dependent.getStatus() == TodoStatus.PENDING) {
                    log.info("Dependent todo {} is ready for manual start", dependentTitle);
                    webSocketService.notifyTodoReadyToStart(missionId, dependent);
                }
            }
        }
    }

    /**
     * Attempt to atomically start a todo.
     * Uses database-level atomic update to prevent race conditions.
     * Uses programmatic transaction to ensure atomicity even when called from async context.
     */
    public void tryAtomicAutoStart(UUID todoId, String todoTitle, UUID missionId) {
        // Use programmatic transaction since this may be called from async context
        // where @Transactional proxy doesn't work
        Boolean started = transactionTemplate.execute(status -> {
            // Atomic update: only succeeds if status is currently PENDING
            int updated = todoRepository.atomicStartTodo(todoId);
            return updated > 0;
        });

        if (Boolean.TRUE.equals(started)) {
            log.info("Atomic auto-start succeeded for todo: {} ({})", todoTitle, todoId);

            // Reload the todo in a new transaction
            Todo todo = transactionTemplate.execute(status ->
                todoRepository.findByIdWithMissionAndWorkspace(todoId).orElse(null)
            );

            if (todo == null) {
                log.error("Todo not found after atomic start: {}", todoId);
                return;
            }

            // Record timeline event
            timelineService.recordTodoStarted(todo);

            // Notify via WebSocket
            webSocketService.notifyTodoStatusChanged(missionId, todo, TodoStatus.PENDING);
            webSocketService.notifyTodoReadyToStart(missionId, todo);

            // Create worktree and start terminal session
            worktreeService.createWorktree(todo)
                .thenCompose(worktreePath -> {
                    log.info("Worktree created for todo {}: {}", todoId, worktreePath);
                    return terminalService.startSession(todoId.toString(), worktreePath, true);
                })
                .thenRun(() -> log.info("Terminal session started in worktree for todo: {}", todoId))
                .exceptionally(e -> {
                    log.error("Failed to setup worktree/terminal for todo {}: {}", todoId, e.getMessage());
                    return null;
                });
        } else {
            // Another thread/process already started or completed this todo
            log.info("Atomic auto-start skipped for todo {} - already started or completed", todoTitle);
        }
    }

    /**
     * Check all pending todos in a mission and start any that are ready.
     * Useful when mission starts threading or when manually triggered.
     * Uses atomic operation to prevent race conditions.
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

        UUID missionId = mission.getId();
        List<Todo> readyTodos = todoRepository.findReadyToStart(missionId);
        log.info("Found {} ready todos for mission {}", readyTodos.size(), missionId);

        for (Todo todo : readyTodos) {
            tryAtomicAutoStart(todo.getId(), todo.getTitle(), missionId);
        }
    }
}
