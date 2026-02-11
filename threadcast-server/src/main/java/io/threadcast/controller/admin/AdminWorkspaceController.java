package io.threadcast.controller.admin;

import io.threadcast.domain.Workspace;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.admin.AdminWorkspaceResponse;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/workspaces")
@RequiredArgsConstructor
public class AdminWorkspaceController {

    private final WorkspaceRepository workspaceRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWorkspaces(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        Page<Workspace> workspacePage = workspaceRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<AdminWorkspaceResponse> workspaces = workspacePage.getContent().stream()
                .filter(w -> search == null || search.isEmpty()
                        || w.getName().toLowerCase().contains(search.toLowerCase()))
                .map(AdminWorkspaceResponse::from)
                .collect(Collectors.toList());

        Map<String, Object> response = Map.of(
                "content", workspaces,
                "totalElements", workspacePage.getTotalElements(),
                "totalPages", workspacePage.getTotalPages(),
                "page", page,
                "size", size
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<AdminWorkspaceResponse>> getWorkspace(@PathVariable UUID id) {
        Workspace workspace = workspaceRepository.findByIdWithMissionsAndTodos(id)
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + id));
        return ResponseEntity.ok(ApiResponse.success(AdminWorkspaceResponse.from(workspace)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteWorkspace(@PathVariable UUID id) {
        if (!workspaceRepository.existsById(id)) {
            throw new NotFoundException("Workspace not found: " + id);
        }
        workspaceRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
