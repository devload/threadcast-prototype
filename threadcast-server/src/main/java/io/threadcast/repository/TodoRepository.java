package io.threadcast.repository;

import io.threadcast.domain.Todo;
import io.threadcast.domain.enums.TodoStatus;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
