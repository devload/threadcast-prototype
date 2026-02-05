package io.threadcast.domain.enums;

public enum EventType {
    MISSION_CREATED,
    MISSION_STARTED,
    MISSION_COMPLETED,
    TODO_CREATED,
    TODO_STARTED,
    TODO_COMPLETED,
    TODO_FAILED,
    STEP_STARTED,
    STEP_COMPLETED,
    FILE_CREATED,
    FILE_MODIFIED,
    FILE_DELETED,
    COMMENT_ADDED,
    AI_QUESTION,
    AI_ANSWER,
    /**
     * AI activity/work summary from Claude's response.
     * Used to show real-time work progress in timeline during weaving.
     */
    AI_ACTIVITY
}
