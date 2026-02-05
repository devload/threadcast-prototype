package io.threadcast.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class UpdateMetaRequest {
    /**
     * 메타데이터 (JSON 객체)
     * 기존 메타에 병합되거나, replace=true면 완전히 대체됨
     */
    private Map<String, Object> meta;

    /**
     * true면 기존 메타를 완전히 대체
     * false면 기존 메타에 deep merge
     */
    private boolean replace = false;
}
