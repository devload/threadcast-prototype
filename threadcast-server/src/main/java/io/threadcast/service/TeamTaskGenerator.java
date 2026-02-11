package io.threadcast.service;

import io.threadcast.domain.Mission;
import io.threadcast.domain.Todo;
import io.threadcast.domain.enums.StepType;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Generates TASKS.md files from Mission/Todo data for Claude Code Team mode.
 *
 * The generated TASKS.md contains all the information Claude Code needs to:
 * 1. Understand the mission context
 * 2. Distribute tasks to Worker agents
 * 3. Respect dependency ordering between Todos
 * 4. Report progress back via MCP tools
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TeamTaskGenerator {

    private static final String BASE_DIR = "/tmp/threadcast";

    private final MissionRepository missionRepository;

    /**
     * Generate TASKS.md for a mission and return the file path.
     */
    @Transactional(readOnly = true)
    public Path generateTasksFile(UUID missionId, String apiUrl) {
        Mission mission = missionRepository.findByIdWithTodos(missionId);
        if (mission == null) {
            throw new NotFoundException("Mission not found: " + missionId);
        }

        String content = buildTasksMarkdown(mission, apiUrl);
        Path outputDir = Paths.get(BASE_DIR, "mission-" + missionId);
        Path outputFile = outputDir.resolve("TASKS.md");

        try {
            Files.createDirectories(outputDir);
            Files.writeString(outputFile, content);
            log.info("Generated TASKS.md for mission {}: {}", missionId, outputFile);
            return outputFile;
        } catch (IOException e) {
            throw new RuntimeException("Failed to write TASKS.md: " + e.getMessage(), e);
        }
    }

    /**
     * Build the TASKS.md markdown content from a Mission and its Todos.
     */
    String buildTasksMarkdown(Mission mission, String apiUrl) {
        StringBuilder sb = new StringBuilder();

        // Header
        sb.append("# Mission: ").append(mission.getTitle()).append("\n\n");

        // Context section
        sb.append("## Context\n");
        sb.append("- **Workspace ID**: ").append(mission.getWorkspace().getId()).append("\n");
        sb.append("- **Mission ID**: ").append(mission.getId()).append("\n");
        sb.append("- **Project Path**: ").append(mission.getWorkspace().getPath()).append("\n");
        sb.append("- **API URL**: ").append(apiUrl).append("\n");
        if (mission.getDescription() != null && !mission.getDescription().isBlank()) {
            sb.append("- **Description**: ").append(mission.getDescription()).append("\n");
        }
        sb.append("\n");

        // Instructions for the Lead agent - Lead does MCP reporting directly
        sb.append("## Instructions\n\n");
        sb.append("You are the Team Lead for this mission. You coordinate workers AND report progress via MCP tools.\n\n");
        sb.append("### Your Workflow for EACH Task\n\n");
        sb.append("For each task, follow this EXACT sequence:\n\n");
        sb.append("1. **Call MCP: worker_start** — `threadcast_worker_start` with the Todo ID\n");
        sb.append("2. **Call MCP: step_complete ANALYSIS** — `threadcast_worker_step_complete` with step=\"ANALYSIS\", then spawn a worker for the actual work\n");
        sb.append("3. **Spawn a worker** using the Task tool to do the implementation work\n");
        sb.append("4. **After worker completes**, call MCP for the remaining steps:\n");
        sb.append("   - `threadcast_worker_step_complete` with step=\"DESIGN\"\n");
        sb.append("   - `threadcast_worker_step_complete` with step=\"IMPLEMENTATION\"\n");
        sb.append("   - `threadcast_worker_step_complete` with step=\"VERIFICATION\"\n");
        sb.append("   - `threadcast_worker_step_complete` with step=\"REVIEW\"\n");
        sb.append("   - `threadcast_worker_step_complete` with step=\"INTEGRATION\"\n");
        sb.append("5. **Call MCP: worker_complete** — `threadcast_worker_complete` with result summary\n\n");
        sb.append("### MCP Tool Names\n\n");
        sb.append("These are ThreadCast MCP tools available to you:\n");
        sb.append("- `threadcast_worker_start` — params: `{\"todoId\": \"<id>\"}`\n");
        sb.append("- `threadcast_worker_step_complete` — params: `{\"todoId\": \"<id>\", \"step\": \"<STEP>\", \"result\": \"<summary>\"}`\n");
        sb.append("- `threadcast_worker_complete` — params: `{\"todoId\": \"<id>\", \"result\": \"<summary>\"}`\n");
        sb.append("- `threadcast_worker_fail` — params: `{\"todoId\": \"<id>\", \"failure\": \"<error>\"}`\n\n");
        sb.append("### Other Rules\n");
        sb.append("- Respect dependency ordering — do NOT start a task until its dependencies are complete\n");
        sb.append("- Tasks with no dependencies can run in parallel\n");
        sb.append("- Workers do the actual coding; YOU do the MCP progress reporting\n");
        sb.append("\n");

        // Tasks section
        List<Todo> todos = mission.getTodos();
        sb.append("## Tasks\n\n");

        // Build a lookup map for task numbering (orderIndex -> task number)
        Map<UUID, Integer> todoNumberMap = new LinkedHashMap<>();
        for (int i = 0; i < todos.size(); i++) {
            todoNumberMap.put(todos.get(i).getId(), i + 1);
        }

        for (int i = 0; i < todos.size(); i++) {
            Todo todo = todos.get(i);
            int taskNum = i + 1;

            sb.append("### Task ").append(taskNum).append(": ").append(todo.getTitle()).append("\n");
            sb.append("- **Todo ID**: `").append(todo.getId()).append("`\n");
            sb.append("- **Complexity**: ").append(todo.getComplexity()).append("\n");
            sb.append("- **Priority**: ").append(todo.getPriority()).append("\n");

            if (todo.getEstimatedTime() != null) {
                sb.append("- **Estimated Time**: ").append(formatTime(todo.getEstimatedTime())).append("\n");
            }

            if (todo.getDescription() != null && !todo.getDescription().isBlank()) {
                sb.append("- **Description**: ").append(todo.getDescription()).append("\n");
            }

            // Dependencies
            String deps = buildDependencyString(todo, todoNumberMap);
            sb.append("- **Dependencies**: ").append(deps).append("\n");

            // Steps
            sb.append("- **Steps**: ");
            sb.append(Arrays.stream(StepType.values())
                    .map(StepType::name)
                    .collect(Collectors.joining(" → ")));
            sb.append("\n");

            // Meta info (related files, instructions, etc.)
            if (todo.getMeta() != null && !todo.getMeta().isBlank()) {
                sb.append("- **Meta**: ").append(todo.getMeta()).append("\n");
            }

            // Inline MCP reporting instructions - directed at the Lead
            sb.append("- **Lead MCP Actions**: YOU (the lead) must call `threadcast_worker_start` with todoId `")
              .append(todo.getId())
              .append("` BEFORE spawning the worker. After worker finishes, call `threadcast_worker_step_complete` for each step, then `threadcast_worker_complete`.\n");

            sb.append("\n");
        }

        // Summary
        sb.append("## Summary\n");
        sb.append("- **Total Tasks**: ").append(todos.size()).append("\n");
        long parallelizable = todos.stream()
                .filter(t -> t.getDependencies().isEmpty())
                .count();
        sb.append("- **Parallelizable (no dependencies)**: ").append(parallelizable).append("\n");
        sb.append("- **Has Dependencies**: ").append(todos.size() - parallelizable).append("\n");

        return sb.toString();
    }

    private String buildDependencyString(Todo todo, Map<UUID, Integer> todoNumberMap) {
        if (todo.getDependencies() == null || todo.getDependencies().isEmpty()) {
            return "none";
        }
        return todo.getDependencies().stream()
                .map(dep -> {
                    Integer num = todoNumberMap.get(dep.getId());
                    return num != null ? "Task " + num : dep.getTitle();
                })
                .sorted()
                .collect(Collectors.joining(", "));
    }

    private String formatTime(int minutes) {
        if (minutes < 60) {
            return minutes + "분";
        }
        int hours = minutes / 60;
        int mins = minutes % 60;
        return mins > 0 ? hours + "시간 " + mins + "분" : hours + "시간";
    }
}
