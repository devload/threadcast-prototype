package io.threadcast.service;

import io.threadcast.domain.Todo;
import io.threadcast.domain.TodoStep;
import io.threadcast.domain.enums.StepStatus;
import io.threadcast.domain.enums.StepType;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.dto.request.StepUpdateWebhookRequest;
import io.threadcast.dto.response.StepProgressResponse;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.TodoRepository;
import io.threadcast.repository.TodoStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for handling step progress updates from AI workers.
 *
 * Manages step state transitions and notifies frontend via WebSocket.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StepProgressService {

    private final TodoRepository todoRepository;
    private final TodoStepRepository todoStepRepository;
    private final WebSocketService webSocketService;
    private final TimelineService timelineService;

    /**
     * Process a step update from AI worker webhook.
     *
     * @param request The step update request
     * @return StepProgressResponse with updated step info
     */
    @Transactional
    public StepProgressResponse processStepUpdate(StepUpdateWebhookRequest request) {
        UUID todoId = UUID.fromString(request.getTodoId());

        Todo todo = todoRepository.findByIdWithSteps(todoId)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + todoId));

        TodoStep step = todoStepRepository.findByTodoIdAndStepType(todoId, request.getStepType())
                .orElseThrow(() -> new NotFoundException("Step not found: " + request.getStepType() + " for Todo: " + todoId));

        StepStatus previousStatus = step.getStatus();

        // Update step status
        updateStepStatus(step, request);

        // Save step
        step = todoStepRepository.save(step);

        // Update Todo status if needed
        updateTodoStatusIfNeeded(todo, step, request.getStatus());

        // Record timeline event for significant changes
        if (previousStatus != request.getStatus()) {
            recordTimelineEvent(todo, step, request);
        }

        // Create response
        StepProgressResponse response = StepProgressResponse.from(
                step,
                request.getProgress(),
                request.getMessage()
        );

        // Notify via WebSocket
        webSocketService.notifyStepProgress(todo.getMission().getId(), response);

        log.info("Step updated: todoId={}, step={}, status={}, progress={}",
                todoId, request.getStepType(), request.getStatus(), request.getProgress());

        return response;
    }

    /**
     * Update step status based on webhook request.
     */
    private void updateStepStatus(TodoStep step, StepUpdateWebhookRequest request) {
        switch (request.getStatus()) {
            case IN_PROGRESS -> {
                if (step.getStatus() != StepStatus.IN_PROGRESS) {
                    step.start();
                }
            }
            case COMPLETED -> {
                step.complete(request.getOutput());
            }
            case FAILED -> {
                step.fail();
            }
            case SKIPPED -> {
                step.skip();
            }
            case PENDING -> {
                // Reset step (rare case)
                step.setStatus(StepStatus.PENDING);
                step.setStartedAt(null);
                step.setCompletedAt(null);
            }
        }
    }

    /**
     * Update Todo status based on step progress.
     */
    private void updateTodoStatusIfNeeded(Todo todo, TodoStep step, StepStatus newStatus) {
        // If first step starts, start the Todo
        if (newStatus == StepStatus.IN_PROGRESS && todo.getStatus() == TodoStatus.PENDING) {
            todo.startThreading();
            todoRepository.save(todo);
            log.info("Todo started automatically: {}", todo.getId());
        }

        // If all steps completed, complete the Todo
        if (newStatus == StepStatus.COMPLETED) {
            boolean allCompleted = todo.getSteps().stream()
                    .allMatch(s -> s.getStatus() == StepStatus.COMPLETED || s.getStatus() == StepStatus.SKIPPED);

            if (allCompleted) {
                todo.complete();
                todoRepository.save(todo);
                log.info("Todo completed automatically: {}", todo.getId());
            }
        }

        // If any step fails, mark Todo as tangled
        if (newStatus == StepStatus.FAILED) {
            todo.fail();
            todoRepository.save(todo);
            log.info("Todo failed due to step failure: {}", todo.getId());
        }
    }

    /**
     * Record timeline event for step changes.
     */
    private void recordTimelineEvent(Todo todo, TodoStep step, StepUpdateWebhookRequest request) {
        String title = switch (request.getStatus()) {
            case IN_PROGRESS -> "Step started: " + step.getStepType().name();
            case COMPLETED -> "Step completed: " + step.getStepType().name();
            case FAILED -> "Step failed: " + step.getStepType().name();
            case SKIPPED -> "Step skipped: " + step.getStepType().name();
            default -> "Step updated: " + step.getStepType().name();
        };

        timelineService.recordStepEvent(todo, step, title, request.getMessage());
    }

    /**
     * Get current step progress for a Todo.
     */
    @Transactional(readOnly = true)
    public StepProgressResponse getCurrentProgress(UUID todoId) {
        Todo todo = todoRepository.findByIdWithSteps(todoId)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + todoId));

        TodoStep currentStep = todo.getSteps().stream()
                .filter(s -> s.getStatus() == StepStatus.IN_PROGRESS)
                .findFirst()
                .orElse(null);

        if (currentStep == null) {
            // Return last completed step or first pending step
            currentStep = todo.getSteps().stream()
                    .filter(s -> s.getStatus() == StepStatus.COMPLETED)
                    .reduce((first, second) -> second)
                    .orElseGet(() -> todo.getSteps().stream()
                            .filter(s -> s.getStatus() == StepStatus.PENDING)
                            .findFirst()
                            .orElse(todo.getSteps().get(0)));
        }

        return StepProgressResponse.from(currentStep, null, null);
    }
}
