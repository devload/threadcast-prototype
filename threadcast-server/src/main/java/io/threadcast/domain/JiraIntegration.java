package io.threadcast.domain;

import io.threadcast.domain.enums.JiraAuthType;
import io.threadcast.domain.enums.JiraInstanceType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JIRA 연동 정보
 * Workspace 당 하나의 JIRA 연결만 허용
 */
@Entity
@Table(name = "jira_integration", uniqueConstraints = {
        @UniqueConstraint(name = "uk_jira_integration_workspace", columnNames = "workspace_id")
})
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class JiraIntegration extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    /**
     * JIRA 인스턴스 타입 (Cloud, Server, Data Center)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JiraInstanceType instanceType;

    /**
     * JIRA 인스턴스 URL
     * - Cloud: https://your-domain.atlassian.net
     * - Server: https://jira.company.com
     */
    @Column(nullable = false, length = 500)
    private String baseUrl;

    /**
     * 인증 방식
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JiraAuthType authType;

    /**
     * Access Token (암호화 저장)
     * - OAuth2: access_token
     * - API_TOKEN: API 토큰
     * - PAT: Personal Access Token
     */
    @Column(columnDefinition = "TEXT")
    private String accessToken;

    /**
     * Refresh Token (OAuth2 전용, 암호화 저장)
     */
    @Column(columnDefinition = "TEXT")
    private String refreshToken;

    /**
     * Access Token 만료 시간 (OAuth2 전용)
     */
    private LocalDateTime tokenExpiresAt;

    /**
     * Cloud ID (JIRA Cloud 전용)
     * OAuth 인증 후 accessible-resources API에서 획득
     */
    @Column(length = 100)
    private String cloudId;

    /**
     * 사용자 이메일 (API Token 인증 시 필요)
     */
    @Column(length = 200)
    private String email;

    /**
     * 기본 프로젝트 키 (Import 시 기본값)
     */
    @Column(length = 20)
    private String defaultProjectKey;

    /**
     * 동기화 활성화 여부
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean syncEnabled = true;

    /**
     * 마지막 동기화 시간
     */
    private LocalDateTime lastSyncAt;

    /**
     * 연결 상태 확인 결과 메시지
     */
    @Column(length = 500)
    private String lastStatusMessage;

    /**
     * JIRA Cloud 연결 생성 (OAuth2)
     */
    public static JiraIntegration createCloudOAuth(Workspace workspace, String baseUrl,
                                                    String accessToken, String refreshToken,
                                                    LocalDateTime tokenExpiresAt, String cloudId) {
        return JiraIntegration.builder()
                .workspace(workspace)
                .instanceType(JiraInstanceType.CLOUD)
                .baseUrl(baseUrl)
                .authType(JiraAuthType.OAUTH2)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenExpiresAt(tokenExpiresAt)
                .cloudId(cloudId)
                .build();
    }

    /**
     * JIRA Cloud 연결 생성 (API Token)
     */
    public static JiraIntegration createCloudApiToken(Workspace workspace, String baseUrl,
                                                       String email, String apiToken) {
        return JiraIntegration.builder()
                .workspace(workspace)
                .instanceType(JiraInstanceType.CLOUD)
                .baseUrl(baseUrl)
                .authType(JiraAuthType.API_TOKEN)
                .email(email)
                .accessToken(apiToken)
                .build();
    }

    /**
     * JIRA Server 연결 생성 (API Token)
     */
    public static JiraIntegration createServerApiToken(Workspace workspace, String baseUrl,
                                                        String email, String apiToken) {
        return JiraIntegration.builder()
                .workspace(workspace)
                .instanceType(JiraInstanceType.SERVER)
                .baseUrl(baseUrl)
                .authType(JiraAuthType.API_TOKEN)
                .email(email)
                .accessToken(apiToken)
                .build();
    }

    /**
     * JIRA Server/Data Center 연결 생성 (PAT)
     */
    public static JiraIntegration createServerPat(Workspace workspace, String baseUrl,
                                                   String pat, JiraInstanceType instanceType) {
        return JiraIntegration.builder()
                .workspace(workspace)
                .instanceType(instanceType)
                .baseUrl(baseUrl)
                .authType(JiraAuthType.PAT)
                .accessToken(pat)
                .build();
    }

    /**
     * OAuth2 토큰 갱신
     */
    public void updateOAuthTokens(String accessToken, String refreshToken, LocalDateTime expiresAt) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiresAt = expiresAt;
    }

    /**
     * 토큰 만료 여부 확인
     */
    public boolean isTokenExpired() {
        if (authType != JiraAuthType.OAUTH2 || tokenExpiresAt == null) {
            return false;
        }
        // 5분 여유를 두고 만료 판단
        return LocalDateTime.now().plusMinutes(5).isAfter(tokenExpiresAt);
    }

    /**
     * JIRA API base URL 반환
     * Cloud의 경우 cloudId를 포함한 API 경로 반환
     */
    public String getApiBaseUrl() {
        if (instanceType == JiraInstanceType.CLOUD && cloudId != null) {
            return "https://api.atlassian.com/ex/jira/" + cloudId;
        }
        return baseUrl;
    }

    /**
     * 마지막 동기화 시간 갱신
     */
    public void updateLastSyncAt() {
        this.lastSyncAt = LocalDateTime.now();
    }
}
