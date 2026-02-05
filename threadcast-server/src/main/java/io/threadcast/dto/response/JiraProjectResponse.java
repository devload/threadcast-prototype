package io.threadcast.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

/**
 * JIRA 프로젝트 응답 DTO
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JiraProjectResponse {

    /**
     * 프로젝트 ID
     */
    private String id;

    /**
     * 프로젝트 키 (예: PROJ)
     */
    private String key;

    /**
     * 프로젝트 이름
     */
    private String name;

    /**
     * 프로젝트 타입 (software, business, service_desk)
     */
    private String projectTypeKey;

    /**
     * 아바타 URL
     */
    private String avatarUrl;

    /**
     * 프로젝트 리더 이름
     */
    private String leadName;

    /**
     * 프로젝트 설명
     */
    private String description;
}
