package io.threadcast.domain.enums;

/**
 * Status of a terminal session.
 */
public enum SessionStatus {
    ACTIVE,     // Session is running
    STOPPED,    // Session was stopped normally
    ERROR       // Session terminated with error
}
