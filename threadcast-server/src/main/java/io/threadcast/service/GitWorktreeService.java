package io.threadcast.service;

import io.threadcast.domain.Todo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Service for managing Git worktrees for Todos.
 *
 * Each Todo gets its own worktree to isolate changes:
 * - On Todo start: Create worktree at .worktrees/todo-{id}
 * - On Todo complete: Commit changes and optionally merge to main
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GitWorktreeService {

    /**
     * Create a worktree for a Todo.
     * Creates a new branch and worktree at .worktrees/todo-{todoId}
     */
    public CompletableFuture<String> createWorktree(Todo todo) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String projectDir = todo.getMission().getWorkspace().getPath();
                String todoId = todo.getId().toString();
                String branchName = "todo/" + todoId;
                String worktreePath = projectDir + "/.worktrees/todo-" + todoId;

                // Check if worktree already exists
                File worktreeDir = new File(worktreePath);
                if (worktreeDir.exists()) {
                    log.info("Worktree already exists for todo {}: {}", todoId, worktreePath);
                    return worktreePath;
                }

                // Create .worktrees directory if not exists
                new File(projectDir, ".worktrees").mkdirs();

                // Get main branch name
                String mainBranch = getMainBranch(projectDir);

                // Create branch from main (ignore error if branch already exists)
                try {
                    runGitCommand(projectDir, "git", "branch", branchName, mainBranch);
                } catch (Exception e) {
                    log.debug("Branch {} may already exist: {}", branchName, e.getMessage());
                }

                // Add worktree
                runGitCommand(projectDir, "git", "worktree", "add", worktreePath, branchName);

                log.info("Created worktree for todo {}: {}", todoId, worktreePath);

                return worktreePath;
            } catch (Exception e) {
                log.error("Failed to create worktree for todo {}: {}", todo.getId(), e.getMessage());
                throw new RuntimeException("Failed to create worktree: " + e.getMessage(), e);
            }
        });
    }

    /**
     * Commit all changes in a Todo's worktree.
     * Called when Todo completes (WOVEN).
     */
    public CompletableFuture<Void> commitWorktree(Todo todo) {
        return CompletableFuture.runAsync(() -> {
            try {
                String worktreePath = todo.getWorktreePath();
                if (worktreePath == null || worktreePath.isEmpty()) {
                    log.warn("No worktree path for todo {}, skipping commit", todo.getId());
                    return;
                }

                File worktreeDir = new File(worktreePath);
                if (!worktreeDir.exists()) {
                    log.warn("Worktree directory does not exist: {}", worktreePath);
                    return;
                }

                // Check if there are changes to commit
                String status = runGitCommand(worktreePath, "git", "status", "--porcelain");
                if (status.trim().isEmpty()) {
                    log.info("No changes to commit in worktree: {}", worktreePath);
                    return;
                }

                // Stage all changes
                runGitCommand(worktreePath, "git", "add", "-A");

                // Create commit message
                String message = String.format("feat(%s): %s\n\nTodo ID: %s\nMission: %s\n\nAuto-committed by ThreadCast",
                        todo.getMission().getTitle(),
                        todo.getTitle(),
                        todo.getId(),
                        todo.getMission().getId());

                // Commit
                runGitCommand(worktreePath, "git", "commit", "-m", message);

                log.info("Committed changes in worktree for todo {}: {}", todo.getId(), worktreePath);

            } catch (Exception e) {
                log.error("Failed to commit worktree for todo {}: {}", todo.getId(), e.getMessage());
                // Don't throw - commit failure shouldn't block Todo completion
            }
        });
    }

    /**
     * Remove a worktree after Todo is done.
     * Optional cleanup step.
     */
    public CompletableFuture<Void> removeWorktree(Todo todo) {
        return CompletableFuture.runAsync(() -> {
            try {
                String worktreePath = todo.getWorktreePath();
                if (worktreePath == null || worktreePath.isEmpty()) {
                    return;
                }

                String projectDir = todo.getMission().getWorkspace().getPath();

                // Remove worktree
                runGitCommand(projectDir, "git", "worktree", "remove", worktreePath, "--force");

                log.info("Removed worktree for todo {}: {}", todo.getId(), worktreePath);

            } catch (Exception e) {
                log.error("Failed to remove worktree for todo {}: {}", todo.getId(), e.getMessage());
            }
        });
    }

    /**
     * Get the main branch name (main or master).
     */
    private String getMainBranch(String projectDir) {
        try {
            // Try 'main' first
            runGitCommand(projectDir, "git", "rev-parse", "--verify", "main");
            return "main";
        } catch (Exception e) {
            // Fall back to 'master'
            return "master";
        }
    }

    /**
     * Run a git command and return output.
     */
    private String runGitCommand(String workDir, String... command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(new File(workDir));
        pb.redirectErrorStream(true);

        Process process = pb.start();
        StringBuilder output = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        boolean finished = process.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            throw new RuntimeException("Git command timed out");
        }

        int exitCode = process.exitValue();
        if (exitCode != 0) {
            throw new RuntimeException("Git command failed (exit " + exitCode + "): " + output);
        }

        return output.toString();
    }
}
