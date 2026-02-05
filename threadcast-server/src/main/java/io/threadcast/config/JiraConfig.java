package io.threadcast.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * JIRA 연동 설정
 */
@Configuration
@ConfigurationProperties(prefix = "jira")
@Data
public class JiraConfig {

    /**
     * JIRA Cloud OAuth 설정
     */
    private CloudOAuthConfig cloud = new CloudOAuthConfig();

    /**
     * 암호화 설정
     */
    private EncryptionConfig encryption = new EncryptionConfig();

    @Data
    public static class CloudOAuthConfig {
        /**
         * Atlassian OAuth2 Client ID
         */
        private String clientId;

        /**
         * Atlassian OAuth2 Client Secret
         */
        private String clientSecret;

        /**
         * OAuth 콜백 URL
         */
        private String redirectUri = "http://localhost:21002/integrations/jira/callback";

        /**
         * OAuth 권한 범위
         */
        private String scopes = "read:jira-work read:jira-user write:jira-work offline_access";
    }

    @Data
    public static class EncryptionConfig {
        /**
         * 토큰 암호화 키 (32바이트)
         */
        private String key = "default-key-32-bytes-long!!-pad!";
    }

    /**
     * JIRA API 호출용 RestTemplate
     */
    @Bean(name = "jiraRestTemplate")
    public RestTemplate jiraRestTemplate() {
        return new RestTemplate();
    }
}
