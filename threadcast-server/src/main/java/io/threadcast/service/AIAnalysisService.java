package io.threadcast.service;

import io.threadcast.domain.enums.Complexity;
import io.threadcast.dto.request.AnalyzeMissionRequest;
import io.threadcast.dto.response.AIAnalysisResponse;
import io.threadcast.dto.response.AIAnalysisResponse.SuggestedTodo;
import io.threadcast.dto.response.AIAnalysisResponse.AIQuestionSuggestion;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class AIAnalysisService {

    private static final List<String> UNCERTAINTY_KEYWORDS = Arrays.asList(
            "select", "choose", "decide", "strategy", "option", "method", "approach",
            "oauth", "library", "framework", "provider", "service", "integration",
            "선택", "결정", "방식", "전략", "라이브러리", "프레임워크"
    );

    /**
     * Analyze mission and generate suggested todos (Demo implementation)
     */
    public AIAnalysisResponse analyzeMission(UUID missionId, AnalyzeMissionRequest request) {
        long startTime = System.currentTimeMillis();

        // Simulate AI processing time (0.5-1.5 seconds)
        try {
            Thread.sleep(500 + new Random().nextInt(1000));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        String searchText = (request.getTitle() + " " +
                (request.getDescription() != null ? request.getDescription() : "")).toLowerCase();

        List<SuggestedTodo> suggestedTodos = generateTodos(searchText);
        List<AIQuestionSuggestion> questions = generateQuestions(request.getTitle(), suggestedTodos);

        double analysisTime = (System.currentTimeMillis() - startTime) / 1000.0;
        double confidence = suggestedTodos.stream().anyMatch(t -> !t.isUncertain()) ? 0.85 : 0.65;

        log.info("AI Analysis completed for mission {}: {} todos, {} questions, confidence: {}",
                missionId, suggestedTodos.size(), questions.size(), confidence);

        return AIAnalysisResponse.builder()
                .missionId(missionId)
                .suggestedTodos(suggestedTodos)
                .questions(questions)
                .confidence(confidence)
                .analysisTime(analysisTime)
                .build();
    }

    private List<SuggestedTodo> generateTodos(String searchText) {
        // AI Question / 양방향 연동 keywords
        if (containsAny(searchText, "ai 질문", "질문 연동", "양방향", "question", "ai worker")) {
            return Arrays.asList(
                    createTodo("WebSocket 질문 이벤트 스키마 설계",
                            "AI Worker ↔ ThreadCast 간 질문/답변 메시지 포맷 정의 및 문서화",
                            Complexity.LOW, 20, false, null),
                    createTodo("Backend WebSocket 핸들러 구현",
                            "질문 수신/브로드캐스트, 답변 전송 처리 로직 구현",
                            Complexity.MEDIUM, 45, false, null),
                    createTodo("Frontend 실시간 질문 알림 구현",
                            "WebSocket 연결, Store 업데이트, 알림 배지 UI 구현",
                            Complexity.MEDIUM, 40, false, null),
                    createTodo("답변 입력 UI 및 전송 로직",
                            "옵션 선택형/텍스트 입력형 답변 폼 구현",
                            Complexity.MEDIUM, 35, false, null),
                    createTodo("통합 테스트 시나리오 작성",
                            "질문 발생 → 알림 → 답변 → 확인 전체 플로우 테스트",
                            Complexity.LOW, 25, false, null),
                    createTodo("QA: 다양한 질문 유형 테스트",
                            "단일 선택, 다중 선택, 자유 입력 등 케이스별 검증",
                            Complexity.LOW, 30, false, null),
                    createTodo("API 문서 업데이트",
                            "AI Question 관련 엔드포인트 Swagger 문서 추가",
                            Complexity.LOW, 15, false, null)
            );
        }

        // Step 진행 상황 / 실시간 추적 keywords
        if (containsAny(searchText, "step", "진행 상황", "실시간 추적", "progress", "단계")) {
            return Arrays.asList(
                    createTodo("Step Progress 이벤트 스키마 정의",
                            "stepType, status, progress(0-100), message 필드 포함 이벤트 구조 설계",
                            Complexity.LOW, 15, false, null),
                    createTodo("Backend Step 업데이트 API 구현",
                            "Step 상태 변경 API 및 WebSocket 브로드캐스트 구현",
                            Complexity.MEDIUM, 35, false, null),
                    createTodo("Frontend Step UI 실시간 반영",
                            "WebSocket 수신 시 Progress Bar 애니메이션 및 상태 아이콘 업데이트",
                            Complexity.MEDIUM, 40, false, null),
                    createTodo("Step 완료/실패 처리 로직",
                            "완료 시 다음 Step 활성화, 실패 시 에러 표시 및 재시도 옵션",
                            Complexity.MEDIUM, 30, true, "실패 시 재시도 정책 결정 필요"),
                    createTodo("E2E 테스트: Step 전환 시나리오",
                            "PENDING → IN_PROGRESS → COMPLETED 전체 흐름 자동화 테스트",
                            Complexity.MEDIUM, 35, false, null),
                    createTodo("QA: 에지 케이스 검증",
                            "동시 업데이트, 네트워크 끊김, 순서 역전 등 예외 상황 테스트",
                            Complexity.LOW, 25, false, null)
            );
        }

        // 파일 변경 이벤트 keywords
        if (containsAny(searchText, "파일 변경", "file change", "file event", "파일 이벤트")) {
            return Arrays.asList(
                    createTodo("파일 변경 데이터 모델 설계",
                            "filePath, changeType(CREATE/MODIFY/DELETE), diff, commitHash 등 스키마 정의",
                            Complexity.LOW, 20, false, null),
                    createTodo("Backend 파일 변경 수집 API",
                            "MCP에서 파일 변경 보고 받는 API 및 저장 로직 구현",
                            Complexity.MEDIUM, 35, false, null),
                    createTodo("Timeline에 파일 변경 표시",
                            "변경 유형별 아이콘/색상, 커밋 단위 그룹핑 UI 구현",
                            Complexity.MEDIUM, 40, false, null),
                    createTodo("Diff 뷰어 모달 구현",
                            "파일 클릭 시 변경 내용 diff 미리보기 표시",
                            Complexity.HIGH, 50, true, "Diff 라이브러리 선택 필요 (react-diff-viewer 등)"),
                    createTodo("QA: 대용량 파일 변경 테스트",
                            "100개 이상 파일 변경 시 성능 및 UI 반응성 검증",
                            Complexity.LOW, 25, false, null),
                    createTodo("사용자 가이드 문서 작성",
                            "파일 변경 추적 기능 사용법 및 활용 팁 문서화",
                            Complexity.LOW, 20, false, null)
            );
        }

        // MCP 기능 확장 keywords
        if (containsAny(searchText, "mcp", "기능 확장", "도구 추가", "tool")) {
            return Arrays.asList(
                    createTodo("신규 MCP 도구 요구사항 정리",
                            "timeline_event, file_change, step_update, ask_question 등 필요 도구 목록화",
                            Complexity.LOW, 20, false, null),
                    createTodo("MCP 도구 구현 (Backend API 포함)",
                            "각 도구별 inputSchema 정의 및 API 연동 구현",
                            Complexity.HIGH, 90, false, null),
                    createTodo("MCP 도구 단위 테스트",
                            "각 도구별 정상/에러 케이스 테스트 작성",
                            Complexity.MEDIUM, 40, false, null),
                    createTodo("Claude Code 통합 테스트",
                            "실제 Claude Code에서 MCP 도구 호출하여 동작 검증",
                            Complexity.MEDIUM, 45, false, null),
                    createTodo("MCP 도구 사용 가이드 작성",
                            "각 도구별 설명, 파라미터, 예제 코드 포함 문서화",
                            Complexity.LOW, 30, false, null),
                    createTodo("릴리즈 노트 작성",
                            "새 MCP 도구 기능 소개 및 마이그레이션 가이드",
                            Complexity.LOW, 15, false, null)
            );
        }

        // Auth-related keywords
        if (containsAny(searchText, "auth", "authentication", "login", "sign", "인증", "로그인", "가입")) {
            return Arrays.asList(
                    // 분석/설계
                    createTodo("인증 방식 기술 검토",
                            "JWT vs 세션, OAuth 제공자 등 기술 스택 비교 및 결정",
                            Complexity.LOW, 25, true, "인증 방식 결정 필요"),
                    createTodo("인증 API 스펙 설계",
                            "엔드포인트 URL, 요청/응답 스키마, 에러 코드 정의",
                            Complexity.LOW, 20, false, null),
                    // 구현 (세분화)
                    createTodo("Backend 인증 로직 구현",
                            "토큰 생성/검증, 로그인/로그아웃 API, 미들웨어 구현",
                            Complexity.HIGH, 50, false, null),
                    createTodo("토큰 갱신 및 세션 관리",
                            "리프레시 토큰, 토큰 만료 처리, 세션 정책 구현",
                            Complexity.MEDIUM, 35, false, null),
                    createTodo("Frontend 로그인 UI 구현",
                            "로그인/회원가입 폼, 유효성 검사, 에러 메시지 표시",
                            Complexity.MEDIUM, 30, false, null),
                    createTodo("Frontend 인증 상태 관리",
                            "토큰 저장, 인증 상태 Store, 보호된 라우트 구현",
                            Complexity.MEDIUM, 30, false, null),
                    // 테스트 (세분화)
                    createTodo("인증 API 단위 테스트",
                            "로그인 성공/실패, 토큰 검증, 권한 체크 테스트",
                            Complexity.MEDIUM, 25, false, null),
                    createTodo("보안 시나리오 테스트",
                            "토큰 만료, 무효 토큰, 권한 없는 접근 등 보안 케이스 검증",
                            Complexity.MEDIUM, 30, false, null),
                    createTodo("QA: 전체 로그인 플로우 검증",
                            "회원가입 → 로그인 → 세션 유지 → 로그아웃 전체 흐름 테스트",
                            Complexity.LOW, 25, false, null),
                    // 마무리
                    createTodo("보안 가이드 문서화",
                            "토큰 관리 정책, 보안 모범 사례 문서 작성",
                            Complexity.LOW, 15, false, null)
            );
        }

        // Dashboard/Chart keywords
        if (containsAny(searchText, "dashboard", "chart", "graph", "visualization", "대시보드", "차트", "그래프", "시각화")) {
            return Arrays.asList(
                    // 분석/설계
                    createTodo("대시보드 요구사항 및 지표 정의",
                            "표시할 KPI, 차트 종류, 필터 옵션 등 요구사항 정리",
                            Complexity.LOW, 20, false, null),
                    createTodo("차트 라이브러리 선정 및 PoC",
                            "후보 라이브러리 비교, 샘플 차트로 성능/사용성 검증",
                            Complexity.LOW, 25, true, "라이브러리 선택 필요 (Recharts, Chart.js 등)"),
                    createTodo("대시보드 레이아웃 설계",
                            "위젯 배치, 반응형 그리드, 사용자 커스터마이징 방안",
                            Complexity.LOW, 20, false, null),
                    // 구현 (세분화)
                    createTodo("Backend 데이터 집계 API 구현",
                            "기간별/필터별 통계 데이터 조회 API 개발",
                            Complexity.MEDIUM, 40, false, null),
                    createTodo("기본 차트 컴포넌트 구현",
                            "Line, Bar, Pie 등 재사용 가능한 기본 차트 컴포넌트",
                            Complexity.MEDIUM, 35, false, null),
                    createTodo("대시보드 레이아웃 및 위젯 구현",
                            "위젯 그리드, 필터 패널, 기간 선택기 UI 개발",
                            Complexity.MEDIUM, 40, false, null),
                    createTodo("차트 데이터 연동 및 실시간 업데이트",
                            "API 연동, 데이터 변환, 자동 갱신 로직 구현",
                            Complexity.MEDIUM, 30, false, null),
                    // 테스트 (세분화)
                    createTodo("차트 렌더링 테스트",
                            "다양한 데이터셋으로 차트 정상 렌더링 검증",
                            Complexity.LOW, 20, false, null),
                    createTodo("성능 테스트 및 최적화",
                            "대용량 데이터 렌더링 성능 측정, 지연 로딩/가상화 적용",
                            Complexity.MEDIUM, 35, false, null),
                    createTodo("QA: 엣지 케이스 검증",
                            "데이터 없음, 극단값, 화면 리사이즈 등 예외 상황 테스트",
                            Complexity.LOW, 20, false, null)
            );
        }

        // API keywords
        if (containsAny(searchText, "api", "endpoint", "rest", "graphql", "backend", "엔드포인트", "백엔드")) {
            return Arrays.asList(
                    // 설계
                    createTodo("API 스펙 설계",
                            "엔드포인트 URL, HTTP 메소드, 요청/응답 스키마 정의",
                            Complexity.MEDIUM, 30, false, null),
                    createTodo("데이터 모델 설계",
                            "엔티티, DTO, 연관관계 설계",
                            Complexity.MEDIUM, 25, false, null),
                    // 구현 (세분화)
                    createTodo("엔티티 및 Repository 구현",
                            "JPA 엔티티, Repository 인터페이스, 쿼리 메소드 구현",
                            Complexity.MEDIUM, 30, false, null),
                    createTodo("Service 비즈니스 로직 구현",
                            "핵심 비즈니스 로직, 트랜잭션 처리, 예외 처리",
                            Complexity.HIGH, 45, false, null),
                    createTodo("Controller 및 API 엔드포인트 구현",
                            "REST 컨트롤러, 요청/응답 매핑, 입력 검증",
                            Complexity.MEDIUM, 30, false, null),
                    createTodo("에러 처리 및 응답 포맷 통일",
                            "글로벌 예외 핸들러, 에러 응답 표준화",
                            Complexity.LOW, 20, false, null),
                    // 테스트 (세분화)
                    createTodo("Service 단위 테스트",
                            "비즈니스 로직 단위 테스트, Mock 활용",
                            Complexity.MEDIUM, 25, false, null),
                    createTodo("API 통합 테스트",
                            "엔드포인트별 요청/응답 통합 테스트",
                            Complexity.MEDIUM, 30, false, null),
                    // 마무리
                    createTodo("API 문서화 (Swagger)",
                            "OpenAPI 스펙 작성, 예제 요청/응답 추가",
                            Complexity.LOW, 20, false, null),
                    createTodo("코드 리뷰 및 머지",
                            "PR 생성, 리뷰 반영, 브랜치 머지",
                            Complexity.LOW, 15, false, null)
            );
        }

        // UI keywords
        if (containsAny(searchText, "ui", "component", "interface", "design", "frontend", "컴포넌트", "인터페이스", "디자인", "프론트엔드")) {
            return Arrays.asList(
                    // 분석/설계
                    createTodo("디자인 시안 분석",
                            "디자인 파일 검토, 컴포넌트 분해, 재사용 가능 요소 식별",
                            Complexity.LOW, 20, false, null),
                    createTodo("컴포넌트 구조 설계",
                            "컴포넌트 계층, Props 인터페이스, 상태 관리 방식 정의",
                            Complexity.LOW, 20, false, null),
                    // 구현 (세분화)
                    createTodo("기본 UI 컴포넌트 구현",
                            "Button, Input, Card 등 재사용 기본 컴포넌트 개발",
                            Complexity.MEDIUM, 35, false, null),
                    createTodo("레이아웃 컴포넌트 구현",
                            "Header, Sidebar, Container 등 레이아웃 구조 개발",
                            Complexity.MEDIUM, 25, false, null),
                    createTodo("페이지/기능 컴포넌트 구현",
                            "실제 비즈니스 로직이 포함된 기능 컴포넌트 개발",
                            Complexity.HIGH, 50, false, null),
                    createTodo("상태 관리 및 API 연동",
                            "Store 연결, API 호출, 로딩/에러 상태 처리",
                            Complexity.MEDIUM, 30, false, null),
                    createTodo("반응형 레이아웃 적용",
                            "모바일/태블릿/데스크톱 반응형 스타일 구현",
                            Complexity.MEDIUM, 25, false, null),
                    // 테스트/검수 (세분화)
                    createTodo("컴포넌트 단위 테스트",
                            "Props, 이벤트 핸들링, 렌더링 테스트",
                            Complexity.LOW, 20, false, null),
                    createTodo("디자인 QA 검수",
                            "디자인 시안과 구현 결과 비교, 수정 사항 반영",
                            Complexity.LOW, 20, false, null),
                    createTodo("접근성 및 크로스 브라우저 테스트",
                            "키보드 네비게이션, 스크린 리더, 브라우저 호환성 검증",
                            Complexity.LOW, 20, false, null)
            );
        }

        // Test keywords
        if (containsAny(searchText, "test", "testing", "unit", "integration", "e2e", "테스트", "유닛", "통합")) {
            return Arrays.asList(
                    createTodo("테스트 전략 수립",
                            "테스트 범위, 커버리지 목표, 프레임워크 선정",
                            Complexity.LOW, 25, true, "테스트 프레임워크 선택 필요"),
                    createTodo("유닛 테스트 작성",
                            "핵심 비즈니스 로직, 유틸리티 함수 테스트",
                            Complexity.MEDIUM, 60, false, null),
                    createTodo("통합 테스트 작성",
                            "API 엔드포인트, DB 연동 등 통합 레벨 테스트",
                            Complexity.HIGH, 80, false, null),
                    createTodo("E2E 테스트 시나리오 작성",
                            "주요 사용자 플로우 자동화 테스트",
                            Complexity.HIGH, 70, false, null),
                    createTodo("CI 파이프라인 연동",
                            "PR 생성 시 자동 테스트 실행 설정",
                            Complexity.MEDIUM, 35, false, null),
                    createTodo("테스트 커버리지 리포트",
                            "커버리지 측정 및 미달 영역 보완",
                            Complexity.LOW, 25, false, null)
            );
        }

        // Default todos - 일반적인 개발 프로세스 (세분화)
        return Arrays.asList(
                // 1. 분석 단계
                createTodo("요구사항 분석 및 범위 정의",
                        "미션 목표 명확화, 포함/제외 범위 정의, 산출물 목록화",
                        Complexity.LOW, 25, false, null),
                createTodo("기술 검토 및 설계",
                        "기술 스택 선택, 아키텍처 결정, 데이터 모델 설계",
                        Complexity.MEDIUM, 35, true, "기술 스택 결정 필요"),

                // 2. 구현 단계 (세분화)
                createTodo("데이터 모델 및 스키마 구현",
                        "DB 스키마, 엔티티, DTO 등 데이터 레이어 구현",
                        Complexity.MEDIUM, 30, false, null),
                createTodo("Backend 비즈니스 로직 구현",
                        "Service, Repository, API 엔드포인트 구현",
                        Complexity.HIGH, 60, false, null),
                createTodo("Frontend UI 구현",
                        "컴포넌트, 상태 관리, API 연동 구현",
                        Complexity.HIGH, 60, false, null),

                // 3. 테스트 단계 (세분화)
                createTodo("단위 테스트 작성",
                        "핵심 로직, 유틸리티 함수에 대한 단위 테스트",
                        Complexity.MEDIUM, 30, false, null),
                createTodo("통합 테스트 및 E2E 테스트",
                        "API 통합 테스트, 주요 사용자 플로우 E2E 테스트",
                        Complexity.MEDIUM, 35, false, null),
                createTodo("버그 수정 및 안정화",
                        "테스트에서 발견된 이슈 해결, 에지 케이스 처리",
                        Complexity.MEDIUM, 25, false, null),

                // 4. 마무리 단계
                createTodo("코드 리뷰 및 피드백 반영",
                        "팀원 리뷰 요청, 피드백 반영, 코드 품질 개선",
                        Complexity.LOW, 25, false, null),
                createTodo("문서화 및 배포 준비",
                        "API 문서, 사용 가이드 작성, 배포 체크리스트 확인",
                        Complexity.LOW, 20, false, null)
            );
    }

    private List<AIQuestionSuggestion> generateQuestions(String missionTitle, List<SuggestedTodo> todos) {
        List<AIQuestionSuggestion> questions = new ArrayList<>();

        for (SuggestedTodo todo : todos) {
            if (!todo.isUncertain()) continue;

            String questionText;
            List<String> options;

            String reason = todo.getUncertainReason() != null ? todo.getUncertainReason().toLowerCase() : "";

            if (reason.contains("session") || reason.contains("세션")) {
                questionText = "세션 관리를 어떻게 구현해야 할까요?";
                options = Arrays.asList("쿠키 기반 세션", "JWT 전용", "Redis 기반 세션", "하이브리드 방식");
            } else if (reason.contains("oauth") || reason.contains("provider")) {
                questionText = "어떤 OAuth 제공자를 연동해야 할까요?";
                options = Arrays.asList("Google", "GitHub", "Apple", "여러 제공자");
            } else if (reason.contains("library") || reason.contains("라이브러리")) {
                questionText = "어떤 라이브러리/프레임워크를 사용해야 할까요?";
                options = Arrays.asList("가장 인기 있는 옵션", "경량 옵션", "풀기능 옵션", "커스텀 구현");
            } else if (reason.contains("websocket") || reason.contains("polling")) {
                questionText = "실시간 업데이트를 어떻게 처리해야 할까요?";
                options = Arrays.asList("WebSocket", "Server-Sent Events (SSE)", "Long Polling", "Short Polling");
            } else if (reason.contains("framework") || reason.contains("프레임워크")) {
                questionText = "어떤 테스트 프레임워크를 사용해야 할까요?";
                options = Arrays.asList("Jest", "Vitest", "Mocha", "Testing Library");
            } else if (reason.contains("documentation") || reason.contains("문서")) {
                questionText = "어떤 문서화 도구를 사용해야 할까요?";
                options = Arrays.asList("Swagger/OpenAPI", "Postman", "ReadMe", "커스텀 문서");
            } else {
                questionText = String.format("\"%s\"을(를) 어떻게 구현해야 할까요?", todo.getTitle());
                options = Arrays.asList("표준 방식", "고급 방식", "최소 구현", "추가 정보 필요");
            }

            questions.add(AIQuestionSuggestion.builder()
                    .id(generateId())
                    .question(questionText)
                    .context(String.format("관련 Todo: %s\n미션: %s", todo.getTitle(), missionTitle))
                    .relatedTodoId(todo.getId())
                    .options(options)
                    .build());
        }

        return questions;
    }

    private SuggestedTodo createTodo(String title, String description, Complexity complexity,
                                      int estimatedTime, boolean isUncertain, String uncertainReason) {
        return SuggestedTodo.builder()
                .id(generateId())
                .title(title)
                .description(description)
                .complexity(complexity)
                .estimatedTime(estimatedTime)
                .isUncertain(isUncertain)
                .uncertainReason(uncertainReason)
                .build();
    }

    private String generateId() {
        return "temp-" + System.currentTimeMillis() + "-" +
                UUID.randomUUID().toString().substring(0, 7);
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword.toLowerCase())) {
                return true;
            }
        }
        return false;
    }
}
