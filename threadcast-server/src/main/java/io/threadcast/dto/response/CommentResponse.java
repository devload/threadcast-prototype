package io.threadcast.dto.response;

import io.threadcast.domain.Comment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CommentResponse {

    private UUID id;
    private UUID userId;
    private String userName;
    private String userAvatarUrl;
    private String content;
    private boolean hasAiMention;
    private UUID parentId;
    private List<CommentResponse> replies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommentResponse from(Comment comment) {
        return from(comment, false);
    }

    public static CommentResponse from(Comment comment, boolean includeReplies) {
        CommentResponseBuilder builder = CommentResponse.builder()
                .id(comment.getId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getName())
                .userAvatarUrl(comment.getUser().getAvatarUrl())
                .content(comment.getContent())
                .hasAiMention(comment.getHasAiMention())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt());

        if (includeReplies && comment.getReplies() != null && !comment.getReplies().isEmpty()) {
            List<CommentResponse> replyResponses = comment.getReplies().stream()
                    .map(r -> CommentResponse.from(r, false))
                    .toList();
            builder.replies(replyResponses);
        }

        return builder.build();
    }
}
