# ThreadCast Feature Specification

## Document Info
- Version: 1.0.0
- Last Updated: 2026-01-27
- Total Pages: 6
- Total Features: 78

---

## Page Index

| Page ID | Page Name | Route | Features |
|---------|-----------|-------|----------|
| P01 | HomePage | `/` | 15 |
| P02 | WorkspaceDashboard | `/dashboard` | 12 |
| P03 | MissionsPage | `/missions` | 14 |
| P04 | TodosPage | `/missions/:id/todos` | 13 |
| P05 | TimelinePage | `/timeline` | 10 |
| P06 | ProjectDashboard | `/projects/:id` | 14 |
| M01 | SettingsModal | (overlay) | 4 |
| M02 | AIQuestionPanel | (overlay) | 6 |
| M03 | MissionDetailModal | (overlay) | 10 |

---

## P01: HomePage

| Feature ID | Feature Name | Type | Description | Test Priority |
|------------|--------------|------|-------------|---------------|
| P01-F01 | Display Global Stats | Display | 5개 통계 카드 표시 (Workspaces, Missions, Todos, AI Actions, Pending Questions) | High |
| P01-F02 | Workspace Card List | Display | 등록된 Workspace 카드 목록 표시 | High |
| P01-F03 | Workspace Card Stats | Display | 각 카드에 Projects, Missions, Todos, Progress 표시 | High |
| P01-F04 | Workspace Click Navigate | Action | Workspace 클릭 시 Dashboard로 이동 | High |
| P01-F05 | AI Alert Banner | Display | 대기중 질문 있을 때 핑크 배너 표시 | High |
| P01-F06 | AI Alert Click | Action | 배너 클릭 시 AI Question Panel 열기 | High |
| P01-F07 | Create Workspace Button | Action | "+ 새 Workspace 추가" 버튼 클릭 → 모달 열기 | Medium |
| P01-F08 | Create Workspace Modal | Form | 이름, 설명, 경로 입력 폼 | Medium |
| P01-F09 | Create Workspace Submit | Action | 생성 API 호출 및 목록 갱신 | Medium |
| P01-F10 | Recent Activity List | Display | 최근 5개 활동 목록 표시 | Medium |
| P01-F11 | Settings Button | Action | 설정 버튼 클릭 → Settings Modal 열기 | Medium |
| P01-F12 | Analytics Button | Action | 분석 버튼 (향후 기능) | Low |
| P01-F13 | Workspace Question Badge | Display | 질문 있는 Workspace에 배지 표시 | Medium |
| P01-F14 | Threading Indicator | Display | 현재 진행 중인 작업 표시 | Low |
| P01-F15 | Progress Calculation | Logic | 완료 미션/전체 미션 비율 계산 | Medium |

---

## P02: WorkspaceDashboard

| Feature ID | Feature Name | Type | Description | Test Priority |
|------------|--------------|------|-------------|---------------|
| P02-F01 | Workspace Info Header | Display | Workspace 이름, 경로, 설명 표시 | High |
| P02-F02 | Stats Cards | Display | 4개 통계 (Projects, Missions, Completed, Todos) | High |
| P02-F03 | Projects List | Display | 프로젝트 목록 (아이콘, 이름, 경로) | High |
| P02-F04 | Project Click Navigate | Action | 프로젝트 클릭 → Project Dashboard 이동 | High |
| P02-F05 | Recent Missions List | Display | 최근 5개 미션 (진행도 바, 상태 배지) | High |
| P02-F06 | Mission Status Badge | Display | Threading/Woven/Archived 상태 표시 | Medium |
| P02-F07 | Add Project Button | Action | "+ 추가" 버튼 클릭 → 프로젝트 생성 모달 | Medium |
| P02-F08 | Create Project Modal | Form | 이름, 경로, 언어 선택 폼 | Medium |
| P02-F09 | New Mission Quick Action | Action | "New Mission" 버튼 → Missions 페이지 이동 | Medium |
| P02-F10 | Timeline Quick Action | Action | "Timeline" 버튼 → Timeline 페이지 이동 | Medium |
| P02-F11 | Back Navigation | Action | "← Home" 클릭 → HomePage 이동 | High |
| P02-F12 | Autonomy Slider | Display | AI 자율성 레벨 표시 (Sidebar) | Low |

---

## P03: MissionsPage

| Feature ID | Feature Name | Type | Description | Test Priority |
|------------|--------------|------|-------------|---------------|
| P03-F01 | Mission Kanban Board | Display | 4개 컬럼 (Backlog, Threading, Woven, Archived) | High |
| P03-F02 | Mission Card Display | Display | 각 카드에 ID, 제목, 설명, 진행도, Todo 수 표시 | High |
| P03-F03 | Mission Card Click | Action | 카드 클릭 → MissionDetailModal 열기 | High |
| P03-F04 | AI Question Banner | Display | 대기중 질문 수, 관련 미션 태그 표시 | High |
| P03-F05 | AI Banner Click | Action | 배너 클릭 → AI Question Panel 열기 | High |
| P03-F06 | Mission AI Badge | Display | 질문 있는 미션에 노란 배지 표시 | Medium |
| P03-F07 | New Mission Button | Action | "+ New Mission" 클릭 → 생성 모달 열기 | High |
| P03-F08 | Create Mission Modal | Form | 제목, 설명, 우선순위, 템플릿 선택 | High |
| P03-F09 | Create Mission Submit | Action | 생성 API 호출 및 Kanban 갱신 | High |
| P03-F10 | View Toggle | Action | Missions/Timeline 뷰 전환 | Medium |
| P03-F11 | Overview Stats | Display | Total, Active, Success Rate, Remaining 표시 | Medium |
| P03-F12 | Sidebar Filter | Action | All/Active/Completed/Archived 필터 | Medium |
| P03-F13 | Mission Priority Badge | Display | High/Medium/Low 우선순위 표시 | Low |
| P03-F14 | Settings Button | Action | Settings Modal 열기 | Low |

---

## P04: TodosPage

| Feature ID | Feature Name | Type | Description | Test Priority |
|------------|--------------|------|-------------|---------------|
| P04-F01 | Todo Kanban Board | Display | 5개 컬럼 (Backlog, Pending, Threading, Woven, Tangled) | High |
| P04-F02 | Todo Card Display | Display | ID, 제목, 진행 단계 바, 예상 시간, 복잡도 표시 | High |
| P04-F03 | Todo Card Click | Action | 카드 클릭 → 상세 드로어 열기 | High |
| P04-F04 | Current Mission Info | Display | 선택된 미션 제목, 전체 진행도 표시 | High |
| P04-F05 | Status Filter | Action | All/Backlog/Pending/Threading/Woven/Tangled 필터 | Medium |
| P04-F06 | Filter Badge Count | Display | 각 필터별 Todo 개수 표시 | Medium |
| P04-F07 | Add Todo Button | Action | "+ Add Todo" 클릭 → 생성 모달 열기 | High |
| P04-F08 | Create Todo Modal | Form | 제목, 설명, 복잡도, 예상 시간 입력 | High |
| P04-F09 | Todo Detail Drawer | Display | 설명, 우선순위, 복잡도, Progress Steps 표시 | High |
| P04-F10 | Progress Step Toggle | Action | Step 체크박스 토글 → 상태 변경 API | High |
| P04-F11 | Step Status Update | Logic | Step 완료 시 Todo 진행률 재계산 | High |
| P04-F12 | Overview Stats | Display | Total, Threading, Woven, Tangled 카운트 | Medium |
| P04-F13 | Back Navigation | Action | "← Missions" 클릭 → Missions 페이지 이동 | Medium |

---

## P05: TimelinePage

| Feature ID | Feature Name | Type | Description | Test Priority |
|------------|--------------|------|-------------|---------------|
| P05-F01 | Timeline Event List | Display | 날짜별 그룹화된 이벤트 목록 | High |
| P05-F02 | Event Type Filter | Action | All/Missions/Todos/AI Activity/System 필터 | High |
| P05-F03 | Event Card Display | Display | 아이콘, 제목, 상태 배지, 시간, 메타데이터 | High |
| P05-F04 | Date Grouping | Display | Today, Yesterday, 날짜별 그룹 헤더 | Medium |
| P05-F05 | Event Type Icon | Display | 이벤트 타입별 다른 아이콘 표시 | Medium |
| P05-F06 | Status Badge | Display | Woven/Threading 등 상태 배지 | Medium |
| P05-F07 | Load More Button | Action | "더 불러오기" 클릭 → 페이지네이션 | Medium |
| P05-F08 | Refresh Button | Action | 새로고침 버튼 → 최신 데이터 조회 | Medium |
| P05-F09 | Export Button | Action | JSON 형식으로 이벤트 내보내기 | Low |
| P05-F10 | Overview Stats | Display | Woven, Threading, AI Actions, Total Events | Medium |

---

## P06: ProjectDashboard

| Feature ID | Feature Name | Type | Description | Test Priority |
|------------|--------------|------|-------------|---------------|
| P06-F01 | Project Info Header | Display | 프로젝트 이름, 언어 태그, 빌드 도구 | High |
| P06-F02 | Stats Cards | Display | 6개 통계 (Todos, Threading, Woven, Missions, Commits, AI) | High |
| P06-F03 | Todo List Section | Display | 프로젝트의 Todo 목록 (진행도 바) | High |
| P06-F04 | Todo Click Navigate | Action | Todo 클릭 → Todos 페이지 이동 | Medium |
| P06-F05 | Linked Missions | Display | 연결된 미션 목록 | Medium |
| P06-F06 | Mission Click Navigate | Action | 미션 클릭 → Mission Detail 열기 | Medium |
| P06-F07 | Git Status Section | Display | 현재 브랜치, 마지막 커밋, 변경 사항 | Medium |
| P06-F08 | Active Worktrees | Display | 활성 worktree 목록 | Low |
| P06-F09 | Progress Circle | Display | 원형 진행률 차트 | Low |
| P06-F10 | Quick Actions | Action | New Todo, Run Build, Open Terminal 버튼 | Low |
| P06-F11 | Add Todo Button | Action | "+ 새 Todo" 클릭 → 생성 모달 | Medium |
| P06-F12 | Refresh Button | Action | 새로고침 → 데이터 재조회 | Low |
| P06-F13 | Back Navigation | Action | "← Dashboard" 클릭 → Workspace Dashboard 이동 | High |
| P06-F14 | Todo Complexity Badge | Display | Simple/Medium/Complex 배지 | Low |

---

## M01: SettingsModal

| Feature ID | Feature Name | Type | Description | Test Priority |
|------------|--------------|------|-------------|---------------|
| M01-F01 | Language Selection | Action | 한국어/English 버튼 클릭 → 언어 변경 | High |
| M01-F02 | Language Persistence | Logic | 언어 설정 localStorage 저장 | High |
| M01-F03 | Theme Selection | Action | Light/Dark/System 버튼 클릭 → 테마 변경 | Medium |
| M01-F04 | Close Modal | Action | ESC 키 또는 외부 클릭 → 모달 닫기 | High |

---

## M02: AIQuestionPanel

| Feature ID | Feature Name | Type | Description | Test Priority |
|------------|--------------|------|-------------|---------------|
| M02-F01 | Question List Display | Display | 대기중 질문 목록 (미션/Todo 태그 포함) | High |
| M02-F02 | Answer Input | Form | 각 질문별 답변 입력 (선택지 또는 텍스트) | High |
| M02-F03 | Submit Answer | Action | 답변 제출 → API 호출 → AI Agent 알림 | Critical |
| M02-F04 | Skip Question | Action | 질문 건너뛰기 | Medium |
| M02-F05 | Skip All Button | Action | "모두 건너뛰기" 클릭 | Low |
| M02-F06 | Close Panel | Action | X 버튼 또는 ESC → 패널 닫기 | High |

---

## M03: MissionDetailModal

| Feature ID | Feature Name | Type | Description | Test Priority |
|------------|--------------|------|-------------|---------------|
| M03-F01 | Mission Info Header | Display | ID, 제목, 상태 배지, 태그 | High |
| M03-F02 | Mission Description | Display | 미션 설명 텍스트 | High |
| M03-F03 | Progress Section | Display | 진행도 바, 4개 통계 (Total, Threading, Woven, Pending) | High |
| M03-F04 | Todo List | Display | 미션의 Todo 목록 (상태 dot, 단계 수, 시간) | High |
| M03-F05 | Todo AI Badge | Display | 질문 있는 Todo에 핑크 배지 | Medium |
| M03-F06 | Todo Click | Action | Todo 클릭 → Todos 페이지로 이동 (highlight) | High |
| M03-F07 | Start Weaving Button | Action | "Start Weaving" 클릭 → 미션 시작 API | Critical |
| M03-F08 | Pause Weaving Button | Action | "Pause Weaving" 클릭 → 미션 일시정지 | Medium |
| M03-F09 | Status Badge Style | Display | 상태별 다른 색상 배지 | Low |
| M03-F10 | Close Modal | Action | ESC 키 또는 X 버튼 → 모달 닫기 | High |

---

## Test Priority Legend

| Priority | Description | Count |
|----------|-------------|-------|
| Critical | 핵심 비즈니스 로직, 반드시 테스트 | 2 |
| High | 주요 기능, 우선 테스트 | 38 |
| Medium | 보조 기능, 기본 테스트 | 28 |
| Low | 부가 기능, 선택적 테스트 | 10 |

---

## API Endpoints Used

| Endpoint | Method | Used By |
|----------|--------|---------|
| `/api/workspaces` | GET | P01 |
| `/api/workspaces` | POST | P01-F09 |
| `/api/workspaces/{id}` | GET | P02 |
| `/api/workspaces/{id}/missions` | GET | P02, P03 |
| `/api/workspaces/{id}/projects` | GET | P02 |
| `/api/workspaces/{id}/timeline` | GET | P05 |
| `/api/workspaces/{id}/ai-questions` | GET | M02 |
| `/api/missions` | POST | P03-F09 |
| `/api/missions/{id}` | GET | P03, M03 |
| `/api/missions/{id}/status` | PATCH | M03-F07, M03-F08 |
| `/api/missions/{id}/todos` | GET | P04 |
| `/api/todos` | POST | P04-F08 |
| `/api/todos/{id}/steps/{stepId}` | PATCH | P04-F10 |
| `/api/ai-questions/{id}/answer` | POST | M02-F03 |
| `/api/ai-questions/{id}/skip` | POST | M02-F04 |
| `/api/projects/{id}` | GET | P06 |

---

## Notes

1. **Critical Features**: AI 답변 제출(M02-F03)과 Mission 시작(M03-F07)은 핵심 워크플로우
2. **i18n**: 모든 UI 텍스트는 한국어/영어 지원 필요
3. **Real-time**: WebSocket으로 AI 질문 알림 수신
4. **State Management**: Zustand stores (workspaceStore, missionStore, todoStore, aiQuestionStore, uiStore)
