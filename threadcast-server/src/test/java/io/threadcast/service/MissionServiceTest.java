package io.threadcast.service;

import io.threadcast.domain.Mission;
import io.threadcast.domain.User;
import io.threadcast.domain.Workspace;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.Priority;
import io.threadcast.dto.request.CreateMissionRequest;
import io.threadcast.dto.response.MissionResponse;
import io.threadcast.exception.BadRequestException;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.AIQuestionRepository;
import io.threadcast.repository.MissionRepository;
import io.threadcast.repository.TimelineEventRepository;
import io.threadcast.repository.TodoRepository;
import io.threadcast.repository.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MissionServiceTest {

    @Mock
    private MissionRepository missionRepository;

    @Mock
    private WorkspaceRepository workspaceRepository;

    @Mock
    private TodoRepository todoRepository;

    @Mock
    private TimelineEventRepository timelineEventRepository;

    @Mock
    private AIQuestionRepository aiQuestionRepository;

    @Mock
    private TimelineService timelineService;

    @Mock
    private WebSocketService webSocketService;

    @Mock
    private GitWorktreeService worktreeService;

    @InjectMocks
    private MissionService missionService;

    private User testUser;
    private Workspace testWorkspace;
    private Mission testMission;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .passwordHash("hash")
                .name("Test User")
                .build();

        testWorkspace = Workspace.builder()
                .id(UUID.randomUUID())
                .name("Test Workspace")
                .owner(testUser)
                .build();

        testMission = Mission.builder()
                .id(UUID.randomUUID())
                .workspace(testWorkspace)
                .title("Test Mission")
                .description("Description")
                .status(MissionStatus.BACKLOG)
                .priority(Priority.HIGH)
                .progress(0)
                .build();
    }

    @Test
    void getMissions_shouldReturnPageOfMissions() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Mission> missionPage = new PageImpl<>(List.of(testMission));

        when(missionRepository.findByWorkspaceId(testWorkspace.getId(), pageable)).thenReturn(missionPage);

        Page<MissionResponse> result = missionService.getMissions(testWorkspace.getId(), null, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Test Mission");
    }

    @Test
    void getMissions_withStatusFilter_shouldReturnFilteredMissions() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Mission> missionPage = new PageImpl<>(List.of(testMission));

        when(missionRepository.findByWorkspaceIdAndStatus(testWorkspace.getId(), MissionStatus.BACKLOG, pageable))
                .thenReturn(missionPage);

        Page<MissionResponse> result = missionService.getMissions(testWorkspace.getId(), MissionStatus.BACKLOG, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(missionRepository).findByWorkspaceIdAndStatus(testWorkspace.getId(), MissionStatus.BACKLOG, pageable);
    }

    @Test
    void getMission_withValidId_shouldReturnMission() {
        when(missionRepository.findByIdWithTodos(testMission.getId())).thenReturn(testMission);

        MissionResponse result = missionService.getMission(testMission.getId());

        assertThat(result.getTitle()).isEqualTo("Test Mission");
        assertThat(result.getStatus()).isEqualTo(MissionStatus.BACKLOG);
    }

    @Test
    void getMission_withInvalidId_shouldThrowNotFoundException() {
        UUID invalidId = UUID.randomUUID();
        when(missionRepository.findByIdWithTodos(invalidId)).thenReturn(null);

        assertThatThrownBy(() -> missionService.getMission(invalidId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Mission not found");
    }

    @Test
    void createMission_shouldCreateAndReturnMission() {
        CreateMissionRequest request = new CreateMissionRequest();
        request.setWorkspaceId(testWorkspace.getId());
        request.setTitle("New Mission");
        request.setDescription("New Description");
        request.setPriority(Priority.HIGH);

        when(workspaceRepository.findById(testWorkspace.getId())).thenReturn(Optional.of(testWorkspace));
        when(missionRepository.save(any(Mission.class))).thenAnswer(invocation -> {
            Mission mission = invocation.getArgument(0);
            mission.setId(UUID.randomUUID());
            return mission;
        });

        MissionResponse result = missionService.createMission(request);

        assertThat(result.getTitle()).isEqualTo("New Mission");
        assertThat(result.getStatus()).isEqualTo(MissionStatus.BACKLOG);
        verify(timelineService).recordMissionCreated(any(Mission.class));
        verify(webSocketService).notifyMissionCreated(eq(testWorkspace.getId()), any(Mission.class));
    }

    @Test
    void createMission_withInvalidWorkspace_shouldThrowNotFoundException() {
        CreateMissionRequest request = new CreateMissionRequest();
        request.setWorkspaceId(UUID.randomUUID());
        request.setTitle("New Mission");

        when(workspaceRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> missionService.createMission(request))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Workspace not found");
    }

    @Test
    void updateStatus_toThreading_shouldStartMission() {
        when(missionRepository.findById(testMission.getId())).thenReturn(Optional.of(testMission));
        when(missionRepository.save(any(Mission.class))).thenReturn(testMission);
        when(worktreeService.createMissionBranch(any(Mission.class)))
                .thenReturn(CompletableFuture.completedFuture(null));

        MissionResponse result = missionService.updateStatus(testMission.getId(), MissionStatus.THREADING);

        assertThat(result.getStatus()).isEqualTo(MissionStatus.THREADING);
        verify(timelineService).recordMissionStarted(testMission);
    }

    @Test
    void updateStatus_toThreading_fromNonBacklog_shouldThrowException() {
        testMission.setStatus(MissionStatus.THREADING);
        when(missionRepository.findById(testMission.getId())).thenReturn(Optional.of(testMission));

        assertThatThrownBy(() -> missionService.updateStatus(testMission.getId(), MissionStatus.THREADING))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("can only start threading from BACKLOG");
    }

    @Test
    void updateStatus_toWoven_shouldCompleteMission() {
        testMission.setStatus(MissionStatus.THREADING);
        when(missionRepository.findById(testMission.getId())).thenReturn(Optional.of(testMission));
        when(missionRepository.save(any(Mission.class))).thenReturn(testMission);

        MissionResponse result = missionService.updateStatus(testMission.getId(), MissionStatus.WOVEN);

        assertThat(result.getStatus()).isEqualTo(MissionStatus.WOVEN);
        verify(timelineService).recordMissionCompleted(testMission);
    }

    @Test
    void deleteMission_shouldDeleteAndNotify() {
        when(missionRepository.findByIdWithTodos(testMission.getId())).thenReturn(testMission);
        doNothing().when(missionRepository).delete(testMission);

        missionService.deleteMission(testMission.getId());

        verify(missionRepository).delete(testMission);
        verify(webSocketService).notifyMissionDeleted(testWorkspace.getId(), testMission.getId());
    }
}
