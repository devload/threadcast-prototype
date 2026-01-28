package io.threadcast.repository;

import io.threadcast.domain.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {

    List<Workspace> findByOwnerId(UUID ownerId);

    @Query("SELECT DISTINCT w FROM Workspace w " +
           "LEFT JOIN FETCH w.projects " +
           "WHERE w.owner.id = :ownerId")
    List<Workspace> findByOwnerIdWithProjects(@Param("ownerId") UUID ownerId);

    @Query("SELECT DISTINCT w FROM Workspace w " +
           "LEFT JOIN FETCH w.missions " +
           "WHERE w IN :workspaces")
    List<Workspace> findWithMissions(@Param("workspaces") List<Workspace> workspaces);

    @Query("SELECT DISTINCT w FROM Workspace w " +
           "LEFT JOIN FETCH w.projects " +
           "WHERE w.id = :id")
    Optional<Workspace> findByIdWithProjects(@Param("id") UUID id);

    @Query("SELECT DISTINCT w FROM Workspace w " +
           "LEFT JOIN FETCH w.missions m " +
           "LEFT JOIN FETCH m.todos " +
           "WHERE w.id = :id")
    Optional<Workspace> findByIdWithMissionsAndTodos(@Param("id") UUID id);
}
