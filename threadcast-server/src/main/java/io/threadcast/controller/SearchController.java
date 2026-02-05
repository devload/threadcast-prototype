package io.threadcast.controller;

import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.SearchType;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.dto.request.SearchRequest;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.SearchResponse;
import io.threadcast.service.SearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Search API Controller
 *
 * Provides unified search across missions, todos, comments, and projects
 * within a workspace.
 *
 * API Endpoints:
 * - GET /api/search - Search with query parameters
 * - GET /api/workspaces/{workspaceId}/search - Search within a specific workspace
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class SearchController {

    private final SearchService searchService;

    /**
     * Unified search endpoint
     *
     * @param q           Search query (required, 2-200 characters)
     * @param workspaceId Workspace ID (required)
     * @param type        Search type filter (ALL, MISSION, TODO, COMMENT, PROJECT)
     * @param missionStatus Filter by mission status
     * @param todoStatus    Filter by todo status
     * @param page        Page number (default: 0)
     * @param size        Page size (default: 20)
     * @return SearchResponse with results grouped by type
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<SearchResponse>> search(
            @RequestParam String q,
            @RequestParam UUID workspaceId,
            @RequestParam(required = false, defaultValue = "ALL") SearchType type,
            @RequestParam(required = false) MissionStatus missionStatus,
            @RequestParam(required = false) TodoStatus todoStatus,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size) {

        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_QUERY", "Search query must be at least 2 characters"));
        }

        if (q.length() > 200) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_QUERY", "Search query must not exceed 200 characters"));
        }

        SearchRequest request = new SearchRequest();
        request.setQ(q);
        request.setWorkspaceId(workspaceId);
        request.setType(type);
        request.setMissionStatus(missionStatus);
        request.setTodoStatus(todoStatus);
        request.setPage(page);
        request.setSize(Math.min(size, 100)); // Max 100 results per page

        log.debug("Search request: query='{}', workspaceId={}, type={}", q, workspaceId, type);

        SearchResponse response = searchService.search(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Search within a specific workspace (alternative endpoint)
     */
    @GetMapping("/workspaces/{workspaceId}/search")
    public ResponseEntity<ApiResponse<SearchResponse>> searchInWorkspace(
            @PathVariable UUID workspaceId,
            @RequestParam String q,
            @RequestParam(required = false, defaultValue = "ALL") SearchType type,
            @RequestParam(required = false) MissionStatus missionStatus,
            @RequestParam(required = false) TodoStatus todoStatus,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size) {

        return search(q, workspaceId, type, missionStatus, todoStatus, page, size);
    }
}
