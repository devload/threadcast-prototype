package io.threadcast.repository;

import io.threadcast.domain.JiraIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface JiraIntegrationRepository extends JpaRepository<JiraIntegration, UUID> {

    /**
     * Workspace ID로 JIRA 연동 조회 (Workspace 함께 로드)
     */
    @Query("SELECT ji FROM JiraIntegration ji " +
           "JOIN FETCH ji.workspace w " +
           "WHERE w.id = :workspaceId")
    Optional<JiraIntegration> findByWorkspaceId(@Param("workspaceId") UUID workspaceId);

    /**
     * Workspace ID로 JIRA 연동 존재 여부 확인
     */
    boolean existsByWorkspaceId(UUID workspaceId);

    /**
     * Workspace와 함께 JIRA 연동 조회
     */
    @Query("SELECT ji FROM JiraIntegration ji " +
           "JOIN FETCH ji.workspace " +
           "WHERE ji.id = :id")
    Optional<JiraIntegration> findByIdWithWorkspace(@Param("id") UUID id);

    /**
     * 동기화 활성화된 JIRA 연동 목록 조회
     */
    @Query("SELECT ji FROM JiraIntegration ji " +
           "WHERE ji.syncEnabled = true")
    java.util.List<JiraIntegration> findAllSyncEnabled();

    /**
     * Workspace ID로 JIRA 연동 삭제
     */
    void deleteByWorkspaceId(UUID workspaceId);
}
