package io.threadcast.domain.enums;

/**
 * PM Agent 연결 상태
 */
public enum PmAgentStatus {
    /**
     * 연결 안됨
     */
    DISCONNECTED,

    /**
     * 연결됨 (대기 중)
     */
    CONNECTED,

    /**
     * 작업 중
     */
    WORKING
}
