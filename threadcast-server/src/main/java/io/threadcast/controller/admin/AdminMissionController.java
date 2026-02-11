package io.threadcast.controller.admin;

import io.threadcast.domain.Mission;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.dto.response.ApiResponse;
import io.threadcast.dto.response.admin.AdminMissionResponse;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/missions")
@RequiredArgsConstructor
public class AdminMissionController {

    private final MissionRepository missionRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMissions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        Page<Mission> missionPage = missionRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<AdminMissionResponse> missions = missionPage.getContent().stream()
                .filter(m -> status == null || status.isEmpty() || status.equals("All")
                        || m.getStatus().name().equals(status))
                .filter(m -> search == null || search.isEmpty()
                        || m.getTitle().toLowerCase().contains(search.toLowerCase()))
                .map(AdminMissionResponse::from)
                .collect(Collectors.toList());

        Map<String, Object> response = Map.of(
                "content", missions,
                "totalElements", missionPage.getTotalElements(),
                "totalPages", missionPage.getTotalPages(),
                "page", page,
                "size", size
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<AdminMissionResponse>> getMission(@PathVariable java.util.UUID id) {
        Mission mission = missionRepository.findByIdWithTodos(id);
        if (mission == null) {
            throw new NotFoundException("Mission not found: " + id);
        }
        return ResponseEntity.ok(ApiResponse.success(AdminMissionResponse.from(mission)));
    }
}
