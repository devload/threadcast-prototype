package io.threadcast.domain.enums;

/**
 * JIRA 인스턴스 타입
 */
public enum JiraInstanceType {
    /**
     * JIRA Cloud (Atlassian Cloud)
     * - OAuth 2.0 인증 지원
     * - cloudId 필요
     */
    CLOUD,

    /**
     * JIRA Server (자체 호스팅)
     * - API Token 또는 PAT 인증
     * - baseUrl로 직접 접근
     */
    SERVER,

    /**
     * JIRA Data Center (Enterprise)
     * - PAT 인증 권장
     * - 고가용성 구성
     */
    DATA_CENTER
}
