package io.threadcast.controller;

import io.threadcast.domain.enums.ActorType;
import io.threadcast.domain.enums.EventType;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.TimelineEventResponse;
import io.threadcast.service.TimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/timeline")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;

    /**
     * Get timeline events with various filters.
     * workspaceId is optional when todoId is provided (for todo-specific timelines).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<TimelineEventResponse>>> getTimeline(
            @RequestParam(required = false) UUID workspaceId,
            @RequestParam(required = false) UUID missionId,
            @RequestParam(required = false) UUID todoId,
            @RequestParam(required = false) EventType eventType,
            @RequestParam(required = false) ActorType actorType,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        // workspaceId is required unless todoId is provided
        if (workspaceId == null && todoId == null) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("VALIDATION_ERROR", "workspaceId is required when todoId is not provided"));
        }
        Page<TimelineEventResponse> events = timelineService.getTimeline(
                workspaceId, missionId, todoId, eventType, actorType, pageable);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/stats/today")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTodayStats(@RequestParam UUID workspaceId) {
        Map<String, Object> stats = timelineService.getTodayStats(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<Page<TimelineEventResponse>>> getRecentActivity(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TimelineEventResponse> events = timelineService.getRecentActivity(pageable);
        return ResponseEntity.ok(ApiResponse.success(events));
    }
}
