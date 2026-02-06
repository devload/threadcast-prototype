package io.threadcast.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class SentryIssueResponse {
    private String id;
    private String shortId;        // e.g., "PROJ-123"
    private String title;
    private String culprit;        // e.g., "app.views.homepage"
    private String level;          // error, warning, info
    private String status;         // unresolved, resolved, ignored
    private Long count;            // event count
    private Long userCount;        // affected users
    private String firstSeen;
    private String lastSeen;
    private String permalink;      // link to Sentry
    private String project;
    private List<String> tags;
    private String platform;
    private Boolean isUnhandled;

    public static SentryIssueResponse from(Map<String, Object> apiResponse) {
        return SentryIssueResponse.builder()
                .id(getString(apiResponse, "id"))
                .shortId(getString(apiResponse, "shortId"))
                .title(getString(apiResponse, "title"))
                .culprit(getString(apiResponse, "culprit"))
                .level(getString(apiResponse, "level"))
                .status(getString(apiResponse, "status"))
                .count(getLong(apiResponse, "count"))
                .userCount(getLong(apiResponse, "userCount"))
                .firstSeen(getString(apiResponse, "firstSeen"))
                .lastSeen(getString(apiResponse, "lastSeen"))
                .permalink(getString(apiResponse, "permalink"))
                .platform(getString(apiResponse, "platform"))
                .isUnhandled(getBoolean(apiResponse, "isUnhandled"))
                .project(getProjectName(apiResponse))
                .build();
    }

    private static String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private static Long getLong(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Boolean getBoolean(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Boolean) return (Boolean) value;
        return Boolean.parseBoolean(value.toString());
    }

    private static String getProjectName(Map<String, Object> map) {
        Object project = map.get("project");
        if (project instanceof Map) {
            return getString((Map<String, Object>) project, "slug");
        }
        return null;
    }
}
