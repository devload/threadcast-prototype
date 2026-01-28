package io.threadcast.controller;

import io.threadcast.domain.Workspace;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.WorkspaceResponse;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.WorkspaceRepository;
import io.threadcast.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceRepository workspaceRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getMyWorkspaces(
            @RequestHeader("Authorization") String authHeader) {
        UUID userId = getUserIdFromToken(authHeader);
        // Fetch workspaces with projects first
        List<Workspace> workspaces = workspaceRepository.findByOwnerIdWithProjects(userId);
        // Then fetch missions in same transaction
        if (!workspaces.isEmpty()) {
            workspaceRepository.findWithMissions(workspaces);
        }
        List<WorkspaceResponse> responses = workspaces.stream()
                .map(WorkspaceResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspace(@PathVariable UUID id) {
        Workspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + id));
        return ResponseEntity.ok(ApiResponse.success(WorkspaceResponse.from(workspace)));
    }

    /**
     * Get workspace with full dashboard details (projects, missions, stats).
     */
    @GetMapping("/{id}/dashboard")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspaceDashboard(@PathVariable UUID id) {
        // First fetch with projects
        Workspace workspace = workspaceRepository.findByIdWithProjects(id)
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + id));
        // Then fetch with missions and todos
        workspaceRepository.findByIdWithMissionsAndTodos(id);
        return ResponseEntity.ok(ApiResponse.success(WorkspaceResponse.from(workspace, true)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreateWorkspaceRequest request) {
        UUID userId = getUserIdFromToken(authHeader);
        var user = workspaceRepository.findByOwnerId(userId).stream()
                .findFirst()
                .map(Workspace::getOwner)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Workspace workspace = Workspace.create(
                request.name(),
                request.description(),
                request.path(),
                user
        );
        workspace = workspaceRepository.save(workspace);
        return ResponseEntity.ok(ApiResponse.success(WorkspaceResponse.from(workspace)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> updateWorkspace(
            @PathVariable UUID id,
            @RequestBody UpdateWorkspaceRequest request) {
        Workspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + id));

        if (request.name() != null) workspace.setName(request.name());
        if (request.description() != null) workspace.setDescription(request.description());
        if (request.path() != null) workspace.setPath(request.path());

        workspace = workspaceRepository.save(workspace);
        return ResponseEntity.ok(ApiResponse.success(WorkspaceResponse.from(workspace)));
    }

    private UUID getUserIdFromToken(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        return jwtTokenProvider.getUserIdFromToken(token);
    }

    public record CreateWorkspaceRequest(
            String name,
            String description,
            String path
    ) {}

    public record UpdateWorkspaceRequest(
            String name,
            String description,
            String path
    ) {}
}
