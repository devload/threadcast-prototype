package io.threadcast.config;

import io.threadcast.domain.*;
import io.threadcast.domain.enums.*;
import io.threadcast.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Demo 프로필용 풍부한 샘플 데이터 초기화
 * 다양한 상태의 Mission, Todo, AI Questions 포함
 */
@Slf4j
@Component
@Profile("demo")
@RequiredArgsConstructor
public class DemoDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;
    private final MissionRepository missionRepository;
    private final TodoRepository todoRepository;
    private final TodoStepRepository todoStepRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final AIQuestionRepository aiQuestionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("========================================");
        log.info("   ThreadCast Demo 데이터 초기화 시작");
        log.info("========================================");

        User demoUser = createDemoUser();
        Workspace workspace = createWorkspace(demoUser);
        List<Project> projects = createProjects(workspace);
        createRichDemoData(workspace, projects);
        createTimelineEvents(workspace);

        log.info("========================================");
        log.info("   Demo 데이터 초기화 완료!");
        log.info("   계정: demo@threadcast.io / demo1234");
        log.info("========================================");
    }

    private User createDemoUser() {
        User user = User.builder()
                .email("demo@threadcast.io")
                .passwordHash(passwordEncoder.encode("demo1234"))
                .name("김개발")
                .avatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=demo")
                .autonomyLevel(3)
                .build();
        return userRepository.save(user);
    }

    private Workspace createWorkspace(User owner) {
        Workspace workspace = Workspace.builder()
                .name("ThreadCast 개발팀")
                .description("AI 기반 업무 자동화 프로젝트")
                .path("/Users/devload/threadcast")
                .owner(owner)
                .build();
        return workspaceRepository.save(workspace);
    }

    private List<Project> createProjects(Workspace workspace) {
        Project serverProject = Project.builder()
                .workspace(workspace)
                .name("threadcast-server")
                .description("Spring Boot 백엔드 API 서버")
                .path("./threadcast-server")
                .language("Java")
                .buildTool("Gradle")
                .build();

        Project webProject = Project.builder()
                .workspace(workspace)
                .name("threadcast-web")
                .description("React 프론트엔드 웹 클라이언트")
                .path("./threadcast-web")
                .language("TypeScript")
                .buildTool("Vite")
                .build();

        Project cliProject = Project.builder()
                .workspace(workspace)
                .name("threadcast-cli")
                .description("AI Agent CLI 도구")
                .path("./threadcast-cli")
                .language("TypeScript")
                .buildTool("npm")
                .build();

        return List.of(
            projectRepository.save(serverProject),
            projectRepository.save(webProject),
            projectRepository.save(cliProject)
        );
    }

    private void createRichDemoData(Workspace workspace, List<Project> projects) {
        Project serverProject = projects.get(0);
        Project webProject = projects.get(1);
        // ============ BACKLOG (3개) ============

        // 검색 기능 고도화
        Mission m45 = createMission(workspace, "검색 기능 고도화",
            "Elasticsearch 도입으로 전문 검색 기능 구현. 자동완성, 필터링, 정렬, 하이라이팅 지원",
            MissionStatus.BACKLOG, Priority.HIGH, 0);
        createTodosForMission(m45, new String[]{
            "Elasticsearch 클러스터 설정",
            "검색 인덱스 스키마 설계",
            "자동완성 API 구현",
            "필터링 로직 개발",
            "정렬 기능 구현",
            "검색 결과 하이라이팅",
            "검색 UI 컴포넌트",
            "통합 테스트"
        }, TodoStatus.PENDING);

        // 모바일 앱 프로토타입
        Mission m46 = createMission(workspace, "모바일 앱 프로토타입",
            "React Native로 iOS/Android 크로스 플랫폼 앱 MVP 개발",
            MissionStatus.BACKLOG, Priority.MEDIUM, 0);
        createTodosForMission(m46, new String[]{
            "React Native 프로젝트 초기화",
            "네비게이션 구조 설계",
            "로그인 화면 구현",
            "메인 대시보드 화면",
            "푸시 알림 설정",
            "앱 스토어 배포 준비"
        }, TodoStatus.PENDING);

        // 결제 시스템 연동
        Mission m47 = createMission(workspace, "결제 시스템 연동",
            "토스페이먼츠 PG 연동, 정기결제 구독 모델, 환불/취소 처리",
            MissionStatus.BACKLOG, Priority.HIGH, 0);
        createTodosForMission(m47, new String[]{
            "PG사 선정 및 계약",
            "결제 모듈 아키텍처 설계",
            "단건 결제 API",
            "정기결제 구현",
            "환불 처리 로직",
            "결제 내역 조회",
            "영수증 발급",
            "결제 알림 연동",
            "테스트 환경 검증",
            "프로덕션 결제 테스트"
        }, TodoStatus.PENDING);

        // ============ THREADING (4개 - AI 질문 다수) ============

        // 로그인 기능 구현 - 60% (3 woven, 1 threading, 1 pending) - Server Project
        Mission m42 = createMission(workspace, "로그인 기능 구현",
            "JWT 기반 인증 시스템, Google/GitHub OAuth 연동, 리프레시 토큰 관리",
            MissionStatus.THREADING, Priority.HIGH, 60);
        m42.setStartedAt(LocalDateTime.now().minusHours(8));
        missionRepository.save(m42);

        createTodo(m42, serverProject, "기존 인증 시스템 분석", TodoStatus.WOVEN, Complexity.LOW, 0, 30);
        createTodo(m42, serverProject, "JWT 토큰 설계 문서 작성", TodoStatus.WOVEN, Complexity.MEDIUM, 1, 45);
        createTodo(m42, serverProject, "JWT 토큰 발급/검증 구현", TodoStatus.WOVEN, Complexity.MEDIUM, 2, 90);
        Todo authTodo = createTodo(m42, serverProject, "로그인/로그아웃 API 구현", TodoStatus.THREADING, Complexity.HIGH, 3, 120);
        createTodo(m42, serverProject, "OAuth 2.0 연동 (Google, GitHub)", TodoStatus.PENDING, Complexity.HIGH, 4, 180);

        // AI Questions for 로그인 기능
        createAIQuestion(authTodo,
            "로그인 API 구현 중입니다. 보안과 사용자 경험 사이의 균형이 필요합니다.",
            "세션 만료 시간을 몇 분으로 설정할까요? (15분 / 30분 / 1시간 / 24시간)",
            QuestionCategory.ARCHITECTURE);
        createAIQuestion(authTodo,
            "로그인 실패 시 보안 정책을 결정해야 합니다. 브루트포스 공격 방지가 목적입니다.",
            "로그인 5회 실패 시 계정을 잠글까요, 아니면 CAPTCHA를 표시할까요?",
            QuestionCategory.SECURITY);

        // 대시보드 리디자인 - 25% (2 woven, 1 threading, 5 pending) - Web Project
        Mission m43 = createMission(workspace, "대시보드 리디자인",
            "Recharts 기반 데이터 시각화, 반응형 그리드 레이아웃, 다크모드 지원",
            MissionStatus.THREADING, Priority.MEDIUM, 25);
        m43.setStartedAt(LocalDateTime.now().minusHours(12));
        missionRepository.save(m43);

        createTodo(m43, webProject, "UI/UX 와이어프레임 설계", TodoStatus.WOVEN, Complexity.MEDIUM, 0, 120);
        createTodo(m43, webProject, "차트 라이브러리 PoC", TodoStatus.WOVEN, Complexity.LOW, 1, 60);
        Todo chartTodo = createTodo(m43, webProject, "매출 현황 차트 구현", TodoStatus.THREADING, Complexity.MEDIUM, 2, 90);
        createTodo(m43, webProject, "사용자 통계 위젯", TodoStatus.PENDING, Complexity.MEDIUM, 3, 90);
        createTodo(m43, webProject, "반응형 그리드 레이아웃", TodoStatus.PENDING, Complexity.HIGH, 4, 150);
        createTodo(m43, webProject, "다크모드 테마 시스템", TodoStatus.PENDING, Complexity.MEDIUM, 5, 120);
        createTodo(m43, webProject, "마이크로 인터랙션 추가", TodoStatus.PENDING, Complexity.LOW, 6, 60);
        createTodo(m43, webProject, "성능 최적화 (React.memo)", TodoStatus.PENDING, Complexity.MEDIUM, 7, 90);

        // AI Questions for 대시보드
        createAIQuestion(chartTodo,
            "매출 차트에 표시할 기간을 결정해야 합니다. 데이터 로딩 속도와 인사이트 제공의 균형이 필요합니다.",
            "차트 기본 조회 기간을 어떻게 설정할까요? (7일 / 30일 / 90일)",
            QuestionCategory.IMPLEMENTATION);
        createAIQuestion(chartTodo,
            "차트 색상 팔레트를 선택해야 합니다. 브랜드 아이덴티티와 접근성을 고려합니다.",
            "차트 색상으로 브랜드 컬러(보라색 계열)와 범용 컬러(파란색 계열) 중 어떤 것을 사용할까요?",
            QuestionCategory.IMPLEMENTATION);

        // 알림 시스템 구축 - 40% (2 woven, 2 threading, 2 pending)
        Mission m48 = createMission(workspace, "알림 시스템 구축",
            "실시간 인앱 알림, 이메일 알림, 슬랙 웹훅 연동",
            MissionStatus.THREADING, Priority.MEDIUM, 40);
        m48.setStartedAt(LocalDateTime.now().minusHours(6));
        missionRepository.save(m48);

        createTodo(m48, "알림 아키텍처 설계", TodoStatus.WOVEN, Complexity.MEDIUM, 0, 60);
        createTodo(m48, "알림 DB 스키마 설계", TodoStatus.WOVEN, Complexity.LOW, 1, 30);
        Todo notiTodo1 = createTodo(m48, "WebSocket 실시간 알림", TodoStatus.THREADING, Complexity.HIGH, 2, 150);
        Todo notiTodo2 = createTodo(m48, "이메일 알림 서비스", TodoStatus.THREADING, Complexity.MEDIUM, 3, 90);
        createTodo(m48, "슬랙 웹훅 연동", TodoStatus.PENDING, Complexity.MEDIUM, 4, 60);
        createTodo(m48, "알림 설정 UI", TodoStatus.PENDING, Complexity.LOW, 5, 45);

        // AI Questions for 알림 시스템
        createAIQuestion(notiTodo1,
            "실시간 알림의 재연결 전략을 결정해야 합니다. 서버 부하와 사용자 경험의 균형이 필요합니다.",
            "WebSocket 연결 끊김 시 재연결 간격을 어떻게 설정할까요? (즉시 / 지수 백오프 / 고정 5초)",
            QuestionCategory.ARCHITECTURE);
        createAIQuestion(notiTodo2,
            "이메일 발송 서비스를 선택해야 합니다. 비용과 전송률을 고려합니다.",
            "이메일 발송에 AWS SES와 SendGrid 중 어떤 서비스를 사용할까요?",
            QuestionCategory.CONFIGURATION);

        // 파일 업로드 기능 - 30% (1 woven, 2 threading, 2 pending)
        Mission m49 = createMission(workspace, "파일 업로드 시스템",
            "S3 Presigned URL 업로드, 이미지 리사이징, 바이러스 스캔",
            MissionStatus.THREADING, Priority.LOW, 30);
        m49.setStartedAt(LocalDateTime.now().minusHours(4));
        missionRepository.save(m49);

        createTodo(m49, "S3 버킷 설정", TodoStatus.WOVEN, Complexity.LOW, 0, 30);
        Todo fileTodo1 = createTodo(m49, "Presigned URL 생성 API", TodoStatus.THREADING, Complexity.MEDIUM, 1, 60);
        Todo fileTodo2 = createTodo(m49, "이미지 썸네일 생성", TodoStatus.THREADING, Complexity.MEDIUM, 2, 90);
        createTodo(m49, "파일 타입 검증", TodoStatus.PENDING, Complexity.LOW, 3, 30);
        createTodo(m49, "업로드 진행률 UI", TodoStatus.PENDING, Complexity.MEDIUM, 4, 60);

        // AI Questions for 파일 업로드
        createAIQuestion(fileTodo1,
            "Presigned URL의 만료 시간을 설정해야 합니다. 보안과 사용자 편의성을 고려합니다.",
            "Presigned URL 만료 시간을 얼마로 설정할까요? (5분 / 15분 / 1시간)",
            QuestionCategory.SECURITY);
        createAIQuestion(fileTodo2,
            "이미지 썸네일 크기를 결정해야 합니다. 저장 공간과 화질의 균형이 필요합니다.",
            "썸네일 크기로 어떤 옵션을 사용할까요? (150x150 / 300x300 / 둘 다 생성)",
            QuestionCategory.CONFIGURATION);

        // ============ WOVEN (2개) ============

        // API 성능 최적화 - 100%
        Mission m40 = createMission(workspace, "API 성능 최적화",
            "Redis 캐싱 도입으로 응답 시간 70% 개선, N+1 쿼리 해결",
            MissionStatus.WOVEN, Priority.HIGH, 100);
        m40.setStartedAt(LocalDateTime.now().minusDays(7));
        m40.setCompletedAt(LocalDateTime.now().minusDays(2));
        missionRepository.save(m40);
        createCompletedTodos(m40, new String[]{
            "현재 성능 벤치마크 측정", "병목 구간 APM 분석", "Redis 캐시 레이어 추가",
            "N+1 쿼리 최적화", "DB 인덱스 튜닝", "Connection Pool 최적화",
            "비동기 처리 도입", "CDN 설정", "Gzip 압축 적용",
            "k6 로드 테스트", "Grafana 모니터링 대시보드", "성능 개선 문서화"
        });

        // CI/CD 파이프라인 - 100%
        Mission m41 = createMission(workspace, "CI/CD 파이프라인 구축",
            "GitHub Actions 기반 자동화, 테스트/빌드/배포 파이프라인 완성",
            MissionStatus.WOVEN, Priority.MEDIUM, 100);
        m41.setStartedAt(LocalDateTime.now().minusDays(14));
        m41.setCompletedAt(LocalDateTime.now().minusDays(7));
        missionRepository.save(m41);
        createCompletedTodos(m41, new String[]{
            "GitHub Actions 워크플로우 설정", "Jest 자동 테스트 파이프라인",
            "ESLint + Prettier 자동 검사", "SonarQube 정적 분석 연동",
            "Docker 이미지 빌드 자동화", "스테이징 자동 배포",
            "프로덕션 배포 파이프라인", "슬랙 알림 연동"
        });

        // ============ ARCHIVED (1개) ============

        // 프로젝트 초기 설정 - 100%
        Mission m35 = createMission(workspace, "프로젝트 초기 설정",
            "Spring Boot 3.2 + React 18 + TypeScript 프로젝트 셋업 완료",
            MissionStatus.ARCHIVED, Priority.HIGH, 100);
        m35.setStartedAt(LocalDateTime.now().minusWeeks(4));
        m35.setCompletedAt(LocalDateTime.now().minusWeeks(2));
        missionRepository.save(m35);
        createCompletedTodos(m35, new String[]{
            "Spring Boot 프로젝트 생성", "React + Vite 프로젝트 생성",
            "PostgreSQL 스키마 설계", "JPA 엔티티 클래스 작성",
            "Repository 레이어 구현", "Service 레이어 구현",
            "REST Controller 구현", "Swagger API 문서화",
            "Logback 로깅 설정", "전역 예외 처리 구현",
            "Spring Security 설정", "환경 변수 관리",
            "Docker Compose 설정", "개발 환경 가이드 작성", "README 작성"
        });
    }

    private Mission createMission(Workspace workspace, String title, String description,
                                   MissionStatus status, Priority priority, int progress) {
        Mission mission = Mission.builder()
                .workspace(workspace)
                .title(title)
                .description(description)
                .status(status)
                .priority(priority)
                .progress(progress)
                .build();
        return missionRepository.save(mission);
    }

    private void createTodosForMission(Mission mission, String[] titles, TodoStatus status) {
        Complexity[] complexities = {Complexity.LOW, Complexity.MEDIUM, Complexity.HIGH};
        int[] times = {30, 60, 90, 120, 45, 75, 150, 180};
        for (int i = 0; i < titles.length; i++) {
            createTodo(mission, titles[i], status, complexities[i % 3], i, times[i % 8]);
        }
    }

    private Todo createTodo(Mission mission, String title, TodoStatus status,
                            Complexity complexity, int orderIndex, int estimatedMinutes) {
        return createTodo(mission, null, title, status, complexity, orderIndex, estimatedMinutes);
    }

    private Todo createTodo(Mission mission, Project project, String title, TodoStatus status,
                            Complexity complexity, int orderIndex, int estimatedMinutes) {
        Todo todo = Todo.builder()
                .mission(mission)
                .project(project)
                .title(title)
                .description(generateDescription(title))
                .status(status)
                .priority(mission.getPriority())
                .complexity(complexity)
                .orderIndex(orderIndex)
                .estimatedTime(estimatedMinutes)
                .startedAt(status == TodoStatus.THREADING || status == TodoStatus.WOVEN ?
                    LocalDateTime.now().minusHours(orderIndex + 1) : null)
                .completedAt(status == TodoStatus.WOVEN ?
                    LocalDateTime.now().minusMinutes(orderIndex * 15) : null)
                .build();
        todo.initializeSteps();

        // Update step statuses based on todo status
        if (status == TodoStatus.WOVEN) {
            todo.getSteps().forEach(step -> {
                step.setStatus(StepStatus.COMPLETED);
                step.setCompletedAt(LocalDateTime.now().minusMinutes(10));
            });
        } else if (status == TodoStatus.THREADING) {
            List<TodoStep> steps = todo.getSteps();
            int completedSteps = 2 + (orderIndex % 2); // 2-3 completed steps
            for (int i = 0; i < steps.size(); i++) {
                if (i < completedSteps) {
                    steps.get(i).setStatus(StepStatus.COMPLETED);
                    steps.get(i).setCompletedAt(LocalDateTime.now().minusMinutes(30 - i * 5));
                } else if (i == completedSteps) {
                    steps.get(i).setStatus(StepStatus.IN_PROGRESS);
                    steps.get(i).setStartedAt(LocalDateTime.now().minusMinutes(10));
                }
            }
        }

        return todoRepository.save(todo);
    }

    private String generateDescription(String title) {
        return title + "에 대한 상세 작업입니다. 관련 문서와 레퍼런스를 참고하여 진행합니다.";
    }

    private void createCompletedTodos(Mission mission, String[] titles) {
        Complexity[] complexities = {Complexity.LOW, Complexity.MEDIUM, Complexity.HIGH};
        int[] times = {30, 45, 60, 90, 120};
        for (int i = 0; i < titles.length; i++) {
            createTodo(mission, titles[i], TodoStatus.WOVEN, complexities[i % 3], i, times[i % 5]);
        }
    }

    private void createAIQuestion(Todo todo, String context, String question, QuestionCategory category) {
        AIQuestion aiQuestion = AIQuestion.builder()
                .todo(todo)
                .context(context)
                .question(question)
                .category(category)
                .build();
        aiQuestionRepository.save(aiQuestion);
    }

    private void createTimelineEvents(Workspace workspace) {
        // 최근 이벤트들 (다양한 타입)
        createEvent(workspace, EventType.AI_QUESTION, ActorType.AI,
            "AI가 세션 만료 시간 설정에 대해 질문했습니다", 0);
        createEvent(workspace, EventType.AI_QUESTION, ActorType.AI,
            "AI가 이메일 발송 서비스 선택에 대해 질문했습니다", 1);
        createEvent(workspace, EventType.TODO_STARTED, ActorType.AI,
            "AI가 '로그인/로그아웃 API 구현'을 시작했습니다", 2);
        createEvent(workspace, EventType.STEP_COMPLETED, ActorType.AI,
            "'JWT 토큰 발급/검증 구현' - Implementation 단계 완료", 3);
        createEvent(workspace, EventType.TODO_COMPLETED, ActorType.AI,
            "'JWT 토큰 설계 문서 작성'이 완료되었습니다", 4);
        createEvent(workspace, EventType.AI_QUESTION, ActorType.AI,
            "AI가 차트 기본 조회 기간에 대해 질문했습니다", 5);
        createEvent(workspace, EventType.MISSION_STARTED, ActorType.SYSTEM,
            "'알림 시스템 구축' Mission이 시작되었습니다", 6);
        createEvent(workspace, EventType.TODO_STARTED, ActorType.AI,
            "AI가 'WebSocket 실시간 알림'을 시작했습니다", 8);
        createEvent(workspace, EventType.STEP_COMPLETED, ActorType.AI,
            "'매출 현황 차트 구현' - Design 단계 완료", 12);
        createEvent(workspace, EventType.MISSION_STARTED, ActorType.SYSTEM,
            "'로그인 기능 구현' Mission이 시작되었습니다", 8);
        createEvent(workspace, EventType.MISSION_COMPLETED, ActorType.AI,
            "'API 성능 최적화'가 완료되었습니다 - 응답 시간 70% 개선!", 48);
        createEvent(workspace, EventType.TODO_COMPLETED, ActorType.AI,
            "'Redis 캐시 레이어 추가'가 완료되었습니다", 50);
        createEvent(workspace, EventType.MISSION_COMPLETED, ActorType.AI,
            "'CI/CD 파이프라인 구축'이 완료되었습니다", 168);
        createEvent(workspace, EventType.MISSION_CREATED, ActorType.USER,
            "'결제 시스템 연동' Mission이 생성되었습니다", 200);
        createEvent(workspace, EventType.MISSION_CREATED, ActorType.USER,
            "'검색 기능 고도화' Mission이 생성되었습니다", 240);
    }

    private void createEvent(Workspace workspace, EventType eventType,
                             ActorType actorType, String description, int hoursAgo) {
        TimelineEvent event = TimelineEvent.builder()
                .workspace(workspace)
                .eventType(eventType)
                .actorType(actorType)
                .description(description)
                .build();
        timelineEventRepository.save(event);
    }
}
