# ThreadCast MCP 사용 가이드

## 개요

ThreadCast MCP는 Claude Code/Desktop에서 ThreadCast 칸반 보드를 직접 조작할 수 있게 해주는 MCP(Model Context Protocol) 서버입니다.

## 설치 및 설정

### 1. 사전 요구사항

- Node.js 18+
- ThreadCast 계정 및 Access Token

### 2. Claude Code 설정

`~/.claude/settings.json` 파일에 추가:

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

### 3. Claude Desktop 설정

`~/Library/Application Support/Claude/claude_desktop_config.json` 파일에 추가:

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

### 4. Access Token 발급

1. [ThreadCast](https://app.threadcast.io)에 로그인
2. Settings > Integrations로 이동
3. Access Token 복사
4. 위 설정의 `YOUR_ACCESS_TOKEN` 부분에 붙여넣기

---

## 기본 사용법

### 워크스페이스 관리

```
# 워크스페이스 목록 보기
"ThreadCast 워크스페이스 목록 보여줘"

# 새 워크스페이스 생성
"ThreadCast에 'MyProject' 워크스페이스를 ~/projects/myapp 경로로 만들어줘"

# 프로젝트 스캔
"이 워크스페이스의 프로젝트를 스캔해서 메타데이터 추출해줘"
```

### 미션 관리

```
# 미션 목록 보기
"ThreadCast 미션 목록 보여줘"

# 새 미션 생성
"ThreadCast에 '사용자 인증 시스템 구현' 미션을 HIGH 우선순위로 만들어줘"

# AI로 미션 및 Todo 자동 생성
"'다크모드 테마 추가' 미션을 AI로 생성해줘"

# 미션 상세 보기
"미션 ID xxx의 상세 정보 보여줘"

# 미션 상태 변경
"미션을 THREADING 상태로 변경해줘"
```

### Todo 관리

```
# 미션의 Todo 목록 보기
"이 미션의 Todo 목록 보여줘"

# Todo 생성
"이 미션에 'JWT 토큰 관리 구현' Todo를 추가해줘. 복잡도는 MEDIUM, 예상 시간 60분"

# 여러 Todo 한번에 생성
"다음 Todo들을 미션에 추가해줘:
1. 로그인 API 설계 (LOW, 30분)
2. 토큰 갱신 로직 (MEDIUM, 45분)
3. 보안 테스트 (HIGH, 90분)"

# Todo 상태 변경
"Todo를 THREADING 상태로 변경해줘"

# Todo 의존성 설정
"Todo B가 Todo A에 의존하도록 설정해줘"
```

### AI Worker 사용

```
# Todo 작업 시작
"이 Todo 작업 시작해줘" (threadcast_worker_start)

# 단계 진행
"ANALYSIS 단계 진행 상황 업데이트해줘" (threadcast_worker_step_progress)

# 단계 완료
"ANALYSIS 단계 완료하고 DESIGN으로 넘어가줘" (threadcast_worker_step_complete)

# Todo 완료
"작업 완료 처리해줘" (threadcast_worker_complete)
```

### AI 질문 처리

```
# 대기 중인 질문 보기
"ThreadCast에 대기 중인 AI 질문 있어?"

# 질문에 답변
"질문 ID xxx에 'Redis 세션 사용' 이라고 답변해줘"

# 질문 건너뛰기
"이 질문은 AI가 알아서 결정하도록 스킵해줘"
```

### Knowledge Base 활용

```
# 지식 저장
"배포 절차를 knowledge base에 저장해줘"

# 지식 검색
"인증 관련 지식 검색해줘"

# 작업에서 학습
"이 Todo에서 배운 내용을 knowledge base에 저장해줘"
```

---

## 워크플로우 예시

### 새 프로젝트 시작

```
1. "ThreadCast에 'E-commerce Platform' 워크스페이스를 ~/projects/ecommerce 경로로 만들어줘"

2. "이 워크스페이스에 '상품 관리 시스템' 미션을 만들어줘.
    설명: 상품 CRUD 및 재고 관리 기능 구현"

3. "이 미션에 다음 Todo들을 추가해줘:
    - 상품 모델 설계 (LOW, 20분)
    - 상품 API 엔드포인트 구현 (MEDIUM, 60분)
    - 재고 관리 로직 (MEDIUM, 45분)
    - 이미지 업로드 처리 (HIGH, 90분)"

4. "첫 번째 Todo '상품 모델 설계' 작업 시작해줘"
```

### AI Worker로 Todo 진행

```
1. "Todo 작업 시작해줘" (worker_start - effective meta 로드)

2. "ANALYSIS 단계에서 파일 분석 중..." (worker_step_progress)

3. "ANALYSIS 완료" (worker_step_complete - 다음 단계로 자동 이동)

4. ... (각 단계 반복)

5. "작업 완료!" (worker_complete - 결과 및 learnings 저장)
```

### 기존 작업 이어가기

```
1. "ThreadCast 세션 컨텍스트 가져와줘" (get_session_context)

2. "진행 중인 Todo의 상세 정보 보여줘"

3. "IMPLEMENTATION 스텝을 완료하고 VERIFICATION으로 넘어가줘"
```

---

## 상태 값 참조

### Mission Status
| 상태 | 설명 |
|------|------|
| `BACKLOG` | 대기 중 |
| `THREADING` | 작업 중 |
| `WOVEN` | 완료 |
| `ARCHIVED` | 보관됨 |

### Todo Status
| 상태 | 설명 |
|------|------|
| `PENDING` | 대기 중 |
| `THREADING` | 작업 중 |
| `WOVEN` | 완료 |
| `TANGLED` | 문제 발생 |
| `ARCHIVED` | 보관됨 |

### Step Type
| 스텝 | 설명 |
|------|------|
| `ANALYSIS` | 분석 |
| `DESIGN` | 설계 |
| `IMPLEMENTATION` | 구현 |
| `VERIFICATION` | 검증 |
| `REVIEW` | 리뷰 |
| `INTEGRATION` | 통합 |

### Step Status
| 상태 | 설명 |
|------|------|
| `PENDING` | 대기 |
| `IN_PROGRESS` | 진행 중 |
| `COMPLETED` | 완료 |
| `SKIPPED` | 건너뜀 |

### Priority
| 우선순위 | 설명 |
|----------|------|
| `CRITICAL` | 긴급 |
| `HIGH` | 높음 |
| `MEDIUM` | 보통 |
| `LOW` | 낮음 |

### Complexity
| 복잡도 | 설명 |
|--------|------|
| `LOW` | 낮음 (30분 이내) |
| `MEDIUM` | 보통 (1-2시간) |
| `HIGH` | 높음 (2시간 이상) |

---

## 팁

1. **자연어 사용**: 정확한 명령어 대신 자연스러운 한국어로 요청해도 됩니다.

2. **컨텍스트 유지**: 이전 대화에서 언급한 미션/Todo는 "이 미션", "그 Todo"로 참조 가능합니다.

3. **일괄 작업**: 여러 Todo를 한번에 생성할 때는 목록 형태로 요청하세요.

4. **세션 복구**: 대화가 길어져서 컨텍스트가 잘리면 `get_session_context`로 복구하세요.

5. **Knowledge Base**: 중요한 학습 내용은 `remember` 명령으로 저장해두면 다음 작업에 활용됩니다.

---

## 문제 해결

### "Error: Request failed with status code 401"
- Access Token이 만료되었거나 잘못되었습니다.
- ThreadCast 웹에서 새 토큰을 발급받아 설정을 업데이트하세요.

### "Error: connect ECONNREFUSED"
- API URL이 올바른지 확인하세요.
- 프로덕션: `https://api.threadcast.io`
- 로컬 개발: `http://localhost:21000/api`

### MCP 도구가 안 보여요
- Claude Code/Desktop을 재시작하세요.
- 설정 파일의 JSON 문법이 올바른지 확인하세요.
