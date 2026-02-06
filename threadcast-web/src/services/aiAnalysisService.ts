import type { Mission, AIAnalysisResult, SuggestedTodo, AIQuestionSuggestion, Complexity } from '../types';
import { DEMO_MODE } from './api';
import { workspaceAgentService, type SuggestedTodoFromAgent, type UncertainItem } from './workspaceAgentService';

// Utility function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a unique ID
const generateId = () => `suggested-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Keywords that indicate uncertainty (need user confirmation)
const UNCERTAINTY_KEYWORDS = [
  '선택', '결정', '방식', '전략', '어떤', '어느',
  'oauth', '라이브러리', '프레임워크', '연동', '통합',
  'library', 'framework', 'integration', 'choice', 'select'
];

// Check if description contains uncertainty keywords
const hasUncertainty = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return UNCERTAINTY_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
};

// Template-based mock todo generation based on mission keywords
interface TodoTemplate {
  keywords: string[];
  todos: Array<{
    title: string;
    description: string;
    complexity: Complexity;
    estimatedTime: number;
    isUncertain?: boolean;
    uncertainReason?: string;
  }>;
}

const TODO_TEMPLATES: TodoTemplate[] = [
  {
    keywords: ['로그인', '인증', 'authentication', 'login', 'auth'],
    todos: [
      { title: '로그인 폼 UI 구현', description: '이메일/비밀번호 입력 필드와 로그인 버튼 구현', complexity: 'LOW', estimatedTime: 30 },
      { title: 'JWT 토큰 관리 구현', description: '액세스 토큰과 리프레시 토큰 저장 및 갱신 로직', complexity: 'MEDIUM', estimatedTime: 60 },
      { title: 'API 엔드포인트 설계', description: '/auth/login, /auth/register, /auth/refresh 엔드포인트 설계', complexity: 'MEDIUM', estimatedTime: 45 },
      { title: '세션 관리 전략 선택', description: 'JWT vs 세션 기반 인증 방식 결정', complexity: 'HIGH', estimatedTime: 30, isUncertain: true, uncertainReason: '세션 저장 방식을 결정해야 합니다 (Redis vs 로컬 스토리지)' },
      { title: 'OAuth 연동', description: 'Google/GitHub OAuth 2.0 로그인 연동', complexity: 'HIGH', estimatedTime: 120, isUncertain: true, uncertainReason: 'OAuth 제공자 선택이 필요합니다' },
    ],
  },
  {
    keywords: ['대시보드', 'dashboard', '차트', 'chart', '통계'],
    todos: [
      { title: '차트 라이브러리 선정', description: '요구사항에 맞는 차트 라이브러리 선택', complexity: 'LOW', estimatedTime: 30, isUncertain: true, uncertainReason: 'Chart.js vs Recharts vs ApexCharts 중 선택 필요' },
      { title: '데이터 API 설계', description: '차트 데이터 조회 API 엔드포인트 설계', complexity: 'MEDIUM', estimatedTime: 45 },
      { title: '차트 컴포넌트 구현', description: '라인 차트, 바 차트, 파이 차트 컴포넌트', complexity: 'MEDIUM', estimatedTime: 90 },
      { title: '대시보드 레이아웃 구현', description: '반응형 그리드 레이아웃 및 위젯 배치', complexity: 'MEDIUM', estimatedTime: 60 },
      { title: '실시간 데이터 업데이트', description: 'WebSocket을 통한 실시간 데이터 갱신', complexity: 'HIGH', estimatedTime: 90 },
    ],
  },
  {
    keywords: ['api', 'rest', 'endpoint', '서버', 'backend'],
    todos: [
      { title: 'API 스펙 문서 작성', description: 'OpenAPI/Swagger 스펙 작성', complexity: 'LOW', estimatedTime: 60 },
      { title: 'CRUD 엔드포인트 구현', description: '기본 CRUD 작업을 위한 REST API 구현', complexity: 'MEDIUM', estimatedTime: 120 },
      { title: '에러 핸들링 구현', description: '표준화된 에러 응답 형식 및 예외 처리', complexity: 'MEDIUM', estimatedTime: 45 },
      { title: '입력 유효성 검증', description: '요청 데이터 검증 및 변환 로직', complexity: 'MEDIUM', estimatedTime: 60 },
      { title: 'API 테스트 작성', description: '통합 테스트 및 단위 테스트 작성', complexity: 'HIGH', estimatedTime: 90 },
    ],
  },
  {
    keywords: ['리팩토링', 'refactor', '개선', 'cleanup', '정리'],
    todos: [
      { title: '코드 분석 및 문제점 파악', description: '현재 코드베이스의 문제점과 개선 포인트 분석', complexity: 'LOW', estimatedTime: 60 },
      { title: '컴포넌트 분리', description: '대형 컴포넌트를 작은 단위로 분리', complexity: 'MEDIUM', estimatedTime: 90 },
      { title: '공통 유틸리티 추출', description: '반복되는 로직을 유틸리티 함수로 추출', complexity: 'MEDIUM', estimatedTime: 60 },
      { title: '타입 정의 개선', description: 'TypeScript 타입 정의 강화 및 정리', complexity: 'LOW', estimatedTime: 45 },
      { title: '테스트 커버리지 확보', description: '리팩토링된 코드에 대한 테스트 작성', complexity: 'HIGH', estimatedTime: 120 },
    ],
  },
];

// Default todos for missions that don't match any template
const DEFAULT_TODOS: Array<{
  title: string;
  description: string;
  complexity: Complexity;
  estimatedTime: number;
  isUncertain?: boolean;
  uncertainReason?: string;
}> = [
  { title: '요구사항 분석', description: '작업 범위와 상세 요구사항 정리', complexity: 'LOW', estimatedTime: 30 },
  { title: '기술 스택 검토', description: '사용할 기술과 라이브러리 검토', complexity: 'MEDIUM', estimatedTime: 45, isUncertain: true, uncertainReason: '기술 선택이 필요합니다' },
  { title: '기본 구조 구현', description: '핵심 로직 및 데이터 흐름 구현', complexity: 'MEDIUM', estimatedTime: 90 },
  { title: 'UI/UX 구현', description: '사용자 인터페이스 개발', complexity: 'MEDIUM', estimatedTime: 60 },
  { title: '테스트 및 검증', description: '기능 테스트 및 버그 수정', complexity: 'LOW', estimatedTime: 45 },
];

/**
 * Generate mock todos based on mission title and description
 */
function generateMockTodos(mission: Mission): SuggestedTodo[] {
  const searchText = `${mission.title} ${mission.description || ''}`.toLowerCase();

  // Find matching template
  const matchedTemplate = TODO_TEMPLATES.find(template =>
    template.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
  );

  const todoData = matchedTemplate ? matchedTemplate.todos : DEFAULT_TODOS;

  return todoData.map((todo) => ({
    id: generateId(),
    title: todo.title,
    description: todo.description,
    complexity: todo.complexity,
    estimatedTime: todo.estimatedTime,
    isUncertain: todo.isUncertain || hasUncertainty(todo.description),
    uncertainReason: todo.uncertainReason,
  }));
}

/**
 * Generate AI questions for uncertain todos
 */
function generateMockQuestions(mission: Mission, suggestedTodos: SuggestedTodo[]): AIQuestionSuggestion[] {
  return suggestedTodos
    .filter(todo => todo.isUncertain)
    .map(todo => ({
      id: `q-${generateId()}`,
      question: todo.uncertainReason || `${todo.title}에 대해 추가 정보가 필요합니다`,
      context: `Mission "${mission.title}"의 "${todo.title}" 작업을 위해 결정이 필요합니다.`,
      relatedTodoId: todo.id,
      options: generateOptionsForTodo(todo),
    }));
}

/**
 * Generate options based on todo type
 */
function generateOptionsForTodo(todo: SuggestedTodo): string[] {
  const title = todo.title.toLowerCase();

  if (title.includes('oauth') || title.includes('인증')) {
    return ['Google OAuth', 'GitHub OAuth', 'Apple Sign-in', '직접 구현'];
  }
  if (title.includes('라이브러리') || title.includes('library') || title.includes('차트')) {
    return ['Chart.js', 'Recharts', 'ApexCharts', 'D3.js'];
  }
  if (title.includes('세션') || title.includes('session')) {
    return ['JWT + 로컬 스토리지', 'Redis 세션', '쿠키 기반 세션'];
  }
  if (title.includes('기술') || title.includes('스택')) {
    return ['현재 스택 유지', '새로운 프레임워크 도입', '점진적 마이그레이션'];
  }

  return ['옵션 1', '옵션 2', '직접 입력'];
}

// Mission generation templates based on prompt keywords
interface MissionTemplate {
  keywords: string[];
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  todos: Array<{
    title: string;
    description: string;
    complexity: Complexity;
    estimatedTime: number;
    dependsOn?: number[]; // indices of todos this depends on
  }>;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    keywords: ['다크모드', 'dark mode', '다크 모드', '테마'],
    title: '다크모드 테마 시스템 구현',
    description: '## 목표\n앱 전체에 다크모드 지원 추가\n\n## 요구사항\n- 시스템 설정 자동 감지\n- 수동 토글 기능\n- 설정 로컬 저장\n- 부드러운 전환 애니메이션',
    priority: 'MEDIUM',
    todos: [
      { title: 'CSS 변수 기반 테마 시스템 설계', description: 'color, background, border 등 테마 변수 정의', complexity: 'LOW', estimatedTime: 30 },
      { title: 'ThemeProvider 컨텍스트 구현', description: 'React Context로 테마 상태 관리', complexity: 'MEDIUM', estimatedTime: 45 },
      { title: '테마 토글 컴포넌트', description: '라이트/다크 모드 전환 버튼 UI', complexity: 'LOW', estimatedTime: 20, dependsOn: [1] },
      { title: '시스템 설정 연동', description: 'prefers-color-scheme 미디어 쿼리 감지', complexity: 'LOW', estimatedTime: 20, dependsOn: [1] },
      { title: '전체 컴포넌트 테마 적용', description: '모든 UI 컴포넌트에 테마 변수 적용', complexity: 'HIGH', estimatedTime: 120, dependsOn: [0, 1] },
    ],
  },
  {
    keywords: ['알림', 'notification', '푸시', 'push'],
    title: '실시간 알림 시스템 구현',
    description: '## 목표\n사용자에게 실시간 알림 제공\n\n## 요구사항\n- 인앱 토스트 알림\n- 알림 센터 UI\n- 읽음/안읽음 상태 관리\n- 알림 설정 페이지',
    priority: 'HIGH',
    todos: [
      { title: 'WebSocket 연결 설정', description: 'STOMP 프로토콜 기반 실시간 연결', complexity: 'MEDIUM', estimatedTime: 60 },
      { title: '알림 스토어 구현', description: 'Zustand로 알림 상태 관리', complexity: 'MEDIUM', estimatedTime: 45, dependsOn: [0] },
      { title: '토스트 알림 컴포넌트', description: '화면 우상단 팝업 알림 UI', complexity: 'LOW', estimatedTime: 30 },
      { title: '알림 센터 드로어', description: '전체 알림 목록 사이드 패널', complexity: 'MEDIUM', estimatedTime: 60, dependsOn: [1] },
      { title: '알림 설정 페이지', description: '알림 유형별 on/off 설정', complexity: 'LOW', estimatedTime: 45, dependsOn: [1] },
    ],
  },
  {
    keywords: ['검색', 'search', '찾기'],
    title: '통합 검색 기능 구현',
    description: '## 목표\n전체 콘텐츠 통합 검색\n\n## 요구사항\n- Cmd+K 단축키 지원\n- 실시간 검색 결과\n- 검색 히스토리\n- 필터 및 정렬',
    priority: 'MEDIUM',
    todos: [
      { title: '검색 API 엔드포인트 구현', description: 'GET /api/search?q={query} 백엔드 API', complexity: 'MEDIUM', estimatedTime: 60 },
      { title: '검색 모달 UI', description: 'Cmd+K로 열리는 검색 다이얼로그', complexity: 'MEDIUM', estimatedTime: 45 },
      { title: '실시간 검색 결과 표시', description: 'debounce 적용 실시간 검색', complexity: 'LOW', estimatedTime: 30, dependsOn: [0, 1] },
      { title: '검색 히스토리 저장', description: 'localStorage 기반 최근 검색어', complexity: 'LOW', estimatedTime: 20, dependsOn: [1] },
      { title: '검색 필터 구현', description: '타입별, 날짜별 필터링', complexity: 'MEDIUM', estimatedTime: 45, dependsOn: [0] },
    ],
  },
  {
    keywords: ['로그인', '인증', 'auth', 'login', '회원가입'],
    title: '사용자 인증 시스템 구현',
    description: '## 목표\n안전한 사용자 인증 시스템\n\n## 요구사항\n- 이메일/비밀번호 로그인\n- JWT 토큰 관리\n- 소셜 로그인 (선택)\n- 비밀번호 재설정',
    priority: 'CRITICAL',
    todos: [
      { title: '로그인/회원가입 API', description: 'POST /auth/login, /auth/register 구현', complexity: 'MEDIUM', estimatedTime: 60 },
      { title: 'JWT 토큰 관리', description: '액세스/리프레시 토큰 발급 및 갱신', complexity: 'HIGH', estimatedTime: 90, dependsOn: [0] },
      { title: '로그인 폼 UI', description: '이메일, 비밀번호 입력 폼', complexity: 'LOW', estimatedTime: 30 },
      { title: '인증 상태 관리', description: 'Zustand 스토어로 로그인 상태 관리', complexity: 'MEDIUM', estimatedTime: 45, dependsOn: [1] },
      { title: '비밀번호 재설정', description: '이메일 기반 비밀번호 재설정 플로우', complexity: 'MEDIUM', estimatedTime: 60, dependsOn: [0] },
    ],
  },
  {
    keywords: ['대시보드', 'dashboard', '통계', '차트'],
    title: '대시보드 페이지 구현',
    description: '## 목표\n핵심 지표를 한눈에 파악할 수 있는 대시보드\n\n## 요구사항\n- 주요 통계 카드\n- 차트 시각화\n- 최근 활동 타임라인\n- 반응형 레이아웃',
    priority: 'MEDIUM',
    todos: [
      { title: '통계 API 구현', description: 'GET /api/stats 백엔드 API', complexity: 'MEDIUM', estimatedTime: 45 },
      { title: '통계 카드 컴포넌트', description: '숫자와 트렌드 표시 카드', complexity: 'LOW', estimatedTime: 30 },
      { title: '차트 컴포넌트', description: 'Recharts 기반 라인/바 차트', complexity: 'MEDIUM', estimatedTime: 60, dependsOn: [0] },
      { title: '대시보드 레이아웃', description: 'Grid 기반 반응형 레이아웃', complexity: 'LOW', estimatedTime: 30 },
      { title: '실시간 데이터 갱신', description: 'WebSocket으로 실시간 업데이트', complexity: 'HIGH', estimatedTime: 90, dependsOn: [0, 2] },
    ],
  },
];

// Default mission template when no specific match
const DEFAULT_MISSION_TEMPLATE: MissionTemplate = {
  keywords: [],
  title: '새 기능 개발',
  description: '## 목표\n요청된 기능 구현\n\n## 요구사항\n- 요구사항 분석 필요\n- 설계 문서 작성\n- 구현 및 테스트',
  priority: 'MEDIUM',
  todos: [
    { title: '요구사항 분석', description: '상세 요구사항 정리 및 범위 확정', complexity: 'LOW', estimatedTime: 30 },
    { title: '기술 설계', description: '아키텍처 및 데이터 구조 설계', complexity: 'MEDIUM', estimatedTime: 60 },
    { title: '핵심 기능 구현', description: '메인 로직 개발', complexity: 'HIGH', estimatedTime: 120, dependsOn: [0, 1] },
    { title: 'UI 구현', description: '사용자 인터페이스 개발', complexity: 'MEDIUM', estimatedTime: 60, dependsOn: [1] },
    { title: '테스트 및 검증', description: '기능 테스트 및 버그 수정', complexity: 'LOW', estimatedTime: 45, dependsOn: [2, 3] },
  ],
};

export interface GeneratedMission {
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedTodos: Array<{
    title: string;
    description: string;
    complexity: Complexity;
    estimatedTime: number;
    dependsOn?: number[];
  }>;
}

export const aiAnalysisService = {
  /**
   * Generate a mission from a user prompt
   */
  generateMissionFromPrompt: async (prompt: string): Promise<GeneratedMission> => {
    // Simulate AI thinking delay
    await delay(1000 + Math.random() * 1000);

    const lowerPrompt = prompt.toLowerCase();

    // Find matching template
    const matchedTemplate = MISSION_TEMPLATES.find(template =>
      template.keywords.some(keyword => lowerPrompt.includes(keyword.toLowerCase()))
    );

    const template = matchedTemplate || DEFAULT_MISSION_TEMPLATE;

    // Customize title if default template
    let title = template.title;
    let description = template.description;

    if (!matchedTemplate) {
      // Extract key action from prompt for title
      const words = prompt.split(/\s+/).filter(w => w.length > 1);
      if (words.length > 0) {
        title = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
        description = `## 목표\n${prompt}\n\n## 요구사항\n- 상세 요구사항 분석 필요\n- 설계 및 구현\n- 테스트 및 검증`;
      }
    }

    return {
      title,
      description,
      priority: template.priority,
      suggestedTodos: template.todos,
    };
  },

  /**
   * Analyze a mission and generate suggested todos
   * Uses Workspace Agent for real code analysis, falls back to mock in DEMO_MODE
   */
  analyzeMission: async (mission: Mission, onProgress?: (message: string) => void): Promise<AIAnalysisResult> => {
    // Use mock data in DEMO_MODE
    if (DEMO_MODE) {
      // Simulate analysis delay (1.5-2.5 seconds)
      const analysisTime = 1.5 + Math.random();
      await delay(analysisTime * 1000);

      const suggestedTodos = generateMockTodos(mission);
      const questions = generateMockQuestions(mission, suggestedTodos);

      return {
        missionId: mission.id,
        suggestedTodos,
        questions,
        confidence: 0.75 + Math.random() * 0.2, // 75-95%
        analysisTime,
      };
    }

    // Try new HTTP Callback Architecture (Analysis Request API)
    try {
      const workspaceId = mission.workspaceId;
      if (!workspaceId) {
        throw new Error('Mission has no workspaceId');
      }

      onProgress?.('분석 요청 생성 중...');

      // Create analysis request - this queues it for PM Agent
      // Results will be delivered via WebSocket (ANALYSIS_COMPLETED event)
      const analysisRequest = await workspaceAgentService.requestMissionAnalysis(
        workspaceId,
        mission.id,
        mission.title,
        mission.description || '',
        onProgress
      );

      // Return a placeholder result - actual results come via WebSocket
      // The UI should subscribe to ANALYSIS_COMPLETED events
      return {
        missionId: mission.id,
        suggestedTodos: [],
        questions: [],
        confidence: 0,
        analysisTime: 0,
        pendingRequestId: analysisRequest.id, // Used to track the pending request
        status: 'PENDING' as const,
      };
    } catch (error) {
      console.warn('Analysis request failed, falling back to template-based analysis:', error);

      // Fallback to mock data if API fails
      const analysisTime = 1.5 + Math.random();
      await delay(500);

      const suggestedTodos = generateMockTodos(mission);
      const questions = generateMockQuestions(mission, suggestedTodos);

      return {
        missionId: mission.id,
        suggestedTodos,
        questions,
        confidence: 0.7 + Math.random() * 0.15, // Lower confidence for fallback
        analysisTime,
      };
    }
  },

  /**
   * Parse analysis result from completed AnalysisRequest
   * Called when ANALYSIS_COMPLETED WebSocket event is received
   */
  parseAnalysisResult: (resultJson: string, missionId: string): AIAnalysisResult | null => {
    try {
      const analysis = JSON.parse(resultJson);

      const suggestedTodos: SuggestedTodo[] = (analysis.suggestedTodos || []).map(
        (todo: SuggestedTodoFromAgent, index: number) => ({
          id: `agent-${Date.now()}-${index}`,
          title: todo.title,
          description: todo.description,
          complexity: todo.complexity as Complexity,
          estimatedTime: todo.estimatedTime,
          isUncertain: todo.isUncertain || false,
          uncertainReason: todo.uncertainReason,
          relatedFiles: todo.relatedFiles,
          reasoning: todo.reasoning,
        })
      );

      const questions: AIQuestionSuggestion[] = (analysis.uncertainItems || []).map(
        (item: UncertainItem, index: number) => ({
          id: `q-agent-${Date.now()}-${index}`,
          question: item.question,
          context: item.recommendation || '',
          relatedTodoId: suggestedTodos[item.todoIndex]?.id || '',
          options: item.options,
        })
      );

      return {
        missionId,
        suggestedTodos,
        questions,
        confidence: 0.9,
        analysisTime: 10,
        projectInsights: analysis.projectInsights,
      };
    } catch (e) {
      console.error('Failed to parse analysis result:', e);
      return null;
    }
  },
};
