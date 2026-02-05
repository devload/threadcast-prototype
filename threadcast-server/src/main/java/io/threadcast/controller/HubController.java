package io.threadcast.controller;

import io.threadcast.domain.enums.Complexity;
import io.threadcast.domain.enums.Priority;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.dto.request.CreateTodoRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.MissionResponse;
import io.threadcast.dto.response.TodoResponse;
import io.threadcast.service.HubService;
import io.threadcast.service.MissionService;
import io.threadcast.service.TodoService;
import io.threadcast.service.terminal.TodoTerminalService;
import io.threadcast.repository.TodoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * REST API for managing the ThreadCast Hub agent.
 * Includes endpoints for Hub to manage Todos without authentication.
 */
@Slf4j
@RestController
@RequestMapping("/api/hub")
@RequiredArgsConstructor
public class HubController {

    private final HubService hubService;
    private final MissionService missionService;
    private final TodoService todoService;
    private final TodoRepository todoRepository;
    private final TodoTerminalService terminalService;

    /**
     * Get Hub status.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<HubStatusResponse>> getStatus() {
        var status = hubService.getStatus();
        return ResponseEntity.ok(ApiResponse.success(
            new HubStatusResponse(
                status.running(),
                status.sessionName(),
                status.lastScreen(),
                status.stateJson()
            )
        ));
    }

    /**
     * Start the Hub agent.
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<Boolean>> startHub() {
        boolean success = hubService.startHub();
        if (success) {
            return ResponseEntity.ok(ApiResponse.success(true));
        } else {
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("HUB_START_ERROR", "Failed to start hub"));
        }
    }

    /**
     * Stop the Hub agent.
     */
    @PostMapping("/stop")
    public ResponseEntity<ApiResponse<Boolean>> stopHub() {
        boolean success = hubService.stopHub();
        if (success) {
            return ResponseEntity.ok(ApiResponse.success(true));
        } else {
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("HUB_STOP_ERROR", "Failed to stop hub"));
        }
    }

    /**
     * Restart the Hub agent.
     */
    @PostMapping("/restart")
    public ResponseEntity<ApiResponse<Boolean>> restartHub() {
        hubService.stopHub();
        try {
            Thread.sleep(1000); // Brief pause
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        boolean success = hubService.startHub();
        if (success) {
            return ResponseEntity.ok(ApiResponse.success(true));
        } else {
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("HUB_RESTART_ERROR", "Failed to restart hub"));
        }
    }

    /**
     * Send a command to the Hub.
     */
    @PostMapping("/command")
    public ResponseEntity<ApiResponse<Void>> sendCommand(@RequestBody CommandRequest request) {
        try {
            hubService.sendToHub(request.command());
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("HUB_NOT_RUNNING", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("HUB_COMMAND_ERROR", e.getMessage()));
        }
    }

    // ==================== Mission Management for Hub ====================

    /**
     * Get mission details by ID.
     */
    @GetMapping("/missions/{id}")
    public ResponseEntity<ApiResponse<MissionResponse>> getMission(@PathVariable UUID id) {
        try {
            MissionResponse mission = missionService.getMission(id);
            return ResponseEntity.ok(ApiResponse.success(mission));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("MISSION_NOT_FOUND", e.getMessage()));
        }
    }

    /**
     * Get todos for a specific mission.
     */
    @GetMapping("/missions/{missionId}/todos")
    public ResponseEntity<ApiResponse<List<TodoResponse>>> getMissionTodos(
            @PathVariable UUID missionId,
            @RequestParam(required = false) TodoStatus status) {
        try {
            List<TodoResponse> todos = todoService.getTodos(missionId, status);
            return ResponseEntity.ok(ApiResponse.success(todos));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("ERROR", e.getMessage()));
        }
    }

    /**
     * Create a todo for a mission (used by Hub to break down missions).
     */
    @PostMapping("/missions/{missionId}/todos")
    public ResponseEntity<ApiResponse<TodoResponse>> createTodoForMission(
            @PathVariable UUID missionId,
            @RequestBody CreateTodoForMissionRequest request) {
        try {
            CreateTodoRequest todoRequest = new CreateTodoRequest();
            todoRequest.setMissionId(missionId);
            todoRequest.setTitle(request.title());
            todoRequest.setDescription(request.description());
            todoRequest.setPriority(request.priority());
            todoRequest.setComplexity(request.complexity());
            todoRequest.setOrderIndex(request.orderIndex());

            TodoResponse todo = todoService.createTodo(todoRequest);
            log.info("Hub created todo for mission {}: {}", missionId, todo.getId());
            return ResponseEntity.ok(ApiResponse.success(todo));
        } catch (Exception e) {
            log.error("Failed to create todo for mission {}: {}", missionId, e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("CREATE_TODO_ERROR", e.getMessage()));
        }
    }

    // ==================== Todo Management for Hub ====================

    /**
     * Get all pending todos that Hub can assign to workers.
     */
    @GetMapping("/todos/pending")
    public ResponseEntity<ApiResponse<List<TodoResponse>>> getPendingTodos() {
        List<TodoResponse> pendingTodos = todoRepository.findByStatus(TodoStatus.PENDING)
            .stream()
            .map(TodoResponse::from)
            .toList();
        log.info("Hub requested pending todos: {} found", pendingTodos.size());
        return ResponseEntity.ok(ApiResponse.success(pendingTodos));
    }

    /**
     * Get all in-progress (THREADING) todos.
     */
    @GetMapping("/todos/active")
    public ResponseEntity<ApiResponse<List<TodoResponse>>> getActiveTodos() {
        List<TodoResponse> activeTodos = todoRepository.findByStatus(TodoStatus.THREADING)
            .stream()
            .map(TodoResponse::from)
            .toList();
        return ResponseEntity.ok(ApiResponse.success(activeTodos));
    }

    /**
     * Assign a todo to a worker (PENDING -> THREADING).
     */
    @PostMapping("/todos/{id}/assign")
    public ResponseEntity<ApiResponse<TodoResponse>> assignTodo(@PathVariable UUID id) {
        try {
            TodoResponse todo = todoService.updateStatus(id, TodoStatus.THREADING);
            log.info("Hub assigned todo: {} -> THREADING", id);
            return ResponseEntity.ok(ApiResponse.success(todo));
        } catch (Exception e) {
            log.error("Failed to assign todo {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("ASSIGN_ERROR", e.getMessage()));
        }
    }

    /**
     * Complete a todo (THREADING -> WOVEN).
     */
    @PostMapping("/todos/{id}/complete")
    public ResponseEntity<ApiResponse<TodoResponse>> completeTodo(@PathVariable UUID id) {
        try {
            TodoResponse todo = todoService.updateStatus(id, TodoStatus.WOVEN);
            log.info("Hub completed todo: {} -> WOVEN", id);
            return ResponseEntity.ok(ApiResponse.success(todo));
        } catch (Exception e) {
            log.error("Failed to complete todo {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("COMPLETE_ERROR", e.getMessage()));
        }
    }

    /**
     * Fail a todo (THREADING -> TANGLED).
     */
    @PostMapping("/todos/{id}/fail")
    public ResponseEntity<ApiResponse<TodoResponse>> failTodo(
            @PathVariable UUID id,
            @RequestBody(required = false) FailTodoRequest request) {
        try {
            TodoResponse todo = todoService.updateStatus(id, TodoStatus.TANGLED);
            log.info("Hub failed todo: {} -> TANGLED (reason: {})", id,
                request != null ? request.reason() : "not specified");
            return ResponseEntity.ok(ApiResponse.success(todo));
        } catch (Exception e) {
            log.error("Failed to mark todo {} as failed: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("FAIL_ERROR", e.getMessage()));
        }
    }

    /**
     * Get a specific todo by ID.
     */
    @GetMapping("/todos/{id}")
    public ResponseEntity<ApiResponse<TodoResponse>> getTodo(@PathVariable UUID id) {
        try {
            TodoResponse todo = todoService.getTodo(id);
            return ResponseEntity.ok(ApiResponse.success(todo));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("NOT_FOUND", e.getMessage()));
        }
    }

    // ==================== Worker Management ====================

    /**
     * Start a Worker session for a Todo.
     * Creates tmux session (todo-{id}) and launches Claude Code.
     */
    @PostMapping("/todos/{id}/start-worker")
    public ResponseEntity<ApiResponse<WorkerResponse>> startWorker(
            @PathVariable UUID id,
            @RequestBody(required = false) StartWorkerRequest request) {
        try {
            String todoId = id.toString();
            String workDir = request != null && request.workDir() != null
                ? request.workDir()
                : "/tmp/threadcast/" + id;

            // Start terminal session with Claude Code
            CompletableFuture<String> future = terminalService.startSession(todoId, workDir, true);
            String sessionName = future.join();

            // Update todo status to THREADING
            todoService.updateStatus(id, TodoStatus.THREADING);

            log.info("Hub started worker for todo {}: session={}, workDir={}", id, sessionName, workDir);

            return ResponseEntity.ok(ApiResponse.success(
                new WorkerResponse(sessionName, todoId, workDir, true)
            ));
        } catch (Exception e) {
            log.error("Failed to start worker for todo {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("WORKER_START_ERROR", e.getMessage()));
        }
    }

    /**
     * Stop a Worker session for a Todo.
     */
    @PostMapping("/todos/{id}/stop-worker")
    public ResponseEntity<ApiResponse<Boolean>> stopWorker(@PathVariable UUID id) {
        try {
            String todoId = id.toString();
            terminalService.stopSession(todoId).join();
            log.info("Hub stopped worker for todo {}", id);
            return ResponseEntity.ok(ApiResponse.success(true));
        } catch (Exception e) {
            log.error("Failed to stop worker for todo {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("WORKER_STOP_ERROR", e.getMessage()));
        }
    }

    /**
     * Get Worker screen capture for a Todo.
     */
    @GetMapping("/todos/{id}/screen")
    public ResponseEntity<ApiResponse<String>> getWorkerScreen(@PathVariable UUID id) {
        try {
            String screen = terminalService.captureScreen(id.toString());
            return ResponseEntity.ok(ApiResponse.success(screen));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("SCREEN_CAPTURE_ERROR", e.getMessage()));
        }
    }

    /**
     * Send command to a Worker.
     */
    @PostMapping("/todos/{id}/send")
    public ResponseEntity<ApiResponse<Boolean>> sendToWorker(
            @PathVariable UUID id,
            @RequestBody CommandRequest request) {
        try {
            terminalService.sendKeys(id.toString(), request.command()).join();
            return ResponseEntity.ok(ApiResponse.success(true));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("SEND_ERROR", e.getMessage()));
        }
    }

    // ==================== Git Operations for Hub ====================

    /**
     * Initialize git repository in a project directory.
     */
    @PostMapping("/git/init")
    public ResponseEntity<ApiResponse<GitResponse>> gitInit(@RequestBody GitInitRequest request) {
        try {
            String projectDir = request.projectDir();

            // Create directory if not exists
            new java.io.File(projectDir).mkdirs();

            // Check if already a git repo
            java.io.File gitDir = new java.io.File(projectDir, ".git");
            if (gitDir.exists()) {
                return ResponseEntity.ok(ApiResponse.success(
                    new GitResponse(true, "Git repository already exists", projectDir)
                ));
            }

            // git init
            ProcessBuilder pb = new ProcessBuilder("git", "init");
            pb.directory(new java.io.File(projectDir));
            pb.redirectErrorStream(true);
            Process p = pb.start();
            p.waitFor();

            // Create .worktrees directory
            new java.io.File(projectDir, ".worktrees").mkdirs();

            // Add .worktrees to .gitignore
            java.nio.file.Files.writeString(
                java.nio.file.Path.of(projectDir, ".gitignore"),
                ".worktrees/\n",
                java.nio.file.StandardOpenOption.CREATE,
                java.nio.file.StandardOpenOption.APPEND
            );

            // Initial commit
            runGitCommand(projectDir, "git", "add", "-A");
            runGitCommand(projectDir, "git", "commit", "-m", "Initial commit", "--allow-empty");

            log.info("Initialized git repository: {}", projectDir);
            return ResponseEntity.ok(ApiResponse.success(
                new GitResponse(true, "Git repository initialized", projectDir)
            ));
        } catch (Exception e) {
            log.error("Failed to init git: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("GIT_INIT_ERROR", e.getMessage()));
        }
    }

    /**
     * Create a worktree for a todo.
     */
    @PostMapping("/git/worktree/add")
    public ResponseEntity<ApiResponse<WorktreeResponse>> addWorktree(@RequestBody WorktreeRequest request) {
        try {
            String projectDir = request.projectDir();
            String todoId = request.todoId();
            String branchName = "todo/" + todoId;
            String worktreePath = projectDir + "/.worktrees/todo-" + todoId;

            // Create branch from main/master
            String mainBranch = getMainBranch(projectDir);
            runGitCommand(projectDir, "git", "branch", branchName, mainBranch);

            // Add worktree
            runGitCommand(projectDir, "git", "worktree", "add", worktreePath, branchName);

            log.info("Created worktree for todo {}: {}", todoId, worktreePath);
            return ResponseEntity.ok(ApiResponse.success(
                new WorktreeResponse(worktreePath, branchName, todoId, true)
            ));
        } catch (Exception e) {
            log.error("Failed to add worktree: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("WORKTREE_ADD_ERROR", e.getMessage()));
        }
    }

    /**
     * Commit changes in a worktree.
     */
    @PostMapping("/git/commit")
    public ResponseEntity<ApiResponse<GitResponse>> gitCommit(@RequestBody GitCommitRequest request) {
        try {
            String worktreePath = request.worktreePath();
            String message = request.message();
            String todoId = request.todoId();
            String missionId = request.missionId();

            // Format commit message
            String fullMessage = message + "\n\nTodo ID: " + todoId + "\nMission ID: " + missionId;

            // Stage all changes
            runGitCommand(worktreePath, "git", "add", "-A");

            // Commit
            runGitCommand(worktreePath, "git", "commit", "-m", fullMessage, "--allow-empty");

            log.info("Committed changes in worktree: {}", worktreePath);
            return ResponseEntity.ok(ApiResponse.success(
                new GitResponse(true, "Changes committed", worktreePath)
            ));
        } catch (Exception e) {
            log.error("Failed to commit: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("GIT_COMMIT_ERROR", e.getMessage()));
        }
    }

    /**
     * Create a tag for a todo (rollback point).
     */
    @PostMapping("/git/tag")
    public ResponseEntity<ApiResponse<GitResponse>> gitTag(@RequestBody GitTagRequest request) {
        try {
            String worktreePath = request.worktreePath();
            String tagName = "todo-" + request.todoId() + "-done";

            runGitCommand(worktreePath, "git", "tag", tagName);

            log.info("Created tag: {}", tagName);
            return ResponseEntity.ok(ApiResponse.success(
                new GitResponse(true, "Tag created: " + tagName, worktreePath)
            ));
        } catch (Exception e) {
            log.error("Failed to create tag: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("GIT_TAG_ERROR", e.getMessage()));
        }
    }

    /**
     * Merge worktree branch to main.
     */
    @PostMapping("/git/merge")
    public ResponseEntity<ApiResponse<GitResponse>> gitMerge(@RequestBody GitMergeRequest request) {
        try {
            String projectDir = request.projectDir();
            String branchName = "todo/" + request.todoId();
            String mainBranch = getMainBranch(projectDir);

            // Checkout main
            runGitCommand(projectDir, "git", "checkout", mainBranch);

            // Merge
            runGitCommand(projectDir, "git", "merge", branchName, "--no-ff",
                "-m", "Merge " + branchName);

            log.info("Merged {} to {}", branchName, mainBranch);
            return ResponseEntity.ok(ApiResponse.success(
                new GitResponse(true, "Merged to " + mainBranch, projectDir)
            ));
        } catch (Exception e) {
            log.error("Failed to merge: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("GIT_MERGE_ERROR", e.getMessage()));
        }
    }

    /**
     * Remove a worktree after todo completion.
     */
    @PostMapping("/git/worktree/remove")
    public ResponseEntity<ApiResponse<GitResponse>> removeWorktree(@RequestBody WorktreeRequest request) {
        try {
            String projectDir = request.projectDir();
            String todoId = request.todoId();
            String worktreePath = projectDir + "/.worktrees/todo-" + todoId;
            String branchName = "todo/" + todoId;

            // Remove worktree
            runGitCommand(projectDir, "git", "worktree", "remove", worktreePath, "--force");

            // Delete branch
            runGitCommand(projectDir, "git", "branch", "-d", branchName);

            log.info("Removed worktree and branch for todo: {}", todoId);
            return ResponseEntity.ok(ApiResponse.success(
                new GitResponse(true, "Worktree removed", projectDir)
            ));
        } catch (Exception e) {
            log.error("Failed to remove worktree: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("WORKTREE_REMOVE_ERROR", e.getMessage()));
        }
    }

    /**
     * Get git status for a directory.
     */
    @GetMapping("/git/status")
    public ResponseEntity<ApiResponse<String>> gitStatus(@RequestParam String path) {
        try {
            String output = runGitCommandWithOutput(path, "git", "status", "--short");
            return ResponseEntity.ok(ApiResponse.success(output));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("GIT_STATUS_ERROR", e.getMessage()));
        }
    }

    // Helper methods for git operations
    private void runGitCommand(String workDir, String... command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(new java.io.File(workDir));
        pb.redirectErrorStream(true);
        Process p = pb.start();
        int exitCode = p.waitFor();
        if (exitCode != 0) {
            String error = new String(p.getInputStream().readAllBytes());
            throw new RuntimeException("Git command failed: " + error);
        }
    }

    private String runGitCommandWithOutput(String workDir, String... command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(new java.io.File(workDir));
        pb.redirectErrorStream(true);
        Process p = pb.start();
        String output = new String(p.getInputStream().readAllBytes());
        p.waitFor();
        return output;
    }

    private String getMainBranch(String projectDir) {
        try {
            String output = runGitCommandWithOutput(projectDir, "git", "branch", "--list", "main");
            if (!output.isBlank()) return "main";
            output = runGitCommandWithOutput(projectDir, "git", "branch", "--list", "master");
            if (!output.isBlank()) return "master";
        } catch (Exception e) {
            log.debug("Error checking main branch: {}", e.getMessage());
        }
        return "main"; // default
    }

    // ==================== DTOs ====================

    public record HubStatusResponse(
        boolean running,
        String sessionName,
        String lastScreen,
        String stateJson
    ) {}

    public record CommandRequest(String command) {}

    public record FailTodoRequest(String reason) {}

    public record StartWorkerRequest(String workDir) {}

    public record WorkerResponse(
        String sessionName,
        String todoId,
        String workDir,
        boolean started
    ) {}

    public record CreateTodoForMissionRequest(
        String title,
        String description,
        Priority priority,
        Complexity complexity,
        Integer orderIndex
    ) {}

    // Git DTOs
    public record GitInitRequest(String projectDir) {}

    public record GitResponse(boolean success, String message, String path) {}

    public record WorktreeRequest(String projectDir, String todoId) {}

    public record WorktreeResponse(String worktreePath, String branchName, String todoId, boolean created) {}

    public record GitCommitRequest(String worktreePath, String message, String todoId, String missionId) {}

    public record GitTagRequest(String worktreePath, String todoId) {}

    public record GitMergeRequest(String projectDir, String todoId) {}
}
