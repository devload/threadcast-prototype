package io.threadcast.domain;

import io.threadcast.domain.enums.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TodoStepTest {

    private Todo todo;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .email("test@example.com")
                .passwordHash("hash")
                .name("Test User")
                .build();

        Workspace workspace = Workspace.create("Test Workspace", "Description", "/tmp/test-workspace", user);
        Mission mission = Mission.create(workspace, "Test Mission", null, Priority.MEDIUM);
        todo = Todo.builder()
                .mission(mission)
                .title("Test Todo")
                .status(TodoStatus.PENDING)
                .priority(Priority.MEDIUM)
                .complexity(Complexity.LOW)
                .orderIndex(0)
                .build();
    }

    @Test
    void createStep_shouldSetDefaultStatus() {
        TodoStep step = TodoStep.create(todo, StepType.ANALYSIS);

        assertThat(step.getTodo()).isEqualTo(todo);
        assertThat(step.getStepType()).isEqualTo(StepType.ANALYSIS);
        assertThat(step.getStatus()).isEqualTo(StepStatus.PENDING);
    }

    @Test
    void start_shouldUpdateStatusAndStartTime() {
        TodoStep step = TodoStep.create(todo, StepType.IMPLEMENTATION);

        step.start();

        assertThat(step.getStatus()).isEqualTo(StepStatus.IN_PROGRESS);
        assertThat(step.getStartedAt()).isNotNull();
    }

    @Test
    void complete_shouldUpdateStatusAndSetOutput() {
        TodoStep step = TodoStep.create(todo, StepType.ANALYSIS);
        step.start();

        step.complete("Analysis completed. Found 3 relevant files.");

        assertThat(step.getStatus()).isEqualTo(StepStatus.COMPLETED);
        assertThat(step.getCompletedAt()).isNotNull();
        assertThat(step.getOutput()).isEqualTo("Analysis completed. Found 3 relevant files.");
    }

    @Test
    void fail_shouldUpdateStatus() {
        TodoStep step = TodoStep.create(todo, StepType.IMPLEMENTATION);
        step.start();

        step.fail();

        assertThat(step.getStatus()).isEqualTo(StepStatus.FAILED);
        assertThat(step.getCompletedAt()).isNotNull();
    }

    @Test
    void skip_shouldUpdateStatus() {
        TodoStep step = TodoStep.create(todo, StepType.REVIEW);

        step.skip();

        assertThat(step.getStatus()).isEqualTo(StepStatus.SKIPPED);
        assertThat(step.getCompletedAt()).isNotNull();
    }
}
