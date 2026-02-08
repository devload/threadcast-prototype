package io.threadcast.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.Priority;
import io.threadcast.dto.request.CreateMissionRequest;
import io.threadcast.dto.request.UpdateMissionStatusRequest;
import io.threadcast.dto.response.MissionResponse;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.MissionRepository;
import io.threadcast.service.AIAnalysisService;
import io.threadcast.service.MetadataService;
import io.threadcast.service.MissionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = MissionController.class)
@AutoConfigureMockMvc(addFilters = false)
class MissionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MissionService missionService;

    @MockBean
    private MissionRepository missionRepository;

    @MockBean
    private MetadataService metadataService;

    @MockBean
    private AIAnalysisService aiAnalysisService;

    private MissionResponse createTestMissionResponse() {
        return MissionResponse.builder()
                .id(UUID.randomUUID())
                .title("Test Mission")
                .description("Description")
                .status(MissionStatus.BACKLOG)
                .priority(Priority.HIGH)
                .progress(0)
                .todoStats(MissionResponse.TodoStats.builder()
                        .total(0).pending(0).threading(0).woven(0).tangled(0).build())
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getMissions_shouldReturnPageOfMissions() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        MissionResponse mission = createTestMissionResponse();
        Page<MissionResponse> page = new PageImpl<>(List.of(mission));

        when(missionService.getMissions(eq(workspaceId), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/missions")
                        .param("workspaceId", workspaceId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].title").value("Test Mission"));
    }

    @Test
    void getMission_withValidId_shouldReturnMission() throws Exception {
        UUID missionId = UUID.randomUUID();
        MissionResponse mission = createTestMissionResponse();

        when(missionService.getMission(missionId)).thenReturn(mission);

        mockMvc.perform(get("/api/missions/{id}", missionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Mission"));
    }

    @Test
    void getMission_withInvalidId_shouldReturnNotFound() throws Exception {
        UUID missionId = UUID.randomUUID();

        when(missionService.getMission(missionId))
                .thenThrow(new NotFoundException("Mission not found: " + missionId));

        mockMvc.perform(get("/api/missions/{id}", missionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void createMission_withValidRequest_shouldReturnCreated() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        CreateMissionRequest request = new CreateMissionRequest();
        request.setWorkspaceId(workspaceId);
        request.setTitle("New Mission");
        request.setDescription("Description");
        request.setPriority(Priority.HIGH);

        MissionResponse response = createTestMissionResponse();

        when(missionService.createMission(any(CreateMissionRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/missions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Mission"));
    }

    @Test
    void createMission_withMissingTitle_shouldReturnBadRequest() throws Exception {
        CreateMissionRequest request = new CreateMissionRequest();
        request.setWorkspaceId(UUID.randomUUID());
        // Missing title

        mockMvc.perform(post("/api/missions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void updateStatus_shouldReturnUpdatedMission() throws Exception {
        UUID missionId = UUID.randomUUID();
        UpdateMissionStatusRequest request = new UpdateMissionStatusRequest();
        request.setStatus(MissionStatus.THREADING);

        MissionResponse response = createTestMissionResponse();
        response.setStatus(MissionStatus.THREADING);

        when(missionService.updateStatus(eq(missionId), eq(MissionStatus.THREADING))).thenReturn(response);

        mockMvc.perform(patch("/api/missions/{id}/status", missionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("THREADING"));
    }

    @Test
    void deleteMission_shouldReturnSuccess() throws Exception {
        UUID missionId = UUID.randomUUID();

        doNothing().when(missionService).deleteMission(missionId);

        mockMvc.perform(delete("/api/missions/{id}", missionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.deleted").value(true));
    }
}
