package io.threadcast.repository;

import io.threadcast.domain.Todo;
import io.threadcast.domain.enums.TodoStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TodoRepository extends JpaRepository<Todo, UUID> {

    List<Todo> findByMissionIdOrderByOrderIndexAsc(UUID missionId);

    @Query("SELECT t FROM Todo t LEFT JOIN FETCH t.steps WHERE t.mission.id = :missionId AND t.status = :status ORDER BY t.orderIndex")
    List<Todo> findByMissionIdAndStatus(@Param("missionId") UUID missionId, @Param("status") TodoStatus status);

    @Query("SELECT t FROM Todo t LEFT JOIN FETCH t.steps WHERE t.id = :id")
    Optional<Todo> findByIdWithSteps(@Param("id") UUID id);

    @Query("SELECT t FROM Todo t LEFT JOIN FETCH t.steps LEFT JOIN FETCH t.dependencies WHERE t.id = :id")
    Optional<Todo> findByIdWithStepsAndDependencies(@Param("id") UUID id);

    @Query("SELECT t FROM Todo t LEFT JOIN FETCH t.steps WHERE t.mission.id = :missionId ORDER BY t.orderIndex")
    List<Todo> findByMissionIdWithSteps(@Param("missionId") UUID missionId);

    long countByMissionIdAndStatus(UUID missionId, TodoStatus status);

    @Query("SELECT MAX(t.orderIndex) FROM Todo t WHERE t.mission.id = :missionId")
    Integer findMaxOrderIndexByMissionId(@Param("missionId") UUID missionId);

    /**
     * Find all todos by status (for Hub to query pending/active todos).
     */
    @Query("SELECT DISTINCT t FROM Todo t LEFT JOIN FETCH t.mission LEFT JOIN FETCH t.steps LEFT JOIN FETCH t.dependencies WHERE t.status = :status ORDER BY t.createdAt")
    List<Todo> findByStatus(@Param("status") TodoStatus status);

    /**
     * Find todos by project ID with steps.
     */
    @Query("SELECT DISTINCT t FROM Todo t LEFT JOIN FETCH t.steps WHERE t.project.id = :projectId ORDER BY t.orderIndex")
    List<Todo> findByProjectIdWithSteps(@Param("projectId") UUID projectId);

    /**
     * Find todos by project ID and status.
     */
    @Query("SELECT t FROM Todo t LEFT JOIN FETCH t.steps WHERE t.project.id = :projectId AND t.status = :status ORDER BY t.orderIndex")
    List<Todo> findByProjectIdAndStatus(@Param("projectId") UUID projectId, @Param("status") TodoStatus status);

    /**
     * Count todos by project ID and status.
     */
    long countByProjectIdAndStatus(UUID projectId, TodoStatus status);

    /**
     * Count total todos by project ID.
     */
    long countByProjectId(UUID projectId);

    /**
     * Find todo by ID with mission and workspace (for weaving operations).
     */
    @Query("SELECT t FROM Todo t " +
           "LEFT JOIN FETCH t.mission m " +
           "LEFT JOIN FETCH m.workspace " +
           "LEFT JOIN FETCH t.steps " +
           "WHERE t.id = :id")
    Optional<Todo> findByIdWithMissionAndWorkspace(@Param("id") UUID id);

    /**
     * Search todos by title or description within a workspace.
     * Uses FETCH JOIN to avoid N+1 queries when accessing mission.
     */
    @Query("SELECT t FROM Todo t " +
           "JOIN FETCH t.mission m " +
           "JOIN m.workspace w " +
           "WHERE w.id = :workspaceId " +
           "AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Todo> searchByWorkspaceIdAndQuery(
            @Param("workspaceId") UUID workspaceId,
            @Param("query") String query,
            Pageable pageable);

    /**
     * Search todos with status filter.
     * Uses FETCH JOIN to avoid N+1 queries when accessing mission.
     */
    @Query("SELECT t FROM Todo t " +
           "JOIN FETCH t.mission m " +
           "JOIN m.workspace w " +
           "WHERE w.id = :workspaceId " +
           "AND t.status = :status " +
           "AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Todo> searchByWorkspaceIdAndQueryAndStatus(
            @Param("workspaceId") UUID workspaceId,
            @Param("query") String query,
            @Param("status") TodoStatus status,
            Pageable pageable);

    /**
     * Count search results.
     */
    @Query("SELECT COUNT(t) FROM Todo t JOIN t.mission m WHERE m.workspace.id = :workspaceId " +
           "AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    long countSearchResults(@Param("workspaceId") UUID workspaceId, @Param("query") String query);

    /**
     * Find all todos that depend on a given todo.
     * These are the "dependents" - todos that cannot start until this todo is complete.
     */
    @Query("SELECT DISTINCT t FROM Todo t " +
           "LEFT JOIN FETCH t.steps " +
           "LEFT JOIN FETCH t.dependencies " +
           "WHERE :todo MEMBER OF t.dependencies")
    List<Todo> findDependents(@Param("todo") Todo todo);

    /**
     * Find all todos in a mission that are ready to start.
     * A todo is ready if it's PENDING and all its dependencies are WOVEN.
     */
    @Query("SELECT DISTINCT t FROM Todo t " +
           "LEFT JOIN FETCH t.steps " +
           "LEFT JOIN FETCH t.dependencies " +
           "WHERE t.mission.id = :missionId " +
           "AND t.status = 'PENDING' " +
           "AND NOT EXISTS (SELECT d FROM t.dependencies d WHERE d.status <> 'WOVEN')")
    List<Todo> findReadyToStart(@Param("missionId") UUID missionId);

    /**
     * Find todo by ID with all dependencies loaded for cycle detection.
     */
    @Query("SELECT t FROM Todo t " +
           "LEFT JOIN FETCH t.dependencies d " +
           "LEFT JOIN FETCH d.dependencies " +
           "WHERE t.id = :id")
    Optional<Todo> findByIdWithDependencyGraph(@Param("id") UUID id);

    /**
     * Atomically start a todo if it's currently PENDING.
     * This prevents race conditions where multiple threads try to start the same todo.
     * Returns 1 if the update was successful (todo was PENDING), 0 otherwise.
     */
    @Modifying
    @Query("UPDATE Todo t SET t.status = 'THREADING', t.startedAt = CURRENT_TIMESTAMP " +
           "WHERE t.id = :id AND t.status = 'PENDING'")
    int atomicStartTodo(@Param("id") UUID id);
}
