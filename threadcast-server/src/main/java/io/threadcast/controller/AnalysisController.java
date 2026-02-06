package io.threadcast.controller;

import io.threadcast.dto.request.CreateAnalysisRequest;
import io.threadcast.dto.response.AnalysisRequestResponse;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.service.AnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    /**
     * 분석 요청을 생성하고 PM Agent 명령 큐에 추가
     */
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<AnalysisRequestResponse>> createAnalysisRequest(
            @Valid @RequestBody CreateAnalysisRequest request) {
        AnalysisRequestResponse response = analysisService.createAnalysisRequest(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    /**
     * 분석 요청 상태 조회
     */
    @GetMapping("/request/{requestId}")
    public ResponseEntity<ApiResponse<AnalysisRequestResponse>> getAnalysisRequest(
            @PathVariable UUID requestId) {
        AnalysisRequestResponse response = analysisService.getAnalysisRequest(requestId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 워크스페이스의 최근 분석 요청 목록 조회
     */
    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<List<AnalysisRequestResponse>>> getRecentAnalysisRequests(
            @RequestParam UUID workspaceId,
            @RequestParam(defaultValue = "10") int limit) {
        List<AnalysisRequestResponse> responses = analysisService.getRecentAnalysisRequests(workspaceId, limit);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
