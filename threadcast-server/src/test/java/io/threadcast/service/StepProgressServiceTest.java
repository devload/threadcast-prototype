package io.threadcast.service;

import io.threadcast.domain.*;
import io.threadcast.domain.enums.*;
import io.threadcast.dto.request.StepUpdateWebhookRequest;
import io.threadcast.dto.response.StepProgressResponse;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.TodoRepository;
import io.threadcast.repository.TodoStepRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for StepProgressService.
 *
 * Tests the real-time step progress tracking feature including:
 * - Step status transitions (PENDING -> IN_PROGRESS -> COMPLETED/FAILED/SKIPPED)
 * - Auto-update of Todo status based on step progress
 * - WebSocket notification on step updates
 * - Timeline event recording for status changes
 */
@ExtendWith(MockitoExtension.class)
class StepProgressServiceTest {

    @Mock
    private TodoRepository todoRepository;

    @Mock
    private TodoStepRepository todoStepRepository;

    @Mock
    private WebSocketService webSocketService;

    @Mock
    private TimelineService timelineService;

    @InjectMocks
    private StepProgressService stepProgressService;

    private User testUser;
    private Workspace testWorkspace;
    private Mission testMission;
    private Todo testTodo;
    private TodoStep analysisStep;
    private TodoStep implementationStep;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .passwordHash("hash")
                .name("Test User")
                .build();

        testWorkspace = Workspace.builder()
                .id(UUID.randomUUID())
                .name("Test Workspace")
                .owner(testUser)
                .build();

        testMission = Mission.builder()
                .id(UUID.randomUUID())
                .workspace(testWorkspace)
                .title("Test Mission")
                .status(MissionStatus.THREADING)
                .priority(Priority.MEDIUM)
                .progress(0)
                .build();

        testTodo = Todo.builder()
                .id(UUID.randomUUID())
                .mission(testMission)
                .title("Test Todo")
                .description("Description")
                .status(TodoStatus.PENDING)
                .priority(Priority.HIGH)
                .complexity(Complexity.MEDIUM)
                .orderIndex(0)
                .estimatedTime(60)
                .build();
        testTodo.initializeSteps();

        // Get specific steps for testing
        analysisStep = testTodo.getSteps().stream()
                .filter(s -> s.getStepType() == StepType.ANALYSIS)
                .findFirst()
                .orElseThrow();

        implementationStep = testTodo.getSteps().stream()
                .filter(s -> s.getStepType() == StepType.IMPLEMENTATION)
                .findFirst()
                .orElseThrow();
    }

    @Nested
    @DisplayName("processStepUpdate")
    class ProcessStepUpdateTests {

        @Test
        @DisplayName("should start step and update status to IN_PROGRESS")
        void shouldStartStepAndUpdateToInProgress() {
            // Given
            StepUpdateWebhookRequest request = createRequest(
                    testTodo.getId().toString(),
                    StepType.ANALYSIS,
                    StepStatus.IN_PROGRESS,
                    25,
                    "Analyzing code structure..."
            );

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));
            when(todoStepRepository.findByTodoIdAndStepType(testTodo.getId(), StepType.ANALYSIS))
                    .thenReturn(Optional.of(analysisStep));
            when(todoStepRepository.save(any(TodoStep.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            StepProgressResponse response = stepProgressService.processStepUpdate(request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getStepType()).isEqualTo(StepType.ANALYSIS);
            assertThat(response.getStatus()).isEqualTo(StepStatus.IN_PROGRESS);
            assertThat(response.getProgress()).isEqualTo(25);
            assertThat(response.getMessage()).isEqualTo("Analyzing code structure...");

            verify(todoStepRepository).save(analysisStep);
            verify(webSocketService).notifyStepProgress(eq(testMission.getId()), any(StepProgressResponse.class));
            verify(timelineService).recordStepEvent(eq(testTodo), eq(analysisStep), contains("started"), any());
        }

        @Test
        @DisplayName("should complete step with output")
        void shouldCompleteStepWithOutput() {
            // Given
            analysisStep.start(); // Set step to IN_PROGRESS first

            StepUpdateWebhookRequest request = createRequest(
                    testTodo.getId().toString(),
                    StepType.ANALYSIS,
                    StepStatus.COMPLETED,
                    100,
                    "Analysis complete"
            );
            request.setOutput("Found 5 files to modify");

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));
            when(todoStepRepository.findByTodoIdAndStepType(testTodo.getId(), StepType.ANALYSIS))
                    .thenReturn(Optional.of(analysisStep));
            when(todoStepRepository.save(any(TodoStep.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            StepProgressResponse response = stepProgressService.processStepUpdate(request);

            // Then
            assertThat(response.getStatus()).isEqualTo(StepStatus.COMPLETED);
            assertThat(analysisStep.getOutput()).isEqualTo("Found 5 files to modify");
            assertThat(analysisStep.getCompletedAt()).isNotNull();

            verify(timelineService).recordStepEvent(eq(testTodo), eq(analysisStep), contains("completed"), any());
        }

        @Test
        @DisplayName("should mark step as FAILED")
        void shouldMarkStepAsFailed() {
            // Given
            implementationStep.start();

            StepUpdateWebhookRequest request = createRequest(
                    testTodo.getId().toString(),
                    StepType.IMPLEMENTATION,
                    StepStatus.FAILED,
                    50,
                    "Build failed"
            );

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));
            when(todoStepRepository.findByTodoIdAndStepType(testTodo.getId(), StepType.IMPLEMENTATION))
                    .thenReturn(Optional.of(implementationStep));
            when(todoStepRepository.save(any(TodoStep.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            StepProgressResponse response = stepProgressService.processStepUpdate(request);

            // Then
            assertThat(response.getStatus()).isEqualTo(StepStatus.FAILED);
            assertThat(implementationStep.getCompletedAt()).isNotNull();

            verify(timelineService).recordStepEvent(eq(testTodo), eq(implementationStep), contains("failed"), any());
        }

        @Test
        @DisplayName("should skip step")
        void shouldSkipStep() {
            // Given
            StepUpdateWebhookRequest request = createRequest(
                    testTodo.getId().toString(),
                    StepType.REVIEW,
                    StepStatus.SKIPPED,
                    null,
                    "Review not needed"
            );

            TodoStep reviewStep = testTodo.getSteps().stream()
                    .filter(s -> s.getStepType() == StepType.REVIEW)
                    .findFirst()
                    .orElseThrow();

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));
            when(todoStepRepository.findByTodoIdAndStepType(testTodo.getId(), StepType.REVIEW))
                    .thenReturn(Optional.of(reviewStep));
            when(todoStepRepository.save(any(TodoStep.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            StepProgressResponse response = stepProgressService.processStepUpdate(request);

            // Then
            assertThat(response.getStatus()).isEqualTo(StepStatus.SKIPPED);
            assertThat(reviewStep.getCompletedAt()).isNotNull();

            verify(timelineService).recordStepEvent(eq(testTodo), eq(reviewStep), contains("skipped"), any());
        }

        @Test
        @DisplayName("should throw NotFoundException when Todo not found")
        void shouldThrowNotFoundWhenTodoNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            StepUpdateWebhookRequest request = createRequest(
                    unknownId.toString(),
                    StepType.ANALYSIS,
                    StepStatus.IN_PROGRESS,
                    0,
                    "Starting..."
            );

            when(todoRepository.findByIdWithSteps(unknownId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> stepProgressService.processStepUpdate(request))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Todo not found");
        }

        @Test
        @DisplayName("should throw NotFoundException when Step not found")
        void shouldThrowNotFoundWhenStepNotFound() {
            // Given
            StepUpdateWebhookRequest request = createRequest(
                    testTodo.getId().toString(),
                    StepType.ANALYSIS,
                    StepStatus.IN_PROGRESS,
                    0,
                    "Starting..."
            );

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));
            when(todoStepRepository.findByTodoIdAndStepType(testTodo.getId(), StepType.ANALYSIS))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> stepProgressService.processStepUpdate(request))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Step not found");
        }
    }

    @Nested
    @DisplayName("Auto Todo Status Update")
    class AutoTodoStatusUpdateTests {

        @Test
        @DisplayName("should auto-start Todo when first step starts")
        void shouldAutoStartTodoWhenFirstStepStarts() {
            // Given - Todo is PENDING
            assertThat(testTodo.getStatus()).isEqualTo(TodoStatus.PENDING);

            StepUpdateWebhookRequest request = createRequest(
                    testTodo.getId().toString(),
                    StepType.ANALYSIS,
                    StepStatus.IN_PROGRESS,
                    10,
                    "Starting analysis..."
            );

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));
            when(todoStepRepository.findByTodoIdAndStepType(testTodo.getId(), StepType.ANALYSIS))
                    .thenReturn(Optional.of(analysisStep));
            when(todoStepRepository.save(any(TodoStep.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            stepProgressService.processStepUpdate(request);

            // Then - Todo should be THREADING now
            assertThat(testTodo.getStatus()).isEqualTo(TodoStatus.THREADING);
            assertThat(testTodo.getStartedAt()).isNotNull();
            verify(todoRepository).save(testTodo);
        }

        @Test
        @DisplayName("should auto-complete Todo when all steps completed")
        void shouldAutoCompleteTodoWhenAllStepsCompleted() {
            // Given - Set all steps to COMPLETED except the last one
            testTodo.startThreading();
            testTodo.getSteps().forEach(step -> {
                if (step.getStepType() != StepType.INTEGRATION) {
                    step.complete("Done");
                }
            });

            TodoStep integrationStep = testTodo.getSteps().stream()
                    .filter(s -> s.getStepType() == StepType.INTEGRATION)
                    .findFirst()
                    .orElseThrow();
            integrationStep.start();

            StepUpdateWebhookRequest request = createRequest(
                    testTodo.getId().toString(),
                    StepType.INTEGRATION,
                    StepStatus.COMPLETED,
                    100,
                    "Integration complete"
            );

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));
            when(todoStepRepository.findByTodoIdAndStepType(testTodo.getId(), StepType.INTEGRATION))
                    .thenReturn(Optional.of(integrationStep));
            when(todoStepRepository.save(any(TodoStep.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            stepProgressService.processStepUpdate(request);

            // Then - Todo should be WOVEN now
            assertThat(testTodo.getStatus()).isEqualTo(TodoStatus.WOVEN);
            assertThat(testTodo.getCompletedAt()).isNotNull();
            verify(todoRepository, atLeastOnce()).save(testTodo);
        }

        @Test
        @DisplayName("should auto-complete Todo when steps are mix of COMPLETED and SKIPPED")
        void shouldAutoCompleteWhenMixOfCompletedAndSkipped() {
            // Given - Some steps completed, some skipped
            testTodo.startThreading();

            // Complete some steps
            testTodo.getSteps().forEach(step -> {
                if (step.getStepType() == StepType.ANALYSIS ||
                    step.getStepType() == StepType.IMPLEMENTATION ||
                    step.getStepType() == StepType.VERIFICATION) {
                    step.complete("Done");
                } else if (step.getStepType() != StepType.INTEGRATION) {
                    step.skip(); // Skip DESIGN and REVIEW
                }
            });

            TodoStep integrationStep = testTodo.getSteps().stream()
                    .filter(s -> s.getStepType() == StepType.INTEGRATION)
                    .findFirst()
                    .orElseThrow();
            integrationStep.start();

            StepUpdateWebhookRequest request = createRequest(
                    testTodo.getId().toString(),
                    StepType.INTEGRATION,
                    StepStatus.COMPLETED,
                    100,
                    "Done"
            );

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));
            when(todoStepRepository.findByTodoIdAndStepType(testTodo.getId(), StepType.INTEGRATION))
                    .thenReturn(Optional.of(integrationStep));
            when(todoStepRepository.save(any(TodoStep.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            stepProgressService.processStepUpdate(request);

            // Then - Todo should be WOVEN
            assertThat(testTodo.getStatus()).isEqualTo(TodoStatus.WOVEN);
        }

        @Test
        @DisplayName("should mark Todo as TANGLED when step fails")
        void shouldMarkTodoAsTangledWhenStepFails() {
            // Given
            testTodo.startThreading();
            analysisStep.start();

            StepUpdateWebhookRequest request = createRequest(
                    testTodo.getId().toString(),
                    StepType.ANALYSIS,
                    StepStatus.FAILED,
                    30,
                    "Analysis failed: unable to parse code"
            );

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));
            when(todoStepRepository.findByTodoIdAndStepType(testTodo.getId(), StepType.ANALYSIS))
                    .thenReturn(Optional.of(analysisStep));
            when(todoStepRepository.save(any(TodoStep.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            stepProgressService.processStepUpdate(request);

            // Then - Todo should be TANGLED
            assertThat(testTodo.getStatus()).isEqualTo(TodoStatus.TANGLED);
            verify(todoRepository).save(testTodo);
        }
    }

    @Nested
    @DisplayName("WebSocket Notification")
    class WebSocketNotificationTests {

        @Test
        @DisplayName("should send WebSocket notification on step update")
        void shouldSendWebSocketNotification() {
            // Given
            StepUpdateWebhookRequest request = createRequest(
                    testTodo.getId().toString(),
                    StepType.IMPLEMENTATION,
                    StepStatus.IN_PROGRESS,
                    50,
                    "Implementing feature..."
            );

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));
            when(todoStepRepository.findByTodoIdAndStepType(testTodo.getId(), StepType.IMPLEMENTATION))
                    .thenReturn(Optional.of(implementationStep));
            when(todoStepRepository.save(any(TodoStep.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            stepProgressService.processStepUpdate(request);

            // Then
            verify(webSocketService).notifyStepProgress(
                    eq(testMission.getId()),
                    argThat(response ->
                            response.getStepType() == StepType.IMPLEMENTATION &&
                            response.getStatus() == StepStatus.IN_PROGRESS &&
                            response.getProgress() == 50
                    )
            );
        }
    }

    @Nested
    @DisplayName("Timeline Event Recording")
    class TimelineEventTests {

        @Test
        @DisplayName("should record timeline event on status change")
        void shouldRecordTimelineEventOnStatusChange() {
            // Given
            StepUpdateWebhookRequest request = createRequest(
                    testTodo.getId().toString(),
                    StepType.ANALYSIS,
                    StepStatus.IN_PROGRESS,
                    0,
                    "Starting..."
            );

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));
            when(todoStepRepository.findByTodoIdAndStepType(testTodo.getId(), StepType.ANALYSIS))
                    .thenReturn(Optional.of(analysisStep));
            when(todoStepRepository.save(any(TodoStep.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            stepProgressService.processStepUpdate(request);

            // Then
            verify(timelineService).recordStepEvent(
                    eq(testTodo),
                    eq(analysisStep),
                    eq("Step started: ANALYSIS"),
                    eq("Starting...")
            );
        }

        @Test
        @DisplayName("should not record timeline event when status unchanged")
        void shouldNotRecordTimelineWhenStatusUnchanged() {
            // Given - Step is already IN_PROGRESS
            analysisStep.start();

            StepUpdateWebhookRequest request = createRequest(
                    testTodo.getId().toString(),
                    StepType.ANALYSIS,
                    StepStatus.IN_PROGRESS, // Same status
                    75, // Just progress update
                    "Still analyzing..."
            );

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));
            when(todoStepRepository.findByTodoIdAndStepType(testTodo.getId(), StepType.ANALYSIS))
                    .thenReturn(Optional.of(analysisStep));
            when(todoStepRepository.save(any(TodoStep.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            stepProgressService.processStepUpdate(request);

            // Then - No timeline event for same status
            verify(timelineService, never()).recordStepEvent(any(), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("getCurrentProgress")
    class GetCurrentProgressTests {

        @Test
        @DisplayName("should return current IN_PROGRESS step")
        void shouldReturnCurrentInProgressStep() {
            // Given
            testTodo.startThreading();
            analysisStep.complete("Done");
            implementationStep.start();

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));

            // When
            StepProgressResponse response = stepProgressService.getCurrentProgress(testTodo.getId());

            // Then
            assertThat(response.getStepType()).isEqualTo(StepType.IMPLEMENTATION);
            assertThat(response.getStatus()).isEqualTo(StepStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("should return last completed step when no step in progress")
        void shouldReturnLastCompletedStepWhenNoInProgress() {
            // Given
            testTodo.startThreading();
            analysisStep.complete("Done");
            // No step in progress

            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));

            // When
            StepProgressResponse response = stepProgressService.getCurrentProgress(testTodo.getId());

            // Then
            assertThat(response.getStepType()).isEqualTo(StepType.ANALYSIS);
            assertThat(response.getStatus()).isEqualTo(StepStatus.COMPLETED);
        }

        @Test
        @DisplayName("should return first pending step when nothing started")
        void shouldReturnFirstPendingStepWhenNothingStarted() {
            // Given - All steps are PENDING
            when(todoRepository.findByIdWithSteps(testTodo.getId())).thenReturn(Optional.of(testTodo));

            // When
            StepProgressResponse response = stepProgressService.getCurrentProgress(testTodo.getId());

            // Then
            assertThat(response.getStepType()).isEqualTo(StepType.ANALYSIS);
            assertThat(response.getStatus()).isEqualTo(StepStatus.PENDING);
        }

        @Test
        @DisplayName("should throw NotFoundException when Todo not found")
        void shouldThrowNotFoundWhenTodoNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(todoRepository.findByIdWithSteps(unknownId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> stepProgressService.getCurrentProgress(unknownId))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Todo not found");
        }
    }

    // Helper method to create StepUpdateWebhookRequest
    private StepUpdateWebhookRequest createRequest(String todoId, StepType stepType,
                                                    StepStatus status, Integer progress, String message) {
        StepUpdateWebhookRequest request = new StepUpdateWebhookRequest();
        request.setTodoId(todoId);
        request.setStepType(stepType);
        request.setStatus(status);
        request.setProgress(progress);
        request.setMessage(message);
        request.setSessionId("test-session-123");
        return request;
    }
}
