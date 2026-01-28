package io.threadcast.repository;

import io.threadcast.domain.TerminalSessionMapping;
import io.threadcast.domain.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TerminalSessionMappingRepository extends JpaRepository<TerminalSessionMapping, UUID> {

    /**
     * Find mapping by Todo ID.
     */
    Optional<TerminalSessionMapping> findByTodoId(UUID todoId);

    /**
     * Find mapping by tmux session name.
     */
    Optional<TerminalSessionMapping> findByTmuxSessionName(String tmuxSessionName);

    /**
     * Find mapping by SwiftCast trace ID.
     */
    @Query("SELECT m FROM TerminalSessionMapping m WHERE :traceId MEMBER OF m.swiftcastTraceIds")
    Optional<TerminalSessionMapping> findBySwiftcastTraceId(@Param("traceId") String traceId);

    /**
     * Find mapping by SwiftCast session ID (Claude's conversation session ID).
     */
    Optional<TerminalSessionMapping> findBySwiftcastSessionId(String swiftcastSessionId);

    /**
     * Find all active sessions.
     */
    List<TerminalSessionMapping> findByStatus(SessionStatus status);

    /**
     * Find active sessions for a mission.
     */
    @Query("SELECT m FROM TerminalSessionMapping m WHERE m.todo.mission.id = :missionId AND m.status = :status")
    List<TerminalSessionMapping> findByMissionIdAndStatus(
            @Param("missionId") UUID missionId,
            @Param("status") SessionStatus status
    );

    /**
     * Check if active session exists for a Todo.
     */
    boolean existsByTodoIdAndStatus(UUID todoId, SessionStatus status);

    /**
     * Find mapping with Todo details.
     */
    @Query("SELECT m FROM TerminalSessionMapping m LEFT JOIN FETCH m.todo t LEFT JOIN FETCH t.mission WHERE m.id = :id")
    Optional<TerminalSessionMapping> findByIdWithTodoAndMission(@Param("id") UUID id);

    /**
     * Find mapping by Todo ID with Todo details.
     */
    @Query("SELECT m FROM TerminalSessionMapping m LEFT JOIN FETCH m.todo t LEFT JOIN FETCH t.mission WHERE m.todo.id = :todoId")
    Optional<TerminalSessionMapping> findByTodoIdWithTodoAndMission(@Param("todoId") UUID todoId);
}
