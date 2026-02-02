#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";

// ThreadCast API Configuration
const API_BASE_URL = process.env.THREADCAST_API_URL || "http://localhost:21000/api";
const DEFAULT_WORKSPACE_ID = process.env.THREADCAST_WORKSPACE_ID || "default";
const AUTH_EMAIL = process.env.THREADCAST_EMAIL || "test@threadcast.io";
const AUTH_PASSWORD = process.env.THREADCAST_PASSWORD || "test1234";

// API Client
class ThreadCastClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    });
  }

  setToken(token: string) {
    this.token = token;
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.client.post("/auth/login", { email, password });
    this.setToken(res.data.data.accessToken);
    return res.data.data;
  }

  async register(email: string, password: string, name: string) {
    const res = await this.client.post("/auth/register", { email, password, name });
    this.setToken(res.data.data.accessToken);
    return res.data.data;
  }

  async autoLogin(): Promise<boolean> {
    try {
      // Try login first
      await this.login(AUTH_EMAIL, AUTH_PASSWORD);
      return true;
    } catch {
      try {
        // If login fails, try register
        await this.register(AUTH_EMAIL, AUTH_PASSWORD, "ThreadCast User");
        return true;
      } catch (e) {
        console.error("Auto-login failed:", e);
        return false;
      }
    }
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  // Workspaces
  async listWorkspaces() {
    const res = await this.client.get("/workspaces");
    return res.data.data;
  }

  async getWorkspace(id: string) {
    const res = await this.client.get(`/workspaces/${id}`);
    return res.data.data;
  }

  async createWorkspace(name: string, path: string, description?: string) {
    const res = await this.client.post("/workspaces", { name, path, description });
    return res.data.data;
  }

  // Missions
  async listMissions(workspaceId: string, status?: string) {
    const params: Record<string, string> = { workspaceId };
    if (status) params.status = status;
    const res = await this.client.get("/missions", { params });
    return res.data.data;
  }

  async getMission(id: string) {
    const res = await this.client.get(`/missions/${id}`);
    return res.data.data;
  }

  async createMission(workspaceId: string, title: string, description?: string, priority: string = "MEDIUM") {
    const res = await this.client.post("/missions", {
      workspaceId,
      title,
      description,
      priority,
    });
    return res.data.data;
  }

  async updateMissionStatus(id: string, status: string) {
    const res = await this.client.patch(`/missions/${id}/status`, { status });
    return res.data.data;
  }

  async updateMission(id: string, updates: { title?: string; description?: string; priority?: string }) {
    const res = await this.client.patch(`/missions/${id}`, updates);
    return res.data.data;
  }

  async startWeaving(id: string) {
    const res = await this.client.post(`/missions/${id}/start-weaving`);
    return res.data.data;
  }

  async analyzeMission(id: string) {
    const res = await this.client.post(`/missions/${id}/analyze`);
    return res.data.data;
  }

  // Todos
  async listTodos(missionId?: string) {
    const params: Record<string, string> = {};
    if (missionId) params.missionId = missionId;
    const res = await this.client.get("/todos", { params });
    return res.data.data;
  }

  async getTodo(id: string) {
    const res = await this.client.get(`/todos/${id}`);
    return res.data.data;
  }

  async createTodo(
    missionId: string,
    title: string,
    description?: string,
    complexity: string = "MEDIUM",
    estimatedTime?: number
  ) {
    const res = await this.client.post("/todos", {
      missionId,
      title,
      description,
      complexity,
      estimatedTime,
    });
    return res.data.data;
  }

  async updateTodoStatus(id: string, status: string) {
    const res = await this.client.patch(`/todos/${id}/status`, { status });
    return res.data.data;
  }

  async updateStepStatus(todoId: string, stepType: string, status: string) {
    const res = await this.client.patch(`/todos/${todoId}/steps/${stepType}`, { status });
    return res.data.data;
  }

  // AI Questions
  async listAIQuestions(workspaceId?: string) {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;
    const res = await this.client.get("/ai-questions", { params });
    return res.data.data || [];
  }

  async answerQuestion(questionId: string, answer: string) {
    const res = await this.client.post(`/ai-questions/${questionId}/answer`, { answer });
    return res.data.data;
  }

  async skipQuestion(questionId: string) {
    const res = await this.client.post(`/ai-questions/${questionId}/skip`);
    return res.data.data;
  }

  async createAIQuestion(
    todoId: string,
    question: string,
    category: string = "CLARIFICATION",
    options?: string[]
  ) {
    const res = await this.client.post("/ai-questions", {
      todoId,
      question,
      category,
      options,
    });
    return res.data.data;
  }

  // Workspace Settings
  async getWorkspaceSettings(workspaceId: string) {
    const res = await this.client.get(`/workspaces/${workspaceId}/settings`);
    return res.data.data;
  }

  // Todo Dependencies
  async updateTodoDependencies(todoId: string, dependencies: string[]) {
    const res = await this.client.patch(`/todos/${todoId}/dependencies`, { dependencies });
    return res.data.data;
  }

  async getReadyTodos(missionId: string) {
    const res = await this.client.get("/todos/ready", { params: { missionId } });
    return res.data.data;
  }

  // Timeline
  async getTimeline(workspaceId: string, limit: number = 20) {
    const res = await this.client.get("/timeline", {
      params: { workspaceId, size: limit },
    });
    return res.data.data?.content || res.data.data || [];
  }

  // Hub (Start Worker)
  async startWorker(todoId: string) {
    const res = await this.client.post(`/hub/todos/${todoId}/start-worker`);
    return res.data.data;
  }

  async stopWorker(todoId: string) {
    const res = await this.client.post(`/hub/todos/${todoId}/stop-worker`);
    return res.data.data;
  }

  // AI Mission Generation
  async generateMissionFromPrompt(prompt: string): Promise<GeneratedMission> {
    const lowerPrompt = prompt.toLowerCase();

    // Find matching template
    const matchedTemplate = MISSION_TEMPLATES.find((template) =>
      template.keywords.some((keyword) => lowerPrompt.includes(keyword.toLowerCase()))
    );

    const template = matchedTemplate || DEFAULT_MISSION_TEMPLATE;

    // Customize title if default template
    let title = template.title;
    let description = template.description;

    if (!matchedTemplate) {
      title = prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt;
      description = `## 목표\n${prompt}\n\n## 요구사항\n- 상세 요구사항 분석 필요\n- 설계 및 구현\n- 테스트 및 검증`;
    }

    return {
      title,
      description,
      priority: template.priority,
      suggestedTodos: template.todos,
    };
  }

  async createMissionWithTodos(
    workspaceId: string,
    mission: GeneratedMission,
    createQuestionsForUncertain: boolean = true
  ): Promise<{ mission: unknown; todos: unknown[]; questions: unknown[] }> {
    // Create the mission
    const createdMission = await this.createMission(
      workspaceId,
      mission.title,
      mission.description,
      mission.priority
    );

    // Create todos
    const createdTodos: unknown[] = [];
    const createdQuestions: unknown[] = [];

    for (const todo of mission.suggestedTodos) {
      const created = await this.createTodo(
        createdMission.id,
        todo.title,
        todo.description,
        todo.complexity,
        todo.estimatedTime
      );
      createdTodos.push(created);

      // Check if this todo has uncertainty and create AI question
      if (createQuestionsForUncertain && todo.isUncertain && todo.uncertainQuestion) {
        try {
          const question = await this.createAIQuestion(
            (created as { id: string }).id,
            todo.uncertainQuestion,
            "DESIGN_DECISION",
            todo.uncertainOptions
          );
          createdQuestions.push(question);
        } catch (e) {
          console.error("Failed to create AI question:", e);
        }
      }
    }

    return { mission: createdMission, todos: createdTodos, questions: createdQuestions };
  }
}

// AI Mission Generation Types and Templates
interface GeneratedMission {
  title: string;
  description: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  suggestedTodos: Array<{
    title: string;
    description: string;
    complexity: "LOW" | "MEDIUM" | "HIGH";
    estimatedTime: number;
    dependsOn?: number[];
    isUncertain?: boolean;
    uncertainQuestion?: string;
    uncertainOptions?: string[];
  }>;
}

interface MissionTemplate {
  keywords: string[];
  title: string;
  description: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  todos: Array<{
    title: string;
    description: string;
    complexity: "LOW" | "MEDIUM" | "HIGH";
    estimatedTime: number;
    dependsOn?: number[];
    isUncertain?: boolean;
    uncertainQuestion?: string;
    uncertainOptions?: string[];
  }>;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    keywords: ["다크모드", "dark mode", "다크 모드", "테마"],
    title: "다크모드 테마 시스템 구현",
    description:
      "## 목표\n앱 전체에 다크모드 지원 추가\n\n## 요구사항\n- 시스템 설정 자동 감지\n- 수동 토글 기능\n- 설정 로컬 저장\n- 부드러운 전환 애니메이션",
    priority: "MEDIUM",
    todos: [
      {
        title: "CSS 변수 기반 테마 시스템 설계",
        description: "color, background, border 등 테마 변수 정의",
        complexity: "LOW",
        estimatedTime: 30,
        isUncertain: true,
        uncertainQuestion: "테마 색상 팔레트를 어떻게 구성할까요?",
        uncertainOptions: ["Material Design 팔레트 사용", "Tailwind 기본 색상 사용", "커스텀 브랜드 색상 정의", "기존 디자인 시스템 따르기"],
      },
      {
        title: "ThemeProvider 컨텍스트 구현",
        description: "React Context로 테마 상태 관리",
        complexity: "MEDIUM",
        estimatedTime: 45,
      },
      {
        title: "테마 토글 컴포넌트",
        description: "라이트/다크 모드 전환 버튼 UI",
        complexity: "LOW",
        estimatedTime: 20,
        dependsOn: [1],
      },
      {
        title: "시스템 설정 연동",
        description: "prefers-color-scheme 미디어 쿼리 감지",
        complexity: "LOW",
        estimatedTime: 20,
        dependsOn: [1],
      },
      {
        title: "전체 컴포넌트 테마 적용",
        description: "모든 UI 컴포넌트에 테마 변수 적용",
        complexity: "HIGH",
        estimatedTime: 120,
        dependsOn: [0, 1],
      },
    ],
  },
  {
    keywords: ["알림", "notification", "푸시", "push"],
    title: "실시간 알림 시스템 구현",
    description:
      "## 목표\n사용자에게 실시간 알림 제공\n\n## 요구사항\n- 인앱 토스트 알림\n- 알림 센터 UI\n- 읽음/안읽음 상태 관리\n- 알림 설정 페이지",
    priority: "HIGH",
    todos: [
      {
        title: "WebSocket 연결 설정",
        description: "STOMP 프로토콜 기반 실시간 연결",
        complexity: "MEDIUM",
        estimatedTime: 60,
        isUncertain: true,
        uncertainQuestion: "WebSocket 라이브러리를 어떤 것을 사용할까요?",
        uncertainOptions: ["STOMP.js (현재 프로젝트 표준)", "Socket.io", "Native WebSocket API", "SockJS + STOMP"],
      },
      {
        title: "알림 스토어 구현",
        description: "Zustand로 알림 상태 관리",
        complexity: "MEDIUM",
        estimatedTime: 45,
        dependsOn: [0],
      },
      {
        title: "토스트 알림 컴포넌트",
        description: "화면 우상단 팝업 알림 UI",
        complexity: "LOW",
        estimatedTime: 30,
        isUncertain: true,
        uncertainQuestion: "토스트 알림의 표시 위치를 어디로 할까요?",
        uncertainOptions: ["우상단 (기본)", "우하단", "상단 중앙", "하단 중앙"],
      },
      {
        title: "알림 센터 드로어",
        description: "전체 알림 목록 사이드 패널",
        complexity: "MEDIUM",
        estimatedTime: 60,
        dependsOn: [1],
      },
      {
        title: "알림 설정 페이지",
        description: "알림 유형별 on/off 설정",
        complexity: "LOW",
        estimatedTime: 45,
        dependsOn: [1],
      },
    ],
  },
  {
    keywords: ["검색", "search", "찾기"],
    title: "통합 검색 기능 구현",
    description:
      "## 목표\n전체 콘텐츠 통합 검색\n\n## 요구사항\n- Cmd+K 단축키 지원\n- 실시간 검색 결과\n- 검색 히스토리\n- 필터 및 정렬",
    priority: "MEDIUM",
    todos: [
      {
        title: "검색 API 엔드포인트 구현",
        description: "GET /api/search?q={query} 백엔드 API",
        complexity: "MEDIUM",
        estimatedTime: 60,
      },
      {
        title: "검색 모달 UI",
        description: "Cmd+K로 열리는 검색 다이얼로그",
        complexity: "MEDIUM",
        estimatedTime: 45,
      },
      {
        title: "실시간 검색 결과 표시",
        description: "debounce 적용 실시간 검색",
        complexity: "LOW",
        estimatedTime: 30,
        dependsOn: [0, 1],
      },
      {
        title: "검색 히스토리 저장",
        description: "localStorage 기반 최근 검색어",
        complexity: "LOW",
        estimatedTime: 20,
        dependsOn: [1],
      },
      {
        title: "검색 필터 구현",
        description: "타입별, 날짜별 필터링",
        complexity: "MEDIUM",
        estimatedTime: 45,
        dependsOn: [0],
      },
    ],
  },
  {
    keywords: ["로그인", "인증", "auth", "login", "회원가입"],
    title: "사용자 인증 시스템 구현",
    description:
      "## 목표\n안전한 사용자 인증 시스템\n\n## 요구사항\n- 이메일/비밀번호 로그인\n- JWT 토큰 관리\n- 소셜 로그인 (선택)\n- 비밀번호 재설정",
    priority: "CRITICAL",
    todos: [
      {
        title: "로그인/회원가입 API",
        description: "POST /auth/login, /auth/register 구현",
        complexity: "MEDIUM",
        estimatedTime: 60,
      },
      {
        title: "JWT 토큰 관리",
        description: "액세스/리프레시 토큰 발급 및 갱신",
        complexity: "HIGH",
        estimatedTime: 90,
        dependsOn: [0],
        isUncertain: true,
        uncertainQuestion: "JWT 토큰 저장 방식을 어떻게 할까요?",
        uncertainOptions: ["localStorage (편리함, XSS 취약)", "httpOnly Cookie (보안 강화)", "메모리 + Refresh Token Cookie", "sessionStorage (탭 격리)"],
      },
      {
        title: "로그인 폼 UI",
        description: "이메일, 비밀번호 입력 폼",
        complexity: "LOW",
        estimatedTime: 30,
      },
      {
        title: "인증 상태 관리",
        description: "Zustand 스토어로 로그인 상태 관리",
        complexity: "MEDIUM",
        estimatedTime: 45,
        dependsOn: [1],
      },
      {
        title: "소셜 로그인 연동",
        description: "OAuth 2.0 소셜 로그인 구현",
        complexity: "HIGH",
        estimatedTime: 90,
        dependsOn: [0],
        isUncertain: true,
        uncertainQuestion: "어떤 소셜 로그인을 지원할까요? (복수 선택 가능)",
        uncertainOptions: ["Google OAuth", "GitHub OAuth", "Kakao 로그인", "Naver 로그인", "Apple Sign-in"],
      },
      {
        title: "비밀번호 재설정",
        description: "이메일 기반 비밀번호 재설정 플로우",
        complexity: "MEDIUM",
        estimatedTime: 60,
        dependsOn: [0],
      },
    ],
  },
  {
    keywords: ["대시보드", "dashboard", "통계", "차트"],
    title: "대시보드 페이지 구현",
    description:
      "## 목표\n핵심 지표를 한눈에 파악할 수 있는 대시보드\n\n## 요구사항\n- 주요 통계 카드\n- 차트 시각화\n- 최근 활동 타임라인\n- 반응형 레이아웃",
    priority: "MEDIUM",
    todos: [
      {
        title: "통계 API 구현",
        description: "GET /api/stats 백엔드 API",
        complexity: "MEDIUM",
        estimatedTime: 45,
      },
      {
        title: "통계 카드 컴포넌트",
        description: "숫자와 트렌드 표시 카드",
        complexity: "LOW",
        estimatedTime: 30,
      },
      {
        title: "차트 컴포넌트",
        description: "Recharts 기반 라인/바 차트",
        complexity: "MEDIUM",
        estimatedTime: 60,
        dependsOn: [0],
      },
      {
        title: "대시보드 레이아웃",
        description: "Grid 기반 반응형 레이아웃",
        complexity: "LOW",
        estimatedTime: 30,
      },
      {
        title: "실시간 데이터 갱신",
        description: "WebSocket으로 실시간 업데이트",
        complexity: "HIGH",
        estimatedTime: 90,
        dependsOn: [0, 2],
      },
    ],
  },
  {
    keywords: ["api", "rest", "endpoint", "백엔드", "backend"],
    title: "REST API 엔드포인트 구현",
    description:
      "## 목표\nRESTful API 설계 및 구현\n\n## 요구사항\n- CRUD 엔드포인트\n- 입력 유효성 검증\n- 에러 핸들링\n- API 문서화",
    priority: "HIGH",
    todos: [
      {
        title: "API 스펙 문서 작성",
        description: "OpenAPI/Swagger 스펙 작성",
        complexity: "LOW",
        estimatedTime: 60,
      },
      {
        title: "CRUD 엔드포인트 구현",
        description: "기본 CRUD 작업을 위한 REST API 구현",
        complexity: "MEDIUM",
        estimatedTime: 120,
      },
      {
        title: "에러 핸들링 구현",
        description: "표준화된 에러 응답 형식 및 예외 처리",
        complexity: "MEDIUM",
        estimatedTime: 45,
        dependsOn: [1],
      },
      {
        title: "입력 유효성 검증",
        description: "요청 데이터 검증 및 변환 로직",
        complexity: "MEDIUM",
        estimatedTime: 60,
        dependsOn: [1],
      },
      {
        title: "API 테스트 작성",
        description: "통합 테스트 및 단위 테스트 작성",
        complexity: "HIGH",
        estimatedTime: 90,
        dependsOn: [1, 2, 3],
      },
    ],
  },
  {
    keywords: ["리팩토링", "refactor", "개선", "cleanup", "정리"],
    title: "코드 리팩토링",
    description:
      "## 목표\n코드 품질 개선 및 유지보수성 향상\n\n## 요구사항\n- 코드 분석\n- 컴포넌트 분리\n- 공통 유틸리티 추출\n- 테스트 커버리지 확보",
    priority: "MEDIUM",
    todos: [
      {
        title: "코드 분석 및 문제점 파악",
        description: "현재 코드베이스의 문제점과 개선 포인트 분석",
        complexity: "LOW",
        estimatedTime: 60,
      },
      {
        title: "컴포넌트 분리",
        description: "대형 컴포넌트를 작은 단위로 분리",
        complexity: "MEDIUM",
        estimatedTime: 90,
        dependsOn: [0],
      },
      {
        title: "공통 유틸리티 추출",
        description: "반복되는 로직을 유틸리티 함수로 추출",
        complexity: "MEDIUM",
        estimatedTime: 60,
        dependsOn: [0],
      },
      {
        title: "타입 정의 개선",
        description: "TypeScript 타입 정의 강화 및 정리",
        complexity: "LOW",
        estimatedTime: 45,
        dependsOn: [0],
      },
      {
        title: "테스트 커버리지 확보",
        description: "리팩토링된 코드에 대한 테스트 작성",
        complexity: "HIGH",
        estimatedTime: 120,
        dependsOn: [1, 2],
      },
    ],
  },
];

const DEFAULT_MISSION_TEMPLATE: MissionTemplate = {
  keywords: [],
  title: "새 기능 개발",
  description:
    "## 목표\n요청된 기능 구현\n\n## 요구사항\n- 요구사항 분석 필요\n- 설계 문서 작성\n- 구현 및 테스트",
  priority: "MEDIUM",
  todos: [
    {
      title: "요구사항 분석",
      description: "상세 요구사항 정리 및 범위 확정",
      complexity: "LOW",
      estimatedTime: 30,
    },
    {
      title: "기술 설계",
      description: "아키텍처 및 데이터 구조 설계",
      complexity: "MEDIUM",
      estimatedTime: 60,
    },
    {
      title: "핵심 기능 구현",
      description: "메인 로직 개발",
      complexity: "HIGH",
      estimatedTime: 120,
      dependsOn: [0, 1],
    },
    {
      title: "UI 구현",
      description: "사용자 인터페이스 개발",
      complexity: "MEDIUM",
      estimatedTime: 60,
      dependsOn: [1],
    },
    {
      title: "테스트 및 검증",
      description: "기능 테스트 및 버그 수정",
      complexity: "LOW",
      estimatedTime: 45,
      dependsOn: [2, 3],
    },
  ],
};

// MCP Server
const client = new ThreadCastClient();

const server = new Server(
  {
    name: "threadcast-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool Definitions
const tools = [
  // Auth
  {
    name: "threadcast_login",
    description: "Login to ThreadCast (usually auto-authenticated, use if needed)",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Email address" },
        password: { type: "string", description: "Password" },
      },
      required: ["email", "password"],
    },
  },
  // Workspace
  {
    name: "threadcast_list_workspaces",
    description: "List all workspaces",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "threadcast_create_workspace",
    description: "Create a new workspace",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Workspace name" },
        path: { type: "string", description: "Workspace path (e.g., ~/projects/myapp)" },
        description: { type: "string", description: "Workspace description" },
      },
      required: ["name", "path"],
    },
  },
  // Mission
  {
    name: "threadcast_list_missions",
    description: "List missions in a workspace",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
        status: { type: "string", enum: ["BACKLOG", "THREADING", "WOVEN", "ARCHIVED"], description: "Filter by status" },
      },
    },
  },
  {
    name: "threadcast_get_mission",
    description: "Get mission details by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mission ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "threadcast_create_mission",
    description: "Create a new mission",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Mission title" },
        description: { type: "string", description: "Mission description" },
        priority: { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"], default: "MEDIUM" },
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
      },
      required: ["title"],
    },
  },
  {
    name: "threadcast_update_mission_status",
    description: "Update mission status",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mission ID" },
        status: { type: "string", enum: ["BACKLOG", "THREADING", "WOVEN", "ARCHIVED"] },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "threadcast_update_mission",
    description: "Update mission details (title, description, priority)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mission ID" },
        title: { type: "string", description: "New mission title" },
        description: { type: "string", description: "New mission description" },
        priority: { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"], description: "New priority" },
      },
      required: ["id"],
    },
  },
  {
    name: "threadcast_start_weaving",
    description: "Start weaving a mission (begin AI work)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mission ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "threadcast_analyze_mission",
    description: "Analyze a mission with AI and generate todo suggestions",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mission ID" },
      },
      required: ["id"],
    },
  },
  // Todo
  {
    name: "threadcast_list_todos",
    description: "List todos (optionally filtered by mission)",
    inputSchema: {
      type: "object",
      properties: {
        missionId: { type: "string", description: "Mission ID to filter" },
      },
    },
  },
  {
    name: "threadcast_get_todo",
    description: "Get todo details by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Todo ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "threadcast_create_todo",
    description: "Create a new todo",
    inputSchema: {
      type: "object",
      properties: {
        missionId: { type: "string", description: "Mission ID" },
        title: { type: "string", description: "Todo title" },
        description: { type: "string", description: "Todo description" },
        complexity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
        estimatedTime: { type: "number", description: "Estimated time in minutes" },
      },
      required: ["missionId", "title"],
    },
  },
  {
    name: "threadcast_update_todo_status",
    description: "Update todo status",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Todo ID" },
        status: { type: "string", enum: ["PENDING", "THREADING", "WOVEN", "TANGLED", "ARCHIVED"] },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "threadcast_update_step_status",
    description: "Update a step status within a todo",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
        stepType: { type: "string", enum: ["ANALYSIS", "DESIGN", "IMPLEMENTATION", "VERIFICATION", "REVIEW", "INTEGRATION"] },
        status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"] },
      },
      required: ["todoId", "stepType", "status"],
    },
  },
  {
    name: "threadcast_start_worker",
    description: "Start AI worker for a todo (launches Claude Code)",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
      },
      required: ["todoId"],
    },
  },
  {
    name: "threadcast_stop_worker",
    description: "Stop AI worker for a todo",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID" },
      },
      required: ["todoId"],
    },
  },
  // AI Questions
  {
    name: "threadcast_list_questions",
    description: "List pending AI questions",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional)" },
      },
    },
  },
  {
    name: "threadcast_answer_question",
    description: "Answer an AI question",
    inputSchema: {
      type: "object",
      properties: {
        questionId: { type: "string", description: "Question ID" },
        answer: { type: "string", description: "Your answer" },
      },
      required: ["questionId", "answer"],
    },
  },
  {
    name: "threadcast_skip_question",
    description: "Skip an AI question (let AI decide)",
    inputSchema: {
      type: "object",
      properties: {
        questionId: { type: "string", description: "Question ID" },
      },
      required: ["questionId"],
    },
  },
  {
    name: "threadcast_create_ai_question",
    description: "Create an AI question for user clarification. The question may be auto-resolved based on workspace Autonomy level: CRITICAL categories (RISK, SECURITY) always ask the user; IMPORTANT categories (DESIGN_DECISION, SCOPE) ask at medium or low autonomy; NORMAL categories only ask at low autonomy. If autonomy is too high for the category, the question is auto-resolved using the first option.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID to associate the question with" },
        question: { type: "string", description: "The question text to ask the user" },
        category: {
          type: "string",
          enum: ["CLARIFICATION", "DESIGN_DECISION", "PRIORITY", "SCOPE", "TECHNICAL", "RISK", "SECURITY", "ARCHITECTURE"],
          description: "Question category. CRITICAL: RISK, SECURITY (always ask). IMPORTANT: ARCHITECTURE, DESIGN_DECISION, SCOPE (ask at medium/low autonomy). NORMAL: others (ask only at low autonomy).",
          default: "CLARIFICATION",
        },
        options: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of predefined answer options. First option is used for auto-resolve when autonomy is high.",
        },
      },
      required: ["todoId", "question"],
    },
  },
  // Workspace Settings
  {
    name: "threadcast_get_workspace_settings",
    description: "Get workspace settings including Autonomy level (0-100). Low autonomy means AI should ask more questions, high autonomy means AI can make decisions independently.",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
      },
    },
  },
  // Todo Dependencies
  {
    name: "threadcast_update_dependencies",
    description: "Update todo dependencies. Set which todos must be completed before this todo can start.",
    inputSchema: {
      type: "object",
      properties: {
        todoId: { type: "string", description: "Todo ID to update" },
        dependencies: {
          type: "array",
          items: { type: "string" },
          description: "List of dependency Todo IDs",
        },
      },
      required: ["todoId", "dependencies"],
    },
  },
  {
    name: "threadcast_get_ready_todos",
    description: "Get todos that are ready to start (all dependencies completed)",
    inputSchema: {
      type: "object",
      properties: {
        missionId: { type: "string", description: "Mission ID" },
      },
      required: ["missionId"],
    },
  },
  // Timeline
  {
    name: "threadcast_get_timeline",
    description: "Get recent timeline events",
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID (optional, uses default)" },
        limit: { type: "number", description: "Number of events to fetch", default: 20 },
      },
    },
  },
  // AI Mission Generation
  {
    name: "threadcast_generate_mission_ai",
    description:
      "Generate a mission with todos from a natural language prompt using AI. " +
      "Returns a preview of the generated mission and todos. " +
      "Supports keywords: 다크모드/테마, 알림/notification, 검색/search, 로그인/인증, 대시보드/통계, api/백엔드, 리팩토링 등",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Natural language description of what you want to build (e.g., '다크모드 테마 추가', '실시간 알림 시스템')",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "threadcast_create_mission_ai",
    description:
      "Create a mission with todos from a natural language prompt using AI. " +
      "This will actually create the mission and todos in the workspace. " +
      "For uncertain items, AI questions will be automatically created for user clarification. " +
      "Use threadcast_generate_mission_ai first to preview what will be created.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Natural language description of what you want to build",
        },
        workspaceId: {
          type: "string",
          description: "Workspace ID (optional, uses default)",
        },
        createQuestions: {
          type: "boolean",
          description: "Whether to create AI questions for uncertain items (default: true)",
          default: true,
        },
      },
      required: ["prompt"],
    },
  },
];

// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      // Auth
      case "threadcast_login":
        result = await client.login(args?.email as string, args?.password as string);
        break;

      // Workspace
      case "threadcast_list_workspaces":
        result = await client.listWorkspaces();
        break;
      case "threadcast_create_workspace":
        result = await client.createWorkspace(args?.name as string, args?.path as string, args?.description as string);
        break;

      // Mission
      case "threadcast_list_missions":
        result = await client.listMissions(
          (args?.workspaceId as string) || DEFAULT_WORKSPACE_ID,
          args?.status as string
        );
        break;
      case "threadcast_get_mission":
        result = await client.getMission(args?.id as string);
        break;
      case "threadcast_create_mission":
        result = await client.createMission(
          (args?.workspaceId as string) || DEFAULT_WORKSPACE_ID,
          args?.title as string,
          args?.description as string,
          (args?.priority as string) || "MEDIUM"
        );
        break;
      case "threadcast_update_mission_status":
        result = await client.updateMissionStatus(args?.id as string, args?.status as string);
        break;
      case "threadcast_update_mission":
        result = await client.updateMission(args?.id as string, {
          title: args?.title as string | undefined,
          description: args?.description as string | undefined,
          priority: args?.priority as string | undefined,
        });
        break;
      case "threadcast_start_weaving":
        result = await client.startWeaving(args?.id as string);
        break;
      case "threadcast_analyze_mission":
        result = await client.analyzeMission(args?.id as string);
        break;

      // Todo
      case "threadcast_list_todos":
        result = await client.listTodos(args?.missionId as string);
        break;
      case "threadcast_get_todo":
        result = await client.getTodo(args?.id as string);
        break;
      case "threadcast_create_todo":
        result = await client.createTodo(
          args?.missionId as string,
          args?.title as string,
          args?.description as string,
          (args?.complexity as string) || "MEDIUM",
          args?.estimatedTime as number
        );
        break;
      case "threadcast_update_todo_status":
        result = await client.updateTodoStatus(args?.id as string, args?.status as string);
        break;
      case "threadcast_update_step_status":
        result = await client.updateStepStatus(
          args?.todoId as string,
          args?.stepType as string,
          args?.status as string
        );
        break;
      case "threadcast_start_worker":
        result = await client.startWorker(args?.todoId as string);
        break;
      case "threadcast_stop_worker":
        result = await client.stopWorker(args?.todoId as string);
        break;

      // AI Questions
      case "threadcast_list_questions":
        result = await client.listAIQuestions(args?.workspaceId as string);
        break;
      case "threadcast_answer_question":
        result = await client.answerQuestion(args?.questionId as string, args?.answer as string);
        break;
      case "threadcast_skip_question":
        result = await client.skipQuestion(args?.questionId as string);
        break;
      case "threadcast_create_ai_question":
        result = await client.createAIQuestion(
          args?.todoId as string,
          args?.question as string,
          (args?.category as string) || "CLARIFICATION",
          args?.options as string[]
        );
        break;

      // Workspace Settings
      case "threadcast_get_workspace_settings":
        result = await client.getWorkspaceSettings(
          (args?.workspaceId as string) || DEFAULT_WORKSPACE_ID
        );
        break;

      // Todo Dependencies
      case "threadcast_update_dependencies":
        result = await client.updateTodoDependencies(
          args?.todoId as string,
          args?.dependencies as string[]
        );
        break;
      case "threadcast_get_ready_todos":
        result = await client.getReadyTodos(args?.missionId as string);
        break;

      // Timeline
      case "threadcast_get_timeline":
        result = await client.getTimeline(
          (args?.workspaceId as string) || DEFAULT_WORKSPACE_ID,
          (args?.limit as number) || 20
        );
        break;

      // AI Mission Generation
      case "threadcast_generate_mission_ai":
        result = await client.generateMissionFromPrompt(args?.prompt as string);
        break;
      case "threadcast_create_mission_ai": {
        const generated = await client.generateMissionFromPrompt(args?.prompt as string);
        const createResult = await client.createMissionWithTodos(
          (args?.workspaceId as string) || DEFAULT_WORKSPACE_ID,
          generated,
          args?.createQuestions !== false // default to true
        );
        result = {
          ...createResult,
          questionsCreated: createResult.questions.length,
          message: createResult.questions.length > 0
            ? `미션과 ${createResult.todos.length}개의 TODO가 생성되었습니다. ${createResult.questions.length}개의 AI 질문이 생성되어 사용자 응답을 기다리고 있습니다.`
            : `미션과 ${createResult.todos.length}개의 TODO가 생성되었습니다.`,
        };
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Resource Definitions
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "threadcast://missions",
        name: "ThreadCast Missions",
        description: "List of all missions in the default workspace",
        mimeType: "application/json",
      },
      {
        uri: "threadcast://todos",
        name: "ThreadCast Todos",
        description: "List of all todos",
        mimeType: "application/json",
      },
      {
        uri: "threadcast://questions",
        name: "ThreadCast AI Questions",
        description: "Pending AI questions waiting for answers",
        mimeType: "application/json",
      },
      {
        uri: "threadcast://timeline",
        name: "ThreadCast Timeline",
        description: "Recent activity timeline",
        mimeType: "application/json",
      },
    ],
  };
});

// Read Resource Handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    let data: unknown;

    switch (uri) {
      case "threadcast://missions":
        data = await client.listMissions(DEFAULT_WORKSPACE_ID);
        break;
      case "threadcast://todos":
        data = await client.listTodos();
        break;
      case "threadcast://questions":
        data = await client.listAIQuestions(DEFAULT_WORKSPACE_ID);
        break;
      case "threadcast://timeline":
        data = await client.getTimeline(DEFAULT_WORKSPACE_ID, 50);
        break;
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: `Error: ${errorMessage}`,
        },
      ],
    };
  }
});

// Start Server
async function main() {
  // Auto-login on startup
  const loggedIn = await client.autoLogin();
  if (loggedIn) {
    console.error("ThreadCast: Auto-authenticated successfully");
  } else {
    console.error("ThreadCast: Running without authentication - use threadcast_login tool");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ThreadCast MCP server started");
}

main().catch(console.error);
