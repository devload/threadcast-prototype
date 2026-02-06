package io.threadcast.domain.enums;

public enum AnalysisStatus {
    QUEUED,      // 대기열에 추가됨
    PROCESSING,  // 처리 중
    COMPLETED,   // 완료
    FAILED       // 실패
}
