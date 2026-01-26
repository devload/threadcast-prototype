# ThreadCast - SessionCast 연동 설계

## 1. 개요

ThreadCast는 SessionCast CLI를 통해 AI 에이전트(Claude Code)와 연동하여 실제 코드 작업을 수행합니다.

### 통신 구조

```
┌─────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│   ThreadCast    │       │   SessionCast     │       │    Claude Code    │
│     Server      │◀─────▶│      CLI          │◀─────▶│       CLI         │
│  (Spring Boot)  │       │  (Node.js Agent)  │       │   (AI Executor)   │
└─────────────────┘       └───────────────────┘       └───────────────────┘
        │                         │                           │
        │  REST API               │  Event Stream             │  Code Execution
        │  WebSocket              │  Command Queue            │  File Operations
        │                         │                           │
```

## 2. 연동 방식

### 2.1 SessionCast CLI 역할

SessionCast CLI는 ThreadCast와 Claude Code 사이의 중간자 역할을 합니다.

**주요 기능:**
- ThreadCast 서버로부터 Todo 작업 수신
- Claude Code CLI 실행 및 제어
- AI 작업 진행 상황 보고
- AI 질문 전달 및 답변 수신
- 파일 변경 사항 추적

### 2.2 연결 설정

```typescript
// SessionCast CLI 연결 설정
interface SessionCastConfig {
  threadcastUrl: string;      // ThreadCast 서버 URL
  workspaceId: string;        // 작업 공간 ID
  authToken: string;          // 인증 토큰
  projectPath: string;        // 로컬 프로젝트 경로
  autonomyLevel: number;      // AI 자율성 레벨 (1-5)
}

const config: SessionCastConfig = {
  threadcastUrl: 'wss://api.threadcast.io',
  workspaceId: '550e8400-...',
  authToken: 'Bearer eyJ...',
  projectPath: '/Users/dev/my-project',
  autonomyLevel: 3
};
```

## 3. 작업 실행 플로우

### 3.1 Todo 실행 플로우

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│ ThreadCast  │     │ SessionCast  │     │  Claude Code  │     │   Project   │
│   Server    │     │     CLI      │     │      CLI      │     │    Files    │
└──────┬──────┘     └──────┬───────┘     └───────┬───────┘     └──────┬──────┘
       │                   │                     │                    │
       │ 1. Start Todo     │                     │                    │
       │──────────────────▶│                     │                    │
       │                   │                     │                    │
       │                   │ 2. Launch Claude    │                    │
       │                   │────────────────────▶│                    │
       │                   │                     │                    │
       │                   │ 3. Send Task        │                    │
       │                   │────────────────────▶│                    │
       │                   │                     │                    │
       │ 4. Step Started   │                     │                    │
       │◀──────────────────│                     │                    │
       │  (ANALYSIS)       │                     │                    │
       │                   │                     │ 5. Read Files      │
       │                   │                     │───────────────────▶│
       │                   │                     │◀───────────────────│
       │                   │                     │                    │
       │                   │ 6. Analysis Output  │                    │
       │                   │◀────────────────────│                    │
       │                   │                     │                    │
       │ 7. Step Completed │                     │                    │
       │◀──────────────────│                     │                    │
       │  (ANALYSIS)       │                     │                    │
       │                   │                     │                    │
       │ 8. Step Started   │                     │                    │
       │◀──────────────────│                     │                    │
       │  (DESIGN)         │                     │                    │
       │                   │                     │                    │
       │      ... 6 Steps Continue ...          │                    │
       │                   │                     │                    │
       │                   │                     │ N. Write Files     │
       │                   │                     │───────────────────▶│
       │                   │                     │                    │
       │ N+1. File Event   │                     │                    │
       │◀──────────────────│                     │                    │
       │                   │                     │                    │
       │ N+2. Todo Complete│                     │                    │
       │◀──────────────────│                     │                    │
       │                   │                     │                    │
```

### 3.2 6단계 실행 상세

각 Todo는 6단계를 거쳐 실행됩니다.

```typescript
enum TodoStepType {
  ANALYSIS = 'ANALYSIS',           // 1. 기존 코드 분석
  DESIGN = 'DESIGN',               // 2. 구현 설계
  IMPLEMENTATION = 'IMPLEMENTATION', // 3. 코드 구현
  VERIFICATION = 'VERIFICATION',   // 4. 검증 (테스트)
  REVIEW = 'REVIEW',               // 5. 코드 리뷰
  INTEGRATION = 'INTEGRATION'      // 6. 통합
}

// 각 단계별 Claude Code 프롬프트
const stepPrompts: Record<TodoStepType, string> = {
  ANALYSIS: `
    Task: ${todo.title}
    Description: ${todo.description}

    Step 1 - ANALYSIS:
    Analyze the existing codebase related to this task.
    - Identify relevant files and their structure
    - Understand current implementation patterns
    - List dependencies and potential conflicts
    - Document findings in a structured format
  `,

  DESIGN: `
    Based on the analysis, design the implementation approach.
    - Define the component/module structure
    - Specify interfaces and data flow
    - Plan file changes (new files, modifications)
    - Consider edge cases and error handling
  `,

  IMPLEMENTATION: `
    Implement the designed solution.
    - Write clean, maintainable code
    - Follow project conventions
    - Add appropriate comments
    - Handle errors gracefully
  `,

  VERIFICATION: `
    Verify the implementation.
    - Run existing tests
    - Write new tests if needed
    - Check for regressions
    - Validate edge cases
  `,

  REVIEW: `
    Review the changes for quality.
    - Check code style consistency
    - Verify best practices
    - Look for potential issues
    - Suggest improvements
  `,

  INTEGRATION: `
    Finalize and integrate the changes.
    - Ensure all tests pass
    - Update documentation if needed
    - Prepare summary of changes
    - Confirm task completion
  `
};
```

## 4. AI 질문 생성 로직

### 4.1 자율성 레벨별 질문 생성

```typescript
interface QuestionDecision {
  shouldAsk: boolean;
  autoAnswer?: string;
  reason?: string;
}

class AutonomyManager {
  private level: number; // 1-5

  constructor(level: number) {
    this.level = level;
  }

  // 질문 생성 여부 결정
  shouldAskQuestion(category: QuestionCategory, importance: 'low' | 'medium' | 'high' | 'critical'): QuestionDecision {
    const importanceLevel = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    const threshold = this.getThreshold(category);
    const questionImportance = importanceLevel[importance];

    // 자율성 레벨이 높을수록 threshold가 높아짐 (질문을 덜 함)
    if (questionImportance >= threshold) {
      return { shouldAsk: true };
    }

    // 자동 결정
    return {
      shouldAsk: false,
      autoAnswer: this.getAutoAnswer(category),
      reason: `Autonomy Level ${this.level}: Auto-decided based on project conventions`
    };
  }

  private getThreshold(category: QuestionCategory): number {
    // 카테고리별 기본 중요도
    const categoryBase: Record<QuestionCategory, number> = {
      NAMING: 1,           // 네이밍은 보통 자동 결정
      CONFIGURATION: 2,    // 설정값은 medium 이상에서 질문
      IMPLEMENTATION: 2,   // 구현 방식은 medium 이상에서 질문
      ARCHITECTURE: 3,     // 아키텍처는 high 이상에서 질문
      SECURITY: 4,         // 보안은 항상 질문
    };

    // 자율성 레벨에 따라 threshold 조정
    // Level 1: threshold 낮음 (많이 질문)
    // Level 5: threshold 높음 (거의 안 질문)
    return categoryBase[category] - (3 - this.level);
  }

  private getAutoAnswer(category: QuestionCategory): string {
    // 프로젝트 컨벤션에 따른 자동 답변
    const defaults: Record<QuestionCategory, string> = {
      NAMING: 'Follow existing naming conventions in the project',
      CONFIGURATION: 'Use recommended/default values',
      IMPLEMENTATION: 'Follow existing patterns in the codebase',
      ARCHITECTURE: 'Maintain current architecture style',
      SECURITY: 'Apply standard security best practices',
    };
    return defaults[category];
  }
}

// 사용 예시
const autonomyManager = new AutonomyManager(3); // Level 3 (Medium)

// 변수 네이밍 질문 - 자동 결정됨
const namingDecision = autonomyManager.shouldAskQuestion('NAMING', 'low');
// { shouldAsk: false, autoAnswer: 'Follow existing naming conventions...' }

// JWT 만료 시간 - 질문함
const configDecision = autonomyManager.shouldAskQuestion('CONFIGURATION', 'medium');
// { shouldAsk: true }

// DB 스키마 변경 - 질문함
const archDecision = autonomyManager.shouldAskQuestion('ARCHITECTURE', 'high');
// { shouldAsk: true }
```

### 4.2 질문 생성 및 전송

```typescript
interface AIQuestionRequest {
  todoId: string;
  stepType: TodoStepType;
  question: string;
  context: string;
  category: QuestionCategory;
  options: QuestionOption[];
  urgent: boolean;
}

// SessionCast → ThreadCast 질문 전송
async function sendQuestion(request: AIQuestionRequest): Promise<void> {
  await websocket.send('/app/ai/questions', {
    type: 'AI_QUESTION',
    payload: request
  });
}

// Claude Code에서 질문 상황 감지
function detectQuestionScenario(claudeOutput: string): AIQuestionRequest | null {
  // Claude Code의 출력에서 질문이 필요한 상황 감지
  const patterns = [
    {
      regex: /should I use (.*?) or (.*?)\?/i,
      category: 'IMPLEMENTATION',
      importance: 'medium'
    },
    {
      regex: /what should be the (timeout|expiry|limit|max)/i,
      category: 'CONFIGURATION',
      importance: 'medium'
    },
    {
      regex: /this will change the (database|schema|api)/i,
      category: 'ARCHITECTURE',
      importance: 'high'
    },
    {
      regex: /security (concern|issue|risk)/i,
      category: 'SECURITY',
      importance: 'critical'
    }
  ];

  for (const pattern of patterns) {
    const match = claudeOutput.match(pattern.regex);
    if (match) {
      return buildQuestion(match, pattern);
    }
  }

  return null;
}
```

## 5. 이벤트 스트림

### 5.1 SessionCast → ThreadCast 이벤트

```typescript
// 이벤트 타입 정의
type SessionCastEvent =
  | { type: 'TODO_STARTED'; payload: TodoStartedPayload }
  | { type: 'STEP_STARTED'; payload: StepStartedPayload }
  | { type: 'STEP_PROGRESS'; payload: StepProgressPayload }
  | { type: 'STEP_COMPLETED'; payload: StepCompletedPayload }
  | { type: 'FILE_CHANGED'; payload: FileChangedPayload }
  | { type: 'AI_QUESTION'; payload: AIQuestionPayload }
  | { type: 'AI_OUTPUT'; payload: AIOutputPayload }
  | { type: 'TODO_COMPLETED'; payload: TodoCompletedPayload }
  | { type: 'TODO_FAILED'; payload: TodoFailedPayload };

// 이벤트 페이로드 상세
interface StepProgressPayload {
  todoId: string;
  stepType: TodoStepType;
  progress: number;  // 0-100
  currentAction: string;  // "Reading src/components/LoginForm.tsx"
}

interface FileChangedPayload {
  todoId: string;
  stepType: TodoStepType;
  filePath: string;
  action: 'CREATED' | 'MODIFIED' | 'DELETED' | 'READ';
  additions?: number;
  deletions?: number;
}

interface AIOutputPayload {
  todoId: string;
  stepType: TodoStepType;
  output: string;
  outputType: 'analysis' | 'code' | 'test' | 'log';
}
```

### 5.2 ThreadCast → SessionCast 명령

```typescript
// 명령 타입 정의
type ThreadCastCommand =
  | { type: 'START_TODO'; payload: StartTodoPayload }
  | { type: 'PAUSE_TODO'; payload: PauseTodoPayload }
  | { type: 'RESUME_TODO'; payload: ResumeTodoPayload }
  | { type: 'CANCEL_TODO'; payload: CancelTodoPayload }
  | { type: 'ANSWER_QUESTION'; payload: AnswerQuestionPayload }
  | { type: 'UPDATE_AUTONOMY'; payload: UpdateAutonomyPayload }
  | { type: 'ADD_FEEDBACK'; payload: AddFeedbackPayload };

interface StartTodoPayload {
  todoId: string;
  title: string;
  description: string;
  context: {
    missionTitle: string;
    previousTodos: string[];
    dependencies: string[];
  };
  constraints?: {
    maxTime?: number;        // 최대 실행 시간 (분)
    maxFileChanges?: number; // 최대 파일 변경 수
  };
}

interface AnswerQuestionPayload {
  questionId: string;
  answer: string;
  isCustom: boolean;
  additionalContext?: string;
}

interface AddFeedbackPayload {
  todoId: string;
  feedback: string;  // 사용자 @ai 코멘트
  priority: 'immediate' | 'next-step' | 'future';
}
```

## 6. 에러 처리 및 복구

### 6.1 Tangled (에러) 상태 처리

```typescript
interface TodoFailedPayload {
  todoId: string;
  failedStep: TodoStepType;
  errorType: 'EXECUTION' | 'TIMEOUT' | 'VALIDATION' | 'DEPENDENCY';
  errorMessage: string;
  stackTrace?: string;
  recoveryOptions: RecoveryOption[];
}

interface RecoveryOption {
  type: 'RETRY' | 'SKIP' | 'MANUAL_FIX' | 'SPLIT' | 'ABORT';
  description: string;
  estimatedImpact: string;
}

// 에러 복구 플로우
async function handleTodoFailure(failure: TodoFailedPayload): Promise<void> {
  // 1. ThreadCast에 에러 보고
  await sendEvent({
    type: 'TODO_FAILED',
    payload: failure
  });

  // 2. 사용자 결정 대기
  const decision = await waitForUserDecision(failure.todoId);

  // 3. 결정에 따른 처리
  switch (decision.action) {
    case 'RETRY':
      await retryTodo(failure.todoId, failure.failedStep);
      break;

    case 'SKIP':
      await skipStep(failure.todoId, failure.failedStep);
      break;

    case 'MANUAL_FIX':
      await pauseForManualFix(failure.todoId);
      break;

    case 'SPLIT':
      await splitIntoSubTasks(failure.todoId);
      break;

    case 'ABORT':
      await abortMission(failure.todoId);
      break;
  }
}
```

### 6.2 연결 복구

```typescript
class SessionCastConnection {
  private ws: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pendingEvents: SessionCastEvent[] = [];

  async connect(): Promise<void> {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
      await this.authenticate();
      await this.syncState();
      this.flushPendingEvents();
      this.reconnectAttempts = 0;
    } catch (error) {
      await this.handleConnectionError(error);
    }
  }

  private async handleConnectionError(error: Error): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      await sleep(delay);
      await this.connect();
    } else {
      throw new Error('Failed to connect after max attempts');
    }
  }

  // 연결 끊김 시 이벤트 버퍼링
  sendEvent(event: SessionCastEvent): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      this.pendingEvents.push(event);
    }
  }

  // 재연결 후 버퍼링된 이벤트 전송
  private flushPendingEvents(): void {
    while (this.pendingEvents.length > 0) {
      const event = this.pendingEvents.shift()!;
      this.ws.send(JSON.stringify(event));
    }
  }
}
```

## 7. 보안 고려사항

### 7.1 인증 및 권한

```typescript
// SessionCast 인증 토큰 (서비스 토큰)
interface ServiceToken {
  workspaceId: string;
  permissions: string[];
  expiresAt: number;
}

// 허용되는 파일 작업 범위 제한
interface FileAccessPolicy {
  allowedPaths: string[];     // 접근 허용 경로
  deniedPaths: string[];      // 접근 금지 경로
  allowedExtensions: string[];// 허용 확장자
  maxFileSize: number;        // 최대 파일 크기
}

const defaultPolicy: FileAccessPolicy = {
  allowedPaths: ['src/', 'tests/', 'docs/'],
  deniedPaths: ['.env', 'secrets/', 'credentials/'],
  allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.md'],
  maxFileSize: 1024 * 1024 // 1MB
};
```

### 7.2 실행 격리

```typescript
// Claude Code 실행 환경 격리
interface ExecutionEnvironment {
  workingDirectory: string;
  environmentVariables: Record<string, string>;
  networkAccess: boolean;
  maxExecutionTime: number;
  memoryLimit: number;
}

const safeEnvironment: ExecutionEnvironment = {
  workingDirectory: '/project',
  environmentVariables: {
    NODE_ENV: 'development',
    // 민감한 변수 제외
  },
  networkAccess: true,       // npm install 등을 위해 필요
  maxExecutionTime: 300000,  // 5분
  memoryLimit: 512 * 1024 * 1024 // 512MB
};
```

## 8. 성능 최적화

### 8.1 이벤트 배치 처리

```typescript
class EventBatcher {
  private batch: SessionCastEvent[] = [];
  private flushInterval = 100; // ms
  private maxBatchSize = 50;

  add(event: SessionCastEvent): void {
    this.batch.push(event);

    if (this.batch.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  private flush(): void {
    if (this.batch.length === 0) return;

    const events = [...this.batch];
    this.batch = [];

    // 배치로 전송
    websocket.send('/app/events/batch', {
      events,
      timestamp: Date.now()
    });
  }

  startAutoFlush(): void {
    setInterval(() => this.flush(), this.flushInterval);
  }
}
```

### 8.2 파일 변경 디바운싱

```typescript
class FileChangeTracker {
  private changes: Map<string, FileChange> = new Map();
  private debounceTimer: NodeJS.Timeout | null = null;
  private debounceDelay = 500; // ms

  trackChange(filePath: string, change: FileChange): void {
    // 같은 파일의 변경사항 병합
    const existing = this.changes.get(filePath);
    if (existing) {
      this.changes.set(filePath, this.mergeChanges(existing, change));
    } else {
      this.changes.set(filePath, change);
    }

    // 디바운스된 전송
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => this.sendChanges(), this.debounceDelay);
  }

  private mergeChanges(existing: FileChange, newChange: FileChange): FileChange {
    return {
      ...existing,
      additions: (existing.additions || 0) + (newChange.additions || 0),
      deletions: (existing.deletions || 0) + (newChange.deletions || 0),
      action: this.determineAction(existing.action, newChange.action)
    };
  }

  private sendChanges(): void {
    const changes = Array.from(this.changes.entries());
    this.changes.clear();

    changes.forEach(([filePath, change]) => {
      sendEvent({
        type: 'FILE_CHANGED',
        payload: { filePath, ...change }
      });
    });
  }
}
```

## 9. 모니터링 및 로깅

### 9.1 작업 메트릭 수집

```typescript
interface TodoMetrics {
  todoId: string;
  startTime: number;
  endTime?: number;
  steps: StepMetrics[];
  filesCreated: number;
  filesModified: number;
  linesAdded: number;
  linesDeleted: number;
  questionsAsked: number;
  errorsEncountered: number;
}

interface StepMetrics {
  stepType: TodoStepType;
  startTime: number;
  endTime: number;
  duration: number;
  claudeTokensUsed: number;
  claudeApiCalls: number;
}

// ThreadCast로 메트릭 전송
async function sendMetrics(metrics: TodoMetrics): Promise<void> {
  await api.post('/metrics/todos', metrics);
}
```

### 9.2 구조화된 로깅

```typescript
const logger = {
  info: (message: string, context: Record<string, any>) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  },

  error: (message: string, error: Error, context: Record<string, any>) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...context
    }));
  }
};

// 사용 예시
logger.info('Todo step started', {
  todoId: 'xxx',
  stepType: 'IMPLEMENTATION',
  missionId: 'yyy'
});
```

---

**문서 버전**: 1.0
**작성일**: 2026-01-26
**최종 수정**: 2026-01-26
