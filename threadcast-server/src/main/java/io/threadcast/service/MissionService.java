package io.threadcast.service;

import io.threadcast.domain.Mission;
import io.threadcast.domain.Todo;
import io.threadcast.domain.Workspace;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.dto.request.CreateMissionRequest;
import io.threadcast.dto.request.StartWeavingRequest;
import io.threadcast.dto.response.MissionResponse;
import io.threadcast.exception.BadRequestException;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.AIQuestionRepository;
import io.threadcast.repository.MissionRepository;
import io.threadcast.repository.TimelineEventRepository;
import io.threadcast.repository.TodoRepository;
import io.threadcast.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MissionService {

    private final MissionRepository missionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final TodoRepository todoRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final AIQuestionRepository aiQuestionRepository;
    private final TimelineService timelineService;
    private final WebSocketService webSocketService;
    private final GitWorktreeService worktreeService;

    @Transactional(readOnly = true)
    public Page<MissionResponse> getMissions(UUID workspaceId, MissionStatus status, Pageable pageable) {
        Page<Mission> missions;
        if (status != null) {
            missions = missionRepository.findByWorkspaceIdAndStatus(workspaceId, status, pageable);
        } else {
            missions = missionRepository.findByWorkspaceId(workspaceId, pageable);
        }
        return missions.map(MissionResponse::from);
    }

    @Transactional(readOnly = true)
    public MissionResponse getMission(UUID id) {
        Mission mission = missionRepository.findByIdWithTodos(id);
        if (mission == null) {
            throw new NotFoundException("Mission not found: " + id);
        }
        return MissionResponse.from(mission, true);
    }

    @Transactional
    public MissionResponse createMission(CreateMissionRequest request) {
        Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                .orElseThrow(() -> new NotFoundException("Workspace not found: " + request.getWorkspaceId()));

        Mission mission = Mission.create(
                workspace,
                request.getTitle(),
                request.getDescription(),
                request.getPriority()
        );

        // JIRA 연동 정보 설정
        if (request.getJiraIssueKey() != null) {
            mission.setJiraIssueKey(request.getJiraIssueKey());
            mission.setJiraIssueUrl(request.getJiraIssueUrl());
        }

        mission = missionRepository.save(mission);

        // Record timeline event
        timelineService.recordMissionCreated(mission);

        // Notify via WebSocket
        webSocketService.notifyMissionCreated(workspace.getId(), mission);

        return MissionResponse.from(mission);
    }

    @Transactional
    public MissionResponse updateStatus(UUID id, MissionStatus status) {
        Mission mission = missionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Mission not found: " + id));

        MissionStatus previousStatus = mission.getStatus();

        switch (status) {
            case THREADING -> {
                if (mission.getStatus() != MissionStatus.BACKLOG) {
                    throw new BadRequestException("Mission can only start threading from BACKLOG status");
                }
                mission.startThreading();
                timelineService.recordMissionStarted(mission);
                // Create mission branch for git worktree
                worktreeService.createMissionBranch(mission)
                    .exceptionally(e -> {
                        // Log but don't fail - branch creation is optional
                        return null;
                    });
            }
            case WOVEN -> {
                mission.complete();
                timelineService.recordMissionCompleted(mission);
            }
            case DROPPED -> {
                mission.drop();
                timelineService.recordMissionDropped(mission);
            }
            case ARCHIVED -> {
                mission.archive();
            }
            default -> mission.setStatus(status);
        }

        mission = missionRepository.save(mission);

        // Notify via WebSocket
        webSocketService.notifyMissionStatusChanged(mission.getWorkspace().getId(), mission, previousStatus);

        return MissionResponse.from(mission);
    }

    @Transactional
    public void startWeaving(UUID missionId, StartWeavingRequest request) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new NotFoundException("Mission not found: " + missionId));

        if (mission.getStatus() != MissionStatus.BACKLOG) {
            throw new BadRequestException("Mission is not in BACKLOG status");
        }

        // Create todos from proposals
        Map<Integer, Todo> todoMap = new HashMap<>();
        int order = 0;
        for (StartWeavingRequest.TodoProposal proposal : request.getTodos()) {
            int orderIndex = proposal.getOrderIndex() != null ? proposal.getOrderIndex() : order++;

            Todo todo = Todo.create(
                    mission,
                    proposal.getTitle(),
                    proposal.getDescription(),
                    proposal.getPriority(),
                    proposal.getComplexity(),
                    orderIndex,
                    proposal.getEstimatedTime()
            );

            mission.addTodo(todo);
            todoMap.put(orderIndex, todo);
        }

        // Set dependencies
        int idx = 0;
        for (StartWeavingRequest.TodoProposal proposal : request.getTodos()) {
            if (proposal.getDependencies() != null && !proposal.getDependencies().isEmpty()) {
                Todo todo = todoMap.get(proposal.getOrderIndex() != null ? proposal.getOrderIndex() : idx);
                for (UUID depId : proposal.getDependencies()) {
                    // Find by orderIndex (assuming dependencies refer to orderIndex)
                    todoMap.values().stream()
                            .filter(t -> t.getOrderIndex().equals(depId.hashCode() % 100)) // Simplified
                            .findFirst()
                            .ifPresent(todo::addDependency);
                }
            }
            idx++;
        }

        // Calculate estimated time
        int totalEstimatedTime = mission.getTodos().stream()
                .mapToInt(t -> t.getEstimatedTime() != null ? t.getEstimatedTime() : 0)
                .sum();
        mission.setEstimatedTime(totalEstimatedTime);

        // Start threading
        mission.startThreading();

        missionRepository.save(mission);

        // Create mission branch for git worktree
        worktreeService.createMissionBranch(mission)
            .exceptionally(e -> {
                // Log but don't fail - branch creation is optional
                return null;
            });

        // Record events
        timelineService.recordMissionStarted(mission);
        for (Todo todo : mission.getTodos()) {
            timelineService.recordTodoCreated(todo);
        }

        // Notify via WebSocket
        webSocketService.notifyMissionStatusChanged(mission.getWorkspace().getId(), mission, MissionStatus.BACKLOG);
    }

    @Transactional
    public void deleteMission(UUID id) {
        Mission mission = missionRepository.findByIdWithTodos(id);
        if (mission == null) {
            throw new NotFoundException("Mission not found: " + id);
        }

        UUID workspaceId = mission.getWorkspace().getId();

        // Delete related data for all todos in this mission first
        for (Todo todo : mission.getTodos()) {
            aiQuestionRepository.deleteByTodoId(todo.getId());
            timelineEventRepository.deleteByTodoId(todo.getId());
        }

        // Delete timeline events for the mission itself
        timelineEventRepository.deleteByMissionId(id);

        // Now delete the mission (cascades to todos due to CascadeType.ALL)
        missionRepository.delete(mission);

        webSocketService.notifyMissionDeleted(workspaceId, id);
    }
}
