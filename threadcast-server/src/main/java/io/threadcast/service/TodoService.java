package io.threadcast.service;

import io.threadcast.domain.Mission;
import io.threadcast.domain.Todo;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.dto.request.CreateTodoRequest;
import io.threadcast.dto.request.UpdateTodoRequest;
import io.threadcast.dto.response.TodoResponse;
import io.threadcast.exception.BadRequestException;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.MissionRepository;
import io.threadcast.repository.TodoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class TodoService {

    private final TodoRepository todoRepository;
    private final MissionRepository missionRepository;
    private final TimelineService timelineService;
    private final WebSocketService webSocketService;
    private final TodoOrchestrationService orchestrationService;

    public TodoService(
            TodoRepository todoRepository,
            MissionRepository missionRepository,
            TimelineService timelineService,
            WebSocketService webSocketService,
            @Lazy TodoOrchestrationService orchestrationService) {
        this.todoRepository = todoRepository;
        this.missionRepository = missionRepository;
        this.timelineService = timelineService;
        this.webSocketService = webSocketService;
        this.orchestrationService = orchestrationService;
    }

    @Transactional(readOnly = true)
    public List<TodoResponse> getTodos(UUID missionId, TodoStatus status) {
        List<Todo> todos;
        if (status != null) {
            todos = todoRepository.findByMissionIdAndStatus(missionId, status);
        } else {
            todos = todoRepository.findByMissionIdWithSteps(missionId);
        }
        return todos.stream()
                .map(TodoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TodoResponse getTodo(UUID id) {
        Todo todo = todoRepository.findByIdWithMissionAndWorkspace(id)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + id));
        return TodoResponse.from(todo);
    }

    @Transactional
    public TodoResponse createTodo(CreateTodoRequest request) {
        Mission mission = missionRepository.findById(request.getMissionId())
                .orElseThrow(() -> new NotFoundException("Mission not found: " + request.getMissionId()));

        Integer maxOrderIndex = todoRepository.findMaxOrderIndexByMissionId(mission.getId());
        int orderIndex = request.getOrderIndex() != null
                ? request.getOrderIndex()
                : (maxOrderIndex != null ? maxOrderIndex + 1 : 0);

        Todo todo = Todo.create(
                mission,
                request.getTitle(),
                request.getDescription(),
                request.getPriority(),
                request.getComplexity(),
                orderIndex,
                request.getEstimatedTime()
        );

        // Set dependencies
        if (request.getDependencies() != null) {
            for (UUID depId : request.getDependencies()) {
                todoRepository.findById(depId).ifPresent(todo::addDependency);
            }
        }

        todo = todoRepository.save(todo);

        // Update mission progress
        mission.updateProgress();
        missionRepository.save(mission);

        // Record event
        timelineService.recordTodoCreated(todo);

        // Notify via WebSocket
        webSocketService.notifyTodoCreated(mission.getId(), todo);

        return TodoResponse.from(todo);
    }

    @Transactional
    public TodoResponse updateStatus(UUID id, TodoStatus status) {
        Todo todo = todoRepository.findByIdWithMissionAndWorkspace(id)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + id));

        TodoStatus previousStatus = todo.getStatus();

        switch (status) {
            case THREADING -> {
                if (!todo.areDependenciesMet()) {
                    throw new BadRequestException("Dependencies are not met");
                }
                todo.startThreading();
                timelineService.recordTodoStarted(todo);
            }
            case WOVEN -> {
                todo.complete();
                timelineService.recordTodoCompleted(todo);
                // Trigger orchestration to start next ready todos
                orchestrationService.onTodoCompleted(todo);
            }
            case TANGLED -> {
                todo.fail();
                timelineService.recordTodoFailed(todo);
            }
            default -> todo.setStatus(status);
        }

        todo = todoRepository.save(todo);

        // Update mission progress
        todo.getMission().updateProgress();
        missionRepository.save(todo.getMission());

        // Notify via WebSocket
        webSocketService.notifyTodoStatusChanged(todo.getMission().getId(), todo, previousStatus);

        return TodoResponse.from(todo);
    }

    @Transactional
    public TodoResponse updateTodo(UUID id, UpdateTodoRequest request) {
        Todo todo = todoRepository.findByIdWithMissionAndWorkspace(id)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + id));

        if (request.getTitle() != null) {
            todo.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            todo.setDescription(request.getDescription());
        }
        if (request.getPriority() != null) {
            todo.setPriority(request.getPriority());
        }

        todo = todoRepository.save(todo);

        // Notify via WebSocket
        webSocketService.notifyTodoUpdated(todo.getMission().getId(), todo);

        return TodoResponse.from(todo);
    }

    @Transactional
    public void deleteTodo(UUID id) {
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + id));

        Mission mission = todo.getMission();
        UUID missionId = mission.getId();

        mission.getTodos().remove(todo);
        todoRepository.delete(todo);

        // Update mission progress
        mission.updateProgress();
        missionRepository.save(mission);

        webSocketService.notifyTodoDeleted(missionId, id);
    }

    /**
     * Update the dependencies of a todo.
     * Validates that no circular dependencies are created.
     */
    @Transactional
    public TodoResponse updateDependencies(UUID id, List<UUID> dependencyIds) {
        Todo todo = todoRepository.findByIdWithMissionAndWorkspace(id)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + id));

        // Clear existing dependencies
        todo.getDependencies().clear();

        // Add new dependencies
        for (UUID depId : dependencyIds) {
            if (depId.equals(id)) {
                throw new BadRequestException("A todo cannot depend on itself");
            }

            Todo dependency = todoRepository.findById(depId)
                    .orElseThrow(() -> new NotFoundException("Dependency todo not found: " + depId));

            // Validate same mission
            if (!dependency.getMission().getId().equals(todo.getMission().getId())) {
                throw new BadRequestException("Dependencies must be within the same mission");
            }

            todo.addDependency(dependency);
        }

        // Check for circular dependencies using DFS
        if (hasCircularDependency(todo)) {
            throw new BadRequestException("Circular dependency detected");
        }

        todo = todoRepository.save(todo);

        // Notify via WebSocket
        webSocketService.notifyTodoDependenciesChanged(todo.getMission().getId(), todo);

        return TodoResponse.from(todo);
    }

    /**
     * Get all todos that are ready to start for a mission.
     * A todo is ready if it's PENDING and all dependencies are WOVEN.
     */
    @Transactional(readOnly = true)
    public List<TodoResponse> getReadyTodos(UUID missionId) {
        List<Todo> readyTodos = todoRepository.findReadyToStart(missionId);
        return readyTodos.stream()
                .map(TodoResponse::from)
                .toList();
    }

    /**
     * Get all todos that depend on a given todo.
     */
    @Transactional(readOnly = true)
    public List<TodoResponse> getDependents(UUID todoId) {
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + todoId));

        List<Todo> dependents = todoRepository.findDependents(todo);
        return dependents.stream()
                .map(TodoResponse::from)
                .toList();
    }

    /**
     * Check for circular dependencies using DFS.
     * Returns true if a cycle is detected.
     */
    private boolean hasCircularDependency(Todo todo) {
        Set<UUID> visited = new HashSet<>();
        Set<UUID> recursionStack = new HashSet<>();
        return hasCycleDFS(todo, visited, recursionStack);
    }

    private boolean hasCycleDFS(Todo todo, Set<UUID> visited, Set<UUID> recursionStack) {
        UUID todoId = todo.getId();

        if (recursionStack.contains(todoId)) {
            return true; // Cycle detected
        }

        if (visited.contains(todoId)) {
            return false; // Already processed
        }

        visited.add(todoId);
        recursionStack.add(todoId);

        for (Todo dependency : todo.getDependencies()) {
            if (hasCycleDFS(dependency, visited, recursionStack)) {
                return true;
            }
        }

        recursionStack.remove(todoId);
        return false;
    }
}
