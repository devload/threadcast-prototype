package io.threadcast.service;

import io.threadcast.domain.Mission;
import io.threadcast.domain.Todo;
import io.threadcast.domain.User;
import io.threadcast.domain.Workspace;
import io.threadcast.domain.enums.*;
import io.threadcast.dto.request.CreateTodoRequest;
import io.threadcast.dto.request.UpdateTodoRequest;
import io.threadcast.dto.response.TodoResponse;
import io.threadcast.exception.BadRequestException;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.AIQuestionRepository;
import io.threadcast.repository.MissionRepository;
import io.threadcast.repository.TimelineEventRepository;
import io.threadcast.repository.TodoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TodoServiceTest {

    @Mock
    private TodoRepository todoRepository;

    @Mock
    private MissionRepository missionRepository;

    @Mock
    private TimelineEventRepository timelineEventRepository;

    @Mock
    private AIQuestionRepository aiQuestionRepository;

    @Mock
    private TimelineService timelineService;

    @Mock
    private WebSocketService webSocketService;

    @Mock
    private TodoOrchestrationService orchestrationService;

    @InjectMocks
    private TodoService todoService;

    private User testUser;
    private Workspace testWorkspace;
    private Mission testMission;
    private Todo testTodo;

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
    }

    @Test
    void getTodos_shouldReturnTodoList() {
        when(todoRepository.findByMissionIdWithSteps(testMission.getId())).thenReturn(List.of(testTodo));

        List<TodoResponse> result = todoService.getTodos(testMission.getId(), null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Test Todo");
    }

    @Test
    void getTodos_withStatusFilter_shouldReturnFilteredTodos() {
        when(todoRepository.findByMissionIdAndStatus(testMission.getId(), TodoStatus.PENDING))
                .thenReturn(List.of(testTodo));

        List<TodoResponse> result = todoService.getTodos(testMission.getId(), TodoStatus.PENDING);

        assertThat(result).hasSize(1);
        verify(todoRepository).findByMissionIdAndStatus(testMission.getId(), TodoStatus.PENDING);
    }

    @Test
    void getTodo_withValidId_shouldReturnTodo() {
        when(todoRepository.findByIdWithMissionAndWorkspace(testTodo.getId())).thenReturn(Optional.of(testTodo));

        TodoResponse result = todoService.getTodo(testTodo.getId());

        assertThat(result.getTitle()).isEqualTo("Test Todo");
        assertThat(result.getSteps()).hasSize(6);
    }

    @Test
    void getTodo_withInvalidId_shouldThrowNotFoundException() {
        UUID invalidId = UUID.randomUUID();
        when(todoRepository.findByIdWithMissionAndWorkspace(invalidId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> todoService.getTodo(invalidId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Todo not found");
    }

    @Test
    void createTodo_shouldCreateAndReturnTodo() {
        CreateTodoRequest request = new CreateTodoRequest();
        request.setMissionId(testMission.getId());
        request.setTitle("New Todo");
        request.setDescription("New Description");
        request.setPriority(Priority.HIGH);
        request.setComplexity(Complexity.MEDIUM);
        request.setEstimatedTime(90);

        when(missionRepository.findById(testMission.getId())).thenReturn(Optional.of(testMission));
        when(todoRepository.findMaxOrderIndexByMissionId(testMission.getId())).thenReturn(null);
        when(todoRepository.save(any(Todo.class))).thenAnswer(invocation -> {
            Todo todo = invocation.getArgument(0);
            todo.setId(UUID.randomUUID());
            return todo;
        });
        when(missionRepository.save(any(Mission.class))).thenReturn(testMission);

        TodoResponse result = todoService.createTodo(request);

        assertThat(result.getTitle()).isEqualTo("New Todo");
        assertThat(result.getStatus()).isEqualTo(TodoStatus.PENDING);
        verify(timelineService).recordTodoCreated(any(Todo.class));
        verify(webSocketService).notifyTodoCreated(eq(testMission.getId()), any(Todo.class));
    }

    @Test
    void createTodo_withInvalidMission_shouldThrowNotFoundException() {
        CreateTodoRequest request = new CreateTodoRequest();
        request.setMissionId(UUID.randomUUID());
        request.setTitle("New Todo");

        when(missionRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> todoService.createTodo(request))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Mission not found");
    }

    @Test
    void updateStatus_toThreading_shouldStartTodo() {
        when(todoRepository.findByIdWithMissionAndWorkspace(testTodo.getId())).thenReturn(Optional.of(testTodo));
        when(todoRepository.save(any(Todo.class))).thenReturn(testTodo);
        when(missionRepository.save(any(Mission.class))).thenReturn(testMission);

        TodoResponse result = todoService.updateStatus(testTodo.getId(), TodoStatus.THREADING);

        assertThat(result.getStatus()).isEqualTo(TodoStatus.THREADING);
        verify(timelineService).recordTodoStarted(testTodo);
    }

    @Test
    void updateStatus_toThreading_withUnmetDependencies_shouldThrowException() {
        Todo dependency = Todo.builder()
                .id(UUID.randomUUID())
                .mission(testMission)
                .title("Dependency")
                .status(TodoStatus.PENDING)
                .build();
        testTodo.addDependency(dependency);

        when(todoRepository.findByIdWithMissionAndWorkspace(testTodo.getId())).thenReturn(Optional.of(testTodo));

        assertThatThrownBy(() -> todoService.updateStatus(testTodo.getId(), TodoStatus.THREADING))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Dependencies are not met");
    }

    @Test
    void updateStatus_toWoven_shouldCompleteTodo() {
        testTodo.setStatus(TodoStatus.THREADING);
        testTodo.startThreading();

        when(todoRepository.findByIdWithMissionAndWorkspace(testTodo.getId())).thenReturn(Optional.of(testTodo));
        when(todoRepository.save(any(Todo.class))).thenReturn(testTodo);
        when(missionRepository.save(any(Mission.class))).thenReturn(testMission);

        TodoResponse result = todoService.updateStatus(testTodo.getId(), TodoStatus.WOVEN);

        assertThat(result.getStatus()).isEqualTo(TodoStatus.WOVEN);
        verify(timelineService).recordTodoCompleted(testTodo);
    }

    @Test
    void updateStatus_toTangled_shouldFailTodo() {
        testTodo.setStatus(TodoStatus.THREADING);

        when(todoRepository.findByIdWithMissionAndWorkspace(testTodo.getId())).thenReturn(Optional.of(testTodo));
        when(todoRepository.save(any(Todo.class))).thenReturn(testTodo);
        when(missionRepository.save(any(Mission.class))).thenReturn(testMission);

        TodoResponse result = todoService.updateStatus(testTodo.getId(), TodoStatus.TANGLED);

        assertThat(result.getStatus()).isEqualTo(TodoStatus.TANGLED);
        verify(timelineService).recordTodoFailed(testTodo);
    }

    @Test
    void updateTodo_shouldUpdateFields() {
        UpdateTodoRequest request = new UpdateTodoRequest();
        request.setTitle("Updated Title");
        request.setPriority(Priority.CRITICAL);

        when(todoRepository.findByIdWithMissionAndWorkspace(testTodo.getId())).thenReturn(Optional.of(testTodo));
        when(todoRepository.save(any(Todo.class))).thenReturn(testTodo);

        TodoResponse result = todoService.updateTodo(testTodo.getId(), request);

        assertThat(testTodo.getTitle()).isEqualTo("Updated Title");
        assertThat(testTodo.getPriority()).isEqualTo(Priority.CRITICAL);
        verify(webSocketService).notifyTodoUpdated(testMission.getId(), testTodo);
    }

    @Test
    void deleteTodo_shouldDeleteAndNotify() {
        testMission.addTodo(testTodo);

        when(todoRepository.findById(testTodo.getId())).thenReturn(Optional.of(testTodo));
        doNothing().when(todoRepository).delete(testTodo);
        when(missionRepository.save(any(Mission.class))).thenReturn(testMission);

        todoService.deleteTodo(testTodo.getId());

        verify(todoRepository).delete(testTodo);
        verify(webSocketService).notifyTodoDeleted(testMission.getId(), testTodo.getId());
    }
}
