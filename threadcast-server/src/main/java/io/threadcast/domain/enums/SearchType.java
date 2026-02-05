package io.threadcast.domain.enums;

/**
 * 검색 대상 타입을 정의하는 enum.
 */
public enum SearchType {
    ALL,        // 모든 타입 검색
    MISSION,    // Mission만 검색
    TODO,       // Todo만 검색
    COMMENT,    // Comment만 검색
    PROJECT     // Project만 검색
}
