# ThreadCast REST API 명세

## 1. 개요

### Base URL
- 개발: `http://localhost:8080/api`
- 프로덕션: `https://api.threadcast.io/api`

### 인증
모든 API 요청은 JWT 토큰을 포함해야 합니다.

```
Authorization: Bearer {access_token}
```

### 공통 응답 형식

**성공 응답:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-01-26T12:00:00Z"
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": {
    "code": "MISSION_NOT_FOUND",
    "message": "Mission with ID xxx not found"
  },
  "timestamp": "2026-01-26T12:00:00Z"
}
```

### HTTP 상태 코드
| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 오류 |

---

## 2. 인증 API

### 2.1 로그인

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "avatarUrl": "https://...",
      "autonomyLevel": 3
    }
  }
}
```

### 2.2 토큰 갱신

```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400
  }
}
```

---

## 3. Mission API

### 3.1 Mission 목록 조회

```
GET /missions
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| workspaceId | UUID | Y | 작업 공간 ID |
| status | String | N | 상태 필터 (BACKLOG, THREADING, WOVEN, ARCHIVED) |
| page | int | N | 페이지 번호 (기본: 0) |
| size | int | N | 페이지 크기 (기본: 20) |

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "title": "로그인 기능 구현",
        "description": "JWT 기반 로그인 시스템 구현",
        "status": "THREADING",
        "priority": "HIGH",
        "progress": 60,
        "estimatedTime": 300,
        "todoStats": {
          "total": 5,
          "pending": 1,
          "threading": 1,
          "woven": 3,
          "tangled": 0
        },
        "createdAt": "2026-01-26T09:00:00Z",
        "startedAt": "2026-01-26T09:30:00Z"
      }
    ],
    "totalElements": 10,
    "totalPages": 1,
    "number": 0
  }
}
```

### 3.2 Mission 상세 조회

```
GET /missions/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "로그인 기능 구현",
    "description": "JWT 기반 로그인 시스템 구현",
    "status": "THREADING",
    "priority": "HIGH",
    "progress": 60,
    "estimatedTime": 300,
    "todos": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "title": "기존 인증 시스템 조사",
        "status": "WOVEN",
        "complexity": "LOW",
        "orderIndex": 1
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440012",
        "title": "로그인 폼 컴포넌트",
        "status": "THREADING",
        "complexity": "MEDIUM",
        "orderIndex": 2,
        "currentStep": "IMPLEMENTATION"
      }
    ],
    "createdAt": "2026-01-26T09:00:00Z",
    "startedAt": "2026-01-26T09:30:00Z"
  }
}
```

### 3.3 Mission 생성

```
POST /missions
```

**Request Body:**
```json
{
  "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "결제 시스템 연동",
  "description": "Stripe API를 사용한 결제 시스템 구현",
  "priority": "HIGH"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "title": "결제 시스템 연동",
    "status": "BACKLOG",
    "priority": "HIGH",
    "progress": 0,
    "threadProposal": {
      "todos": [
        {
          "title": "Stripe API 조사",
          "description": "Stripe API 문서 분석 및 필요 기능 정리",
          "complexity": "LOW",
          "estimatedTime": 30,
          "dependencies": []
        },
        {
          "title": "결제 폼 컴포넌트 구현",
          "description": "카드 정보 입력 UI 컴포넌트",
          "complexity": "MEDIUM",
          "estimatedTime": 90,
          "dependencies": [0]
        },
        {
          "title": "결제 API 엔드포인트 구현",
          "description": "POST /api/payments 엔드포인트",
          "complexity": "HIGH",
          "estimatedTime": 120,
          "dependencies": [0]
        }
      ],
      "totalEstimatedTime": 240
    },
    "createdAt": "2026-01-26T10:00:00Z"
  }
}
```

### 3.4 Mission 상태 변경

```
PATCH /missions/{id}/status
```

**Request Body:**
```json
{
  "status": "THREADING"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "status": "THREADING",
    "startedAt": "2026-01-26T10:05:00Z"
  }
}
```

### 3.5 Mission Thread 시작 (Start Weaving)

```
POST /missions/{id}/start-weaving
```

**Request Body:**
```json
{
  "todos": [
    {
      "title": "Stripe API 조사",
      "description": "Stripe API 문서 분석",
      "complexity": "LOW",
      "estimatedTime": 30,
      "orderIndex": 1,
      "dependencies": []
    },
    {
      "title": "결제 폼 컴포넌트 구현",
      "description": "카드 정보 입력 UI",
      "complexity": "MEDIUM",
      "estimatedTime": 90,
      "orderIndex": 2,
      "dependencies": [1]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "missionId": "550e8400-e29b-41d4-a716-446655440002",
    "status": "THREADING",
    "todosCreated": 2,
    "startedAt": "2026-01-26T10:05:00Z"
  }
}
```

### 3.6 Mission 삭제

```
DELETE /missions/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

## 4. Todo API

### 4.1 Todo 목록 조회

```
GET /todos
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| missionId | UUID | Y | 미션 ID |
| status | String | N | 상태 필터 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "title": "기존 인증 시스템 조사",
      "description": "현재 프로젝트의 인증 방식 분석",
      "status": "WOVEN",
      "priority": "MEDIUM",
      "complexity": "LOW",
      "orderIndex": 1,
      "estimatedTime": 30,
      "actualTime": 25,
      "currentStep": null,
      "steps": [
        { "type": "ANALYSIS", "status": "COMPLETED" },
        { "type": "DESIGN", "status": "COMPLETED" },
        { "type": "IMPLEMENTATION", "status": "COMPLETED" },
        { "type": "VERIFICATION", "status": "COMPLETED" },
        { "type": "REVIEW", "status": "COMPLETED" },
        { "type": "INTEGRATION", "status": "COMPLETED" }
      ],
      "dependencies": [],
      "createdAt": "2026-01-26T09:30:00Z",
      "completedAt": "2026-01-26T09:55:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440012",
      "title": "로그인 폼 컴포넌트",
      "status": "THREADING",
      "complexity": "MEDIUM",
      "orderIndex": 2,
      "estimatedTime": 90,
      "currentStep": "IMPLEMENTATION",
      "steps": [
        { "type": "ANALYSIS", "status": "COMPLETED" },
        { "type": "DESIGN", "status": "COMPLETED" },
        { "type": "IMPLEMENTATION", "status": "IN_PROGRESS" },
        { "type": "VERIFICATION", "status": "PENDING" },
        { "type": "REVIEW", "status": "PENDING" },
        { "type": "INTEGRATION", "status": "PENDING" }
      ],
      "dependencies": ["550e8400-e29b-41d4-a716-446655440011"],
      "createdAt": "2026-01-26T09:30:00Z",
      "startedAt": "2026-01-26T09:55:00Z"
    }
  ]
}
```

### 4.2 Todo 상세 조회

```
GET /todos/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440012",
    "missionId": "550e8400-e29b-41d4-a716-446655440001",
    "missionTitle": "로그인 기능 구현",
    "title": "로그인 폼 컴포넌트",
    "description": "React 컴포넌트로 로그인 폼 UI 구현",
    "status": "THREADING",
    "priority": "HIGH",
    "complexity": "MEDIUM",
    "orderIndex": 2,
    "estimatedTime": 90,
    "actualTime": null,
    "currentStep": "IMPLEMENTATION",
    "steps": [
      {
        "type": "ANALYSIS",
        "status": "COMPLETED",
        "startedAt": "2026-01-26T09:55:00Z",
        "completedAt": "2026-01-26T10:00:00Z",
        "output": "기존 컴포넌트 구조 분석 완료. Form validation 라이브러리로 react-hook-form 사용 권장."
      },
      {
        "type": "DESIGN",
        "status": "COMPLETED",
        "startedAt": "2026-01-26T10:00:00Z",
        "completedAt": "2026-01-26T10:10:00Z",
        "output": "LoginForm 컴포넌트 구조 설계 완료. EmailInput, PasswordInput, SubmitButton 하위 컴포넌트 구성."
      },
      {
        "type": "IMPLEMENTATION",
        "status": "IN_PROGRESS",
        "startedAt": "2026-01-26T10:10:00Z"
      },
      { "type": "VERIFICATION", "status": "PENDING" },
      { "type": "REVIEW", "status": "PENDING" },
      { "type": "INTEGRATION", "status": "PENDING" }
    ],
    "dependencies": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "title": "기존 인증 시스템 조사",
        "status": "WOVEN"
      }
    ],
    "files": [
      {
        "path": "src/components/LoginForm.tsx",
        "action": "CREATED",
        "additions": 45,
        "deletions": 0
      },
      {
        "path": "src/components/LoginForm.test.tsx",
        "action": "CREATED",
        "additions": 30,
        "deletions": 0
      }
    ],
    "comments": [
      {
        "id": "comment-1",
        "userId": "user-1",
        "userName": "John Doe",
        "content": "@ai 로그인 실패 시 에러 메시지도 표시해줘",
        "hasAiMention": true,
        "createdAt": "2026-01-26T10:15:00Z"
      }
    ],
    "createdAt": "2026-01-26T09:30:00Z",
    "startedAt": "2026-01-26T09:55:00Z"
  }
}
```

### 4.3 Todo 생성

```
POST /todos
```

**Request Body:**
```json
{
  "missionId": "550e8400-e29b-41d4-a716-446655440001",
  "title": "비밀번호 재설정 기능",
  "description": "이메일을 통한 비밀번호 재설정 플로우 구현",
  "priority": "MEDIUM",
  "orderIndex": 6,
  "dependencies": ["550e8400-e29b-41d4-a716-446655440011"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440016",
    "title": "비밀번호 재설정 기능",
    "status": "PENDING",
    "complexity": "MEDIUM",
    "estimatedTime": 60,
    "createdAt": "2026-01-26T11:00:00Z"
  }
}
```

### 4.4 Todo 상태 변경

```
PATCH /todos/{id}/status
```

**Request Body:**
```json
{
  "status": "THREADING"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440016",
    "status": "THREADING",
    "startedAt": "2026-01-26T11:05:00Z"
  }
}
```

### 4.5 Todo 수정

```
PATCH /todos/{id}
```

**Request Body:**
```json
{
  "title": "비밀번호 재설정 기능 (이메일 인증)",
  "priority": "HIGH",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440016",
    "title": "비밀번호 재설정 기능 (이메일 인증)",
    "priority": "HIGH",
    "updatedAt": "2026-01-26T11:10:00Z"
  }
}
```

### 4.6 Todo 삭제

```
DELETE /todos/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

## 5. Timeline API

### 5.1 타임라인 조회

```
GET /timeline
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| workspaceId | UUID | Y | 작업 공간 ID |
| missionId | UUID | N | 미션 필터 |
| todoId | UUID | N | Todo 필터 |
| eventType | String | N | 이벤트 타입 필터 |
| actorType | String | N | 행위자 타입 필터 (AI, SYSTEM, USER) |
| from | DateTime | N | 시작 일시 |
| to | DateTime | N | 종료 일시 |
| page | int | N | 페이지 번호 (기본: 0) |
| size | int | N | 페이지 크기 (기본: 50) |

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "event-1",
        "eventType": "STEP_COMPLETED",
        "actorType": "AI",
        "description": "Implementation 단계 완료",
        "missionId": "550e8400-e29b-41d4-a716-446655440001",
        "missionTitle": "로그인 기능 구현",
        "todoId": "550e8400-e29b-41d4-a716-446655440012",
        "todoTitle": "로그인 폼 컴포넌트",
        "metadata": {
          "stepType": "IMPLEMENTATION",
          "filesModified": 2,
          "linesAdded": 75
        },
        "createdAt": "2026-01-26T10:30:00Z"
      },
      {
        "id": "event-2",
        "eventType": "FILE_MODIFIED",
        "actorType": "AI",
        "description": "LoginForm.tsx 수정",
        "todoId": "550e8400-e29b-41d4-a716-446655440012",
        "metadata": {
          "filePath": "src/components/LoginForm.tsx",
          "additions": 45,
          "deletions": 5
        },
        "createdAt": "2026-01-26T10:28:00Z"
      },
      {
        "id": "event-3",
        "eventType": "COMMENT_ADDED",
        "actorType": "USER",
        "description": "John Doe가 코멘트 추가",
        "todoId": "550e8400-e29b-41d4-a716-446655440012",
        "metadata": {
          "userId": "user-1",
          "userName": "John Doe",
          "hasAiMention": true
        },
        "createdAt": "2026-01-26T10:15:00Z"
      }
    ],
    "totalElements": 150,
    "totalPages": 3,
    "number": 0
  }
}
```

### 5.2 오늘의 활동 통계

```
GET /timeline/stats/today
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| workspaceId | UUID | Y | 작업 공간 ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-26",
    "todosWoven": 8,
    "todosThreading": 2,
    "todosTangled": 1,
    "filesCreated": 15,
    "filesModified": 42,
    "linesAdded": 1250,
    "linesDeleted": 180,
    "aiQuestionsAsked": 5,
    "aiQuestionsAnswered": 4,
    "commentsAdded": 12
  }
}
```

---

## 6. AI Question API

### 6.1 대기 중인 질문 목록

```
GET /ai/questions
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| workspaceId | UUID | Y | 작업 공간 ID |
| status | String | N | 상태 필터 (PENDING, ANSWERED) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "question-1",
      "todoId": "550e8400-e29b-41d4-a716-446655440012",
      "todoTitle": "로그인 폼 컴포넌트",
      "question": "로그인 실패 시 재시도 횟수를 어떻게 설정할까요?",
      "context": "현재 Implementation 단계에서 로그인 로직을 구현 중입니다. 보안을 위해 재시도 제한이 필요합니다.",
      "category": "IMPLEMENTATION",
      "options": [
        { "value": "3", "label": "3회 (일반적)" },
        { "value": "5", "label": "5회 (여유있게)" },
        { "value": "unlimited", "label": "제한 없음" }
      ],
      "status": "PENDING",
      "createdAt": "2026-01-26T10:20:00Z"
    },
    {
      "id": "question-2",
      "todoId": "550e8400-e29b-41d4-a716-446655440013",
      "todoTitle": "API 엔드포인트 구현",
      "question": "JWT 토큰 만료 시간을 얼마로 설정할까요?",
      "context": "보안과 사용자 경험 사이의 균형이 필요합니다.",
      "category": "CONFIGURATION",
      "options": [
        { "value": "1h", "label": "1시간 (보안 강화)" },
        { "value": "24h", "label": "24시간 (일반적)" },
        { "value": "7d", "label": "7일 (편의성)" }
      ],
      "status": "PENDING",
      "createdAt": "2026-01-26T10:25:00Z"
    }
  ]
}
```

### 6.2 질문 상세 조회

```
GET /ai/questions/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "question-1",
    "todoId": "550e8400-e29b-41d4-a716-446655440012",
    "todoTitle": "로그인 폼 컴포넌트",
    "question": "로그인 실패 시 재시도 횟수를 어떻게 설정할까요?",
    "context": "현재 Implementation 단계에서 로그인 로직을 구현 중입니다. 보안을 위해 재시도 제한이 필요합니다.",
    "category": "IMPLEMENTATION",
    "options": [
      { "value": "3", "label": "3회 (일반적)" },
      { "value": "5", "label": "5회 (여유있게)" },
      { "value": "unlimited", "label": "제한 없음" }
    ],
    "status": "PENDING",
    "answer": null,
    "createdAt": "2026-01-26T10:20:00Z"
  }
}
```

### 6.3 질문에 답변

```
POST /ai/questions/{id}/answer
```

**Request Body:**
```json
{
  "answer": "3",
  "customAnswer": null
}
```

또는 커스텀 답변:
```json
{
  "answer": null,
  "customAnswer": "10회로 설정하고, 그 후 30분 대기"
}
```

또는 AI 자동 결정:
```json
{
  "answer": "AUTO_DECIDE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "questionId": "question-1",
    "status": "ANSWERED",
    "answer": "3",
    "answeredBy": "USER",
    "answeredAt": "2026-01-26T10:22:00Z"
  }
}
```

### 6.4 일괄 답변

```
POST /ai/questions/batch-answer
```

**Request Body:**
```json
{
  "answers": [
    { "questionId": "question-1", "answer": "3" },
    { "questionId": "question-2", "answer": "24h" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answered": 2,
    "failed": 0
  }
}
```

---

## 7. Comment API

### 7.1 코멘트 목록 조회

```
GET /todos/{todoId}/comments
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comment-1",
      "userId": "user-1",
      "userName": "John Doe",
      "userAvatarUrl": "https://...",
      "content": "@ai 로그인 실패 시 에러 메시지도 표시해줘",
      "hasAiMention": true,
      "parentId": null,
      "replies": [
        {
          "id": "comment-2",
          "userId": "ai",
          "userName": "AI Assistant",
          "content": "네, 에러 메시지 표시 기능을 추가하겠습니다.",
          "hasAiMention": false,
          "createdAt": "2026-01-26T10:16:00Z"
        }
      ],
      "createdAt": "2026-01-26T10:15:00Z"
    }
  ]
}
```

### 7.2 코멘트 작성

```
POST /todos/{todoId}/comments
```

**Request Body:**
```json
{
  "content": "@ai 비밀번호 유효성 검사 규칙을 추가해줘",
  "parentId": null
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "comment-3",
    "userId": "user-1",
    "userName": "John Doe",
    "content": "@ai 비밀번호 유효성 검사 규칙을 추가해줘",
    "hasAiMention": true,
    "createdAt": "2026-01-26T10:30:00Z"
  }
}
```

---

## 8. User Settings API

### 8.1 사용자 설정 조회

```
GET /users/me/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "autonomyLevel": 3,
    "emailNotifications": true,
    "webNotifications": true,
    "theme": "SYSTEM"
  }
}
```

### 8.2 자율성 레벨 변경

```
PATCH /users/me/settings/autonomy-level
```

**Request Body:**
```json
{
  "level": 4
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "autonomyLevel": 4,
    "description": "High - 매우 중요하거나 위험한 결정만 물어봅니다"
  }
}
```

---

## 9. 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| AUTH_INVALID_CREDENTIALS | 401 | 잘못된 이메일/비밀번호 |
| AUTH_TOKEN_EXPIRED | 401 | 토큰 만료 |
| AUTH_TOKEN_INVALID | 401 | 유효하지 않은 토큰 |
| MISSION_NOT_FOUND | 404 | 미션을 찾을 수 없음 |
| MISSION_ALREADY_THREADING | 400 | 이미 진행 중인 미션 |
| TODO_NOT_FOUND | 404 | Todo를 찾을 수 없음 |
| TODO_DEPENDENCY_NOT_MET | 400 | 의존성 미충족 |
| QUESTION_ALREADY_ANSWERED | 400 | 이미 답변된 질문 |
| WORKSPACE_NOT_FOUND | 404 | 작업 공간을 찾을 수 없음 |
| FORBIDDEN | 403 | 권한 없음 |
| VALIDATION_ERROR | 400 | 입력값 검증 실패 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

---

**문서 버전**: 1.0
**작성일**: 2026-01-26
**최종 수정**: 2026-01-26
