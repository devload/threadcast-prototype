package io.threadcast.domain.enums;

public enum TodoStatus {
    PENDING,    // 대기 중
    THREADING,  // AI 작업 중
    WOVEN,      // 완료됨
    TANGLED     // 에러 발생
}
