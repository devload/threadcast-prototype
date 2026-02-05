package io.threadcast.dto.request;

import io.threadcast.domain.enums.JiraAuthType;
import io.threadcast.domain.enums.JiraInstanceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * JIRA 연결 요청 DTO
 */
@Data
public class JiraConnectRequest {

    @NotNull(message = "Workspace ID is required")
    private UUID workspaceId;

    @NotNull(message = "Instance type is required")
    private JiraInstanceType instanceType;

    @NotBlank(message = "Base URL is required")
    private String baseUrl;

    @NotNull(message = "Auth type is required")
    private JiraAuthType authType;

    /**
     * API Token 또는 PAT
     * - API_TOKEN 인증: API 토큰
     * - PAT 인증: Personal Access Token
     */
    private String apiToken;

    /**
     * 이메일 (API_TOKEN 인증 시 필요)
     */
    private String email;

    /**
     * 기본 프로젝트 키 (선택)
     */
    private String defaultProjectKey;
}
