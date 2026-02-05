package io.threadcast.repository;

import io.threadcast.domain.AIQuestion;
import io.threadcast.domain.enums.QuestionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AIQuestionRepository extends JpaRepository<AIQuestion, UUID> {

    List<AIQuestion> findByTodoIdOrderByCreatedAtDesc(UUID todoId);

    List<AIQuestion> findByStatusOrderByCreatedAtDesc(QuestionStatus status);

    @Query("SELECT q FROM AIQuestion q JOIN q.todo t JOIN t.mission m " +
            "WHERE m.workspace.id = :workspaceId AND q.status = :status " +
            "ORDER BY q.createdAt DESC")
    List<AIQuestion> findByWorkspaceIdAndStatus(
            @Param("workspaceId") UUID workspaceId,
            @Param("status") QuestionStatus status);

    @Query("SELECT q FROM AIQuestion q JOIN q.todo t JOIN t.mission m " +
            "WHERE m.workspace.id = :workspaceId ORDER BY q.createdAt DESC")
    List<AIQuestion> findByWorkspaceId(@Param("workspaceId") UUID workspaceId);

    long countByTodoIdAndStatus(UUID todoId, QuestionStatus status);
}
