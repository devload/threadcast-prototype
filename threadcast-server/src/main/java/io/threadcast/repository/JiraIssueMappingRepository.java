package io.threadcast.repository;

import io.threadcast.domain.JiraIssueMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JiraIssueMappingRepository extends JpaRepository<JiraIssueMapping, UUID> {

    /**
     * JIRA 이슈 키로 매핑 조회
     */
    Optional<JiraIssueMapping> findByJiraIssueKey(String jiraIssueKey);

    /**
     * Integration ID와 JIRA 이슈 키로 매핑 조회
     */
    Optional<JiraIssueMapping> findByIntegrationIdAndJiraIssueKey(UUID integrationId, String jiraIssueKey);

    /**
     * Mission ID로 매핑 조회
     */
    Optional<JiraIssueMapping> findByMissionId(UUID missionId);

    /**
     * Todo ID로 매핑 조회
     */
    Optional<JiraIssueMapping> findByTodoId(UUID todoId);

    /**
     * Integration ID로 모든 매핑 조회
     */
    List<JiraIssueMapping> findByIntegrationId(UUID integrationId);

    /**
     * Integration ID로 Mission 매핑만 조회
     */
    @Query("SELECT jm FROM JiraIssueMapping jm " +
           "WHERE jm.integration.id = :integrationId " +
           "AND jm.entityType = 'MISSION'")
    List<JiraIssueMapping> findMissionMappingsByIntegrationId(@Param("integrationId") UUID integrationId);

    /**
     * Integration ID로 Todo 매핑만 조회
     */
    @Query("SELECT jm FROM JiraIssueMapping jm " +
           "WHERE jm.integration.id = :integrationId " +
           "AND jm.entityType = 'TODO'")
    List<JiraIssueMapping> findTodoMappingsByIntegrationId(@Param("integrationId") UUID integrationId);

    /**
     * Mission과 관련 매핑 함께 조회
     */
    @Query("SELECT jm FROM JiraIssueMapping jm " +
           "LEFT JOIN FETCH jm.mission " +
           "WHERE jm.id = :id")
    Optional<JiraIssueMapping> findByIdWithMission(@Param("id") UUID id);

    /**
     * Todo와 관련 매핑 함께 조회
     */
    @Query("SELECT jm FROM JiraIssueMapping jm " +
           "LEFT JOIN FETCH jm.todo " +
           "WHERE jm.id = :id")
    Optional<JiraIssueMapping> findByIdWithTodo(@Param("id") UUID id);

    /**
     * Integration ID로 매핑 존재 여부 확인
     */
    boolean existsByIntegrationId(UUID integrationId);

    /**
     * JIRA 이슈 키로 매핑 존재 여부 확인
     */
    boolean existsByJiraIssueKey(String jiraIssueKey);

    /**
     * Integration ID로 모든 매핑 삭제
     */
    void deleteByIntegrationId(UUID integrationId);

    /**
     * Mission ID로 매핑 삭제
     */
    void deleteByMissionId(UUID missionId);

    /**
     * Todo ID로 매핑 삭제
     */
    void deleteByTodoId(UUID todoId);
}
