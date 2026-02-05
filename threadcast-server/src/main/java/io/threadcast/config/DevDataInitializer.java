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
import java.util.HashSet;
import java.util.List;

/**
 * Dev/Local 프로필용 초기 데이터 생성
 * - dev: H2 인메모리, 매번 실행
 * - local: PostgreSQL, 데이터 없을 때만 실행
 */
@Slf4j
@Component
@Profile({"dev", "local"})
@RequiredArgsConstructor
public class DevDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;
    private final MissionRepository missionRepository;
    private final TodoRepository todoRepository;
    private final JiraIntegrationRepository jiraIntegrationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // PostgreSQL(local 프로필)에서 이미 데이터가 있으면 건너뛰기
        if (userRepository.existsByEmail("dev@threadcast.io")) {
            log.info("========================================");
            log.info("   Dev 데이터 이미 존재 - 초기화 건너뜀");
            log.info("   계정: dev@threadcast.io / dev1234");
            log.info("========================================");
            return;
        }

        log.info("========================================");
        log.info("   ThreadCast Dev 데이터 초기화 시작");
        log.info("========================================");

        User user = createUser();
        Workspace workspace = createWorkspace(user);
        createProjects(workspace);
        createThreadCastMissions(workspace);
        createJiraIntegration(workspace);

        log.info("========================================");
        log.info("   Dev 데이터 초기화 완료!");
        log.info("   계정: dev@threadcast.io / dev1234");
        log.info("   워크스페이스: ThreadCast Development");
        log.info("   JIRA: whatap-labs.atlassian.net 연동됨");
        log.info("========================================");
    }

    private User createUser() {
        User user = User.builder()
                .email("dev@threadcast.io")
                .passwordHash(passwordEncoder.encode("dev1234"))
                .name("Dev User")
                .avatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=dev")
                .autonomyLevel(3)
                .build();
        return userRepository.save(user);
    }

    private Workspace createWorkspace(User owner) {
        String homePath = System.getProperty("user.home");
        Workspace workspace = Workspace.builder()
                .name("ThreadCast Development")
                .description("ThreadCast AI 코딩 어시스턴트 프로젝트")
                .path(homePath + "/threadcast")
                .owner(owner)
                .autonomy(50)
                .build();
        return workspaceRepository.save(workspace);
    }

    private void createProjects(Workspace workspace) {
        Project serverProject = Project.builder()
                .workspace(workspace)
                .name("threadcast-server")
                .description("Spring Boot 백엔드 API 서버 - REST API, WebSocket, JPA")
                .path("./threadcast-server")
                .language("Java")
                .buildTool("Gradle")
                .build();
        projectRepository.save(serverProject);

        Project webProject = Project.builder()
                .workspace(workspace)
                .name("threadcast-web")
                .description("React 프론트엔드 - TypeScript, Zustand, TailwindCSS")
                .path("./threadcast-web")
                .language("TypeScript")
                .buildTool("Vite")
                .build();
        projectRepository.save(webProject);

        Project mcpProject = Project.builder()
                .workspace(workspace)
                .name("threadcast-mcp")
                .description("MCP Server - Claude Code 연동용 Model Context Protocol")
                .path("./threadcast-mcp")
                .language("TypeScript")
                .buildTool("npm")
                .build();
        projectRepository.save(mcpProject);
    }

    private void createThreadCastMissions(Workspace workspace) {
        // ========================================
        // Mission 1: Todo 의존성 그래프 (WOVEN - 완료)
        // ========================================
        Mission mission1 = Mission.builder()
                .workspace(workspace)
                .title("Todo 의존성 그래프 시각화")
                .description("## 목표\nTodo 간 의존성 관계를 DAG 그래프로 시각화\n\n## 구현 내용\n- React Flow 기반 그래프 뷰\n- 드래그로 의존성 연결\n- Fan-out/Fan-in 패턴 지원")
                .status(MissionStatus.WOVEN)
                .priority(Priority.HIGH)
                .progress(100)
                .startedAt(LocalDateTime.now().minusDays(5))
                .completedAt(LocalDateTime.now().minusDays(1))
                .autoStartEnabled(true)
                .build();
        missionRepository.save(mission1);

        Todo todo1_1 = createTodoWithSteps(mission1, "백엔드 의존성 API 구현",
            "TodoController에 PATCH /dependencies 엔드포인트 추가",
            TodoStatus.WOVEN, Complexity.MEDIUM, 0);
        Todo todo1_2 = createTodoWithSteps(mission1, "순환 의존성 탐지",
            "DFS 알고리즘으로 순환 참조 검증",
            TodoStatus.WOVEN, Complexity.HIGH, 1);
        Todo todo1_3 = createTodoWithSteps(mission1, "React Flow 그래프 컴포넌트",
            "TodoGraph.tsx - DAG 시각화 구현",
            TodoStatus.WOVEN, Complexity.HIGH, 2);
        Todo todo1_4 = createTodoWithSteps(mission1, "그래프 노드 커스터마이징",
            "TodoGraphNode.tsx - 상태별 색상, 블록 표시",
            TodoStatus.WOVEN, Complexity.MEDIUM, 3);

        // 의존성 설정: 1_2는 1_1에 의존, 1_3은 1_1에 의존, 1_4는 1_3에 의존
        todo1_2.setDependencies(new HashSet<>(List.of(todo1_1)));
        todo1_3.setDependencies(new HashSet<>(List.of(todo1_1)));
        todo1_4.setDependencies(new HashSet<>(List.of(todo1_3)));
        todoRepository.saveAll(List.of(todo1_1, todo1_2, todo1_3, todo1_4));

        // ========================================
        // Mission 2: 실시간 알림 시스템 (THREADING - 진행중)
        // ========================================
        Mission mission2 = Mission.builder()
                .workspace(workspace)
                .title("실시간 알림 시스템 구현")
                .description("## 목표\nWebSocket 기반 실시간 알림\n\n## 요구사항\n- Todo 상태 변경 실시간 반영\n- AI 질문 생성 시 알림\n- 토스트 UI 컴포넌트")
                .status(MissionStatus.THREADING)
                .priority(Priority.HIGH)
                .progress(40)
                .startedAt(LocalDateTime.now().minusHours(6))
                .autoStartEnabled(true)
                .build();
        missionRepository.save(mission2);

        Todo todo2_1 = createTodoWithSteps(mission2, "WebSocket 연결 설정",
            "Spring WebSocket + STOMP 프로토콜 설정\n- WebSocketConfig.java\n- /topic/workspaces/{id} 구독",
            TodoStatus.WOVEN, Complexity.MEDIUM, 0);
        Todo todo2_2 = createTodoWithSteps(mission2, "이벤트 타입 정의",
            "WebSocket 메시지 타입 enum 정의\n- MISSION_CREATED\n- TODO_STATUS_CHANGED\n- AI_QUESTION_CREATED",
            TodoStatus.WOVEN, Complexity.LOW, 1);
        Todo todo2_3 = createTodoWithSteps(mission2, "WebSocketService 구현",
            "실시간 이벤트 발송 서비스\n- notifyMissionCreated()\n- notifyTodoStatusChanged()",
            TodoStatus.THREADING, Complexity.MEDIUM, 2);
        Todo todo2_4 = createTodoWithSteps(mission2, "프론트엔드 WebSocket 훅",
            "useWebSocket.ts 구현\n- 연결/재연결 로직\n- 이벤트 핸들러 등록",
            TodoStatus.PENDING, Complexity.MEDIUM, 3);
        Todo todo2_5 = createTodoWithSteps(mission2, "토스트 알림 UI",
            "Toast.tsx 컴포넌트\n- 성공/에러/경고 스타일\n- 자동 사라짐 애니메이션",
            TodoStatus.PENDING, Complexity.LOW, 4);

        // 의존성: Fan-out (2_1 → 2_2, 2_3), Fan-in (2_3, 2_4 → 2_5)
        todo2_2.setDependencies(new HashSet<>(List.of(todo2_1)));
        todo2_3.setDependencies(new HashSet<>(List.of(todo2_1, todo2_2)));
        todo2_4.setDependencies(new HashSet<>(List.of(todo2_1)));
        todo2_5.setDependencies(new HashSet<>(List.of(todo2_3, todo2_4)));
        todoRepository.saveAll(List.of(todo2_1, todo2_2, todo2_3, todo2_4, todo2_5));

        // ========================================
        // Mission 3: AI 자율성 기반 질문 시스템 (THREADING)
        // ========================================
        Mission mission3 = Mission.builder()
                .workspace(workspace)
                .title("AI Autonomy 기반 질문 시스템")
                .description("## 목표\nAutonomy 레벨에 따라 AI가 질문 생성\n\n## Autonomy 레벨\n- 0-30: 모든 결정에 질문\n- 31-70: 주요 결정만 질문\n- 71-100: 자율 결정")
                .status(MissionStatus.THREADING)
                .priority(Priority.CRITICAL)
                .progress(25)
                .startedAt(LocalDateTime.now().minusHours(2))
                .autoStartEnabled(true)
                .build();
        missionRepository.save(mission3);

        Todo todo3_1 = createTodoWithSteps(mission3, "Workspace.autonomy 필드 추가",
            "Workspace 도메인에 autonomy (0-100) 필드 추가",
            TodoStatus.WOVEN, Complexity.LOW, 0);
        Todo todo3_2 = createTodoWithSteps(mission3, "Workspace Settings API",
            "GET/PUT /api/workspaces/{id}/settings 엔드포인트",
            TodoStatus.THREADING, Complexity.MEDIUM, 1);
        Todo todo3_3 = createTodoWithSteps(mission3, "AI Question 생성 API",
            "POST /api/ai-questions 엔드포인트\n- category: TECHNICAL, DESIGN_DECISION, SCOPE 등",
            TodoStatus.PENDING, Complexity.MEDIUM, 2);
        Todo todo3_4 = createTodoWithSteps(mission3, "MCP Tool 확장",
            "threadcast_create_ai_question\nthreadcast_get_workspace_settings",
            TodoStatus.PENDING, Complexity.MEDIUM, 3);
        Todo todo3_5 = createTodoWithSteps(mission3, "AI Question 패널 UI",
            "AIQuestionPanel.tsx 개선\n- Autonomy 레벨 표시\n- 일괄 응답 기능",
            TodoStatus.PENDING, Complexity.HIGH, 4);

        // 순차 의존성
        todo3_2.setDependencies(new HashSet<>(List.of(todo3_1)));
        todo3_3.setDependencies(new HashSet<>(List.of(todo3_2)));
        todo3_4.setDependencies(new HashSet<>(List.of(todo3_2, todo3_3)));
        todo3_5.setDependencies(new HashSet<>(List.of(todo3_3)));
        todoRepository.saveAll(List.of(todo3_1, todo3_2, todo3_3, todo3_4, todo3_5));

        // ========================================
        // Mission 4: MCP PM Agent 연동 (BACKLOG)
        // ========================================
        Mission mission4 = Mission.builder()
                .workspace(workspace)
                .title("MCP PM Agent 연동")
                .description("## 목표\nPM Agent가 MCP를 통해 ThreadCast와 연동\n\n## 기능\n- Mission/Todo CRUD\n- Step 상태 업데이트\n- AI Question 생성/응답")
                .status(MissionStatus.BACKLOG)
                .priority(Priority.HIGH)
                .progress(0)
                .autoStartEnabled(true)
                .build();
        missionRepository.save(mission4);

        Todo todo4_1 = createTodoWithSteps(mission4, "MCP Server 기본 구조",
            "threadcast-mcp 프로젝트 셋업\n- @modelcontextprotocol/sdk 사용",
            TodoStatus.PENDING, Complexity.MEDIUM, 0);
        Todo todo4_2 = createTodoWithSteps(mission4, "인증 Tool 구현",
            "threadcast_login\n- 자동 로그인 기능",
            TodoStatus.PENDING, Complexity.LOW, 1);
        Todo todo4_3 = createTodoWithSteps(mission4, "Mission/Todo Tool 구현",
            "threadcast_list_missions\nthreadcast_create_todo\nthreadcast_update_status",
            TodoStatus.PENDING, Complexity.MEDIUM, 2);
        Todo todo4_4 = createTodoWithSteps(mission4, "Step Progress Tool",
            "threadcast_update_step_status\n- ANALYSIS → DESIGN → IMPLEMENTATION...",
            TodoStatus.PENDING, Complexity.MEDIUM, 3);
        Todo todo4_5 = createTodoWithSteps(mission4, "PM Agent 프롬프트 작성",
            "PM_CLAUDE.md\n- Step 워크플로우 정의\n- Hook 처리 로직",
            TodoStatus.PENDING, Complexity.HIGH, 4);

        todo4_2.setDependencies(new HashSet<>(List.of(todo4_1)));
        todo4_3.setDependencies(new HashSet<>(List.of(todo4_1, todo4_2)));
        todo4_4.setDependencies(new HashSet<>(List.of(todo4_3)));
        todo4_5.setDependencies(new HashSet<>(List.of(todo4_3, todo4_4)));
        todoRepository.saveAll(List.of(todo4_1, todo4_2, todo4_3, todo4_4, todo4_5));

        // ========================================
        // Mission 5: 프로젝트 대시보드 (BACKLOG)
        // ========================================
        Mission mission5 = Mission.builder()
                .workspace(workspace)
                .title("프로젝트 대시보드 개선")
                .description("## 목표\n프로젝트별 진행 상황 한눈에 파악\n\n## 기능\n- Mission/Todo 통계\n- 최근 활동 타임라인\n- AI 작업 현황")
                .status(MissionStatus.BACKLOG)
                .priority(Priority.MEDIUM)
                .progress(0)
                .autoStartEnabled(true)
                .build();
        missionRepository.save(mission5);

        Todo todo5_1 = createTodoWithSteps(mission5, "대시보드 레이아웃 설계",
            "Figma 디자인 기반 레이아웃\n- 상단: 요약 카드\n- 중앙: Mission 보드\n- 하단: 타임라인",
            TodoStatus.PENDING, Complexity.MEDIUM, 0);
        Todo todo5_2 = createTodoWithSteps(mission5, "통계 API 구현",
            "GET /api/workspaces/{id}/stats\n- missionCount, todoCount, completionRate",
            TodoStatus.PENDING, Complexity.LOW, 1);
        Todo todo5_3 = createTodoWithSteps(mission5, "통계 카드 컴포넌트",
            "StatCard.tsx\n- 숫자 애니메이션\n- 트렌드 표시",
            TodoStatus.PENDING, Complexity.LOW, 2);
        Todo todo5_4 = createTodoWithSteps(mission5, "타임라인 통합",
            "대시보드에 최근 활동 5개 표시\n- View All 링크",
            TodoStatus.PENDING, Complexity.MEDIUM, 3);

        todo5_2.setDependencies(new HashSet<>(List.of(todo5_1)));
        todo5_3.setDependencies(new HashSet<>(List.of(todo5_1, todo5_2)));
        todo5_4.setDependencies(new HashSet<>(List.of(todo5_1)));
        todoRepository.saveAll(List.of(todo5_1, todo5_2, todo5_3, todo5_4));

        // ========================================
        // Mission 6: 검색 기능 (BACKLOG)
        // ========================================
        Mission mission6 = Mission.builder()
                .workspace(workspace)
                .title("전체 검색 기능")
                .description("## 목표\nMission, Todo, Timeline 통합 검색\n\n## 기능\n- Cmd+K 단축키\n- 실시간 검색 결과\n- 최근 검색 히스토리")
                .status(MissionStatus.BACKLOG)
                .priority(Priority.LOW)
                .progress(0)
                .autoStartEnabled(false)
                .build();
        missionRepository.save(mission6);

        Todo todo6_1 = createTodoWithSteps(mission6, "검색 API 구현",
            "GET /api/search?q={query}\n- Mission, Todo 동시 검색",
            TodoStatus.PENDING, Complexity.MEDIUM, 0);
        Todo todo6_2 = createTodoWithSteps(mission6, "검색 모달 UI",
            "SearchModal.tsx\n- Cmd+K 트리거\n- 결과 미리보기",
            TodoStatus.PENDING, Complexity.MEDIUM, 1);
        Todo todo6_3 = createTodoWithSteps(mission6, "검색 히스토리",
            "localStorage 기반 최근 검색어 저장",
            TodoStatus.PENDING, Complexity.LOW, 2);

        todo6_2.setDependencies(new HashSet<>(List.of(todo6_1)));
        todo6_3.setDependencies(new HashSet<>(List.of(todo6_2)));
        todoRepository.saveAll(List.of(todo6_1, todo6_2, todo6_3));

        log.info("   ThreadCast Mission 6개, Todo 27개 생성 완료");
        log.info("   - Todo 의존성 그래프 시각화 (WOVEN)");
        log.info("   - 실시간 알림 시스템 구현 (THREADING)");
        log.info("   - AI Autonomy 기반 질문 시스템 (THREADING)");
        log.info("   - MCP PM Agent 연동 (BACKLOG)");
        log.info("   - 프로젝트 대시보드 개선 (BACKLOG)");
        log.info("   - 전체 검색 기능 (BACKLOG)");
    }

    private Todo createTodoWithSteps(Mission mission, String title, String description,
                                      TodoStatus status, Complexity complexity, int orderIndex) {
        Todo todo = Todo.builder()
                .mission(mission)
                .title(title)
                .description(description)
                .status(status)
                .priority(mission.getPriority())
                .complexity(complexity)
                .orderIndex(orderIndex)
                .estimatedTime(complexity == Complexity.HIGH ? 120 : complexity == Complexity.MEDIUM ? 60 : 30)
                .startedAt(status == TodoStatus.THREADING || status == TodoStatus.WOVEN ?
                    LocalDateTime.now().minusHours(orderIndex + 1) : null)
                .completedAt(status == TodoStatus.WOVEN ?
                    LocalDateTime.now().minusMinutes(orderIndex * 15) : null)
                .build();
        todo.initializeSteps();

        // WOVEN 상태면 모든 스텝 완료 처리
        if (status == TodoStatus.WOVEN) {
            todo.getSteps().forEach(step -> {
                step.setStatus(StepStatus.COMPLETED);
                step.setCompletedAt(LocalDateTime.now().minusMinutes(10));
            });
        }
        // THREADING 상태면 일부 스텝 진행 중
        else if (status == TodoStatus.THREADING) {
            int i = 0;
            for (TodoStep step : todo.getSteps()) {
                if (i < 2) {
                    step.setStatus(StepStatus.COMPLETED);
                    step.setCompletedAt(LocalDateTime.now().minusMinutes(30 - i * 10));
                } else if (i == 2) {
                    step.setStatus(StepStatus.IN_PROGRESS);
                    step.setStartedAt(LocalDateTime.now().minusMinutes(5));
                }
                i++;
            }
        }

        return todoRepository.save(todo);
    }

    /**
     * JIRA 연동 초기 데이터 생성 (WhatAp Labs)
     */
    private void createJiraIntegration(Workspace workspace) {
        JiraIntegration jiraIntegration = JiraIntegration.createCloudApiToken(
                workspace,
                "https://whatap-labs.atlassian.net",
                "devload@whatap.io",
                "your-jira-api-token-here"
        );
        jiraIntegrationRepository.save(jiraIntegration);
        log.info("   JIRA 연동 생성: whatap-labs.atlassian.net (devload@whatap.io)");
    }
}
