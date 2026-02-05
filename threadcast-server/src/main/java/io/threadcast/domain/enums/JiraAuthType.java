package io.threadcast.domain.enums;

/**
 * JIRA 인증 타입
 */
public enum JiraAuthType {
    /**
     * OAuth 2.0 (JIRA Cloud 전용)
     * - 가장 안전한 인증 방식
     * - access_token + refresh_token 사용
     */
    OAUTH2,

    /**
     * API Token (JIRA Cloud & Server)
     * - email + API Token 조합
     * - Basic Auth 형태로 전송
     */
    API_TOKEN,

    /**
     * Personal Access Token (JIRA Server/Data Center)
     * - Bearer Token으로 전송
     * - 사용자별 발급
     */
    PAT
}
