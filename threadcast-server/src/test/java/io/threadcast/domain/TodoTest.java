package io.threadcast.domain;

import io.threadcast.domain.enums.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TodoTest {

    private Mission mission;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .email("test@example.com")
                .passwordHash("hash")
                .name("Test User")
                .build();

        Workspace workspace = Workspace.create("Test Workspace", "Description", "/tmp/test-workspace", user);
        mission = Mission.create(workspace, "Test Mission", null, Priority.MEDIUM);
    }

    @Test
    void createTodo_shouldSetDefaultValuesAndInitializeSteps() {
        Todo todo = Todo.create(mission, "Test Todo", "Description", Priority.HIGH, Complexity.MEDIUM, 1, 60);

        assertThat(todo.getTitle()).isEqualTo("Test Todo");
        assertThat(todo.getDescription()).isEqualTo("Description");
        assertThat(todo.getPriority()).isEqualTo(Priority.HIGH);
        assertThat(todo.getComplexity()).isEqualTo(Complexity.MEDIUM);
        assertThat(todo.getOrderIndex()).isEqualTo(1);
        assertThat(todo.getEstimatedTime()).isEqualTo(60);
        assertThat(todo.getStatus()).isEqualTo(TodoStatus.PENDING);
        assertThat(todo.getSteps()).hasSize(6);
    }

    @Test
    void initializeSteps_shouldCreateAllSixSteps() {
        Todo todo = Todo.create(mission, "Test Todo", null, Priority.MEDIUM, Complexity.LOW, 0, 30);

        assertThat(todo.getSteps()).hasSize(6);
        assertThat(todo.getSteps().stream().map(TodoStep::getStepType))
                .containsExactly(
                        StepType.ANALYSIS,
                        StepType.DESIGN,
                        StepType.IMPLEMENTATION,
                        StepType.VERIFICATION,
                        StepType.REVIEW,
                        StepType.INTEGRATION
                );
    }

    @Test
    void startThreading_shouldUpdateStatusAndStartTime() {
        Todo todo = Todo.create(mission, "Test Todo", null, Priority.MEDIUM, Complexity.LOW, 0, 30);

        todo.startThreading();

        assertThat(todo.getStatus()).isEqualTo(TodoStatus.THREADING);
        assertThat(todo.getStartedAt()).isNotNull();
    }

    @Test
    void complete_shouldUpdateStatusAndCalculateActualTime() {
        Todo todo = Todo.create(mission, "Test Todo", null, Priority.MEDIUM, Complexity.LOW, 0, 30);
        todo.startThreading();

        todo.complete();

        assertThat(todo.getStatus()).isEqualTo(TodoStatus.WOVEN);
        assertThat(todo.getCompletedAt()).isNotNull();
        assertThat(todo.getActualTime()).isNotNull();
    }

    @Test
    void fail_shouldSetStatusToTangled() {
        Todo todo = Todo.create(mission, "Test Todo", null, Priority.MEDIUM, Complexity.LOW, 0, 30);
        todo.startThreading();

        todo.fail();

        assertThat(todo.getStatus()).isEqualTo(TodoStatus.TANGLED);
    }

    @Test
    void getCurrentStep_shouldReturnInProgressStep() {
        Todo todo = Todo.create(mission, "Test Todo", null, Priority.MEDIUM, Complexity.LOW, 0, 30);

        // Set IMPLEMENTATION step to IN_PROGRESS
        todo.getSteps().get(0).complete("done");
        todo.getSteps().get(1).complete("done");
        todo.getSteps().get(2).start();

        StepType currentStep = todo.getCurrentStep();

        assertThat(currentStep).isEqualTo(StepType.IMPLEMENTATION);
    }

    @Test
    void getCurrentStep_withNoInProgressStep_shouldReturnNull() {
        Todo todo = Todo.create(mission, "Test Todo", null, Priority.MEDIUM, Complexity.LOW, 0, 30);

        StepType currentStep = todo.getCurrentStep();

        assertThat(currentStep).isNull();
    }

    @Test
    void areDependenciesMet_withNoDeendencies_shouldReturnTrue() {
        Todo todo = Todo.create(mission, "Test Todo", null, Priority.MEDIUM, Complexity.LOW, 0, 30);

        assertThat(todo.areDependenciesMet()).isTrue();
    }

    @Test
    void areDependenciesMet_withWovenDependency_shouldReturnTrue() {
        Todo dependency = Todo.create(mission, "Dependency", null, Priority.MEDIUM, Complexity.LOW, 0, 30);
        dependency.setStatus(TodoStatus.WOVEN);

        Todo todo = Todo.create(mission, "Test Todo", null, Priority.MEDIUM, Complexity.LOW, 1, 30);
        todo.addDependency(dependency);

        assertThat(todo.areDependenciesMet()).isTrue();
    }

    @Test
    void areDependenciesMet_withPendingDependency_shouldReturnFalse() {
        Todo dependency = Todo.create(mission, "Dependency", null, Priority.MEDIUM, Complexity.LOW, 0, 30);
        dependency.setStatus(TodoStatus.PENDING);

        Todo todo = Todo.create(mission, "Test Todo", null, Priority.MEDIUM, Complexity.LOW, 1, 30);
        todo.addDependency(dependency);

        assertThat(todo.areDependenciesMet()).isFalse();
    }
}
