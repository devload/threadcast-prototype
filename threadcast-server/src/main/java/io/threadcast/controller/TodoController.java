package io.threadcast.controller;

import io.threadcast.domain.Todo;
import io.threadcast.domain.enums.StepStatus;
import io.threadcast.domain.enums.StepType;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.dto.request.CreateTodoRequest;
import io.threadcast.dto.request.StepUpdateWebhookRequest;
import io.threadcast.dto.request.UpdateMetaRequest;
import io.threadcast.dto.request.UpdateTodoRequest;
import io.threadcast.dto.request.UpdateTodoStatusRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.StepProgressResponse;
import io.threadcast.dto.response.TodoResponse;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.TodoRepository;
import io.threadcast.service.MetadataService;
import io.threadcast.service.StepProgressService;
import io.threadcast.service.TodoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;
    private final TodoRepository todoRepository;
    private final MetadataService metadataService;
    private final StepProgressService stepProgressService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TodoResponse>>> getTodos(
            @RequestParam UUID missionId,
            @RequestParam(required = false) TodoStatus status) {
        List<TodoResponse> todos = todoService.getTodos(missionId, status);
        return ResponseEntity.ok(ApiResponse.success(todos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TodoResponse>> getTodo(@PathVariable UUID id) {
        TodoResponse todo = todoService.getTodo(id);
        return ResponseEntity.ok(ApiResponse.success(todo));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TodoResponse>> createTodo(
            @Valid @RequestBody CreateTodoRequest request) {
        TodoResponse todo = todoService.createTodo(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(todo));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TodoResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTodoStatusRequest request) {
        TodoResponse todo = todoService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(todo));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<TodoResponse>> updateTodo(
            @PathVariable UUID id,
            @RequestBody UpdateTodoRequest request) {
        TodoResponse todo = todoService.updateTodo(id, request);
        return ResponseEntity.ok(ApiResponse.success(todo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> deleteTodo(@PathVariable UUID id) {
        todoService.deleteTodo(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("deleted", true)));
    }

    /**
     * Update dependencies for a Todo.
     * Validates no circular dependencies are created.
     */
    @PatchMapping("/{id}/dependencies")
    public ResponseEntity<ApiResponse<TodoResponse>> updateDependencies(
            @PathVariable UUID id,
            @RequestBody Map<String, List<UUID>> request) {
        List<UUID> dependencies = request.get("dependencies");
        if (dependencies == null) {
            dependencies = List.of();
        }
        TodoResponse todo = todoService.updateDependencies(id, dependencies);
        return ResponseEntity.ok(ApiResponse.success(todo));
    }

    /**
     * Get all todos that are ready to start for a mission.
     * A todo is ready if it's PENDING and all dependencies are WOVEN.
     */
    @GetMapping("/ready")
    public ResponseEntity<ApiResponse<List<TodoResponse>>> getReadyTodos(
            @RequestParam UUID missionId) {
        List<TodoResponse> readyTodos = todoService.getReadyTodos(missionId);
        return ResponseEntity.ok(ApiResponse.success(readyTodos));
    }

    /**
     * Get all todos that depend on a given todo.
     */
    @GetMapping("/{id}/dependents")
    public ResponseEntity<ApiResponse<List<TodoResponse>>> getDependents(@PathVariable UUID id) {
        List<TodoResponse> dependents = todoService.getDependents(id);
        return ResponseEntity.ok(ApiResponse.success(dependents));
    }

    /**
     * Update a step's status for a Todo.
     */
    @PatchMapping("/{todoId}/steps/{stepType}")
    public ResponseEntity<ApiResponse<StepProgressResponse>> updateStepStatus(
            @PathVariable UUID todoId,
            @PathVariable StepType stepType,
            @RequestBody Map<String, Object> request) {

        StepStatus status = StepStatus.valueOf((String) request.get("status"));
        String notes = (String) request.get("notes");

        StepUpdateWebhookRequest webhookRequest = new StepUpdateWebhookRequest();
        webhookRequest.setTodoId(todoId.toString());
        webhookRequest.setStepType(stepType);
        webhookRequest.setStatus(status);
        webhookRequest.setMessage(notes);

        StepProgressResponse response = stepProgressService.processStepUpdate(webhookRequest);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get the effective (merged) metadata for a Todo.
     * Merges Workspace → Mission → Todo meta with deep merge.
     */
    @GetMapping("/{id}/effective-meta")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEffectiveMeta(@PathVariable UUID id) {
        Todo todo = todoRepository.findByIdWithMissionAndWorkspace(id)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + id));
        Map<String, Object> effectiveMeta = metadataService.getEffectiveMeta(todo);
        return ResponseEntity.ok(ApiResponse.success(effectiveMeta));
    }

    /**
     * Get the Todo's own metadata (not merged).
     */
    @GetMapping("/{id}/meta")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMeta(@PathVariable UUID id) {
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + id));
        if (todo.getMeta() == null) {
            return ResponseEntity.ok(ApiResponse.success(Map.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(parseJsonToMap(todo.getMeta())));
    }

    /**
     * Update the Todo's metadata.
     * If replace=true, replaces entirely. Otherwise, deep merges.
     */
    @PatchMapping("/{id}/meta")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateMeta(
            @PathVariable UUID id,
            @RequestBody UpdateMetaRequest request) {
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Todo not found: " + id));

        Map<String, Object> newMeta;
        if (request.isReplace() || todo.getMeta() == null) {
            newMeta = request.getMeta();
        } else {
            // Parse existing meta and merge
            Map<String, Object> existingMeta = todo.getMeta() != null
                    ? parseJsonToMap(todo.getMeta())
                    : Map.of();
            newMeta = deepMerge(existingMeta, request.getMeta());
        }

        todo.setMeta(metadataService.toMetaString(newMeta));
        todoRepository.save(todo);

        return ResponseEntity.ok(ApiResponse.success(newMeta));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonToMap(String json) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(json, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> deepMerge(Map<String, Object> target, Map<String, Object> source) {
        Map<String, Object> result = new java.util.HashMap<>(target);
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            String key = entry.getKey();
            Object sourceValue = entry.getValue();
            Object targetValue = result.get(key);
            if (sourceValue instanceof Map && targetValue instanceof Map) {
                result.put(key, deepMerge((Map<String, Object>) targetValue, (Map<String, Object>) sourceValue));
            } else {
                result.put(key, sourceValue);
            }
        }
        return result;
    }
}
