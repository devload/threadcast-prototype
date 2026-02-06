# ThreadCast Project

ThreadCast는 AI 기반 태스크 관리 플랫폼입니다.

## 프로젝트 구조

- `threadcast-server/` - Spring Boot 백엔드 (Java)
- `threadcast-mcp/` - MCP 서버 (TypeScript)
- `threadcast-web/` - React 프론트엔드

---

# Workspace Agent Mode

**중요**: 환경변수 `THREADCAST_MODE=workspace_agent`가 설정되어 있으면, 이 섹션의 프로토콜을 **반드시** 따라야 합니다.

## 환경변수 확인

시작 시 다음 환경변수를 확인하세요:
- `THREADCAST_MODE` - "workspace_agent"이면 Agent 모드
- `THREADCAST_WORKSPACE_ID` - 워크스페이스 ID
- `THREADCAST_REQUEST_DIR` - 요청/응답 디렉토리 경로

## 프로토콜

### 1. 요청 읽기

`$THREADCAST_REQUEST_DIR/request.json` 파일을 읽습니다:

```json
{
  "requestId": "uuid",
  "type": "MISSION_TODOS",
  "missionId": "uuid",
  "missionTitle": "미션 제목",
  "missionDescription": "미션 설명",
  "workspaceId": "uuid",
  "projectPath": "/path/to/project",
  "timestamp": "ISO8601"
}
```

### 2. 프로젝트 분석

type에 따라 분석을 수행합니다:

- **MISSION_TODOS**: 미션을 달성하기 위한 Todo 목록 생성
  - 프로젝트 구조, 기존 패턴, 사용 중인 기술 스택 분석
  - 미션에 맞는 구체적인 Todo 제안
  - 관련 파일 경로 포함

- **TODO_CONTEXT**: 특정 Todo에 대한 컨텍스트 분석
- **PROJECT_SCAN**: 프로젝트 구조 스캔

### 3. 응답 작성

분석이 완료되면 **반드시** `$THREADCAST_REQUEST_DIR/response.json`을 작성합니다:

```json
{
  "requestId": "요청과 동일한 ID",
  "status": "SUCCESS",
  "analysis": {
    "suggestedTodos": [
      {
        "title": "Todo 제목",
        "description": "상세 설명",
        "complexity": "LOW|MEDIUM|HIGH",
        "estimatedTime": 30,
        "relatedFiles": ["src/path/to/file.ts"],
        "reasoning": "이 Todo를 제안한 이유",
        "isUncertain": false,
        "uncertainReason": null
      }
    ],
    "projectInsights": {
      "framework": "React 18 + TypeScript",
      "stateManagement": "Zustand",
      "styling": "Tailwind CSS",
      "existingPatterns": ["Context for global state", "CVA for variants"]
    },
    "uncertainItems": [
      {
        "todoIndex": 0,
        "question": "불확실한 항목에 대한 질문",
        "options": ["옵션1", "옵션2"],
        "recommendation": "권장 옵션과 이유"
      }
    ]
  }
}
```

### 4. 완료 신호

응답 작성 후 **반드시** `$THREADCAST_REQUEST_DIR/ready` 파일을 생성합니다:

```bash
touch $THREADCAST_REQUEST_DIR/ready
```

## 분석 가이드라인

### Todo 생성 시 고려사항

1. **프로젝트 패턴 준수**: 기존 코드 스타일, 디렉토리 구조, 네이밍 컨벤션 따르기
2. **관련 파일 명시**: 수정이 필요한 파일 경로를 `relatedFiles`에 포함
3. **적절한 세분화**: 하나의 Todo는 2-4시간 내 완료 가능한 크기
4. **의존성 고려**: Todo 간 순서가 중요하면 설명에 명시
5. **불확실성 표시**: 결정이 필요한 항목은 `isUncertain: true`로 표시

### Complexity 기준

- **LOW**: 단순 수정, 설정 변경, 문서 작업 (< 1시간)
- **MEDIUM**: 새 컴포넌트, API 추가, 중간 규모 변경 (1-4시간)
- **HIGH**: 아키텍처 변경, 복잡한 기능, 다중 파일 수정 (> 4시간)

## 예시: 다크모드 미션 분석

미션: "다크모드 테마 추가"

분석 과정:
1. 현재 테마 시스템 확인 (tailwind.config.js, CSS 변수)
2. 기존 색상 사용 패턴 검색 (`bg-white`, `text-gray-*`, `dark:` 클래스)
3. 상태 관리 방식 확인 (Zustand store, Context)
4. 설정 저장 방식 확인 (localStorage, API)

결과 Todo 예시:
1. ThemeProvider 컨텍스트 생성 (MEDIUM, 45분)
2. Tailwind dark 모드 설정 (LOW, 20분)
3. 기존 컴포넌트 dark 클래스 추가 (HIGH, 2시간)
4. 테마 토글 UI 구현 (MEDIUM, 30분)
5. localStorage 연동 (LOW, 15분)

---

## 일반 개발 가이드

### 빌드 명령어

```bash
# Backend
cd threadcast-server && ./gradlew build

# MCP
cd threadcast-mcp && npm run build

# Frontend
cd threadcast-web && npm run build
```

### 테스트

```bash
# Backend 테스트
cd threadcast-server && ./gradlew test

# Frontend 테스트
cd threadcast-web && npm test
```
