package io.threadcast.repository;

import io.threadcast.domain.Project;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByWorkspaceId(UUID workspaceId);

    @Query("SELECT p FROM Project p WHERE p.workspace.id = :workspaceId ORDER BY p.name")
    List<Project> findByWorkspaceIdOrderByName(@Param("workspaceId") UUID workspaceId);

    @Query("SELECT p FROM Project p JOIN p.workspace w WHERE w.owner.id = :userId ORDER BY p.name")
    List<Project> findByUserId(@Param("userId") UUID userId);

    boolean existsByWorkspaceIdAndName(UUID workspaceId, String name);

    /**
     * Search projects by name, description, or path.
     * Uses FETCH JOIN to avoid N+1 queries when accessing workspace.
     */
    @Query("SELECT p FROM Project p " +
           "JOIN FETCH p.workspace w " +
           "WHERE w.id = :workspaceId " +
           "AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.path) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Project> searchByWorkspaceIdAndQuery(
            @Param("workspaceId") UUID workspaceId,
            @Param("query") String query,
            Pageable pageable);

    /**
     * Count search results.
     */
    @Query("SELECT COUNT(p) FROM Project p WHERE p.workspace.id = :workspaceId " +
           "AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.path) LIKE LOWER(CONCAT('%', :query, '%')))")
    long countSearchResults(@Param("workspaceId") UUID workspaceId, @Param("query") String query);
}
