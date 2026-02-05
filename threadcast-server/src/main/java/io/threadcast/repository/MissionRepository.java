package io.threadcast.repository;

import io.threadcast.domain.Mission;
import io.threadcast.domain.enums.MissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MissionRepository extends JpaRepository<Mission, UUID> {

    Page<Mission> findByWorkspaceId(UUID workspaceId, Pageable pageable);

    Page<Mission> findByWorkspaceIdAndStatus(UUID workspaceId, MissionStatus status, Pageable pageable);

    List<Mission> findByWorkspaceIdAndStatusIn(UUID workspaceId, List<MissionStatus> statuses);

    @Query("SELECT m FROM Mission m LEFT JOIN FETCH m.todos WHERE m.id = :id")
    Mission findByIdWithTodos(@Param("id") UUID id);

    long countByWorkspaceIdAndStatus(UUID workspaceId, MissionStatus status);

    /**
     * Find mission by ID with Workspace for effective meta calculation.
     */
    @Query("SELECT m FROM Mission m JOIN FETCH m.workspace WHERE m.id = :id")
    Optional<Mission> findByIdWithWorkspace(@Param("id") UUID id);

    /**
     * Search missions by title or description containing the query.
     * Uses FETCH JOIN to avoid N+1 queries when accessing workspace.
     */
    @Query("SELECT m FROM Mission m " +
           "JOIN FETCH m.workspace w " +
           "WHERE w.id = :workspaceId " +
           "AND (LOWER(m.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Mission> searchByWorkspaceIdAndQuery(
            @Param("workspaceId") UUID workspaceId,
            @Param("query") String query,
            Pageable pageable);

    /**
     * Search missions with status filter.
     * Uses FETCH JOIN to avoid N+1 queries when accessing workspace.
     */
    @Query("SELECT m FROM Mission m " +
           "JOIN FETCH m.workspace w " +
           "WHERE w.id = :workspaceId " +
           "AND m.status = :status " +
           "AND (LOWER(m.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Mission> searchByWorkspaceIdAndQueryAndStatus(
            @Param("workspaceId") UUID workspaceId,
            @Param("query") String query,
            @Param("status") MissionStatus status,
            Pageable pageable);

    /**
     * Count search results.
     */
    @Query("SELECT COUNT(m) FROM Mission m WHERE m.workspace.id = :workspaceId " +
           "AND (LOWER(m.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    long countSearchResults(@Param("workspaceId") UUID workspaceId, @Param("query") String query);
}
