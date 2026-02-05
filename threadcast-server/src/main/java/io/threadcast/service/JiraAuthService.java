package io.threadcast.service;

import io.threadcast.config.JiraConfig;
import io.threadcast.domain.JiraIntegration;
import io.threadcast.domain.Workspace;
import io.threadcast.domain.enums.JiraAuthType;
import io.threadcast.domain.enums.JiraInstanceType;
import io.threadcast.repository.JiraIntegrationRepository;
import io.threadcast.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

/**
 * JIRA 인증 서비스
 * OAuth 2.0, API Token, PAT 인증 처리
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JiraAuthService {

    private final JiraConfig jiraConfig;
    private final JiraIntegrationRepository jiraIntegrationRepository;
    private final WorkspaceRepository workspaceRepository;
    private final RestTemplate jiraRestTemplate;

    private static final String ATLASSIAN_AUTH_URL = "https://auth.atlassian.com";
    private static final String ATLASSIAN_API_URL = "https://api.atlassian.com";

    /**
     * OAuth 인증 URL 생성 (JIRA Cloud)
     */
    public String getOAuthAuthorizationUrl(UUID workspaceId) {
        String state = Base64.getEncoder().encodeToString(
                (workspaceId.toString() + ":" + System.currentTimeMillis()).getBytes()
        );

        return String.format(
                "%s/authorize?audience=api.atlassian.com&client_id=%s&scope=%s&redirect_uri=%s&state=%s&response_type=code&prompt=consent",
                ATLASSIAN_AUTH_URL,
                jiraConfig.getCloud().getClientId(),
                jiraConfig.getCloud().getScopes().replace(" ", "%20"),
                jiraConfig.getCloud().getRedirectUri(),
                state
        );
    }

    /**
     * OAuth 콜백 처리 (JIRA Cloud)
     */
    @Transactional
    public JiraIntegration handleOAuthCallback(UUID workspaceId, String code) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found: " + workspaceId));

        // 기존 연동이 있으면 삭제
        jiraIntegrationRepository.findByWorkspaceId(workspaceId)
                .ifPresent(jiraIntegrationRepository::delete);

        // Access Token 교환
        Map<String, Object> tokenResponse = exchangeCodeForToken(code);
        String accessToken = (String) tokenResponse.get("access_token");
        String refreshToken = (String) tokenResponse.get("refresh_token");
        Integer expiresIn = (Integer) tokenResponse.get("expires_in");
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(expiresIn);

        // Cloud ID 및 사이트 정보 조회
        Map<String, String> siteInfo = getAccessibleResources(accessToken);
        String cloudId = siteInfo.get("cloudId");
        String baseUrl = siteInfo.get("url");

        // 연동 정보 저장
        JiraIntegration integration = JiraIntegration.createCloudOAuth(
                workspace, baseUrl,
                encrypt(accessToken), encrypt(refreshToken),
                expiresAt, cloudId
        );

        return jiraIntegrationRepository.save(integration);
    }

    /**
     * API Token 연결 (JIRA Cloud/Server)
     */
    @Transactional
    public JiraIntegration connectWithApiToken(UUID workspaceId, JiraInstanceType instanceType,
                                                String baseUrl, String email, String apiToken) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found: " + workspaceId));

        // 연결 테스트
        validateApiTokenConnection(instanceType, baseUrl, email, apiToken);

        // 기존 연동이 있으면 삭제
        jiraIntegrationRepository.findByWorkspaceId(workspaceId)
                .ifPresent(jiraIntegrationRepository::delete);

        // 연동 정보 저장
        JiraIntegration integration = instanceType == JiraInstanceType.CLOUD
                ? JiraIntegration.createCloudApiToken(workspace, normalizeUrl(baseUrl), email, encrypt(apiToken))
                : JiraIntegration.createServerApiToken(workspace, normalizeUrl(baseUrl), email, encrypt(apiToken));

        integration.setLastStatusMessage("Connected successfully");
        return jiraIntegrationRepository.save(integration);
    }

    /**
     * PAT 연결 (JIRA Server/Data Center)
     */
    @Transactional
    public JiraIntegration connectWithPat(UUID workspaceId, JiraInstanceType instanceType,
                                           String baseUrl, String pat) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found: " + workspaceId));

        // 연결 테스트
        validatePatConnection(baseUrl, pat);

        // 기존 연동이 있으면 삭제
        jiraIntegrationRepository.findByWorkspaceId(workspaceId)
                .ifPresent(jiraIntegrationRepository::delete);

        // 연동 정보 저장
        JiraIntegration integration = JiraIntegration.createServerPat(
                workspace, normalizeUrl(baseUrl), encrypt(pat), instanceType
        );

        integration.setLastStatusMessage("Connected successfully");
        return jiraIntegrationRepository.save(integration);
    }

    /**
     * 토큰 갱신 (OAuth2)
     */
    @Transactional
    public void refreshTokenIfNeeded(JiraIntegration integration) {
        if (integration.getAuthType() != JiraAuthType.OAUTH2) {
            return;
        }

        if (!integration.isTokenExpired()) {
            return;
        }

        log.info("Refreshing JIRA OAuth token for workspace: {}", integration.getWorkspace().getId());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "refresh_token");
        params.add("client_id", jiraConfig.getCloud().getClientId());
        params.add("client_secret", jiraConfig.getCloud().getClientSecret());
        params.add("refresh_token", decrypt(integration.getRefreshToken()));

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<Map> response = jiraRestTemplate.postForEntity(
                    ATLASSIAN_AUTH_URL + "/oauth/token",
                    request,
                    Map.class
            );

            Map<String, Object> body = response.getBody();
            String newAccessToken = (String) body.get("access_token");
            String newRefreshToken = (String) body.get("refresh_token");
            Integer expiresIn = (Integer) body.get("expires_in");
            LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(expiresIn);

            integration.updateOAuthTokens(
                    encrypt(newAccessToken),
                    newRefreshToken != null ? encrypt(newRefreshToken) : integration.getRefreshToken(),
                    expiresAt
            );

            jiraIntegrationRepository.save(integration);
            log.info("JIRA OAuth token refreshed successfully");
        } catch (Exception e) {
            log.error("Failed to refresh JIRA OAuth token", e);
            throw new RuntimeException("Failed to refresh JIRA token: " + e.getMessage());
        }
    }

    /**
     * 연결 해제
     */
    @Transactional
    public void disconnect(UUID workspaceId) {
        jiraIntegrationRepository.deleteByWorkspaceId(workspaceId);
        log.info("JIRA integration disconnected for workspace: {}", workspaceId);
    }

    /**
     * 자격 증명 테스트 (저장하지 않고 연결만 테스트)
     */
    public Map<String, Object> testCredentials(JiraInstanceType instanceType, String baseUrl,
                                                JiraAuthType authType, String email, String apiToken) {
        Map<String, Object> result = new HashMap<>();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            if (authType == JiraAuthType.API_TOKEN) {
                String auth = email + ":" + apiToken;
                String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
                headers.set("Authorization", "Basic " + encodedAuth);
            } else if (authType == JiraAuthType.PAT) {
                headers.setBearerAuth(apiToken);
            } else {
                result.put("success", false);
                result.put("message", "OAuth2 인증은 별도 플로우를 사용해주세요.");
                return result;
            }

            HttpEntity<Void> request = new HttpEntity<>(headers);
            String url = normalizeUrl(baseUrl) + "/rest/api/2/myself";

            ResponseEntity<Map> response = jiraRestTemplate.exchange(url, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                result.put("success", true);
                result.put("message", "연결 성공!");
                result.put("displayName", body.get("displayName"));
                result.put("emailAddress", body.get("emailAddress"));
                result.put("accountId", body.get("accountId"));

                // 추가 정보: 사용자의 JIRA 계정 유형
                if (body.containsKey("accountType")) {
                    result.put("accountType", body.get("accountType"));
                }
            } else {
                result.put("success", false);
                result.put("message", "연결 실패: 응답이 유효하지 않습니다.");
            }
        } catch (Exception e) {
            log.warn("Credential test failed for {}: {}", baseUrl, e.getMessage());
            result.put("success", false);
            result.put("message", "연결 실패: " + e.getMessage());
        }

        return result;
    }

    /**
     * HTTP 헤더 생성 (인증 포함)
     */
    public HttpHeaders createAuthHeaders(JiraIntegration integration) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        switch (integration.getAuthType()) {
            case OAUTH2:
                refreshTokenIfNeeded(integration);
                headers.setBearerAuth(decrypt(integration.getAccessToken()));
                break;
            case API_TOKEN:
                String auth = integration.getEmail() + ":" + decrypt(integration.getAccessToken());
                String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
                headers.set("Authorization", "Basic " + encodedAuth);
                break;
            case PAT:
                headers.setBearerAuth(decrypt(integration.getAccessToken()));
                break;
        }

        return headers;
    }

    // ==================== Private Methods ====================

    private Map<String, Object> exchangeCodeForToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", jiraConfig.getCloud().getClientId());
        params.add("client_secret", jiraConfig.getCloud().getClientSecret());
        params.add("code", code);
        params.add("redirect_uri", jiraConfig.getCloud().getRedirectUri());

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<Map> response = jiraRestTemplate.postForEntity(
                ATLASSIAN_AUTH_URL + "/oauth/token",
                request,
                Map.class
        );

        return response.getBody();
    }

    private Map<String, String> getAccessibleResources(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<List> response = jiraRestTemplate.exchange(
                ATLASSIAN_API_URL + "/oauth/token/accessible-resources",
                HttpMethod.GET,
                request,
                List.class
        );

        List<Map<String, Object>> resources = response.getBody();
        if (resources == null || resources.isEmpty()) {
            throw new RuntimeException("No accessible JIRA sites found");
        }

        // 첫 번째 사이트 사용
        Map<String, Object> site = resources.get(0);
        Map<String, String> result = new HashMap<>();
        result.put("cloudId", (String) site.get("id"));
        result.put("url", (String) site.get("url"));
        result.put("name", (String) site.get("name"));

        return result;
    }

    private void validateApiTokenConnection(JiraInstanceType instanceType, String baseUrl,
                                            String email, String apiToken) {
        HttpHeaders headers = new HttpHeaders();
        String auth = email + ":" + apiToken;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedAuth);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        String url = normalizeUrl(baseUrl) + "/rest/api/2/myself";

        try {
            jiraRestTemplate.exchange(url, HttpMethod.GET, request, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("JIRA connection failed: " + e.getMessage());
        }
    }

    private void validatePatConnection(String baseUrl, String pat) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(pat);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        String url = normalizeUrl(baseUrl) + "/rest/api/2/myself";

        try {
            jiraRestTemplate.exchange(url, HttpMethod.GET, request, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("JIRA connection failed: " + e.getMessage());
        }
    }

    private String normalizeUrl(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    /**
     * AES 키를 32바이트로 정규화
     */
    private byte[] normalizeKeyTo32Bytes(String key) {
        byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
        byte[] normalizedKey = new byte[32];

        if (keyBytes.length >= 32) {
            System.arraycopy(keyBytes, 0, normalizedKey, 0, 32);
        } else {
            System.arraycopy(keyBytes, 0, normalizedKey, 0, keyBytes.length);
            // 나머지는 0으로 패딩됨
        }

        return normalizedKey;
    }

    /**
     * 토큰 암호화
     */
    public String encrypt(String plainText) {
        try {
            byte[] keyBytes = normalizeKeyTo32Bytes(jiraConfig.getEncryption().getKey());
            SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "AES");
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            log.error("Encryption failed", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * 토큰 복호화
     */
    public String decrypt(String encryptedText) {
        try {
            byte[] keyBytes = normalizeKeyTo32Bytes(jiraConfig.getEncryption().getKey());
            SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "AES");
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Decryption failed", e);
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
