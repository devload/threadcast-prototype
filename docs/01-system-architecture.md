# ThreadCast 시스템 아키텍처

> Thread your AI workflow, never lose context

## 1. 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ThreadCast System                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────────┐     ┌───────────────────────┐   │
│  │   Frontend   │────▶│   Spring Boot    │────▶│   SessionCast CLI     │   │
│  │  (React 18)  │◀────│     Server       │◀────│   (AI Agent Host)     │   │
│  └──────────────┘     └──────────────────┘     └───────────────────────┘   │
│         │                     │                          │                  │
│         │ WebSocket           │ JPA                      │ Claude API       │
│         │ (STOMP)             │                          │                  │
│         ▼                     ▼                          ▼                  │
│  ┌──────────────┐     ┌──────────────────┐     ┌───────────────────────┐   │
│  │   Zustand    │     │   PostgreSQL     │     │   Claude Code CLI     │   │
│  │   (State)    │     │   (H2 for Dev)   │     │   (AI Executor)       │   │
│  └──────────────┘     └──────────────────┘     └───────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. 기술 스택

| 영역 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **Backend** | Spring Boot | 3.x | REST API, WebSocket |
| | Spring Security | 6.x | 인증/인가 (JWT) |
| | Spring WebSocket | 3.x | 실시간 통신 (STOMP) |
| | Spring Data JPA | 3.x | ORM |
| **Frontend** | React | 18.x | UI Framework |
| | TypeScript | 5.x | Type Safety |
| | Zustand | 4.x | 상태 관리 |
| | react-beautiful-dnd | 13.x | 칸반 드래그앤드롭 |
| **Database** | H2 | 2.x | 개발용 인메모리 DB |
| | PostgreSQL | 15.x | 프로덕션 DB |
| **Real-time** | WebSocket (STOMP) | - | 양방향 통신 |
| | SockJS | - | WebSocket Fallback |
| **Auth** | JWT | - | 토큰 기반 인증 |
| **AI Agent** | SessionCast CLI | - | AI 작업 오케스트레이션 |
| | Claude Code CLI | - | AI 코드 실행 |

## 3. 레이어 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  REST Controllers          WebSocket Controllers            │ │
│  │  - MissionController       - MissionWebSocketController     │ │
│  │  - TodoController          - TodoWebSocketController        │ │
│  │  - TimelineController      - TimelineWebSocketController    │ │
│  │  - AIQuestionController    - AIQuestionWebSocketController  │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                         Service Layer                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  MissionService      TodoService       TimelineService      │ │
│  │  AIQuestionService   SessionCastService                     │ │
│  │  UserService         NotificationService                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                        Repository Layer                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  MissionRepository   TodoRepository    TimelineRepository   │ │
│  │  AIQuestionRepository AIAnswerRepository UserRepository     │ │
│  │  CommentRepository   WorkspaceRepository                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                          Domain Layer                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Workspace  Mission  Todo  TodoStep  TimelineEvent          │ │
│  │  AIQuestion  AIAnswer  User  Comment                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 4. 모듈 구성

### 4.1 Backend 모듈 구조

```
threadcast-server/
├── src/main/java/io/threadcast/
│   ├── ThreadCastApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java          # JWT, CORS 설정
│   │   ├── WebSocketConfig.java         # STOMP 설정
│   │   └── JpaConfig.java               # JPA Auditing 설정
│   ├── controller/
│   │   ├── MissionController.java
│   │   ├── TodoController.java
│   │   ├── TimelineController.java
│   │   ├── AIQuestionController.java
│   │   └── websocket/
│   │       ├── MissionWebSocketController.java
│   │       └── TodoWebSocketController.java
│   ├── service/
│   │   ├── MissionService.java
│   │   ├── TodoService.java
│   │   ├── TimelineService.java
│   │   ├── AIQuestionService.java
│   │   └── SessionCastIntegrationService.java
│   ├── repository/
│   │   ├── MissionRepository.java
│   │   ├── TodoRepository.java
│   │   ├── TimelineEventRepository.java
│   │   └── AIQuestionRepository.java
│   ├── domain/
│   │   ├── Workspace.java
│   │   ├── Mission.java
│   │   ├── Todo.java
│   │   ├── TodoStep.java
│   │   ├── TimelineEvent.java
│   │   ├── AIQuestion.java
│   │   ├── AIAnswer.java
│   │   ├── User.java
│   │   └── Comment.java
│   ├── dto/
│   │   ├── request/
│   │   └── response/
│   ├── exception/
│   │   └── GlobalExceptionHandler.java
│   └── security/
│       ├── JwtTokenProvider.java
│       └── JwtAuthenticationFilter.java
├── src/main/resources/
│   ├── application.yml
│   └── application-dev.yml
└── build.gradle
```

### 4.2 Frontend 모듈 구조

```
threadcast-web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── missions/
│   │   │   └── page.tsx
│   │   ├── todos/
│   │   │   └── page.tsx
│   │   └── timeline/
│   │       └── page.tsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── ViewSwitcher.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── SlidePanel.tsx
│   │   ├── mission/
│   │   │   ├── MissionBoard.tsx
│   │   │   ├── MissionCard.tsx
│   │   │   ├── MissionModal.tsx
│   │   │   └── CreateMissionModal.tsx
│   │   ├── todo/
│   │   │   ├── TodoBoard.tsx
│   │   │   ├── TodoCard.tsx
│   │   │   ├── TodoDetailPanel.tsx
│   │   │   └── tabs/
│   │   │       ├── TimelineTab.tsx
│   │   │       ├── FilesTab.tsx
│   │   │       ├── StepsTab.tsx
│   │   │       └── SettingsTab.tsx
│   │   ├── timeline/
│   │   │   ├── Timeline.tsx
│   │   │   └── TimelineItem.tsx
│   │   └── ai/
│   │       └── AIQuestionCard.tsx
│   ├── store/
│   │   ├── missionStore.ts
│   │   ├── todoStore.ts
│   │   ├── timelineStore.ts
│   │   └── aiQuestionStore.ts
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   └── useMission.ts
│   ├── services/
│   │   ├── api.ts
│   │   └── websocket.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css
├── package.json
└── tsconfig.json
```

## 5. 통신 흐름

### 5.1 Mission 생성 흐름

```
┌────────┐       ┌────────────┐       ┌─────────────┐       ┌──────────────┐
│ Client │       │   Server   │       │ SessionCast │       │ Claude Code  │
└───┬────┘       └─────┬──────┘       └──────┬──────┘       └──────┬───────┘
    │                  │                     │                     │
    │ POST /missions   │                     │                     │
    │─────────────────▶│                     │                     │
    │                  │                     │                     │
    │                  │ Create Mission      │                     │
    │                  │────────────────────▶│                     │
    │                  │                     │                     │
    │                  │                     │ Generate Todos      │
    │                  │                     │────────────────────▶│
    │                  │                     │                     │
    │                  │                     │◀────────────────────│
    │                  │                     │  Thread Proposal    │
    │                  │◀────────────────────│                     │
    │                  │   Todo List         │                     │
    │◀─────────────────│                     │                     │
    │  Mission + Todos │                     │                     │
    │                  │                     │                     │
```

### 5.2 실시간 업데이트 흐름

```
┌────────┐       ┌────────────┐       ┌─────────────┐       ┌──────────────┐
│ Client │       │   Server   │       │ SessionCast │       │ Claude Code  │
└───┬────┘       └─────┬──────┘       └──────┬──────┘       └──────┬───────┘
    │                  │                     │                     │
    │ SUBSCRIBE        │                     │                     │
    │ /topic/todos/1   │                     │                     │
    │─────────────────▶│                     │                     │
    │                  │                     │                     │
    │                  │                     │  Execute Todo       │
    │                  │                     │────────────────────▶│
    │                  │                     │                     │
    │                  │◀────────────────────│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
    │                  │   Progress Event    │   Step Complete     │
    │                  │                     │                     │
    │◀─ ─ ─ ─ ─ ─ ─ ─ ─│                     │                     │
    │  WebSocket MSG   │                     │                     │
    │  (Step Update)   │                     │                     │
    │                  │                     │                     │
```

## 6. 배포 아키텍처

### 6.1 개발 환경

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Development                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────┐  │
│  │  React Dev   │     │ Spring Boot  │     │    H2      │  │
│  │  Server      │────▶│   Server     │────▶│  Database  │  │
│  │  :3000       │     │   :8080      │     │ (In-Memory)│  │
│  └──────────────┘     └──────────────┘     └────────────┘  │
│                              │                              │
│                              ▼                              │
│                    ┌──────────────────┐                     │
│                    │  SessionCast CLI │                     │
│                    │  (Local Process) │                     │
│                    └──────────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 프로덕션 환경 (AWS)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Production                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CloudFront CDN                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────┐     ┌───────────────────────────────────────────────┐   │
│  │     S3       │     │                  ALB                           │   │
│  │  (Frontend)  │     │  app.threadcast.io  api.threadcast.io         │   │
│  └──────────────┘     └───────────────────────────────────────────────┘   │
│                                    │                                        │
│                       ┌────────────┴────────────┐                          │
│                       ▼                         ▼                          │
│              ┌──────────────┐          ┌──────────────┐                    │
│              │   ECS Task   │          │   ECS Task   │                    │
│              │ (API Server) │          │ (WebSocket)  │                    │
│              └──────────────┘          └──────────────┘                    │
│                       │                         │                          │
│                       └────────────┬────────────┘                          │
│                                    ▼                                        │
│                          ┌──────────────┐                                  │
│                          │  PostgreSQL  │                                  │
│                          │    (RDS)     │                                  │
│                          └──────────────┘                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SessionCast Agent Pool (ECS)                      │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │  Agent 1  │ │  Agent 2  │ │  Agent 3  │ │  Agent N  │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 7. 보안 아키텍처

### 7.1 인증 흐름

```
┌────────┐                    ┌────────────┐                    ┌──────────┐
│ Client │                    │   Server   │                    │   User   │
└───┬────┘                    └─────┬──────┘                    └────┬─────┘
    │                               │                                │
    │ POST /auth/login              │                                │
    │ {email, password}             │                                │
    │──────────────────────────────▶│                                │
    │                               │ Validate credentials           │
    │                               │───────────────────────────────▶│
    │                               │◀───────────────────────────────│
    │                               │                                │
    │◀──────────────────────────────│                                │
    │ {accessToken, refreshToken}   │                                │
    │                               │                                │
    │ GET /api/missions             │                                │
    │ Authorization: Bearer {token} │                                │
    │──────────────────────────────▶│                                │
    │                               │ Validate JWT                   │
    │                               │                                │
    │◀──────────────────────────────│                                │
    │ {missions: [...]}             │                                │
    │                               │                                │
```

### 7.2 JWT 토큰 구조

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@example.com",
    "workspaceId": "workspace-uuid",
    "roles": ["USER"],
    "iat": 1706054400,
    "exp": 1706140800
  }
}
```

## 8. 확장성 고려사항

### 8.1 수평 확장

- **API Server**: Stateless 설계로 ECS Task 수평 확장 가능
- **WebSocket Server**: Sticky Session + Redis Pub/Sub로 확장
- **SessionCast Agent**: Agent Pool에서 동적 할당

### 8.2 캐싱 전략

- **Redis**: 세션, 토큰, 자주 조회되는 데이터
- **CDN**: 정적 자원 (Frontend)
- **Local Cache**: 설정값, Enum 데이터

### 8.3 메시지 큐 (향후)

- **SQS/Kafka**: AI 작업 큐잉
- **Event-Driven**: 비동기 작업 처리

---

**문서 버전**: 1.0
**작성일**: 2026-01-26
**최종 수정**: 2026-01-26
