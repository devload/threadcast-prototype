package io.threadcast.service;

import io.threadcast.domain.*;
import io.threadcast.domain.enums.Complexity;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.Priority;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.dto.response.JiraImportResultResponse;
import io.threadcast.dto.response.JiraIssueResponse;
import io.threadcast.dto.response.JiraIssueMappingResponse;
import io.threadcast.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * JIRA 동기화 서비스
 * JIRA 이슈 → ThreadCast Mission/Todo 변환
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JiraSyncService {

    private final JiraService jiraService;
    private final JiraIntegrationRepository jiraIntegrationRepository;
    private final JiraIssueMappingRepository jiraIssueMappingRepository;
    private final MissionRepository missionRepository;
    private final TodoRepository todoRepository;
    private final WorkspaceRepository workspaceRepository;

    /**
     * 단일 이슈를 Mission으로 Import
     */
    @Transactional
    public JiraImportResultResponse importIssueAsMission(UUID workspaceId, String issueKey) {
        // 이미 Import 되었는지 확인
        if (jiraIssueMappingRepository.existsByJiraIssueKey(issueKey)) {
            return JiraImportResultResponse.builder()
                    .success(false)
                    .errorMessage("Issue " + issueKey + " is already imported")
                    .build();
        }

        JiraIntegration integration = getIntegration(workspaceId);
        Workspace workspace = integration.getWorkspace();

        // JIRA 이슈 조회
        JiraIssueResponse issue = jiraService.getIssue(workspaceId, issueKey);

        // Mission 생성
        Mission mission = Mission.create(
                workspace,
                issue.getSummary(),
                issue.getDescription(),
                mapPriority(issue.getPriority())
        );

        // 예상 시간 설정 (초 → 분)
        if (issue.getTimeEstimate() != null) {
            mission.setEstimatedTime((int) (issue.getTimeEstimate() / 60));
        }

        mission = missionRepository.save(mission);

        // 매핑 생성
        JiraIssueMapping mapping = JiraIssueMapping.createForMission(
                integration,
                issue.getKey(),
                issue.getId(),
                issue.getIssueType(),
                issue.getSummary(),
                issue.getStatus(),
                issue.getWebUrl(),
                mission
        );
        mapping = jiraIssueMappingRepository.save(mapping);

        // Mission meta에 JIRA 정보 저장
        saveMissionMeta(mission, issue);

        log.info("Imported JIRA issue {} as Mission {}", issueKey, mission.getId());

        return JiraImportResultResponse.builder()
                .success(true)
                .mission(JiraImportResultResponse.MissionInfo.builder()
                        .id(mission.getId())
                        .title(mission.getTitle())
                        .status(mission.getStatus().name())
                        .build())
                .mapping(JiraIssueMappingResponse.from(mapping))
                .build();
    }

    /**
     * 단일 이슈를 Todo로 Import
     */
    @Transactional
    public JiraImportResultResponse importIssueAsTodo(UUID workspaceId, String issueKey,
                                                       UUID missionId, Integer orderIndex) {
        // 이미 Import 되었는지 확인
        if (jiraIssueMappingRepository.existsByJiraIssueKey(issueKey)) {
            return JiraImportResultResponse.builder()
                    .success(false)
                    .errorMessage("Issue " + issueKey + " is already imported")
                    .build();
        }

        JiraIntegration integration = getIntegration(workspaceId);
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new IllegalArgumentException("Mission not found: " + missionId));

        // JIRA 이슈 조회
        JiraIssueResponse issue = jiraService.getIssue(workspaceId, issueKey);

        // orderIndex 계산
        int order = orderIndex != null ? orderIndex : mission.getTodos().size();

        // Todo 생성
        Todo todo = Todo.create(
                mission,
                issue.getSummary(),
                issue.getDescription(),
                mapPriority(issue.getPriority()),
                mapComplexity(issue.getStoryPoints()),
                order,
                issue.getTimeEstimate() != null ? (int) (issue.getTimeEstimate() / 60) : null
        );

        todo = todoRepository.save(todo);

        // 매핑 생성
        JiraIssueMapping mapping = JiraIssueMapping.createForTodo(
                integration,
                issue.getKey(),
                issue.getId(),
                issue.getIssueType(),
                issue.getSummary(),
                issue.getStatus(),
                issue.getWebUrl(),
                todo
        );
        mapping = jiraIssueMappingRepository.save(mapping);

        // Todo meta에 JIRA 정보 저장
        saveTodoMeta(todo, issue);

        log.info("Imported JIRA issue {} as Todo {} in Mission {}", issueKey, todo.getId(), missionId);

        return JiraImportResultResponse.builder()
                .success(true)
                .todo(JiraImportResultResponse.TodoInfo.builder()
                        .id(todo.getId())
                        .title(todo.getTitle())
                        .status(todo.getStatus().name())
                        .jiraIssueKey(issueKey)
                        .build())
                .mapping(JiraIssueMappingResponse.from(mapping))
                .build();
    }

    /**
     * Epic을 Mission + Todos로 일괄 Import
     */
    @Transactional
    public JiraImportResultResponse importEpic(UUID workspaceId, String epicKey,
                                                boolean includeChildren, List<String> issueTypes,
                                                boolean includeCompleted) {
        JiraIntegration integration = getIntegration(workspaceId);
        Workspace workspace = integration.getWorkspace();

        // Epic 이슈 조회
        JiraIssueResponse epic = jiraService.getIssue(workspaceId, epicKey);

        // Epic 타입 확인
        if (!"Epic".equalsIgnoreCase(epic.getIssueType())) {
            return JiraImportResultResponse.builder()
                    .success(false)
                    .errorMessage(epicKey + " is not an Epic (type: " + epic.getIssueType() + ")")
                    .build();
        }

        // 이미 Import 되었는지 확인
        Optional<JiraIssueMapping> existingMapping = jiraIssueMappingRepository.findByJiraIssueKey(epicKey);
        Mission mission;
        JiraIssueMapping epicMapping;

        if (existingMapping.isPresent()) {
            // 기존 Mission 사용
            mission = existingMapping.get().getMission();
            epicMapping = existingMapping.get();
            log.info("Using existing Mission {} for Epic {}", mission.getId(), epicKey);
        } else {
            // 새 Mission 생성
            mission = Mission.create(
                    workspace,
                    epic.getSummary(),
                    epic.getDescription(),
                    mapPriority(epic.getPriority())
            );

            if (epic.getTimeEstimate() != null) {
                mission.setEstimatedTime((int) (epic.getTimeEstimate() / 60));
            }

            mission = missionRepository.save(mission);

            // Epic 매핑 생성
            epicMapping = JiraIssueMapping.createForMission(
                    integration,
                    epic.getKey(),
                    epic.getId(),
                    epic.getIssueType(),
                    epic.getSummary(),
                    epic.getStatus(),
                    epic.getWebUrl(),
                    mission
            );
            epicMapping = jiraIssueMappingRepository.save(epicMapping);

            saveMissionMeta(mission, epic);
            log.info("Created new Mission {} for Epic {}", mission.getId(), epicKey);
        }

        List<JiraImportResultResponse.TodoInfo> importedTodos = new ArrayList<>();
        List<JiraIssueMappingResponse> mappings = new ArrayList<>();
        mappings.add(JiraIssueMappingResponse.from(epicMapping));

        int skippedCount = 0;

        // 하위 이슈 Import
        if (includeChildren) {
            List<JiraIssueResponse> children = jiraService.getEpicChildren(
                    workspaceId, epicKey, issueTypes, includeCompleted
            );

            int orderIndex = mission.getTodos().size();

            for (JiraIssueResponse child : children) {
                // 이미 Import 되었는지 확인
                if (jiraIssueMappingRepository.existsByJiraIssueKey(child.getKey())) {
                    skippedCount++;
                    continue;
                }

                Todo todo = Todo.create(
                        mission,
                        child.getSummary(),
                        child.getDescription(),
                        mapPriority(child.getPriority()),
                        mapComplexity(child.getStoryPoints()),
                        orderIndex++,
                        child.getTimeEstimate() != null ? (int) (child.getTimeEstimate() / 60) : null
                );

                todo = todoRepository.save(todo);

                JiraIssueMapping todoMapping = JiraIssueMapping.createForTodo(
                        integration,
                        child.getKey(),
                        child.getId(),
                        child.getIssueType(),
                        child.getSummary(),
                        child.getStatus(),
                        child.getWebUrl(),
                        todo
                );
                todoMapping = jiraIssueMappingRepository.save(todoMapping);

                saveTodoMeta(todo, child);

                importedTodos.add(JiraImportResultResponse.TodoInfo.builder()
                        .id(todo.getId())
                        .title(todo.getTitle())
                        .status(todo.getStatus().name())
                        .jiraIssueKey(child.getKey())
                        .build());
                mappings.add(JiraIssueMappingResponse.from(todoMapping));
            }
        }

        log.info("Imported Epic {} with {} todos (skipped {})", epicKey, importedTodos.size(), skippedCount);

        return JiraImportResultResponse.builder()
                .success(true)
                .mission(JiraImportResultResponse.MissionInfo.builder()
                        .id(mission.getId())
                        .title(mission.getTitle())
                        .status(mission.getStatus().name())
                        .build())
                .todos(importedTodos)
                .mappings(mappings)
                .skippedCount(skippedCount)
                .build();
    }

    /**
     * 매핑 목록 조회
     */
    public List<JiraIssueMappingResponse> getMappings(UUID workspaceId) {
        JiraIntegration integration = getIntegration(workspaceId);
        return jiraIssueMappingRepository.findByIntegrationId(integration.getId())
                .stream()
                .map(JiraIssueMappingResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 매핑 삭제 (Unlink)
     */
    @Transactional
    public void unlinkMapping(UUID mappingId) {
        jiraIssueMappingRepository.deleteById(mappingId);
        log.info("Unlinked JIRA mapping: {}", mappingId);
    }

    // ==================== Private Methods ====================

    private JiraIntegration getIntegration(UUID workspaceId) {
        return jiraIntegrationRepository.findByWorkspaceId(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("JIRA integration not found for workspace: " + workspaceId));
    }

    private Priority mapPriority(String jiraPriority) {
        if (jiraPriority == null) return Priority.MEDIUM;

        switch (jiraPriority.toLowerCase()) {
            case "highest":
                return Priority.CRITICAL;
            case "high":
                return Priority.HIGH;
            case "low":
            case "lowest":
                return Priority.LOW;
            default:
                return Priority.MEDIUM;
        }
    }

    private Complexity mapComplexity(Double storyPoints) {
        if (storyPoints == null) return Complexity.MEDIUM;

        if (storyPoints <= 2) return Complexity.LOW;
        if (storyPoints <= 5) return Complexity.MEDIUM;
        return Complexity.HIGH;
    }

    private void saveMissionMeta(Mission mission, JiraIssueResponse issue) {
        Map<String, Object> meta = new HashMap<>();
        Map<String, Object> jira = new HashMap<>();

        jira.put("issueKey", issue.getKey());
        jira.put("issueId", issue.getId());
        jira.put("issueType", issue.getIssueType());
        jira.put("status", issue.getStatus());
        jira.put("url", issue.getWebUrl());
        jira.put("labels", issue.getLabels());
        jira.put("components", issue.getComponents());

        meta.put("jira", jira);

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mission.setMeta(mapper.writeValueAsString(meta));
            missionRepository.save(mission);
        } catch (Exception e) {
            log.warn("Failed to save mission meta: {}", e.getMessage());
        }
    }

    private void saveTodoMeta(Todo todo, JiraIssueResponse issue) {
        Map<String, Object> meta = new HashMap<>();
        Map<String, Object> jira = new HashMap<>();

        jira.put("issueKey", issue.getKey());
        jira.put("issueId", issue.getId());
        jira.put("issueType", issue.getIssueType());
        jira.put("status", issue.getStatus());
        jira.put("url", issue.getWebUrl());
        jira.put("labels", issue.getLabels());
        jira.put("components", issue.getComponents());
        jira.put("storyPoints", issue.getStoryPoints());

        meta.put("jira", jira);

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            todo.setMeta(mapper.writeValueAsString(meta));
            todoRepository.save(todo);
        } catch (Exception e) {
            log.warn("Failed to save todo meta: {}", e.getMessage());
        }
    }
}
