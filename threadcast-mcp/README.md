# ThreadCast MCP Server

ThreadCast와 Claude Code/Desktop을 연결하는 MCP(Model Context Protocol) 서버입니다.

## 설치 및 설정

### Claude Code 설정

`~/.claude/settings.json` 파일에 다음을 추가하세요:

```json
{
  "mcpServers": {
    "threadcast": {
      "command": "npx",
      "args": ["-y", "threadcast-mcp"],
      "env": {
        "THREADCAST_API_URL": "https://api.threadcast.io",
        "THREADCAST_TOKEN": "YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

### Claude Desktop 설정

`~/Library/Application Support/Claude/claude_desktop_config.json` 파일에 다음을 추가하세요:

```json
{
  "mcpServers": {
    "threadcast": {
      "command": "npx",
      "args": ["-y", "threadcast-mcp"],
      "env": {
        "THREADCAST_API_URL": "https://api.threadcast.io",
        "THREADCAST_TOKEN": "YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

### Access Token 발급

1. [ThreadCast](https://app.threadcast.io)에 로그인
2. Settings > Integrations에서 Access Token 복사
3. 위 설정의 `YOUR_ACCESS_TOKEN` 부분에 붙여넣기

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `THREADCAST_API_URL` | ThreadCast API 서버 URL | `https://api.threadcast.io` |
| `THREADCAST_TOKEN` | Access Token (필수) | - |

## 사용 가능한 Tools

### Workspace 관리
- `threadcast_list_workspaces` - 워크스페이스 목록 조회
- `threadcast_create_workspace` - 새 워크스페이스 생성
- `threadcast_scan_workspace` - 프로젝트 스캔 및 메타데이터 추출
- `threadcast_get_workspace_settings` - 워크스페이스 설정 조회
- `threadcast_get_session_context` - 세션 컨텍스트 조회 (컴팩션 복구용)

### Mission 관리
- `threadcast_list_missions` - 미션 목록 조회
- `threadcast_get_mission` - 미션 상세 조회
- `threadcast_create_mission` - 새 미션 생성
- `threadcast_update_mission` - 미션 정보 수정
- `threadcast_update_mission_status` - 미션 상태 업데이트
- `threadcast_start_weaving` - 미션 작업 시작
- `threadcast_analyze_mission` - AI로 미션 분석
- `threadcast_generate_mission_ai` - AI로 미션 생성 (미리보기)
- `threadcast_create_mission_ai` - AI로 미션 및 Todo 일괄 생성

### Todo 관리
- `threadcast_list_todos` - Todo 목록 조회
- `threadcast_get_todo` - Todo 상세 조회
- `threadcast_create_todo` - 새 Todo 생성
- `threadcast_update_todo_status` - Todo 상태 업데이트
- `threadcast_update_step_status` - Todo Step 상태 업데이트
- `threadcast_update_dependencies` - Todo 의존성 설정
- `threadcast_get_ready_todos` - 시작 가능한 Todo 조회

### Meta 관리
- `threadcast_get_workspace_meta` - 워크스페이스 메타 조회
- `threadcast_update_workspace_meta` - 워크스페이스 메타 업데이트
- `threadcast_get_mission_meta` / `threadcast_get_mission_effective_meta` - 미션 메타 조회
- `threadcast_update_mission_meta` - 미션 메타 업데이트
- `threadcast_get_todo_meta` / `threadcast_get_todo_effective_meta` - Todo 메타 조회
- `threadcast_update_todo_meta` - Todo 메타 업데이트

### AI Worker
- `threadcast_worker_start` - Todo 작업 시작
- `threadcast_worker_step_progress` - 단계별 진행 상황 업데이트
- `threadcast_worker_step_complete` - 단계 완료 처리
- `threadcast_worker_complete` - Todo 작업 완료
- `threadcast_worker_fail` - Todo 작업 실패 처리

### AI 질문
- `threadcast_list_questions` - AI 질문 목록 조회
- `threadcast_answer_question` - AI 질문에 답변
- `threadcast_skip_question` - AI 질문 건너뛰기
- `threadcast_create_ai_question` - AI 질문 생성

### 컨텍스트 분석
- `threadcast_analyze_mission_context` - 미션 컨텍스트 분석
- `threadcast_analyze_todo_context` - Todo 컨텍스트 분석
- `threadcast_analyze_text` - 텍스트 컨텍스트 분석

### Knowledge Base
- `threadcast_remember` - 지식 저장
- `threadcast_learn_from_work` - 작업에서 학습
- `threadcast_get_knowledge` - 지식 조회
- `threadcast_list_knowledge` - 지식 목록
- `threadcast_search_knowledge` - 지식 검색
- `threadcast_forget` - 지식 삭제

### 타임라인
- `threadcast_get_timeline` - 타임라인 이벤트 조회

## 사용 가능한 Resources

- `threadcast://missions` - 현재 워크스페이스의 모든 미션
- `threadcast://todos` - 현재 워크스페이스의 모든 Todo
- `threadcast://questions` - 대기 중인 AI 질문 목록
- `threadcast://timeline` - 최근 타임라인 이벤트

## 사용 예시

Claude Code에서 다음과 같이 사용할 수 있습니다:

```
# 미션 생성
ThreadCast에 "사용자 인증 시스템 구현" 미션을 생성해줘

# AI로 Todo 자동 생성
"사용자 인증 시스템 구현" 미션을 분석해서 Todo들을 생성해줘

# 작업 시작
첫 번째 Todo를 시작해줘

# 진행 상황 업데이트
ANALYSIS 단계 완료하고 DESIGN 단계로 넘어가줘
```

## 로컬 개발

```bash
# 저장소 클론
git clone https://github.com/devload/threadcast.git
cd threadcast/threadcast-mcp

# 의존성 설치
npm install

# 빌드
npm run build

# 개발 모드
npm run dev

# 로컬에서 테스트
THREADCAST_API_URL=http://localhost:21000/api THREADCAST_TOKEN=your_token npm start
```

## 라이선스

MIT
