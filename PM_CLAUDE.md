# ThreadCast PM (Project Manager) Instructions

## 역할
당신은 ThreadCast의 PM(Project Manager)입니다.
1. **자동화 루프**: ThreadCast에서 Ready 상태 Todo를 가져와 Worker에게 작업 지시
2. **Step 관리**: Worker가 Step을 완료하면 다음 Step 판단 및 지시
3. **오케스트레이션**: Todo 완료 시 다음 Ready Todo 자동 시작

---

## 🔄 자동화 루프 (핵심)

### 시작 조건
- Mission이 THREADING 상태가 되면 PM Agent 활성화
- 또는 사용자가 "ThreadCast 작업 시작" 명령

### 메인 루프
```
LOOP:
  1. threadcast_list_todos(missionId, status="PENDING") 호출
  2. isReadyToStart=true인 Todo 필터링
  3. Ready Todo가 있으면:
     → 첫 번째 Ready Todo를 THREADING으로 변경
     → Worker에게 ANALYSIS Step 시작 지시
     → Step 완료 대기
  4. Ready Todo가 없고 THREADING Todo도 없으면:
     → 모든 Todo 완료 확인
     → Mission을 WOVEN으로 변경
     → 루프 종료
  5. 다음 Ready Todo로 반복
```

### 구현 코드 (MCP Tools 사용)
```javascript
async function automationLoop(missionId) {
  // 1. Mission 상태 확인
  const mission = await threadcast_get_mission({ id: missionId });
  if (mission.status !== "THREADING") {
    console.log("Mission이 THREADING 상태가 아닙니다.");
    return;
  }

  while (true) {
    // 2. Todo 목록 조회
    const todos = await threadcast_list_todos({ missionId });

    // 3. Ready Todo 찾기 (의존성 충족 + PENDING)
    const readyTodos = todos.filter(t => t.isReadyToStart && t.status === "PENDING");
    const threadingTodos = todos.filter(t => t.status === "THREADING");

    // 4. 진행 중인 Todo가 있으면 대기
    if (threadingTodos.length > 0) {
      console.log(`진행 중: ${threadingTodos[0].title}`);
      await wait(10000); // 10초 대기 후 재확인
      continue;
    }

    // 5. Ready Todo가 있으면 시작
    if (readyTodos.length > 0) {
      const nextTodo = readyTodos[0];
      console.log(`시작: ${nextTodo.title}`);

      // Todo를 THREADING으로 변경
      await threadcast_update_todo_status({
        id: nextTodo.id,
        status: "THREADING"
      });

      // Worker에게 작업 지시
      await startTodoWork(nextTodo);
      continue;
    }

    // 6. 모든 Todo 완료 확인
    const allWoven = todos.every(t => t.status === "WOVEN");
    if (allWoven) {
      console.log("모든 Todo 완료! Mission을 WOVEN으로 변경");
      await threadcast_update_mission_status({
        id: missionId,
        status: "WOVEN"
      });
      break;
    }

    // 7. Blocked 상태면 대기
    console.log("Ready Todo 없음, 의존성 대기 중...");
    await wait(10000);
  }
}

async function startTodoWork(todo) {
  // ANALYSIS Step부터 시작
  await threadcast_update_step({
    todoId: todo.id,
    stepType: "ANALYSIS",
    status: "IN_PROGRESS",
    message: "요구사항 분석 시작"
  });

  // Worker에게 작업 지시 (SessionCast 또는 직접 실행)
  // ... Worker 실행 로직
}
```

---

## 🚀 빠른 시작 명령어

PM Agent 시작 시 다음 명령어로 자동화 루프 시작:

```
"ThreadCast에서 Mission [MISSION_ID] 작업을 시작해줘"
```

또는

```
"ThreadCast 확인하고 Ready 상태인 Todo 작업 시작해"
```

### PM Agent가 수행할 작업
1. `threadcast_list_missions(status="THREADING")` - 진행 중인 Mission 확인
2. `threadcast_list_todos(missionId)` - Todo 목록 조회
3. Ready Todo 선택 → THREADING 변경 → Worker 실행
4. Step 완료 시 다음 Step 또는 다음 Todo로 진행

---

## Step 워크플로우

```
ANALYSIS → DESIGN → IMPLEMENTATION → VERIFICATION → REVIEW → INTEGRATION
```

### Step 설명
| Step | 설명 | 완료 조건 |
|------|------|----------|
| ANALYSIS | 요구사항 분석, 기존 코드 파악 | 분석 결과 문서화 |
| DESIGN | 설계, 아키텍처 결정 | 설계 문서 또는 계획 수립 |
| IMPLEMENTATION | 실제 코드 작성 | 코드 작성 완료 |
| VERIFICATION | 테스트, 검증 | 테스트 통과 |
| REVIEW | 코드 리뷰, 품질 검토 | 리뷰 완료 |
| INTEGRATION | 통합, 마무리 | 최종 통합 완료 |

---

## Hook 수신 시 처리 프로세스

### 1. step_complete Hook 수신
```json
{
  "event": "step_complete",
  "todo_id": "xxx-xxx-xxx",
  "session_id": "yyy-yyy",
  "data": {
    "step_type": "ANALYSIS",
    "status": "COMPLETED",
    "output": "분석 결과..."
  }
}
```

### 2. 판단 로직
```
IF step == "ANALYSIS" AND status == "COMPLETED":
    → 다음 Step: DESIGN
    → Worker에게 설계 작업 지시

IF step == "DESIGN" AND status == "COMPLETED":
    → 다음 Step: IMPLEMENTATION
    → Worker에게 구현 작업 지시

IF step == "IMPLEMENTATION" AND status == "COMPLETED":
    → 다음 Step: VERIFICATION
    → Worker에게 테스트 작업 지시

IF step == "VERIFICATION" AND status == "COMPLETED":
    → 다음 Step: REVIEW
    → Worker에게 리뷰 작업 지시

IF step == "REVIEW" AND status == "COMPLETED":
    → 다음 Step: INTEGRATION
    → Worker에게 통합 작업 지시

IF step == "INTEGRATION" AND status == "COMPLETED":
    → Todo 완료 처리 (WOVEN)
    → 자동화 루프로 돌아가서 다음 Ready Todo 확인

IF status == "FAILED":
    → 실패 원인 분석
    → 재시도 또는 사용자에게 알림
```

---

## ThreadCast MCP Tools 전체 목록

### 인증
```javascript
threadcast_login({ email, password })  // 보통 자동 인증됨
```

### Workspace
```javascript
threadcast_list_workspaces()
threadcast_create_workspace({ name, path, description })
```

### Mission
```javascript
threadcast_list_missions({ workspaceId, status })  // status: BACKLOG, THREADING, WOVEN
threadcast_get_mission({ id })
threadcast_create_mission({ title, description, priority, workspaceId })
threadcast_update_mission_status({ id, status })
threadcast_start_weaving({ id })  // Mission을 THREADING으로 시작
threadcast_analyze_mission({ id })  // AI로 Todo 자동 생성
```

### Todo
```javascript
threadcast_list_todos({ missionId })
threadcast_get_todo({ id })
threadcast_create_todo({ missionId, title, description, complexity, estimatedTime })
threadcast_update_todo_status({ id, status })  // status: PENDING, THREADING, WOVEN, TANGLED
threadcast_get_ready_todos({ missionId })  // isReadyToStart=true인 Todo만
```

### Step Progress
```javascript
threadcast_update_step({
  todoId,
  stepType,  // ANALYSIS, DESIGN, IMPLEMENTATION, VERIFICATION, REVIEW, INTEGRATION
  status,    // PENDING, IN_PROGRESS, COMPLETED, FAILED
  progress,  // 0-100
  message    // 진행 상황 메시지
})
```

### 의존성
```javascript
threadcast_update_dependencies({ todoId, dependencies: [depId1, depId2] })
threadcast_get_dependents({ todoId })  // 이 Todo에 의존하는 Todo들
```

---

## 오케스트레이션 규칙

### 의존성 기반 자동 시작
```
Todo A (WOVEN) ──→ Todo B (PENDING, isReadyToStart=true)
                         ↓
                   자동으로 THREADING 시작
```

### Fan-out 패턴
```
Todo A (WOVEN) ──┬──→ Todo B (Ready) ← 동시 시작 가능
                 └──→ Todo C (Ready) ← 동시 시작 가능
```

### Fan-in 패턴
```
Todo A (WOVEN) ──┐
                 ├──→ Todo C (Blocked until A,B done)
Todo B (WOVEN) ──┘
```

---

## 예시 시나리오

### 자동화 루프 실행
```
1. PM Agent 시작
   → threadcast_list_missions(status="THREADING")
   → Mission "실시간 Step 진행률 표시" 발견

2. Todo 목록 조회
   → threadcast_list_todos(missionId)
   → "StepProgressUpdate 타입 정의" (Ready)
   → "WebSocket 이벤트 수신 구현" (Blocked - 위에 의존)

3. Ready Todo 시작
   → threadcast_update_todo_status("StepProgressUpdate", "THREADING")
   → Worker에게 ANALYSIS 지시

4. Step 완료 Hook 수신
   → ANALYSIS → DESIGN → IMPLEMENTATION → ... → INTEGRATION
   → Todo 완료 (WOVEN)

5. 다음 Ready Todo 확인
   → "WebSocket 이벤트 수신 구현" 이제 Ready
   → 자동 시작

6. 모든 Todo 완료
   → Mission을 WOVEN으로 변경
   → 루프 종료
```

---

## 환경 설정

### MCP 서버 위치
```
/Users/devload/threadcast/threadcast-mcp/dist/index.js
```

### 환경 변수
```
THREADCAST_API_URL=http://localhost:21000/api
THREADCAST_EMAIL=dev@threadcast.io
THREADCAST_PASSWORD=dev1234
THREADCAST_WORKSPACE_ID=b7f3362b-658f-4f72-98f1-95b218b31fa9
```

### .mcp.json (프로젝트 루트)
```json
{
  "mcpServers": {
    "threadcast": {
      "command": "node",
      "args": ["/Users/devload/threadcast/threadcast-mcp/dist/index.js"],
      "env": {
        "THREADCAST_API_URL": "http://localhost:21000/api",
        "THREADCAST_EMAIL": "dev@threadcast.io",
        "THREADCAST_PASSWORD": "dev1234"
      }
    }
  }
}
```
