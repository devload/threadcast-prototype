package io.threadcast.dto.response;

import io.threadcast.domain.Project;
import io.threadcast.domain.Todo;
import io.threadcast.domain.Mission;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.TodoStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ProjectDashboardResponse {
    private UUID id;
    private UUID workspaceId;
    private String name;
    private String description;
    private String path;
    private String absolutePath;
    private String language;
    private String buildTool;
    private LocalDateTime createdAt;

    private ProjectStats stats;
    private List<TodoSummary> todos;
    private List<LinkedMission> linkedMissions;
    private List<Worktree> activeWorktrees;
    private GitStatus gitStatus;

    @Data
    @Builder
    public static class ProjectStats {
        private int totalTodos;
        private int threadingTodos;
        private int wovenTodos;
        private int pendingTodos;
        private int tangledTodos;
        private int linkedMissions;
        private int commits;
        private int aiActions;
        private int linesAdded;
        private int linesRemoved;
        private int progress; // percentage
    }

    @Data
    @Builder
    public static class TodoSummary {
        private UUID id;
        private String title;
        private TodoStatus status;
        private String priority;
        private String complexity;
        private String stepProgress; // e.g., "3/6"
        private int completedSteps;
        private int totalSteps;
        private UUID missionId;
        private String missionTitle;
    }

    @Data
    @Builder
    public static class LinkedMission {
        private UUID id;
        private String title;
        private MissionStatus status;
        private int todoCount;
        private int progress;
    }

    @Data
    @Builder
    public static class Worktree {
        private String todoId;
        private String todoTitle;
        private String path;
        private String branch;
    }

    @Data
    @Builder
    public static class GitStatus {
        private String currentBranch;
        private String lastCommit;
        private int commitCount;
        private int branchCount;
        private int uncommittedChanges;
    }

    public static ProjectDashboardResponse from(Project project, List<Todo> todos,
                                                 List<Mission> linkedMissions,
                                                 ProjectStats stats,
                                                 GitStatus gitStatus) {
        List<TodoSummary> todoSummaries = todos.stream()
                .map(t -> TodoSummary.builder()
                        .id(t.getId())
                        .title(t.getTitle())
                        .status(t.getStatus())
                        .priority(t.getPriority() != null ? t.getPriority().name() : null)
                        .complexity(t.getComplexity() != null ? t.getComplexity().name() : null)
                        .completedSteps(t.getSteps() != null ?
                                (int) t.getSteps().stream()
                                        .filter(s -> s.getStatus() == io.threadcast.domain.enums.StepStatus.COMPLETED)
                                        .count() : 0)
                        .totalSteps(t.getSteps() != null ? t.getSteps().size() : 0)
                        .stepProgress(buildStepProgress(t))
                        .missionId(t.getMission() != null ? t.getMission().getId() : null)
                        .missionTitle(t.getMission() != null ? t.getMission().getTitle() : null)
                        .build())
                .toList();

        List<LinkedMission> missionSummaries = linkedMissions.stream()
                .map(m -> LinkedMission.builder()
                        .id(m.getId())
                        .title(m.getTitle())
                        .status(m.getStatus())
                        .todoCount(m.getTodos() != null ? m.getTodos().size() : 0)
                        .progress(m.getProgress())
                        .build())
                .toList();

        // Generate worktrees from threading todos
        List<Worktree> worktrees = todos.stream()
                .filter(t -> t.getStatus() == TodoStatus.THREADING)
                .map(t -> Worktree.builder()
                        .todoId("TODO-" + t.getId().toString().substring(0, 8))
                        .todoTitle(t.getTitle())
                        .path(".worktrees/todo-" + t.getId().toString().substring(0, 8))
                        .branch("todo/" + t.getId().toString().substring(0, 8))
                        .build())
                .toList();

        return ProjectDashboardResponse.builder()
                .id(project.getId())
                .workspaceId(project.getWorkspace().getId())
                .name(project.getName())
                .description(project.getDescription())
                .path(project.getPath())
                .absolutePath(project.getAbsolutePath())
                .language(project.getLanguage())
                .buildTool(project.getBuildTool())
                .createdAt(project.getCreatedAt())
                .stats(stats)
                .todos(todoSummaries)
                .linkedMissions(missionSummaries)
                .activeWorktrees(worktrees)
                .gitStatus(gitStatus)
                .build();
    }

    private static String buildStepProgress(Todo todo) {
        if (todo.getSteps() == null || todo.getSteps().isEmpty()) {
            return "0/0";
        }
        int completed = (int) todo.getSteps().stream()
                .filter(s -> s.getStatus() == io.threadcast.domain.enums.StepStatus.COMPLETED)
                .count();
        return completed + "/" + todo.getSteps().size();
    }
}
