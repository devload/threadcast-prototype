package io.threadcast.service;

import io.threadcast.domain.Mission;
import io.threadcast.domain.Project;
import io.threadcast.domain.Todo;
import io.threadcast.domain.Workspace;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.dto.response.ProjectDashboardResponse;
import io.threadcast.dto.response.ProjectResponse;
import io.threadcast.exception.BadRequestException;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.ProjectRepository;
import io.threadcast.repository.TodoRepository;
import io.threadcast.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;
    private final TodoRepository todoRepository;

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByWorkspace(UUID workspaceId) {
        return projectRepository.findByWorkspaceIdOrderByName(workspaceId).stream()
                .map(ProjectResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found: " + projectId));
        return ProjectResponse.from(project);
    }

    @Transactional
    public ProjectResponse createProject(UUID workspaceId, String name, String description, String path,
                                         String language, String buildTool) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + workspaceId));

        if (projectRepository.existsByWorkspaceIdAndName(workspaceId, name)) {
            throw new BadRequestException("Project with name '" + name + "' already exists in this workspace");
        }

        Project project = Project.create(workspace, name, description, path);
        project.setLanguage(language);
        project.setBuildTool(buildTool);

        project = projectRepository.save(project);
        log.info("Created project: {} in workspace: {}", name, workspaceId);

        return ProjectResponse.from(project);
    }

    @Transactional
    public ProjectResponse updateProject(UUID projectId, String name, String description, String path,
                                         String language, String buildTool) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found: " + projectId));

        if (name != null) project.setName(name);
        if (description != null) project.setDescription(description);
        if (path != null) project.setPath(path);
        if (language != null) project.setLanguage(language);
        if (buildTool != null) project.setBuildTool(buildTool);

        project = projectRepository.save(project);
        log.info("Updated project: {}", projectId);

        return ProjectResponse.from(project);
    }

    @Transactional
    public void deleteProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found: " + projectId));

        if (!project.getTodos().isEmpty()) {
            throw new BadRequestException("Cannot delete project with existing todos");
        }

        projectRepository.delete(project);
        log.info("Deleted project: {}", projectId);
    }

    @Transactional(readOnly = true)
    public ProjectDashboardResponse getProjectDashboard(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found: " + projectId));

        // Get todos for this project
        List<Todo> todos = todoRepository.findByProjectIdWithSteps(projectId);

        // Calculate stats
        long totalTodos = todos.size();
        long threadingTodos = todos.stream().filter(t -> t.getStatus() == TodoStatus.THREADING).count();
        long wovenTodos = todos.stream().filter(t -> t.getStatus() == TodoStatus.WOVEN).count();
        long pendingTodos = todos.stream().filter(t -> t.getStatus() == TodoStatus.PENDING).count();
        long tangledTodos = todos.stream().filter(t -> t.getStatus() == TodoStatus.TANGLED).count();

        // Get linked missions (missions that have todos in this project)
        Set<Mission> linkedMissionSet = todos.stream()
                .filter(t -> t.getMission() != null)
                .map(Todo::getMission)
                .collect(Collectors.toSet());
        List<Mission> linkedMissions = List.copyOf(linkedMissionSet);

        // Calculate progress
        int progress = totalTodos > 0 ? (int) ((wovenTodos * 100) / totalTodos) : 0;

        ProjectDashboardResponse.ProjectStats stats = ProjectDashboardResponse.ProjectStats.builder()
                .totalTodos((int) totalTodos)
                .threadingTodos((int) threadingTodos)
                .wovenTodos((int) wovenTodos)
                .pendingTodos((int) pendingTodos)
                .tangledTodos((int) tangledTodos)
                .linkedMissions(linkedMissions.size())
                .commits(0) // TODO: Integrate with git service
                .aiActions(0) // TODO: Track AI actions
                .linesAdded(0) // TODO: Integrate with git service
                .linesRemoved(0) // TODO: Integrate with git service
                .progress(progress)
                .build();

        // Mock git status - TODO: Integrate with actual git service
        ProjectDashboardResponse.GitStatus gitStatus = ProjectDashboardResponse.GitStatus.builder()
                .currentBranch("main")
                .lastCommit("Initial commit")
                .commitCount(0)
                .branchCount(1)
                .uncommittedChanges(0)
                .build();

        return ProjectDashboardResponse.from(project, todos, linkedMissions, stats, gitStatus);
    }
}
