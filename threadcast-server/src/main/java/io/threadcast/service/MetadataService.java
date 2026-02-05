package io.threadcast.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.threadcast.domain.Mission;
import io.threadcast.domain.Todo;
import io.threadcast.domain.Workspace;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * 계층적 메타데이터 관리 서비스
 *
 * 메타데이터 우선순위 (하위가 상위를 오버라이드):
 * 1. Workspace meta (전역 기본값)
 * 2. Mission meta (미션별 설정)
 * 3. Todo meta (개별 작업 설정)
 *
 * 병합 규칙:
 * - 객체: deep merge (하위 객체가 상위 객체의 키를 오버라이드)
 * - 배열: 하위가 상위를 완전히 대체 (append 하려면 별도 키 사용)
 * - 스칼라: 하위가 상위를 오버라이드
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MetadataService {

    private final ObjectMapper objectMapper;

    /**
     * Todo 실행을 위한 최종 메타데이터 반환
     * Workspace → Mission → Todo 순서로 병합
     */
    public Map<String, Object> getEffectiveMeta(Todo todo) {
        Map<String, Object> result = new HashMap<>();

        // 1. Workspace meta
        Workspace workspace = todo.getMission().getWorkspace();
        if (workspace.getMeta() != null) {
            result = mergeMeta(result, parseMeta(workspace.getMeta()));
        }

        // 2. Mission meta
        Mission mission = todo.getMission();
        if (mission.getMeta() != null) {
            result = mergeMeta(result, parseMeta(mission.getMeta()));
        }

        // 3. Todo meta
        if (todo.getMeta() != null) {
            result = mergeMeta(result, parseMeta(todo.getMeta()));
        }

        // 기본값 추가
        addDefaults(result, todo);

        return result;
    }

    /**
     * Mission 실행을 위한 최종 메타데이터 반환
     * Workspace → Mission 순서로 병합
     */
    public Map<String, Object> getEffectiveMeta(Mission mission) {
        Map<String, Object> result = new HashMap<>();

        // 1. Workspace meta
        Workspace workspace = mission.getWorkspace();
        if (workspace.getMeta() != null) {
            result = mergeMeta(result, parseMeta(workspace.getMeta()));
        }

        // 2. Mission meta
        if (mission.getMeta() != null) {
            result = mergeMeta(result, parseMeta(mission.getMeta()));
        }

        return result;
    }

    /**
     * Workspace 메타데이터 반환
     */
    public Map<String, Object> getEffectiveMeta(Workspace workspace) {
        if (workspace.getMeta() != null) {
            return parseMeta(workspace.getMeta());
        }
        return new HashMap<>();
    }

    /**
     * 메타데이터 저장 (JSON 문자열로 변환)
     */
    public String toMetaString(Map<String, Object> meta) {
        try {
            return objectMapper.writeValueAsString(meta);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize meta", e);
            return "{}";
        }
    }

    /**
     * 특정 키의 값 조회 (dot notation 지원)
     * 예: getMeta(todo, "repo.url") → "https://github.com/..."
     */
    public Object getMeta(Todo todo, String key) {
        Map<String, Object> meta = getEffectiveMeta(todo);
        return getNestedValue(meta, key);
    }

    /**
     * 특정 키의 문자열 값 조회
     */
    public String getMetaString(Todo todo, String key) {
        Object value = getMeta(todo, key);
        return value != null ? value.toString() : null;
    }

    /**
     * 특정 키의 문자열 값 조회 (기본값 포함)
     */
    public String getMetaString(Todo todo, String key, String defaultValue) {
        String value = getMetaString(todo, key);
        return value != null ? value : defaultValue;
    }

    // ============ Private Methods ============

    private Map<String, Object> parseMeta(String metaJson) {
        try {
            return objectMapper.readValue(metaJson, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse meta JSON: {}", metaJson, e);
            return new HashMap<>();
        }
    }

    /**
     * Deep merge: source의 값들을 target에 병합
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> mergeMeta(Map<String, Object> target, Map<String, Object> source) {
        Map<String, Object> result = new HashMap<>(target);

        for (Map.Entry<String, Object> entry : source.entrySet()) {
            String key = entry.getKey();
            Object sourceValue = entry.getValue();
            Object targetValue = result.get(key);

            if (sourceValue instanceof Map && targetValue instanceof Map) {
                // 둘 다 Map이면 재귀적으로 병합
                result.put(key, mergeMeta(
                    (Map<String, Object>) targetValue,
                    (Map<String, Object>) sourceValue
                ));
            } else {
                // 그 외에는 source가 target을 오버라이드
                result.put(key, sourceValue);
            }
        }

        return result;
    }

    /**
     * Dot notation으로 nested value 조회
     * 예: "repo.url" → meta.get("repo").get("url")
     */
    @SuppressWarnings("unchecked")
    private Object getNestedValue(Map<String, Object> map, String key) {
        String[] parts = key.split("\\.");
        Object current = map;

        for (String part : parts) {
            if (current instanceof Map) {
                current = ((Map<String, Object>) current).get(part);
                if (current == null) return null;
            } else {
                return null;
            }
        }

        return current;
    }

    /**
     * 기본값 추가 (필수 필드가 없으면 자동 생성)
     */
    private void addDefaults(Map<String, Object> meta, Todo todo) {
        // workingDir 기본값
        if (!meta.containsKey("workingDir")) {
            meta.put("workingDir", todo.getWorkingPath());
        }

        // todoId 추가 (항상)
        meta.put("todoId", todo.getId().toString());
        meta.put("todoTitle", todo.getTitle());
        meta.put("missionId", todo.getMission().getId().toString());
        meta.put("missionTitle", todo.getMission().getTitle());
        meta.put("workspaceId", todo.getMission().getWorkspace().getId().toString());
    }
}
