package io.threadcast.repository;

import io.threadcast.domain.TimelineEvent;
import io.threadcast.domain.enums.ActorType;
import io.threadcast.domain.enums.EventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface TimelineEventRepository extends JpaRepository<TimelineEvent, UUID> {

    Page<TimelineEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<TimelineEvent> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId, Pageable pageable);

    Page<TimelineEvent> findByMissionIdOrderByCreatedAtDesc(UUID missionId, Pageable pageable);

    @Query("SELECT t FROM TimelineEvent t WHERE t.todo.id = :todoId ORDER BY t.createdAt DESC")
    Page<TimelineEvent> findByTodoIdOrderByCreatedAtDesc(@Param("todoId") UUID todoId, Pageable pageable);

    Page<TimelineEvent> findByWorkspaceIdAndEventTypeOrderByCreatedAtDesc(
            UUID workspaceId, EventType eventType, Pageable pageable);

    Page<TimelineEvent> findByWorkspaceIdAndActorTypeOrderByCreatedAtDesc(
            UUID workspaceId, ActorType actorType, Pageable pageable);

    @Query("SELECT t FROM TimelineEvent t WHERE t.workspace.id = :workspaceId " +
            "AND t.createdAt >= :from AND t.createdAt <= :to ORDER BY t.createdAt DESC")
    List<TimelineEvent> findByWorkspaceIdAndDateRange(
            @Param("workspaceId") UUID workspaceId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(t) FROM TimelineEvent t WHERE t.workspace.id = :workspaceId " +
            "AND t.eventType = :eventType AND t.createdAt >= :from AND t.createdAt <= :to")
    long countByWorkspaceIdAndEventTypeAndDateRange(
            @Param("workspaceId") UUID workspaceId,
            @Param("eventType") EventType eventType,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
