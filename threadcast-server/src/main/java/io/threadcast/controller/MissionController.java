package io.threadcast.controller;

import io.threadcast.domain.Mission;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.dto.request.AnalyzeMissionRequest;
import io.threadcast.dto.request.CreateMissionRequest;
import io.threadcast.dto.request.StartWeavingRequest;
import io.threadcast.dto.request.UpdateMetaRequest;
import io.threadcast.dto.request.UpdateMissionStatusRequest;
import io.threadcast.dto.response.AIAnalysisResponse;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.MissionResponse;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.MissionRepository;
import io.threadcast.service.AIAnalysisService;
import io.threadcast.service.AnalysisService;
import io.threadcast.service.MetadataService;
import io.threadcast.service.MissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/missions")
@RequiredArgsConstructor
public class MissionController {

    private final MissionService missionService;
    private final MissionRepository missionRepository;
    private final MetadataService metadataService;
    private final AIAnalysisService aiAnalysisService;
    private final AnalysisService analysisService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<MissionResponse>>> getMissions(
            @RequestParam UUID workspaceId,
            @RequestParam(required = false) MissionStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<MissionResponse> missions = missionService.getMissions(workspaceId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(missions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MissionResponse>> getMission(@PathVariable UUID id) {
        MissionResponse mission = missionService.getMission(id);
        return ResponseEntity.ok(ApiResponse.success(mission));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MissionResponse>> createMission(
            @Valid @RequestBody CreateMissionRequest request) {
        MissionResponse mission = missionService.createMission(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(mission));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<MissionResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMissionStatusRequest request) {
        MissionResponse mission = missionService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(mission));
    }

    @PostMapping("/{id}/start-weaving")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startWeaving(
            @PathVariable UUID id,
            @Valid @RequestBody StartWeavingRequest request) {
        missionService.startWeaving(id, request);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "missionId", id,
                "status", "THREADING",
                "todosCreated", request.getTodos().size()
        )));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> deleteMission(@PathVariable UUID id) {
        missionService.deleteMission(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("deleted", true)));
    }

    /**
     * Update auto-start enabled setting for a mission.
     * When enabled, completing a todo will automatically start the next ready todo.
     */
    @PatchMapping("/{id}/auto-start")
    @Transactional
    public ResponseEntity<ApiResponse<MissionResponse>> updateAutoStart(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> request) {
        Mission mission = missionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Mission not found: " + id));

        Boolean enabled = request.get("enabled");
        if (enabled != null) {
            mission.setAutoStartEnabled(enabled);
            missionRepository.save(mission);
        }

        return ResponseEntity.ok(ApiResponse.success(MissionResponse.from(mission)));
    }

    @PostMapping("/{id}/analyze")
    public ResponseEntity<ApiResponse<AIAnalysisResponse>> analyzeMission(
            @PathVariable UUID id,
            @RequestBody AnalyzeMissionRequest request) {
        AIAnalysisResponse result = aiAnalysisService.analyzeMission(id, request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Get the effective (merged) metadata for a Mission.
     * Merges Workspace → Mission meta with deep merge.
     */
    @GetMapping("/{id}/effective-meta")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEffectiveMeta(@PathVariable UUID id) {
        Mission mission = missionRepository.findByIdWithWorkspace(id)
                .orElseThrow(() -> new NotFoundException("Mission not found: " + id));
        Map<String, Object> effectiveMeta = metadataService.getEffectiveMeta(mission);
        return ResponseEntity.ok(ApiResponse.success(effectiveMeta));
    }

    /**
     * Get the Mission's own metadata (not merged).
     */
    @GetMapping("/{id}/meta")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMeta(@PathVariable UUID id) {
        Mission mission = missionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Mission not found: " + id));
        if (mission.getMeta() == null) {
            return ResponseEntity.ok(ApiResponse.success(Map.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(parseJsonToMap(mission.getMeta())));
    }

    /**
     * Update the Mission's metadata.
     * If replace=true, replaces entirely. Otherwise, deep merges.
     */
    @PatchMapping("/{id}/meta")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateMeta(
            @PathVariable UUID id,
            @RequestBody UpdateMetaRequest request) {
        Mission mission = missionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Mission not found: " + id));

        Map<String, Object> newMeta;
        if (request.isReplace() || mission.getMeta() == null) {
            newMeta = request.getMeta();
        } else {
            Map<String, Object> existingMeta = parseJsonToMap(mission.getMeta());
            newMeta = deepMerge(existingMeta, request.getMeta());
        }

        mission.setMeta(metadataService.toMetaString(newMeta));
        missionRepository.save(mission);

        return ResponseEntity.ok(ApiResponse.success(newMeta));
    }

    /**
     * Generate TASKS.md for Claude Code Team mode.
     * Creates a task file from the mission's todos with dependency info.
     */
    @PostMapping("/{id}/generate-tasks")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateTasks(@PathVariable UUID id) {
        String filePath = analysisService.generateTasksFile(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "missionId", id.toString(),
                "tasksFilePath", filePath
        )));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonToMap(String json) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(json, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> deepMerge(Map<String, Object> target, Map<String, Object> source) {
        Map<String, Object> result = new HashMap<>(target);
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            String key = entry.getKey();
            Object sourceValue = entry.getValue();
            Object targetValue = result.get(key);
            if (sourceValue instanceof Map && targetValue instanceof Map) {
                result.put(key, deepMerge((Map<String, Object>) targetValue, (Map<String, Object>) sourceValue));
            } else {
                result.put(key, sourceValue);
            }
        }
        return result;
    }
}
