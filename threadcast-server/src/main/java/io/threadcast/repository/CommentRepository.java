package io.threadcast.repository;

import io.threadcast.domain.Comment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    @Query("SELECT c FROM Comment c WHERE c.todo.id = :todoId AND c.parent IS NULL ORDER BY c.createdAt DESC")
    List<Comment> findRootCommentsByTodoId(@Param("todoId") UUID todoId);

    List<Comment> findByTodoIdOrderByCreatedAtDesc(UUID todoId);

    List<Comment> findByParentId(UUID parentId);

    List<Comment> findByTodoIdAndHasAiMentionTrue(UUID todoId);

    /**
     * Search comments by content within a workspace.
     * Uses FETCH JOIN to avoid N+1 queries when accessing todo and mission.
     */
    @Query("SELECT c FROM Comment c " +
           "JOIN FETCH c.todo t " +
           "JOIN FETCH t.mission m " +
           "JOIN m.workspace w " +
           "WHERE w.id = :workspaceId " +
           "AND LOWER(c.content) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Comment> searchByWorkspaceIdAndQuery(
            @Param("workspaceId") UUID workspaceId,
            @Param("query") String query,
            Pageable pageable);

    /**
     * Count search results.
     */
    @Query("SELECT COUNT(c) FROM Comment c JOIN c.todo t JOIN t.mission m WHERE m.workspace.id = :workspaceId " +
           "AND LOWER(c.content) LIKE LOWER(CONCAT('%', :query, '%'))")
    long countSearchResults(@Param("workspaceId") UUID workspaceId, @Param("query") String query);
}
