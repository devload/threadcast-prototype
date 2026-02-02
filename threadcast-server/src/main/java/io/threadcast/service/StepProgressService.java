package io.threadcast.service;

import io.threadcast.domain.Todo;
import io.threadcast.domain.TodoStep;
import io.threadcast.domain.enums.StepStatus;
import io.threadcast.domain.enums.StepType;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.dto.request.StepUpdateWebhookRequest;
import io.threadcast.dto.response.StepProgressResponse;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.TerminalSessionMappingRepository;
import io.threadcast.repository.TodoRepository;
import io.threadcast.repository.TodoStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for handling step progress updates from AI workers.
 *
 * Manages step state transitions and notifies frontend via WebSocket.
 */
@Slf4j
@Service
public class StepProgressService {

    private final TodoRepository todoRepository;
    private final TodoStepRepository todoStepRepository;
    private final TerminalSessionMappingRepository mappingRepository;
    private final WebSocketService webSocketService;
    private final TimelineService timelineService;
    private final io.threadcast.service.terminal.TodoTerminalService terminalService;
    private final TodoOrchestrationService orchestrationService;

    public StepProgressService(
            TodoRepository todoRepository,
            TodoStepRepository todoStepRepository,
            TerminalSessionMappingRepository mappingRepository,
            WebSocketService webSocketService,
            TimelineService timelineService,
            io.threadcast.service.terminal.TodoTerminalService terminalService,
            @org.springframework.context.annotation.Lazy TodoOrchestrationService orchestrationService) {
        this.todoRepository = todoRepository;
        this.todoStepRepository = todoStepRepository;
        this.mappingRepository = mappingRepository;
        this.webSocketService = webSocketService;
        this.timelineService = timelineService;
        this.terminalService = terminalService;
        this.orchestrationService = orchestrationService;
    }

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

        // Skip any previous PENDING steps (if jumping ahead)
        if (request.getStatus() == StepStatus.IN_PROGRESS) {
            skipPreviousPendingSteps(todo, request.getStepType());
        }

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
     * Step order for determining which steps to skip.
     */
    private static final List<StepType> STEP_ORDER = List.of(
            StepType.ANALYSIS,
            StepType.DESIGN,
            StepType.IMPLEMENTATION,
            StepType.VERIFICATION,
            StepType.REVIEW,
            StepType.INTEGRATION
    );

    /**
     * Skip any previous PENDING steps when a later step starts.
     * For example, if IMPLEMENTATION starts but DESIGN is still PENDING, mark DESIGN as SKIPPED.
     */
    private void skipPreviousPendingSteps(Todo todo, StepType currentStepType) {
        int currentIndex = STEP_ORDER.indexOf(currentStepType);
        if (currentIndex <= 0) {
            return; // No previous steps to skip
        }

        for (int i = 0; i < currentIndex; i++) {
            StepType previousStepType = STEP_ORDER.get(i);
            todo.getSteps().stream()
                    .filter(s -> s.getStepType() == previousStepType && s.getStatus() == StepStatus.PENDING)
                    .findFirst()
                    .ifPresent(pendingStep -> {
                        pendingStep.skip();
                        todoStepRepository.save(pendingStep);
                        log.info("Step skipped: todoId={}, step={}", todo.getId(), previousStepType);
                    });
        }
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
                // Trigger orchestration for dependent todos
                orchestrationService.onTodoCompleted(todo);
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
     * Start the first step (ANALYSIS) for a Todo.
     * Called when Todo execution begins.
     * Sets currentPmStep=ANALYSIS in the session mapping.
     */
    @Transactional
    public void startFirstStep(UUID todoId) {
        Todo todo = todoRepository.findByIdWithSteps(todoId)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + todoId));

        // Find ANALYSIS step and start it
        TodoStep analysisStep = todo.getSteps().stream()
                .filter(s -> s.getStepType() == StepType.ANALYSIS)
                .findFirst()
                .orElse(null);

        if (analysisStep != null && analysisStep.getStatus() == StepStatus.PENDING) {
            analysisStep.start();
            todoStepRepository.save(analysisStep);

            // Set currentPmStep in session mapping (source of truth for PM)
            mappingRepository.findByTodoId(todoId)
                .ifPresent(mapping -> {
                    mapping.setCurrentPmStep(StepType.ANALYSIS);
                    mappingRepository.save(mapping);
                    log.info("PM: Set currentPmStep=ANALYSIS for todoId={}", todoId);
                });

            log.info("PM: Started first step ANALYSIS for todoId={}", todoId);

            // Notify via WebSocket
            webSocketService.notifyStepProgress(todo.getMission().getId(),
                StepProgressResponse.from(analysisStep, 0, "ANALYSIS started"));
        } else {
            log.info("PM: ANALYSIS step already started or not found for todoId={}", todoId);
        }
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

    /**
     * Complete a session - determine next step or mark Todo as complete.
     * Called when SwiftCast sends session_complete webhook (stop_reason: "end_turn").
     *
     * PM Logic (uses currentPmStep from mapping as source of truth):
     * 1. Get currentPmStep from session mapping (the step PM assigned, not DB IN_PROGRESS)
     * 2. Mark that step as COMPLETED
     * 3. Determine and start the next step in the workflow
     * 4. If all steps done, mark Todo as WOVEN
     */
    @Transactional
    public void completeSession(UUID todoId) {
        Todo todo = todoRepository.findByIdWithSteps(todoId)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + todoId));

        log.info("PM: Processing session complete for Todo: {}", todoId);

        // Get currentPmStep from session mapping (source of truth for PM step progression)
        var mappingOpt = mappingRepository.findByTodoId(todoId);
        StepType currentPmStep = mappingOpt.map(m -> m.getCurrentPmStep()).orElse(null);

        log.info("PM: currentPmStep from mapping: {} for todoId={}", currentPmStep, todoId);

        // Find the step to complete
        TodoStep currentStep = null;
        if (currentPmStep != null) {
            currentStep = todo.getSteps().stream()
                    .filter(s -> s.getStepType() == currentPmStep)
                    .findFirst()
                    .orElse(null);
        }

        // Fallback: if no currentPmStep, look for IN_PROGRESS step (legacy behavior)
        if (currentStep == null) {
            currentStep = todo.getSteps().stream()
                    .filter(s -> s.getStatus() == StepStatus.IN_PROGRESS)
                    .findFirst()
                    .orElse(null);

            if (currentStep != null) {
                log.warn("PM: currentPmStep was null, falling back to IN_PROGRESS step: {}", currentStep.getStepType());
            }
        }

        StepType lastCompletedStepType = null;

        // Complete the current step
        if (currentStep != null) {
            // Ensure step is marked as IN_PROGRESS before completing (fix any incorrect status)
            if (currentStep.getStatus() != StepStatus.IN_PROGRESS && currentStep.getStatus() != StepStatus.COMPLETED) {
                currentStep.start(); // Ensure it's in progress first
            }

            if (currentStep.getStatus() != StepStatus.COMPLETED) {
                currentStep.complete(null);
                todoStepRepository.save(currentStep);
                log.info("PM: Step completed: todoId={}, step={}", todoId, currentStep.getStepType());

                // Notify step completion via WebSocket
                webSocketService.notifyStepProgress(todo.getMission().getId(),
                    StepProgressResponse.from(currentStep, 100, "Step completed"));
            } else {
                log.info("PM: Step already completed: todoId={}, step={}", todoId, currentStep.getStepType());
            }

            lastCompletedStepType = currentStep.getStepType();

            // Clear currentPmStep in mapping
            mappingOpt.ifPresent(mapping -> {
                mapping.clearCurrentPmStep();
                mappingRepository.save(mapping);
            });
        } else {
            // Find the last completed step in order to determine where we are
            for (int i = STEP_ORDER.size() - 1; i >= 0; i--) {
                StepType stepType = STEP_ORDER.get(i);
                boolean isCompleted = todo.getSteps().stream()
                        .anyMatch(s -> s.getStepType() == stepType && s.getStatus() == StepStatus.COMPLETED);
                if (isCompleted) {
                    lastCompletedStepType = stepType;
                    break;
                }
            }
            log.info("PM: No step to complete. Last completed: {}", lastCompletedStepType);
        }

        // Determine the next step based on last completed
        StepType nextStepType = getNextStepType(lastCompletedStepType);
        log.info("PM: Next step type: {} (after {})", nextStepType, lastCompletedStepType);

        if (nextStepType != null) {
            // Find the next step entity (must be PENDING or not yet started)
            TodoStep nextStep = todo.getSteps().stream()
                    .filter(s -> s.getStepType() == nextStepType &&
                            (s.getStatus() == StepStatus.PENDING || s.getStatus() == StepStatus.IN_PROGRESS))
                    .findFirst()
                    .orElse(null);

            if (nextStep != null) {
                log.info("PM: Starting next step: todoId={}, step={}", todoId, nextStepType);

                // Start the next step if not already started
                if (nextStep.getStatus() == StepStatus.PENDING) {
                    nextStep.start();
                    todoStepRepository.save(nextStep);

                    // Notify step start via WebSocket
                    webSocketService.notifyStepProgress(todo.getMission().getId(),
                        StepProgressResponse.from(nextStep, 0, "Step started"));
                }

                // Execute next step via SessionCast (this also sets currentPmStep in mapping)
                executeNextStep(todo, nextStep, currentStep);

                return; // Don't complete the Todo yet
            } else {
                log.info("PM: Next step {} not found or already completed", nextStepType);
            }
        }

        // All steps done - complete the Todo
        log.info("PM: All steps completed, marking Todo as WOVEN: {}", todoId);
        todo.complete();
        todoRepository.save(todo);

        // Notify via WebSocket
        webSocketService.notifyTodoUpdated(todo.getMission().getId(), todo);

        log.info("PM: Todo completed: todoId={}, status={}", todoId, todo.getStatus());

        // Trigger orchestration for dependent todos
        orchestrationService.onTodoCompleted(todo);
    }

    /**
     * Get the next step type in the workflow.
     */
    private StepType getNextStepType(StepType currentStep) {
        if (currentStep == null) {
            return StepType.ANALYSIS; // Start with ANALYSIS
        }

        int currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex < 0 || currentIndex >= STEP_ORDER.size() - 1) {
            return null; // No more steps
        }

        return STEP_ORDER.get(currentIndex + 1);
    }

    /**
     * Execute the next step via SessionCast.
     * Sends a prompt to Claude Code with context from the previous step.
     * Sets currentPmStep in the session mapping to track which step PM assigned.
     */
    private void executeNextStep(Todo todo, TodoStep nextStep, TodoStep previousStep) {
        String todoId = todo.getId().toString();
        String missionTitle = todo.getMission().getTitle();
        String todoTitle = todo.getTitle();
        StepType stepType = nextStep.getStepType();
        String stepName = stepType.name();

        // Set currentPmStep in session mapping (source of truth for PM step progression)
        mappingRepository.findByTodoId(todo.getId())
            .ifPresent(mapping -> {
                mapping.setCurrentPmStep(stepType);
                mappingRepository.save(mapping);
                log.info("PM: Set currentPmStep={} for todoId={}", stepType, todoId);
            });

        // Build context from previous step
        String previousContext = "";
        if (previousStep != null && previousStep.getOutput() != null) {
            previousContext = "이전 " + previousStep.getStepType().name() + " 결과: " +
                previousStep.getOutput().substring(0, Math.min(500, previousStep.getOutput().length()));
        }

        // Build prompt for the next step
        String prompt = buildStepPrompt(stepName, missionTitle, todoTitle, todo.getDescription(), previousContext);

        // Send to Claude Code via SessionCast
        try {
            terminalService.sendKeys(todoId, prompt, true)
                .thenRun(() -> log.info("PM: Sent {} prompt to Claude: todoId={}", stepName, todoId))
                .exceptionally(e -> {
                    log.error("PM: Failed to send prompt: {}", e.getMessage());
                    return null;
                });
        } catch (Exception e) {
            log.error("PM: Failed to execute next step: {}", e.getMessage());
        }
    }

    /**
     * Build prompt for a specific step.
     */
    private String buildStepPrompt(String stepName, String missionTitle, String todoTitle,
            String description, String previousContext) {
        String stepInstruction = switch (stepName) {
            case "ANALYSIS" -> "요구사항을 분석하고 기존 코드를 파악해주세요.";
            case "DESIGN" -> "분석 결과를 바탕으로 설계해주세요.";
            case "IMPLEMENTATION" -> "설계대로 코드를 구현해주세요.";
            case "VERIFICATION" -> "구현한 코드를 테스트하고 검증해주세요.";
            case "REVIEW" -> "코드 품질을 검토하고 개선해주세요.";
            case "INTEGRATION" -> "최종 통합하고 마무리해주세요.";
            default -> "다음 작업을 진행해주세요.";
        };

        StringBuilder prompt = new StringBuilder();
        prompt.append("[ThreadCast ").append(stepName).append("] ");
        prompt.append("Mission: ").append(missionTitle);
        prompt.append(" / TODO: ").append(todoTitle);
        if (description != null && !description.isEmpty()) {
            prompt.append(" / 설명: ").append(description);
        }
        if (!previousContext.isEmpty()) {
            prompt.append(" / ").append(previousContext);
        }
        prompt.append(" - ").append(stepInstruction);

        return prompt.toString();
    }
}
