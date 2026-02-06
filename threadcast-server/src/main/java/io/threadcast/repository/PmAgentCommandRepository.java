package io.threadcast.repository;

import io.threadcast.domain.PmAgentCommand;
import io.threadcast.domain.enums.CommandStatus;
import io.threadcast.domain.enums.CommandType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PmAgentCommandRepository extends JpaRepository<PmAgentCommand, UUID> {

    Page<PmAgentCommand> findByWorkspaceId(UUID workspaceId, Pageable pageable);

    @Query("SELECT c FROM PmAgentCommand c " +
           "WHERE c.workspace.id = :workspaceId " +
           "AND c.status = :status " +
           "ORDER BY c.createdAt ASC")
    List<PmAgentCommand> findByWorkspaceIdAndStatus(
            @Param("workspaceId") UUID workspaceId,
            @Param("status") CommandStatus status);

    @Query("SELECT c FROM PmAgentCommand c " +
           "WHERE c.workspace.id = :workspaceId " +
           "AND c.status IN :statuses " +
           "ORDER BY c.createdAt ASC")
    List<PmAgentCommand> findByWorkspaceIdAndStatusIn(
            @Param("workspaceId") UUID workspaceId,
            @Param("statuses") List<CommandStatus> statuses);

    long countByWorkspaceIdAndStatus(UUID workspaceId, CommandStatus status);

    @Query("SELECT c FROM PmAgentCommand c " +
           "WHERE c.workspace.id = :workspaceId " +
           "AND c.type = :type " +
           "AND c.status = :status")
    List<PmAgentCommand> findByWorkspaceIdAndTypeAndStatus(
            @Param("workspaceId") UUID workspaceId,
            @Param("type") CommandType type,
            @Param("status") CommandStatus status);
}
