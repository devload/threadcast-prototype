package io.threadcast.domain;

import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.Priority;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.domain.enums.Complexity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MissionTest {

    private User user;
    private Workspace workspace;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email("test@example.com")
                .passwordHash("hash")
                .name("Test User")
                .build();

        workspace = Workspace.create("Test Workspace", "Description", "/tmp/test-workspace", user);
    }

    @Test
    void createMission_shouldSetDefaultValues() {
        Mission mission = Mission.create(workspace, "Test Mission", "Description", Priority.HIGH);

        assertThat(mission.getTitle()).isEqualTo("Test Mission");
        assertThat(mission.getDescription()).isEqualTo("Description");
        assertThat(mission.getPriority()).isEqualTo(Priority.HIGH);
        assertThat(mission.getStatus()).isEqualTo(MissionStatus.BACKLOG);
        assertThat(mission.getProgress()).isEqualTo(0);
        assertThat(mission.getWorkspace()).isEqualTo(workspace);
    }

    @Test
    void startThreading_shouldUpdateStatusAndStartTime() {
        Mission mission = Mission.create(workspace, "Test Mission", null, Priority.MEDIUM);

        mission.startThreading();

        assertThat(mission.getStatus()).isEqualTo(MissionStatus.THREADING);
        assertThat(mission.getStartedAt()).isNotNull();
    }

    @Test
    void complete_shouldUpdateStatusAndCompletionTime() {
        Mission mission = Mission.create(workspace, "Test Mission", null, Priority.MEDIUM);
        mission.startThreading();

        mission.complete();

        assertThat(mission.getStatus()).isEqualTo(MissionStatus.WOVEN);
        assertThat(mission.getCompletedAt()).isNotNull();
        assertThat(mission.getProgress()).isEqualTo(100);
    }

    @Test
    void archive_shouldUpdateStatus() {
        Mission mission = Mission.create(workspace, "Test Mission", null, Priority.MEDIUM);

        mission.archive();

        assertThat(mission.getStatus()).isEqualTo(MissionStatus.ARCHIVED);
    }

    @Test
    void updateProgress_shouldCalculateFromTodos() {
        Mission mission = Mission.create(workspace, "Test Mission", null, Priority.MEDIUM);

        Todo todo1 = Todo.create(mission, "Todo 1", null, Priority.MEDIUM, Complexity.LOW, 0, 30);
        todo1.setStatus(TodoStatus.WOVEN);
        mission.addTodo(todo1);

        Todo todo2 = Todo.create(mission, "Todo 2", null, Priority.MEDIUM, Complexity.LOW, 1, 30);
        todo2.setStatus(TodoStatus.PENDING);
        mission.addTodo(todo2);

        mission.updateProgress();

        assertThat(mission.getProgress()).isEqualTo(50);
    }

    @Test
    void updateProgress_withAllTodosWoven_shouldComplete() {
        Mission mission = Mission.create(workspace, "Test Mission", null, Priority.MEDIUM);

        Todo todo1 = Todo.create(mission, "Todo 1", null, Priority.MEDIUM, Complexity.LOW, 0, 30);
        todo1.setStatus(TodoStatus.WOVEN);
        mission.addTodo(todo1);

        Todo todo2 = Todo.create(mission, "Todo 2", null, Priority.MEDIUM, Complexity.LOW, 1, 30);
        todo2.setStatus(TodoStatus.WOVEN);
        mission.addTodo(todo2);

        mission.updateProgress();

        assertThat(mission.getProgress()).isEqualTo(100);
        assertThat(mission.getStatus()).isEqualTo(MissionStatus.WOVEN);
    }

    @Test
    void addTodo_shouldSetMissionReference() {
        Mission mission = Mission.create(workspace, "Test Mission", null, Priority.MEDIUM);
        Todo todo = Todo.builder()
                .title("Test Todo")
                .orderIndex(0)
                .build();

        mission.addTodo(todo);

        assertThat(mission.getTodos()).contains(todo);
        assertThat(todo.getMission()).isEqualTo(mission);
    }
}
