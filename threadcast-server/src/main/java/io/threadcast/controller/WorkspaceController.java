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

    /**
     * Get workspace settings including autonomy level.
     * Used by PM Agent to determine how autonomous AI should be.
     */
    @GetMapping("/{id}/settings")
    public ResponseEntity<ApiResponse<WorkspaceSettingsResponse>> getSettings(@PathVariable UUID id) {
        Workspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + id));

        return ResponseEntity.ok(ApiResponse.success(new WorkspaceSettingsResponse(
                workspace.getId(),
                workspace.getAutonomy(),
                workspace.getMeta()
        )));
    }

    /**
     * Update workspace settings.
     */
    @PutMapping("/{id}/settings")
    public ResponseEntity<ApiResponse<WorkspaceSettingsResponse>> updateSettings(
            @PathVariable UUID id,
            @RequestBody UpdateSettingsRequest request) {
        Workspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + id));

        if (request.autonomy() != null) {
            // Validate autonomy range 0-100
            int autonomy = Math.max(0, Math.min(100, request.autonomy()));
            workspace.setAutonomy(autonomy);
        }
        if (request.meta() != null) {
            workspace.setMeta(request.meta());
        }

        workspace = workspaceRepository.save(workspace);
        return ResponseEntity.ok(ApiResponse.success(new WorkspaceSettingsResponse(
                workspace.getId(),
                workspace.getAutonomy(),
                workspace.getMeta()
        )));
    }

    /**
     * Get workspace meta.
     */
    @GetMapping("/{id}/meta")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getMeta(@PathVariable UUID id) {
        Workspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + id));
        if (workspace.getMeta() == null || workspace.getMeta().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(java.util.Map.of()));
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> meta = mapper.readValue(workspace.getMeta(),
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
            return ResponseEntity.ok(ApiResponse.success(meta));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success(java.util.Map.of()));
        }
    }

    /**
     * Update workspace meta.
     */
    @PatchMapping("/{id}/meta")
    @Transactional
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> updateMeta(
            @PathVariable UUID id,
            @RequestBody UpdateMetaRequest request) {
        Workspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + id));

        java.util.Map<String, Object> newMeta;
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

        if (Boolean.TRUE.equals(request.replace())) {
            newMeta = request.meta();
        } else {
            // Parse existing meta and merge
            java.util.Map<String, Object> existingMeta = java.util.Map.of();
            if (workspace.getMeta() != null && !workspace.getMeta().isEmpty()) {
                try {
                    existingMeta = mapper.readValue(workspace.getMeta(),
                            new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                } catch (Exception e) {
                    // Ignore parse errors
                }
            }
            newMeta = deepMerge(existingMeta, request.meta());
        }

        try {
            workspace.setMeta(mapper.writeValueAsString(newMeta));
        } catch (Exception e) {
            workspace.setMeta("{}");
        }
        workspaceRepository.save(workspace);

        return ResponseEntity.ok(ApiResponse.success(newMeta));
    }

    @SuppressWarnings("unchecked")
    private java.util.Map<String, Object> deepMerge(java.util.Map<String, Object> base, java.util.Map<String, Object> override) {
        java.util.Map<String, Object> result = new java.util.HashMap<>(base);
        for (var entry : override.entrySet()) {
            String key = entry.getKey();
            Object overrideValue = entry.getValue();
            Object baseValue = result.get(key);

            if (baseValue instanceof java.util.Map && overrideValue instanceof java.util.Map) {
                result.put(key, deepMerge(
                        (java.util.Map<String, Object>) baseValue,
                        (java.util.Map<String, Object>) overrideValue
                ));
            } else {
                result.put(key, overrideValue);
            }
        }
        return result;
    }

    public record UpdateMetaRequest(
            java.util.Map<String, Object> meta,
            Boolean replace
    ) {}

    public record WorkspaceSettingsResponse(
            UUID id,
            Integer autonomy,
            String meta
    ) {}

    public record UpdateSettingsRequest(
            Integer autonomy,
            String meta
    ) {}

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
