package io.threadcast.controller;

import io.threadcast.domain.Mission;
import io.threadcast.domain.Todo;
import io.threadcast.domain.TimelineEvent;
import io.threadcast.domain.User;
import io.threadcast.domain.Workspace;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.WorkspaceResponse;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.MissionRepository;
import io.threadcast.repository.TimelineEventRepository;
import io.threadcast.repository.UserRepository;
import io.threadcast.repository.WorkspaceRepository;
import io.threadcast.security.JwtTokenProvider;
import io.threadcast.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceRepository workspaceRepository;
    private final MissionRepository missionRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getMyWorkspaces(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        UUID userId = principal.getId();
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
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateWorkspaceRequest request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        UUID userId = principal.getId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));

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
     * Get session context for context recovery after compaction.
     * Returns aggregated information about current work state.
     */
    @GetMapping("/{id}/session-context")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<SessionContextResponse>> getSessionContext(@PathVariable UUID id) {
        Workspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + id));

        // Parse workspace meta for projectContext
        Map<String, Object> projectContext = Map.of();
        if (workspace.getMeta() != null && !workspace.getMeta().isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> meta = mapper.readValue(workspace.getMeta(),
                        new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                if (meta.containsKey("projectContext")) {
                    projectContext = (Map<String, Object>) meta.get("projectContext");
                }
            } catch (Exception e) {
                // Ignore parse errors
            }
        }

        // Find current active mission (THREADING first, then BACKLOG)
        Mission currentMission = missionRepository.findByWorkspaceIdAndStatus(id, MissionStatus.THREADING,
                        PageRequest.of(0, 1))
                .getContent().stream().findFirst().orElse(null);
        if (currentMission == null) {
            currentMission = missionRepository.findByWorkspaceIdAndStatus(id, MissionStatus.BACKLOG,
                            PageRequest.of(0, 1))
                    .getContent().stream().findFirst().orElse(null);
        }

        // Find current active todo
        Todo currentTodo = null;
        List<String> recentProgress = new ArrayList<>();
        if (currentMission != null) {
            currentTodo = currentMission.getTodos().stream()
                    .filter(t -> t.getStatus() == TodoStatus.THREADING)
                    .findFirst()
                    .orElse(currentMission.getTodos().stream().findFirst().orElse(null));

            // Extract recent progress from todo meta
            if (currentTodo != null && currentTodo.getMeta() != null) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    Map<String, Object> todoMeta = mapper.readValue(currentTodo.getMeta(),
                            new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                    if (todoMeta.containsKey("steps")) {
                        Map<String, Object> steps = (Map<String, Object>) todoMeta.get("steps");
                        for (var entry : steps.entrySet()) {
                            Map<String, Object> stepData = (Map<String, Object>) entry.getValue();
                            if ("COMPLETED".equals(stepData.get("status"))) {
                                Map<String, Object> result = (Map<String, Object>) stepData.get("result");
                                if (result != null && result.containsKey("summary")) {
                                    recentProgress.add(entry.getKey() + ": " + result.get("summary"));
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    // Ignore
                }
            }
        }

        // Get recent timeline events
        List<String> recentActivity = new ArrayList<>();
        try {
            List<TimelineEvent> events = timelineEventRepository.findByWorkspaceIdOrderByCreatedAtDesc(id,
                    PageRequest.of(0, 5)).getContent();
            for (TimelineEvent event : events) {
                String timeAgo = getTimeAgo(event.getCreatedAt());
                recentActivity.add(event.getEventType() + ": " + event.getDescription() + " - " + timeAgo);
            }
        } catch (Exception e) {
            // Timeline might not be available
        }

        // Generate summary
        String summary;
        if (currentMission != null && currentTodo != null) {
            String stepInfo = currentTodo.getCurrentStep() != null ?
                    ", 현재 단계: " + currentTodo.getCurrentStep() : "";
            summary = String.format("미션 \"%s\" 진행 중 (%d%%). 현재 Todo: \"%s\" (%s%s).",
                    currentMission.getTitle(),
                    currentMission.getProgress(),
                    currentTodo.getTitle(),
                    currentTodo.getStatus(),
                    stepInfo);
            if (!recentProgress.isEmpty()) {
                summary += " 최근 진행: " + recentProgress.get(recentProgress.size() - 1);
            }
        } else if (currentMission != null) {
            summary = String.format("미션 \"%s\" 대기 중. Todo 작업을 시작하세요.", currentMission.getTitle());
        } else {
            summary = "진행 중인 미션이 없습니다. 새 미션을 생성하거나 기존 미션을 시작하세요.";
        }

        return ResponseEntity.ok(ApiResponse.success(new SessionContextResponse(
                new WorkspaceInfo(workspace.getId(), workspace.getName(), workspace.getPath(), projectContext),
                currentMission != null ? new MissionInfo(
                        currentMission.getId(),
                        currentMission.getTitle(),
                        currentMission.getStatus().name(),
                        currentMission.getProgress(),
                        currentMission.getDescription()
                ) : null,
                currentTodo != null ? new TodoInfo(
                        currentTodo.getId(),
                        currentTodo.getTitle(),
                        currentTodo.getStatus().name(),
                        currentTodo.getCurrentStep() != null ? currentTodo.getCurrentStep().name() : null,
                        recentProgress
                ) : null,
                recentActivity,
                summary
        )));
    }

    private String getTimeAgo(LocalDateTime dateTime) {
        Duration duration = Duration.between(dateTime, LocalDateTime.now());
        long minutes = duration.toMinutes();
        if (minutes < 1) return "방금 전";
        if (minutes < 60) return minutes + "분 전";
        long hours = duration.toHours();
        if (hours < 24) return hours + "시간 전";
        long days = duration.toDays();
        return days + "일 전";
    }

    public record SessionContextResponse(
            WorkspaceInfo workspace,
            MissionInfo currentMission,
            TodoInfo currentTodo,
            List<String> recentActivity,
            String summary
    ) {}

    public record WorkspaceInfo(
            UUID id,
            String name,
            String path,
            Map<String, Object> projectContext
    ) {}

    public record MissionInfo(
            UUID id,
            String title,
            String status,
            Integer progress,
            String description
    ) {}

    public record TodoInfo(
            UUID id,
            String title,
            String status,
            String currentStep,
            List<String> recentProgress
    ) {}

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

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> deleteWorkspace(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        UUID userId = principal.getId();
        Workspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + id));

        // Verify ownership
        if (!workspace.getOwner().getId().equals(userId)) {
            throw new io.threadcast.exception.UnauthorizedException("You don't have permission to delete this workspace");
        }

        workspaceRepository.delete(workspace);
        return ResponseEntity.ok(ApiResponse.success(Map.of("deleted", true)));
    }
}
