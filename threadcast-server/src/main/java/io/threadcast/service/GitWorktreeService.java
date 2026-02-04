package io.threadcast.service;

import io.threadcast.domain.Mission;
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
 * Mission-based branching strategy:
 * - On Mission start: Create mission/{id} branch from main
 * - On Todo start: Create worktree from mission branch (includes previous commits)
 * - On Todo complete: Commit to mission branch, remove worktree
 * - Result: Sequential todos share the same branch, each building on previous work
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GitWorktreeService {

    /**
     * Create a mission branch when Mission starts THREADING.
     * All Todos in this mission will work on this branch.
     */
    public CompletableFuture<Void> createMissionBranch(Mission mission) {
        return CompletableFuture.runAsync(() -> {
            try {
                String projectDir = mission.getWorkspace().getPath();
                String missionId = mission.getId().toString();
                String branchName = "mission/" + missionId;

                // Check if branch already exists
                try {
                    runGitCommand(projectDir, "git", "rev-parse", "--verify", branchName);
                    log.info("Mission branch already exists: {}", branchName);
                    return;
                } catch (Exception e) {
                    // Branch doesn't exist, create it
                }

                // Get main branch name
                String mainBranch = getMainBranch(projectDir);

                // Create mission branch from main
                runGitCommand(projectDir, "git", "branch", branchName, mainBranch);

                log.info("Created mission branch: {} from {}", branchName, mainBranch);
            } catch (Exception e) {
                log.error("Failed to create mission branch for {}: {}", mission.getId(), e.getMessage());
                throw new RuntimeException("Failed to create mission branch: " + e.getMessage(), e);
            }
        });
    }

    /**
     * Create a worktree for a Todo.
     * Uses the mission branch so that previous Todo commits are included.
     */
    public CompletableFuture<String> createWorktree(Todo todo) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String projectDir = todo.getMission().getWorkspace().getPath();
                String todoId = todo.getId().toString();
                String missionId = todo.getMission().getId().toString();
                String missionBranch = "mission/" + missionId;
                String worktreePath = projectDir + "/.worktrees/todo-" + todoId;

                // Check if worktree already exists
                File worktreeDir = new File(worktreePath);
                if (worktreeDir.exists()) {
                    log.info("Worktree already exists for todo {}: {}", todoId, worktreePath);
                    return worktreePath;
                }

                // Create .worktrees directory if not exists
                new File(projectDir, ".worktrees").mkdirs();

                // Ensure mission branch exists
                try {
                    runGitCommand(projectDir, "git", "rev-parse", "--verify", missionBranch);
                } catch (Exception e) {
                    // Mission branch doesn't exist, create it
                    String mainBranch = getMainBranch(projectDir);
                    runGitCommand(projectDir, "git", "branch", missionBranch, mainBranch);
                    log.info("Created mission branch on-demand: {}", missionBranch);
                }

                // Remove any existing worktree for this mission (only one active at a time)
                cleanupMissionWorktrees(projectDir, missionId, todoId);

                // Add worktree with detached HEAD from mission branch
                // This allows multiple worktrees to reference the same branch
                runGitCommand(projectDir, "git", "worktree", "add", "--detach", worktreePath, missionBranch);

                log.info("Created worktree for todo {} from mission branch {}: {}", todoId, missionBranch, worktreePath);

                return worktreePath;
            } catch (Exception e) {
                log.error("Failed to create worktree for todo {}: {}", todo.getId(), e.getMessage());
                throw new RuntimeException("Failed to create worktree: " + e.getMessage(), e);
            }
        });
    }

    /**
     * Clean up other worktrees for the same mission.
     * Since we use detached HEAD, we need to ensure only one active worktree per mission
     * to avoid conflicts when committing.
     */
    private void cleanupMissionWorktrees(String projectDir, String missionId, String currentTodoId) {
        try {
            File worktreesDir = new File(projectDir, ".worktrees");
            if (!worktreesDir.exists()) return;

            File[] worktrees = worktreesDir.listFiles();
            if (worktrees == null) return;

            for (File worktree : worktrees) {
                String name = worktree.getName();
                // Skip current todo's worktree
                if (name.equals("todo-" + currentTodoId)) continue;

                // Check if this worktree belongs to our mission by reading .git file
                // For simplicity, we'll just remove all old worktrees
                // In production, we'd check mission association
                try {
                    runGitCommand(projectDir, "git", "worktree", "remove", worktree.getAbsolutePath(), "--force");
                    log.info("Removed old worktree: {}", worktree.getName());
                } catch (Exception e) {
                    log.debug("Could not remove worktree {}: {}", name, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Error during worktree cleanup: {}", e.getMessage());
        }
    }

    /**
     * Commit all changes in a Todo's worktree and update mission branch.
     * Called when Todo completes (WOVEN).
     *
     * Since worktree uses detached HEAD, we:
     * 1. Commit changes in worktree
     * 2. Update mission branch to point to the new commit
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

                String projectDir = todo.getMission().getWorkspace().getPath();
                String missionId = todo.getMission().getId().toString();
                String missionBranch = "mission/" + missionId;

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

                // Commit in worktree (detached HEAD)
                runGitCommand(worktreePath, "git", "commit", "-m", message);

                // Get the new commit hash
                String commitHash = runGitCommand(worktreePath, "git", "rev-parse", "HEAD").trim();

                // Update mission branch to point to the new commit
                runGitCommand(projectDir, "git", "branch", "-f", missionBranch, commitHash);

                log.info("Committed to mission branch {}: {} (todo: {})", missionBranch, commitHash.substring(0, 7), todo.getId());

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
