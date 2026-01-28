package io.threadcast.controller;

import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.ProjectDashboardResponse;
import io.threadcast.dto.response.ProjectResponse;
import io.threadcast.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getProjects(
            @PathVariable UUID workspaceId) {
        List<ProjectResponse> projects = projectService.getProjectsByWorkspace(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId) {
        ProjectResponse project = projectService.getProject(projectId);
        return ResponseEntity.ok(ApiResponse.success(project));
    }

    @GetMapping("/{projectId}/dashboard")
    public ResponseEntity<ApiResponse<ProjectDashboardResponse>> getProjectDashboard(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId) {
        ProjectDashboardResponse dashboard = projectService.getProjectDashboard(projectId);
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @PathVariable UUID workspaceId,
            @RequestBody CreateProjectRequest request) {
        ProjectResponse project = projectService.createProject(
                workspaceId,
                request.name(),
                request.description(),
                request.path(),
                request.language(),
                request.buildTool()
        );
        return ResponseEntity.ok(ApiResponse.success(project));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            @RequestBody UpdateProjectRequest request) {
        ProjectResponse project = projectService.updateProject(
                projectId,
                request.name(),
                request.description(),
                request.path(),
                request.language(),
                request.buildTool()
        );
        return ResponseEntity.ok(ApiResponse.success(project));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId) {
        projectService.deleteProject(projectId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    public record CreateProjectRequest(
            String name,
            String description,
            String path,
            String language,
            String buildTool
    ) {}

    public record UpdateProjectRequest(
            String name,
            String description,
            String path,
            String language,
            String buildTool
    ) {}
}
