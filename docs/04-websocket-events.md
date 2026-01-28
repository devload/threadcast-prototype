# ThreadCast WebSocket 이벤트 정의

## 1. 개요

ThreadCast는 STOMP 프로토콜 기반의 WebSocket을 사용하여 실시간 업데이트를 제공합니다.

### 연결 정보
- **개발**: `ws://localhost:8080/ws`
- **프로덕션**: `wss://api.threadcast.io/ws`

### STOMP 설정
```javascript
const client = new Client({
  brokerURL: 'wss://api.threadcast.io/ws',
  connectHeaders: {
    Authorization: `Bearer ${accessToken}`
  },
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000
});
```

## 2. 토픽 구조

```
/topic/workspaces/{workspaceId}           # 작업 공간 전체 이벤트
/topic/missions/{missionId}               # 미션 업데이트
/topic/todos/{todoId}                     # Todo 업데이트
/topic/timeline/{workspaceId}             # 타임라인 실시간 이벤트
/topic/ai/questions/{workspaceId}         # AI 질문 알림
/user/queue/notifications                 # 개인 알림
```

## 3. 구독 (Subscribe)

### 3.1 작업 공간 이벤트 구독

모든 Mission/Todo 상태 변경을 한 번에 받을 때 사용합니다.

```javascript
client.subscribe('/topic/workspaces/550e8400-...', (message) => {
  const event = JSON.parse(message.body);
  console.log('Workspace event:', event);
});
```

**이벤트 유형:**
- `MISSION_CREATED`
- `MISSION_UPDATED`
- `MISSION_STATUS_CHANGED`
- `TODO_CREATED`
- `TODO_UPDATED`
- `TODO_STATUS_CHANGED`

### 3.2 미션 상세 이벤트 구독

특정 미션의 상세 업데이트를 받을 때 사용합니다.

```javascript
client.subscribe('/topic/missions/550e8400-...', (message) => {
  const event = JSON.parse(message.body);
  console.log('Mission event:', event);
});
```

### 3.3 Todo 상세 이벤트 구독

특정 Todo의 실시간 진행 상황을 받을 때 사용합니다.

```javascript
client.subscribe('/topic/todos/550e8400-...', (message) => {
  const event = JSON.parse(message.body);
  console.log('Todo event:', event);
});
```

### 3.4 타임라인 이벤트 구독

실시간 Activity 피드를 받을 때 사용합니다.

```javascript
client.subscribe('/topic/timeline/550e8400-...', (message) => {
  const event = JSON.parse(message.body);
  console.log('Timeline event:', event);
});
```

### 3.5 AI 질문 알림 구독

AI가 새로운 질문을 생성했을 때 알림을 받습니다.

```javascript
client.subscribe('/topic/ai/questions/550e8400-...', (message) => {
  const event = JSON.parse(message.body);
  console.log('AI Question:', event);
});
```

### 3.6 개인 알림 구독

사용자별 개인 알림을 받습니다.

```javascript
client.subscribe('/user/queue/notifications', (message) => {
  const notification = JSON.parse(message.body);
  console.log('Notification:', notification);
});
```

---

## 4. 이벤트 메시지 형식

### 4.1 공통 이벤트 형식

```json
{
  "eventId": "evt-550e8400-...",
  "eventType": "TODO_STATUS_CHANGED",
  "timestamp": "2026-01-26T10:30:00Z",
  "payload": { ... }
}
```

---

## 5. Mission 이벤트

### 5.1 MISSION_CREATED

미션이 생성되었을 때 발생합니다.

**토픽**: `/topic/workspaces/{workspaceId}`

```json
{
  "eventId": "evt-001",
  "eventType": "MISSION_CREATED",
  "timestamp": "2026-01-26T10:00:00Z",
  "payload": {
    "id": "550e8400-...-001",
    "title": "로그인 기능 구현",
    "description": "JWT 기반 로그인 시스템",
    "status": "BACKLOG",
    "priority": "HIGH",
    "progress": 0,
    "createdAt": "2026-01-26T10:00:00Z"
  }
}
```

### 5.2 MISSION_STATUS_CHANGED

미션 상태가 변경되었을 때 발생합니다.

**토픽**: `/topic/workspaces/{workspaceId}`, `/topic/missions/{missionId}`

```json
{
  "eventId": "evt-002",
  "eventType": "MISSION_STATUS_CHANGED",
  "timestamp": "2026-01-26T10:05:00Z",
  "payload": {
    "missionId": "550e8400-...-001",
    "previousStatus": "BACKLOG",
    "newStatus": "THREADING",
    "startedAt": "2026-01-26T10:05:00Z"
  }
}
```

### 5.3 MISSION_PROGRESS_UPDATED

미션 진행률이 업데이트되었을 때 발생합니다.

**토픽**: `/topic/workspaces/{workspaceId}`, `/topic/missions/{missionId}`

```json
{
  "eventId": "evt-003",
  "eventType": "MISSION_PROGRESS_UPDATED",
  "timestamp": "2026-01-26T10:30:00Z",
  "payload": {
    "missionId": "550e8400-...-001",
    "progress": 60,
    "todoStats": {
      "total": 5,
      "pending": 1,
      "threading": 1,
      "woven": 3,
      "tangled": 0
    }
  }
}
```

### 5.4 MISSION_COMPLETED

미션이 완료되었을 때 발생합니다.

**토픽**: `/topic/workspaces/{workspaceId}`, `/topic/missions/{missionId}`

```json
{
  "eventId": "evt-004",
  "eventType": "MISSION_COMPLETED",
  "timestamp": "2026-01-26T12:00:00Z",
  "payload": {
    "missionId": "550e8400-...-001",
    "title": "로그인 기능 구현",
    "status": "WOVEN",
    "completedAt": "2026-01-26T12:00:00Z",
    "totalTime": 115,
    "todoStats": {
      "total": 5,
      "woven": 5
    }
  }
}
```

---

## 6. Todo 이벤트

### 6.1 TODO_CREATED

Todo가 생성되었을 때 발생합니다.

**토픽**: `/topic/missions/{missionId}`

```json
{
  "eventId": "evt-101",
  "eventType": "TODO_CREATED",
  "timestamp": "2026-01-26T10:05:00Z",
  "payload": {
    "id": "550e8400-...-011",
    "missionId": "550e8400-...-001",
    "title": "기존 인증 시스템 조사",
    "description": "현재 프로젝트의 인증 방식 분석",
    "status": "PENDING",
    "complexity": "LOW",
    "estimatedTime": 30,
    "orderIndex": 1
  }
}
```

### 6.2 TODO_STATUS_CHANGED

Todo 상태가 변경되었을 때 발생합니다.

**토픽**: `/topic/missions/{missionId}`, `/topic/todos/{todoId}`

```json
{
  "eventId": "evt-102",
  "eventType": "TODO_STATUS_CHANGED",
  "timestamp": "2026-01-26T10:10:00Z",
  "payload": {
    "todoId": "550e8400-...-011",
    "missionId": "550e8400-...-001",
    "previousStatus": "PENDING",
    "newStatus": "THREADING",
    "startedAt": "2026-01-26T10:10:00Z"
  }
}
```

### 6.3 TODO_STEP_STARTED

Todo의 특정 단계가 시작되었을 때 발생합니다.

**토픽**: `/topic/todos/{todoId}`

```json
{
  "eventId": "evt-103",
  "eventType": "TODO_STEP_STARTED",
  "timestamp": "2026-01-26T10:10:00Z",
  "payload": {
    "todoId": "550e8400-...-011",
    "stepType": "ANALYSIS",
    "stepIndex": 1,
    "totalSteps": 6,
    "startedAt": "2026-01-26T10:10:00Z"
  }
}
```

### 6.4 TODO_STEP_COMPLETED

Todo의 특정 단계가 완료되었을 때 발생합니다.

**토픽**: `/topic/todos/{todoId}`, `/topic/timeline/{workspaceId}`

```json
{
  "eventId": "evt-104",
  "eventType": "TODO_STEP_COMPLETED",
  "timestamp": "2026-01-26T10:15:00Z",
  "payload": {
    "todoId": "550e8400-...-011",
    "stepType": "ANALYSIS",
    "stepIndex": 1,
    "totalSteps": 6,
    "output": "기존 JWT 기반 인증 시스템 분석 완료. 만료 시간 24시간, Refresh Token 미사용.",
    "completedAt": "2026-01-26T10:15:00Z",
    "duration": 300
  }
}
```

### 6.5 TODO_COMPLETED

Todo가 완료되었을 때 발생합니다.

**토픽**: `/topic/missions/{missionId}`, `/topic/todos/{todoId}`

```json
{
  "eventId": "evt-105",
  "eventType": "TODO_COMPLETED",
  "timestamp": "2026-01-26T10:40:00Z",
  "payload": {
    "todoId": "550e8400-...-011",
    "missionId": "550e8400-...-001",
    "title": "기존 인증 시스템 조사",
    "status": "WOVEN",
    "completedAt": "2026-01-26T10:40:00Z",
    "actualTime": 30,
    "estimatedTime": 30,
    "filesCreated": 1,
    "filesModified": 0
  }
}
```

### 6.6 TODO_FAILED

Todo가 실패했을 때 발생합니다.

**토픽**: `/topic/missions/{missionId}`, `/topic/todos/{todoId}`

```json
{
  "eventId": "evt-106",
  "eventType": "TODO_FAILED",
  "timestamp": "2026-01-26T11:00:00Z",
  "payload": {
    "todoId": "550e8400-...-012",
    "missionId": "550e8400-...-001",
    "title": "로그인 폼 컴포넌트",
    "status": "TANGLED",
    "failedAt": "2026-01-26T11:00:00Z",
    "failedStep": "IMPLEMENTATION",
    "errorMessage": "Cannot find module 'react-hook-form'",
    "retryCount": 0
  }
}
```

---

## 7. 파일 이벤트

### 7.1 FILE_CREATED

파일이 생성되었을 때 발생합니다.

**토픽**: `/topic/todos/{todoId}`, `/topic/timeline/{workspaceId}`

```json
{
  "eventId": "evt-201",
  "eventType": "FILE_CREATED",
  "timestamp": "2026-01-26T10:20:00Z",
  "payload": {
    "todoId": "550e8400-...-012",
    "filePath": "src/components/LoginForm.tsx",
    "additions": 45,
    "language": "typescript"
  }
}
```

### 7.2 FILE_MODIFIED

파일이 수정되었을 때 발생합니다.

**토픽**: `/topic/todos/{todoId}`, `/topic/timeline/{workspaceId}`

```json
{
  "eventId": "evt-202",
  "eventType": "FILE_MODIFIED",
  "timestamp": "2026-01-26T10:25:00Z",
  "payload": {
    "todoId": "550e8400-...-012",
    "filePath": "src/components/LoginForm.tsx",
    "additions": 15,
    "deletions": 5,
    "language": "typescript"
  }
}
```

### 7.3 FILE_DELETED

파일이 삭제되었을 때 발생합니다.

**토픽**: `/topic/todos/{todoId}`, `/topic/timeline/{workspaceId}`

```json
{
  "eventId": "evt-203",
  "eventType": "FILE_DELETED",
  "timestamp": "2026-01-26T10:30:00Z",
  "payload": {
    "todoId": "550e8400-...-012",
    "filePath": "src/components/OldLoginForm.tsx",
    "deletions": 120
  }
}
```

---

## 8. AI 질문 이벤트

### 8.1 AI_QUESTION_CREATED

AI가 새로운 질문을 생성했을 때 발생합니다.

**토픽**: `/topic/ai/questions/{workspaceId}`, `/topic/todos/{todoId}`

```json
{
  "eventId": "evt-301",
  "eventType": "AI_QUESTION_CREATED",
  "timestamp": "2026-01-26T10:20:00Z",
  "payload": {
    "questionId": "question-001",
    "todoId": "550e8400-...-012",
    "todoTitle": "로그인 폼 컴포넌트",
    "question": "로그인 실패 시 재시도 횟수를 어떻게 설정할까요?",
    "context": "현재 Implementation 단계에서 로그인 로직을 구현 중입니다.",
    "category": "IMPLEMENTATION",
    "options": [
      { "value": "3", "label": "3회 (일반적)" },
      { "value": "5", "label": "5회 (여유있게)" },
      { "value": "unlimited", "label": "제한 없음" }
    ],
    "urgent": true
  }
}
```

### 8.2 AI_QUESTION_ANSWERED

AI 질문이 답변되었을 때 발생합니다.

**토픽**: `/topic/ai/questions/{workspaceId}`, `/topic/todos/{todoId}`

```json
{
  "eventId": "evt-302",
  "eventType": "AI_QUESTION_ANSWERED",
  "timestamp": "2026-01-26T10:22:00Z",
  "payload": {
    "questionId": "question-001",
    "todoId": "550e8400-...-012",
    "answer": "3",
    "answeredBy": "USER",
    "answeredAt": "2026-01-26T10:22:00Z"
  }
}
```

### 8.3 AI_QUESTION_AUTO_RESOLVED

AI 자율성 레벨에 따라 자동 결정되었을 때 발생합니다.

**토픽**: `/topic/ai/questions/{workspaceId}`, `/topic/todos/{todoId}`

```json
{
  "eventId": "evt-303",
  "eventType": "AI_QUESTION_AUTO_RESOLVED",
  "timestamp": "2026-01-26T10:21:00Z",
  "payload": {
    "questionId": "question-002",
    "todoId": "550e8400-...-013",
    "question": "변수명을 userRepository로 할까요, userRepo로 할까요?",
    "autoAnswer": "userRepository",
    "reason": "프로젝트 코드 컨벤션에 따라 전체 이름 사용",
    "autonomyLevel": 4
  }
}
```

---

## 9. 코멘트 이벤트

### 9.1 COMMENT_ADDED

코멘트가 추가되었을 때 발생합니다.

**토픽**: `/topic/todos/{todoId}`, `/topic/timeline/{workspaceId}`

```json
{
  "eventId": "evt-401",
  "eventType": "COMMENT_ADDED",
  "timestamp": "2026-01-26T10:25:00Z",
  "payload": {
    "commentId": "comment-001",
    "todoId": "550e8400-...-012",
    "userId": "user-001",
    "userName": "John Doe",
    "userAvatarUrl": "https://...",
    "content": "@ai 로그인 실패 시 에러 메시지도 표시해줘",
    "hasAiMention": true,
    "parentId": null
  }
}
```

### 9.2 AI_RESPONSE_TO_COMMENT

AI가 멘션된 코멘트에 응답했을 때 발생합니다.

**토픽**: `/topic/todos/{todoId}`

```json
{
  "eventId": "evt-402",
  "eventType": "AI_RESPONSE_TO_COMMENT",
  "timestamp": "2026-01-26T10:26:00Z",
  "payload": {
    "commentId": "comment-002",
    "parentCommentId": "comment-001",
    "todoId": "550e8400-...-012",
    "content": "네, 에러 메시지 표시 기능을 추가하겠습니다. 현재 Implementation 단계에서 바로 반영합니다.",
    "estimatedImpact": "5분 추가 소요 예상"
  }
}
```

---

## 10. 알림 이벤트

### 10.1 개인 알림

사용자 개인 알림입니다.

**토픽**: `/user/queue/notifications`

```json
{
  "eventId": "evt-501",
  "eventType": "NOTIFICATION",
  "timestamp": "2026-01-26T10:30:00Z",
  "payload": {
    "type": "MISSION_COMPLETED",
    "title": "미션 완료",
    "message": "'로그인 기능 구현' 미션이 완료되었습니다.",
    "missionId": "550e8400-...-001",
    "read": false,
    "actionUrl": "/missions/550e8400-...-001"
  }
}
```

### 알림 타입
| 타입 | 설명 |
|------|------|
| MISSION_COMPLETED | 미션 완료 |
| TODO_COMPLETED | Todo 완료 |
| TODO_FAILED | Todo 실패 (주의 필요) |
| AI_QUESTION_URGENT | 긴급 AI 질문 |
| COMMENT_MENTION | 코멘트에서 멘션됨 |

---

## 11. 클라이언트 구현 예시

### 11.1 React Hook 예시

```typescript
// useWebSocket.ts
import { Client, IMessage } from '@stomp/stompjs';
import { useEffect, useRef, useCallback } from 'react';
import { useMissionStore } from '../store/missionStore';
import { useTodoStore } from '../store/todoStore';

export const useWebSocket = (workspaceId: string, accessToken: string) => {
  const clientRef = useRef<Client | null>(null);
  const { updateMission, addMission } = useMissionStore();
  const { updateTodo, addTodo } = useTodoStore();

  useEffect(() => {
    const client = new Client({
      brokerURL: `${process.env.NEXT_PUBLIC_WS_URL}/ws`,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('WebSocket connected');

      // 작업 공간 이벤트 구독
      client.subscribe(`/topic/workspaces/${workspaceId}`, handleWorkspaceEvent);

      // 타임라인 이벤트 구독
      client.subscribe(`/topic/timeline/${workspaceId}`, handleTimelineEvent);

      // AI 질문 알림 구독
      client.subscribe(`/topic/ai/questions/${workspaceId}`, handleAIQuestionEvent);

      // 개인 알림 구독
      client.subscribe('/user/queue/notifications', handleNotification);
    };

    client.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message']);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [workspaceId, accessToken]);

  const handleWorkspaceEvent = useCallback((message: IMessage) => {
    const event = JSON.parse(message.body);

    switch (event.eventType) {
      case 'MISSION_CREATED':
        addMission(event.payload);
        break;
      case 'MISSION_STATUS_CHANGED':
      case 'MISSION_PROGRESS_UPDATED':
        updateMission(event.payload.missionId, event.payload);
        break;
      case 'TODO_CREATED':
        addTodo(event.payload);
        break;
      case 'TODO_STATUS_CHANGED':
        updateTodo(event.payload.todoId, event.payload);
        break;
    }
  }, [addMission, updateMission, addTodo, updateTodo]);

  const subscribeToTodo = useCallback((todoId: string, callback: (event: any) => void) => {
    if (clientRef.current?.connected) {
      return clientRef.current.subscribe(`/topic/todos/${todoId}`, (message) => {
        callback(JSON.parse(message.body));
      });
    }
    return null;
  }, []);

  return { subscribeToTodo };
};
```

### 11.2 Zustand Store 연동 예시

```typescript
// missionStore.ts
import { create } from 'zustand';

interface Mission {
  id: string;
  title: string;
  status: string;
  progress: number;
  // ...
}

interface MissionStore {
  missions: Mission[];
  addMission: (mission: Mission) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  removeMission: (id: string) => void;
}

export const useMissionStore = create<MissionStore>((set) => ({
  missions: [],

  addMission: (mission) =>
    set((state) => ({
      missions: [...state.missions, mission]
    })),

  updateMission: (id, updates) =>
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      )
    })),

  removeMission: (id) =>
    set((state) => ({
      missions: state.missions.filter((m) => m.id !== id)
    })),
}));
```

---

## 12. 에러 처리

### 12.1 연결 에러

```json
{
  "eventType": "ERROR",
  "payload": {
    "code": "CONNECTION_FAILED",
    "message": "Failed to connect to WebSocket server"
  }
}
```

### 12.2 인증 에러

```json
{
  "eventType": "ERROR",
  "payload": {
    "code": "AUTH_FAILED",
    "message": "Invalid or expired token"
  }
}
```

### 12.3 구독 에러

```json
{
  "eventType": "ERROR",
  "payload": {
    "code": "SUBSCRIPTION_DENIED",
    "message": "Not authorized to subscribe to this topic",
    "topic": "/topic/workspaces/xxx"
  }
}
```

---

**문서 버전**: 1.0
**작성일**: 2026-01-26
**최종 수정**: 2026-01-26
