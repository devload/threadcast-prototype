package io.threadcast.dto.response;

import io.threadcast.domain.*;
import io.threadcast.domain.enums.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class SearchResponse {

    private String query;
    private int totalCount;
    private int missionCount;
    private int todoCount;
    private int commentCount;
    private int projectCount;
    private List<SearchResultItem> results;

    @Data
    @Builder
    public static class SearchResultItem {
        private UUID id;
        private SearchType type;
        private String title;
        private String description;
        private String highlightedContent;
        private String status;
        private String priority;
        private UUID parentId;
        private String parentTitle;
        private UUID workspaceId;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    public static SearchResultItem fromMission(Mission mission, String query) {
        return SearchResultItem.builder()
                .id(mission.getId())
                .type(SearchType.MISSION)
                .title(mission.getTitle())
                .description(mission.getDescription())
                .highlightedContent(highlightMatch(mission.getTitle() + " " + mission.getDescription(), query))
                .status(mission.getStatus().name())
                .priority(mission.getPriority() != null ? mission.getPriority().name() : null)
                .workspaceId(mission.getWorkspace().getId())
                .createdAt(mission.getCreatedAt())
                .updatedAt(mission.getUpdatedAt())
                .build();
    }

    public static SearchResultItem fromTodo(Todo todo, String query) {
        return SearchResultItem.builder()
                .id(todo.getId())
                .type(SearchType.TODO)
                .title(todo.getTitle())
                .description(todo.getDescription())
                .highlightedContent(highlightMatch(todo.getTitle() + " " + todo.getDescription(), query))
                .status(todo.getStatus().name())
                .priority(todo.getPriority() != null ? todo.getPriority().name() : null)
                .parentId(todo.getMission().getId())
                .parentTitle(todo.getMission().getTitle())
                .workspaceId(todo.getMission().getWorkspace().getId())
                .createdAt(todo.getCreatedAt())
                .updatedAt(todo.getUpdatedAt())
                .build();
    }

    public static SearchResultItem fromComment(Comment comment, String query) {
        return SearchResultItem.builder()
                .id(comment.getId())
                .type(SearchType.COMMENT)
                .title("Comment on: " + comment.getTodo().getTitle())
                .description(truncate(comment.getContent(), 200))
                .highlightedContent(highlightMatch(comment.getContent(), query))
                .parentId(comment.getTodo().getId())
                .parentTitle(comment.getTodo().getTitle())
                .workspaceId(comment.getTodo().getMission().getWorkspace().getId())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    public static SearchResultItem fromProject(Project project, String query) {
        return SearchResultItem.builder()
                .id(project.getId())
                .type(SearchType.PROJECT)
                .title(project.getName())
                .description(project.getDescription())
                .highlightedContent(highlightMatch(project.getName() + " " + project.getPath(), query))
                .workspaceId(project.getWorkspace().getId())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private static String highlightMatch(String text, String query) {
        if (text == null || query == null) return text;
        String lowerText = text.toLowerCase();
        String lowerQuery = query.toLowerCase();
        int index = lowerText.indexOf(lowerQuery);
        if (index == -1) return truncate(text, 150);

        int start = Math.max(0, index - 30);
        int end = Math.min(text.length(), index + query.length() + 70);
        String snippet = text.substring(start, end);
        if (start > 0) snippet = "..." + snippet;
        if (end < text.length()) snippet = snippet + "...";
        return snippet;
    }

    private static String truncate(String text, int maxLength) {
        if (text == null) return null;
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }
}
