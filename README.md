# 🧵 ThreadCast UI Prototype

> Thread your AI workflow, never lose context

프로토타입 화면들을 통해 ThreadCast의 핵심 기능과 UI/UX를 확인하세요.

---

## 🎬 인터랙티브 프로토타입

**모든 화면이 클릭으로 연결되어 있습니다! 모달과 슬라이드 패널로 완전히 통합되었습니다.**

### 📁 파일 구조
```
prototype/
├── 00-missions-board.html      # 🏠 메인: Mission 칸반 보드
├── 01-dashboard.html           # 📋 Todo 대시보드 (Todo Detail 패널 통합)
├── 06-timeline.html            # 📊 타임라인 (활동 기록)
├── README.md                   # 📖 프로젝트 문서
└── CHANGELOG.md                # 📝 개발 히스토리
```

### ✨ 2026-01-24 업데이트
- ✅ **Mission Summary 모달**: 05-mission-summary.html → 00에 통합
- ✅ **Todo Detail 패널**: 04-todo-detail-panel.html → 01에 통합
- ✅ **Create Mission 모달**: 02-create-mission.html → 00, 01에 통합
- ✅ **Drag & Drop 칸반**: Mission/Todo 카드 드래그 가능
- ✅ **AI 질문 시스템**: 7가지 개선 사항 (우선순위, 필터링, 일괄 답변 등)

자세한 내용은 [CHANGELOG.md](./CHANGELOG.md)를 참고하세요.

---

## 📖 핵심 개념: Mission vs Todo vs Timeline

### 🧵 Mission (00-missions-board.html)
**"큰 목표 단위"** - 프로젝트에서 완료해야 할 기능이나 작업

- **예시**: "로그인 기능 구현", "대시보드 리디자인", "결제 시스템 연동"
- **구성**: 하나의 Mission은 여러 개의 Todo로 쪼개짐
- **용도**: 전체적인 프로젝트 진행 상황을 한눈에 파악
- **칸반 상태**: Backlog (계획) → Threading (진행중) → Woven (완료) → Archived (보관)

**언제 사용하나요?**
- "지금 진행 중인 큰 작업들이 뭐가 있지?"
- "이번 스프린트에 뭘 해야 하지?"
- "각 기능별 진행률이 어떻게 돼?"

---

### 📋 Todo (01-dashboard.html)
**"작은 실행 단위"** - AI가 실제로 수행하는 구체적인 작업

- **예시**: "API 엔드포인트 구현", "로그인 폼 컴포넌트", "테스트 코드 작성"
- **구성**: 하나의 Todo는 6단계(Analysis → Design → Implementation → Verification → Review → Integration)로 진행
- **용도**: 특정 Mission의 세부 작업들을 추적하고 실행
- **칸반 상태**: Pending (대기) → Threading (AI 작업중) → Woven (완료) → Tangled (에러)

**언제 사용하나요?**
- "로그인 기능 구현에 필요한 세부 작업들은?"
- "AI가 지금 뭐 하고 있지?"
- "이 Todo가 어디까지 진행됐지?" (Analysis? Implementation?)

---

### 📊 Timeline (06-timeline.html)
**"활동 기록/로그"** - Mission과 Todo에서 일어난 모든 일을 시간순으로 표시

- **예시**: "11:45 - TODO-42-3 완료", "11:33 - TODO-42-3 시작", "09:15 - MISSION-42 시작"
- **구성**: AI 작업, 시스템 이벤트, 사용자 액션을 시간순 피드로 표시
- **용도**: "오늘 뭐했지?", "언제 이게 완료됐지?" 같은 기록 확인
- **표시 정보**: 누가 (AI/System/User), 언제, 무엇을, 어떻게 (파일 변경, 라인 수 등)

**언제 사용하나요?**
- "오늘 AI가 뭘 했지?"
- "이 Mission이 언제 시작됐더라?"
- "지난 주에 완료한 작업들 보고서 쓰려고"

---

## 🔄 간단 비유

**프로젝트를 집 짓기에 비유하면:**

- 🧵 **Mission** = "방 하나 완성하기" (예: 거실, 침실, 주방)
  - 각 방의 진행 상황을 칸반 보드로 관리

- 📋 **Todo** = "구체적인 작업" (예: 벽 세우기, 전기 배선, 페인트칠)
  - 거실을 완성하려면 여러 Todo를 해야 함
  - AI 작업자가 실제로 수행하는 단위

- 📊 **Timeline** = "작업 일지"
  - "1월 24일 11:45 - 거실 벽 페인트칠 완료"
  - "1월 24일 09:15 - 거실 공사 시작"
  - 시간순으로 뭐가 언제 일어났는지 기록

---

## 📊 계층 구조

```
Workspace (내 작업 공간)
  │
  ├─ 🧵 Mission: "로그인 기능 구현"
  │   ├─ 📋 Todo: "기존 인증 시스템 조사"
  │   │   └─ 6단계: Analysis → Design → Implementation → Verification → Review → Integration
  │   ├─ 📋 Todo: "로그인 폼 컴포넌트"
  │   ├─ 📋 Todo: "API 엔드포인트 구현"
  │   ├─ 📋 Todo: "세션 관리 및 OAuth 연동"
  │   └─ 📋 Todo: "통합 테스트 작성"
  │
  ├─ 🧵 Mission: "대시보드 리디자인"
  │   ├─ 📋 Todo: "차트 컴포넌트 설계"
  │   ├─ 📋 Todo: "반응형 레이아웃 구현"
  │   └─ 📋 Todo: "다크모드 지원"
  │
  └─ 📊 Timeline: 모든 Mission/Todo의 활동 기록
      ├─ 11:45 - "TODO: API 엔드포인트 구현" 완료
      ├─ 11:33 - "TODO: API 엔드포인트 구현" 시작
      ├─ 11:03 - "TODO: 로그인 폼 컴포넌트" 완료
      └─ 09:15 - "MISSION: 로그인 기능 구현" 시작
```

---

## 🎯 화면별 사용 시나리오

### 시나리오 1: 새로운 기능 시작하기
1. **Mission 보드 (00-missions-board.html)** 열기
2. "Thread New Mission" 버튼 클릭
3. Mission 제목 입력: "결제 시스템 연동"
4. AI가 자동으로 Todo 목록 제안 (Thread Proposal)
5. "Start Weaving" → Mission이 Threading 컬럼으로 이동

### 시나리오 2: 진행 중인 작업 확인하기
1. **Mission 보드**에서 Threading 중인 Mission 카드 클릭
2. Mission 요약 모달에서 전체 진행률 확인 (60% 완료)
3. "View Details" 클릭 → **Todo 보드 (01-dashboard.html)** 열림
4. Threading 중인 Todo 카드 클릭
5. 오른쪽 상세 패널에서 6단계 중 어디까지 진행됐는지 확인
6. Timeline 탭에서 AI가 뭘 하고 있는지 실시간 확인

### 시나리오 3: 오늘 한 일 확인하기
1. **Timeline (06-timeline.html)** 열기
2. "Today" 섹션에서 완료된 Todo 목록 확인
3. "Today's Activity" 통계: 8개 Woven, 5개 Threading
4. 특정 활동 클릭 → 해당 Mission/Todo 화면으로 이동

---

### 전체 플로우

```
00-missions-board.html (Mission 칸반 보드) ←→ 06-timeline.html (Activity Timeline)
    ↓ Mission 카드 클릭                         ↑ View Switcher로 전환 가능
    🔹 Mission 요약 모달 (통합됨)
        ↓ "View Details" 또는 Todo 클릭
01-dashboard.html (Todo 칸반 보드)
    ↓ Todo 카드 클릭
    🔹 Todo 상세 슬라이드 패널 (통합됨)
```

**View Switcher (00-missions-board.html, 06-timeline.html):**
- 🧵 Missions → Mission 칸반 보드
- 📋 Todos → Todo 칸반 보드
- 📊 Timeline → 활동 타임라인

**시작하기:**
```bash
start 00-missions-board.html
```

**통합 완료:**
- ✅ Mission Summary는 00-missions-board.html에 모달로 통합
- ✅ Todo Detail Panel은 01-dashboard.html에 슬라이드 패널로 통합
- ✅ 모든 인터랙션이 단일 페이지 내에서 동작

---

## 🔄 데이터 입출력 주체 (누가 무엇을 입력하나?)

### 👤 **사용자 입력**
사용자가 직접 결정하고 입력하는 것:
- ✍️ Mission 제목, 설명 ("로그인 기능 구현")
- ✍️ Todo 제목, 설명 수정 (AI 제안을 다듬기)
- ⭐ **우선순위** (Low/Medium/High/Critical) → 사용자만 중요도 판단 가능
- 💬 Comment/피드백 (@ai 멘션으로 AI에게 지시)
- 🔄 Mission/Todo 순서 변경

### 🤖 **AI 자동 생성**
AI가 코드를 분석하여 자동으로 계산하는 것:
- 🧵 Mission → Todo 목록 쪼개기 (Thread Proposal)
- 📊 **복잡도** (Low/Medium/High) → AI가 코드 복잡도 분석
- ⏱️ **예상 시간** (~1.5h) → AI가 과거 데이터 기반 추정
- 🔗 Todo 간 **의존성** (A를 먼저 해야 B를 할 수 있음)
- 🔄 6단계 자동 실행 (Analysis → Integration)
- 📝 코드 작성 (파일 변경)

### ⚙️ **시스템 자동 생성**
시스템이 자동으로 생성하는 것:
- 🆔 Todo ID (TODO-42-3)
- ⏰ 실제 소요 시간 (완료 후 측정)
- 📊 Timeline 이벤트
- 🔄 상태 변경 (Pending → Threading → Woven)

---

## 📋 전체 워크플로우 (단계별 주체)

```
1️⃣ [사용자] Mission 생성
   입력: "로그인 기능 구현"
   ↓

2️⃣ [AI] Thread Proposal 생성
   출력: 5개 Todo 목록 제안
   - TODO-1: 기존 인증 시스템 조사 (Low, ~30min)
   - TODO-2: 로그인 폼 컴포넌트 (High, ~2h)
   - TODO-3: API 엔드포인트 구현 (High, ~1.5h)
   - TODO-4: 세션 관리 (Medium, ~1h)
   - TODO-5: 테스트 작성 (Low, ~1h)
   ↓

3️⃣ [사용자] Todo 검토 및 수정
   - Todo 제목/설명 수정
   - 우선순위 설정 (Critical로 변경)
   - 불필요한 Todo 삭제
   - "Start Weaving" 클릭
   ↓

4️⃣ [AI + System] 자동 실행
   - TODO-1 시작 → 6단계 자동 진행 → 완료
   - TODO-2 시작 → 6단계 자동 진행 → 완료
   - TODO-3 시작 중 (현재 Implementation 단계)
   ↓

5️⃣ [사용자] 진행 상황 모니터링
   - Todo 상세 패널 > Timeline 탭 확인
   - Files 탭에서 변경된 파일 확인
   - Steps 탭에서 어느 단계인지 확인
   ↓

6️⃣ [사용자] Comment로 피드백
   입력: "@ai 로그인 실패 시 3번까지만 재시도하도록 수정해줘"
   ↓

7️⃣ [AI] Comment 반영
   출력: 코드 수정 + Timeline 업데이트
   ↓

8️⃣ [System] Mission 완료
   - 모든 Todo Woven
   - Mission 상태 → Woven
   - Timeline에 완료 이벤트 추가
```

---

## 🎚️ AI 자율성 레벨 (AI Autonomy Levels)

ThreadCast는 AI가 얼마나 자율적으로 작업할지를 5단계로 조정할 수 있습니다. 자율성 레벨에 따라 AI가 질문하는 빈도와 내용이 달라집니다.

### 5단계 자율성 레벨

#### Level 1: Minimal (모든 것 물어봄)
- **설명**: AI는 거의 모든 결정을 사용자에게 물어봅니다
- **질문 빈도**: 매우 높음
- **질문 예시**:
  - "변수명을 `userRepository`로 할까요, `userRepo`로 할까요?"
  - "이 함수는 public으로 할까요, private으로 할까요?"
  - "여기에 주석을 추가할까요?"
- **추천 상황**: AI를 처음 사용할 때, 코드 스타일을 엄격히 관리하고 싶을 때

#### Level 2: Low (중요한 것만 물어봄)
- **설명**: 기본적인 코드는 자동 작성하고, 아키텍처나 주요 로직 선택 시 물어봅니다
- **질문 빈도**: 높음
- **질문 예시**:
  - "Repository 패턴을 사용할까요, DAO 패턴을 사용할까요?"
  - "예외 처리는 어떤 방식으로 할까요?"
  - "Validation을 Service 레이어에서 할까요, Controller에서 할까요?"
- **추천 상황**: 프로젝트 초기 단계, 아키텍처 결정이 중요할 때

#### Level 3: Medium (균형) ⭐ 추천
- **설명**: 대부분 자율적으로 진행하되, 중요한 설계 결정이나 애매한 부분만 물어봅니다
- **질문 빈도**: 보통
- **질문 예시**:
  - "JWT 토큰 만료 시간을 얼마로 설정할까요?"
  - "로그인 실패 시 재시도 횟수를 어떻게 설정할까요?"
  - "세션 저장소로 Redis를 사용할까요, DB를 사용할까요?"
- **추천 상황**: 일반적인 개발 작업, 균형잡힌 협업을 원할 때
- **기본값**: ThreadCast의 기본 설정

#### Level 4: High (거의 자율)
- **설명**: 매우 중요하거나 위험한 결정만 물어봅니다
- **질문 빈도**: 낮음
- **질문 예시**:
  - "DB 스키마를 변경해야 합니다. 진행할까요?"
  - "기존 API의 응답 형식을 변경해야 합니다. Breaking change가 발생할 수 있습니다."
  - "보안 관련 설정을 수정합니다. 검토해주세요."
- **추천 상황**: 빠른 프로토타이핑, 신뢰도가 높은 작업

#### Level 5: Maximum (완전 자율)
- **설명**: AI가 모든 것을 자율적으로 결정하고 진행합니다
- **질문 빈도**: 거의 없음
- **질문 예시**: (거의 질문하지 않음, 정말 치명적인 문제만 물어봄)
- **추천 상황**: 간단한 CRUD 작업, 반복적인 boilerplate 코드 생성

---

### 자율성 레벨 설정 위치

**Settings 탭 (01-dashboard.html)**
- Todo 상세 패널의 Settings 탭에서 자율성 레벨을 조정할 수 있습니다
- 슬라이더로 Level 1-5를 선택
- 현재 레벨에 대한 설명이 실시간으로 표시됨

**Timeline에서 AI 질문 확인**
- AI가 질문을 할 때는 Timeline 탭에 질문 카드가 표시됩니다
- 질문 카드에는 다음이 포함됩니다:
  - 질문 내용
  - 질문 이유 (컨텍스트)
  - 선택 가능한 답변 옵션
  - "AI가 알아서 결정" 옵션
- 답변을 선택하면 AI가 즉시 작업을 계속 진행합니다

---

### AI 질문/답변 플로우 (a2ui 스타일)

```
1️⃣ AI가 작업 중 결정이 필요한 상황 발생
   예: "로그인 실패 시 재시도 횟수 결정"
   ↓

2️⃣ 자율성 레벨 확인
   - Level 1-2: 즉시 질문
   - Level 3: 중요한 설계 결정이므로 질문
   - Level 4-5: AI가 일반적인 값(3회)으로 자동 결정
   ↓

3️⃣ Timeline에 질문 카드 표시
   - 🤔 아이콘 + "질문 대기중" 배지
   - 질문 내용: "로그인 실패 시 재시도 횟수를 어떻게 설정할까요?"
   - 컨텍스트: "현재 Implementation 단계에서..."
   - 선택지:
     ✓ 3회 (일반적)
     ✓ 5회 (여유있게)
     🤖 AI가 알아서 결정
   ↓

4️⃣ 사용자 답변
   - 선택지 클릭 또는 "AI가 알아서 결정" 선택
   ↓

5️⃣ 질문 카드 → 답변 완료 상태로 변경
   - 👤 아이콘 + "사용자 답변"
   - 선택한 답변 표시: "✓ 3회 (일반적)"
   ↓

6️⃣ AI가 답변을 반영하여 작업 계속 진행
   - Timeline에 새로운 AI Activity 카드 추가
   - "재시도 로직 구현 중 (최대 3회)..."
```

---

### 자율성 레벨별 질문 예시 비교

| 상황 | Level 1 | Level 3 | Level 5 |
|------|---------|---------|---------|
| 변수명 결정 | ❓ 질문 | ✅ 자동 결정 | ✅ 자동 결정 |
| 함수 접근제어자 | ❓ 질문 | ✅ 자동 결정 | ✅ 자동 결정 |
| 예외 처리 방식 | ❓ 질문 | ❓ 질문 | ✅ 자동 결정 |
| JWT 토큰 만료 시간 | ❓ 질문 | ❓ 질문 | ✅ 자동 결정 |
| DB 스키마 변경 | ❓ 질문 | ❓ 질문 | ❓ 질문 |
| 보안 설정 변경 | ❓ 질문 | ❓ 질문 | ❓ 질문 |

---

## 🎯 Settings 탭 구조 (AI vs 사용자 구분)

### 🤖 AI 분석 결과 (읽기 전용)
수정 불가 - AI가 자동으로 계산한 값
- **Todo ID**: TODO-42-3
- **복잡도**: High (AI가 코드 분석)
- **예상 시간**: 1.5h (AI가 추정)
- **실제 소요 시간**: 25분 경과 (시스템 측정)

### ✏️ 사용자 설정 (수정 가능)
수정 가능 - 사용자가 결정하는 값
- **제목**: API 엔드포인트 구현
- **설명**: JWT 기반 로그인...
- **우선순위**: High (사용자가 판단)
- **의존성**: TODO-42-1, TODO-42-2 (AI 제안 + 사용자 수정)

---

## 📁 프로토타입 파일 목록

### 0. `00-missions-board.html` - Mission 칸반 보드 ⭐ START HERE

**주요 기능:**
- Mission 레벨 칸반 (Backlog, Threading, Woven, Archived)
- Mission 카드 (진행률, 통계, 태그)
- Workspace Overview (전체 통계)
- View Switcher (Missions/Todos/Timeline)
- **✨ Mission Summary 모달 내장 (05-mission-summary.html 통합)**

**인터랙션:**
- ✅ Mission 카드 클릭 → Mission 요약 모달 열림 (통합됨)
- ✅ 모달 닫기: "×" 버튼, 오버레이 클릭, ESC 키
- ✅ 모달 내 "View Details" → Todo 보드로 이동
- ✅ 모달 내 Todo 클릭 → Todo 보드로 이동
- ✅ "Thread New Mission" 버튼 → Mission 생성 모달
- ✅ View Switcher: "Todos" 탭 → Todo 보드, "Timeline" 탭 → Timeline

**브라우저에서 열기:**
```bash
start 00-missions-board.html
```

---

### 1. `01-dashboard.html` - Todo 칸반 보드

**주요 기능:**
- 3단 레이아웃 (Sidebar + Board + Detail Panel 위치)
- Mission 목록 (Pending/Threading/Woven 상태별)
- 칸반 보드 (4개 컬럼: Pending, Threading, Woven, Tangled)
- Todo Thread 카드
- Thread Path 시각화 (진행률 표시)
- **✨ Todo Detail Panel 내장 (04-todo-detail-panel.html 통합)**

**확인 포인트:**
- ✅ Linear 스타일의 깔끔한 UI
- ✅ Thread 진행 상태 시각화 (6단계 Step dots)
- ✅ 복잡도 배지 (Low/Medium/High)
- ✅ 의존성 표시 (Depends on...)
- ✅ 실시간 Threading 애니메이션

**인터랙션:**
- ✅ Todo 카드 클릭 → 오른쪽에서 상세 패널 슬라이드 인 (통합됨)
- ✅ 패널 닫기: "×" 버튼, 오버레이 클릭, ESC 키
- ✅ 패널 내 Tab 전환 (Timeline, Files, Steps, Settings)
- ✅ 패널 내 Comment 작성 (@ai 멘션)
- ✅ "← Missions" 버튼 → Mission 칸반으로 돌아가기
- ✅ "Thread New Mission" 버튼 → Mission 생성 모달

**브라우저에서 열기:**
```bash
start 01-dashboard.html
```

---

### 2. `05-mission-summary.html` - Mission 요약 팝업 ⚠️ 00-missions-board.html에 통합됨

**⚠️ 이 파일은 참고용입니다. 실제로는 00-missions-board.html에 모달로 통합되었습니다.**

**주요 기능:**
- Mission 전체 개요 (제목, 설명, 태그)
- Thread 진행 현황 (Progress bar, 통계)
- Todo 목록 (간략하게, 상태별)
- 현재 Threading 중인 Todo 강조

**확인 포인트:**
- ✅ Mission 레벨 통계 (Progress, Woven Todos, Remaining Time)
- ✅ Thread Path 전체 보기
- ✅ Todo 상태별 색상 구분
- ✅ Threading 중인 Todo 하이라이트

**인터랙션 (00-missions-board.html에서):**
- ✅ Mission 카드 클릭 → Mission 요약 모달 열림
- ✅ "View Details" 버튼 → Todo 칸반 보드로 이동
- ✅ Todo 아이템 클릭 → Todo 칸반 보드로 이동
- ✅ "×" 닫기, 오버레이 클릭, ESC 키 → 모달 닫기

**실제 사용:**
```bash
start 00-missions-board.html
# Mission 카드를 클릭하면 모달로 열립니다
```

---

### 3. `02-create-mission.html` - Mission Thread 생성

**주요 기능:**
- Mission 제목/설명 입력
- Project 선택
- 빠른 시작 예시 템플릿
- System Agent 자동 Threading 안내

**확인 포인트:**
- ✅ 간단한 입력 폼
- ✅ 예시 클릭으로 빠른 입력
- ✅ Markdown 지원 힌트
- ✅ Thread Mission 버튼

**인터랙션:**
- ✅ "Thread Mission" 버튼 → Thread Proposal 화면
- ✅ "Cancel" 버튼 → 뒤로가기
- ✅ 예시 클릭 → 폼 자동 채우기

**브라우저에서 열기:**
```bash
start 02-create-mission.html
```

---

### 4. `03-thread-proposal.html` - Thread Proposal (AI 분석 결과)

**주요 기능:**
- System Agent가 생성한 Todo 목록 표시
- Thread Path 의존성 시각화
- 예상 시간, 복잡도, 파일 수 표시
- Todo 수정/삭제 기능
- Start Weaving 버튼

**확인 포인트:**
- ✅ AI Generated 배지
- ✅ Thread Summary (총 Todo 수, 예상 시간, 의존성 수, High Complexity 수)
- ✅ Thread Path 그래프 (의존성 흐름)
- ✅ 각 Todo의 상세 정보
- ✅ Modify / Start Weaving 액션

**인터랙션:**
- ✅ "Start Weaving" 버튼 → Todo 칸반 보드로 이동 (Mission 시작)
- ✅ "Modify" 버튼 → Alert (추후 Todo 수정 기능)

**브라우저에서 열기:**
```bash
start 03-thread-proposal.html
```

---

### 4. `06-timeline.html` - Activity Timeline

**주요 기능:**
- 전체 활동 피드 (Mission + Todo 통합)
- 시간순 정렬 (날짜별 그룹핑)
- AI Activity, System Event, User Action 구분
- 활동 필터 (All, Missions, Todos, AI Only, System Events)
- Today's Activity 통계

**확인 포인트:**
- ✅ 날짜별 그룹핑 (Today, Yesterday, ...)
- ✅ 3가지 아이콘 타입 (🤖 AI, ⚙️ System, 👤 User)
- ✅ 타임라인 연결선 (vertical line)
- ✅ 상태 배지 (Woven, Threading, Started)
- ✅ Mission/Todo 메타 태그
- ✅ 파일 변경, 라인 수, 소요 시간 표시

**인터랙션:**
- ✅ View Switcher로 Missions/Todos 전환
- ✅ Timeline 아이템 클릭 → 해당 Mission/Todo 화면으로 이동
- ✅ 필터 클릭 → 활동 타입별 필터링 (향후 구현 예정)

**브라우저에서 열기:**
```bash
start 06-timeline.html
```

---

### 5. `04-todo-detail-panel.html` - Todo Thread 상세 패널 ⚠️ 01-dashboard.html에 통합됨

**⚠️ 이 파일은 참고용입니다. 실제로는 01-dashboard.html에 슬라이드 패널로 통합되었습니다.**

**주요 기능:**
- Todo Thread 진행 상태 (6단계 Progress Bar)
- Timeline (AI Activity + System Event)
- 파일 변경 내역
- Stitch Comment 입력
- Tabs (Timeline, Files, Steps, Settings)

**확인 포인트:**
- ✅ 6단계 Step Progress 시각화
- ✅ Timeline (시간순 Activity 피드)
- ✅ AI 아이콘 vs System 아이콘
- ✅ 파일 변경 카드 (READ, +45, MODIFIED)
- ✅ @ai 멘션 Comment 폼

**인터랙션 (01-dashboard.html에서):**
- ✅ Todo 카드 클릭 → 오른쪽에서 슬라이드 패널 열림
- ✅ "×" 닫기, 오버레이 클릭, ESC 키 → 패널 닫기
- ✅ **Tab 전환 (4개 탭 모두 완전 구현):**
  - **Timeline 탭**: AI 작업 활동, 시스템 이벤트, 파일 변경 기록
  - **Files 탭**: 파일 변경 내역 (5개), 변경 통계 (+105 -15)
  - **Steps 탭**: 6단계 진행 상황 (Analysis → Integration)
  - **Settings 탭**: Todo 설정 (제목, 설명, 복잡도, 예상 시간, 의존성)
- ✅ "Stitch Comment" 버튼 → Comment 전송 (Alert)

**실제 사용:**
```bash
start 01-dashboard.html
# Todo 카드를 클릭하면 오른쪽에서 패널이 슬라이드됩니다
# 패널 안에서 Timeline/Files/Steps/Settings 탭을 자유롭게 전환할 수 있습니다
```

---

## 🎨 ThreadCast 브랜딩

### 색상 시스템

```css
--thread-primary:   #6366F1  /* 인디고 - 메인 */
--thread-secondary: #8B5CF6  /* 보라 - AI */
--thread-accent:    #EC4899  /* 핑크 - 강조 */
--thread-woven:     #22C55E  /* 녹색 - 완료 */
--thread-threading: #F59E0B  /* 주황 - 진행 */
--thread-tangled:   #EF4444  /* 빨강 - 에러 */
--thread-pending:   #6B7280  /* 회색 - 대기 */
```

### ThreadCast 전용 용어

| 일반 용어 | ThreadCast 용어 |
|-----------|----------------|
| Create    | **Thread**     |
| Start     | **Weave**      |
| Progress  | **Threading**  |
| Complete  | **Woven**      |
| Failed    | **Tangled**    |
| Blocked   | **Knotted**    |
| Connected | **Stitched**   |
| Resume    | **Re-thread**  |

---

## 🔍 기능 확정을 위한 체크리스트

### ✅ 확정된 기능

- [x] 3단 레이아웃 (Sidebar, Main Board, Detail Panel)
- [x] 4개 칸반 컬럼 (Pending, Threading, Woven, Tangled)
- [x] 6단계 Todo 생명주기 (Analysis → Design → Implementation → Verification → Review → Integration)
- [x] Thread Path 의존성 시각화
- [x] Timeline 기반 Activity 피드
- [x] @ai 멘션 Comment 시스템
- [x] 복잡도 배지 (Low/Medium/High)
- [x] 예상 시간 표시

### 🤔 검토 필요한 기능

#### 1. Drag & Drop

**질문:** Todo 카드를 드래그해서 순서/컬럼 변경을 허용할까요?

**옵션:**
- A) 허용 (react-beautiful-dnd 사용)
- B) 비허용 (AI가 자동 관리, 사용자는 보기만)
- C) 제한적 허용 (Pending 컬럼 내에서만)

**현재:** 프로토타입에서는 미구현

---

#### 2. Real-time Update 방식

**질문:** Thread 진행 상황을 어떻게 업데이트할까요?

**옵션:**
- A) WebSocket (STOMP) - 실시간 자동 업데이트
- B) Polling (3-5초 간격) - 주기적 갱신
- C) 수동 새로고침 - 사용자가 버튼 클릭

**현재:** Phase 1에서는 C (수동), Phase 3에서 A (WebSocket) 추가 계획

---

#### 3. Thread Timeline 필터링

**질문:** Timeline에 표시할 Activity를 필터링할 수 있어야 할까요?

**옵션:**
- A) 전체 표시 (필터 없음)
- B) 타입별 필터 (AI Activity만, System Event만, Comment만)
- C) 중요도 필터 (중요 이벤트만)

**현재:** 프로토타입에서는 A (전체 표시)

---

#### 4. Mission Thread 수정

**질문:** Thread Proposal 화면에서 "Modify" 버튼 클릭 시 무엇을 할 수 있어야 할까요?

**옵션:**
- A) Todo 제목/설명 직접 수정
- B) Todo 추가/삭제
- C) Todo 순서 변경
- D) 의존성 수정
- E) 모두 가능

**현재:** 프로토타입에서는 E 예상

---

#### 5. Tangled Thread 처리

**질문:** Thread가 Tangled (에러 발생) 되었을 때 사용자에게 어떤 옵션을 제공할까요?

**옵션:**
- A) 재시도 (Re-thread)
- B) 수동 수정 후 계속
- C) Sub-Thread로 분할
- D) 건너뛰기
- E) Mission 중단
- F) 모두 제공

**현재:** 스펙에는 F (모두 제공) 계획

---

#### 6. Thread Context Checkpoint

**질문:** Checkpoint는 어떤 타이밍에 자동 생성할까요?

**옵션:**
- A) Todo 시작 시
- B) 각 Step 완료 시
- C) Todo 완료 시
- D) Mission 완료 시
- E) 사용자 수동 생성
- F) A + C + D

**현재:** 스펙에는 F 계획

---

#### 7. Thread Statistics

**질문:** 대시보드에 통계/차트를 추가할까요?

**옵션:**
- A) Mission별 진행률 차트
- B) 평균 Thread 완료 시간
- C) AI 효율성 지표
- D) 통계 없음 (심플하게)

**현재:** Phase 5 (선택적)에서 추가 계획

---

## 📝 최종 확정이 필요한 사항

### UI/UX 관련

1. **칼라 테마**
   - 현재 ThreadCast 브랜딩 색상으로 확정되었나요?
   - 다크 모드는 Phase 3에서 추가하는 것으로 OK?

2. **레이아웃**
   - 사이드바 폭 260px 적절한가요?
   - Detail Panel 폭 480px 적절한가요?
   - 모바일 대응은 어느 Phase에서?

3. **애니메이션**
   - Threading 상태의 pulse 애니메이션 OK?
   - 카드 hover 효과 OK?
   - 더 필요한 애니메이션은?

### 기능 관련

1. **Mission 생성**
   - 예시 템플릿 3개로 충분한가요?
   - Markdown 에디터가 필요한가요? (현재: 일반 textarea)

2. **Thread Proposal**
   - AI가 제안한 Todo를 사용자가 수정하는 범위는?
   - Modify 버튼 클릭 시 인라인 편집? 모달?

3. **Timeline**
   - Activity 타입이 더 필요한가요?
     - 현재: AI Activity, System Event, Comment
   - 파일 diff를 바로 볼 수 있어야 할까요?

4. **Comment System**
   - @ai 외에 @username 멘션도 필요한가요?
   - Comment 수정/삭제 기능은?
   - Thread(대댓글) 기능은?

---

## 🚀 다음 단계

### ✅ 완료된 작업
- [x] Mission 칸반 보드 (00-missions-board.html)
- [x] Todo 칸반 보드 (01-dashboard.html)
- [x] Mission Thread 생성 모달 (02-create-mission.html)
- [x] Thread Proposal 화면 (03-thread-proposal.html)
- [x] Todo 상세 패널 (04-todo-detail-panel.html → 01-dashboard.html에 통합)
  - [x] Timeline 탭: AI 활동 + 시스템 이벤트 + Comment
  - [x] Files 탭: 파일 변경 내역 5개 + 변경 통계
  - [x] Steps 탭: 6단계 진행 상황 (Analysis → Integration)
  - [x] Settings 탭: Todo 설정 (제목, 설명, 복잡도, 의존성)
- [x] Mission 요약 팝업 (05-mission-summary.html → 00-missions-board.html에 통합)
- [x] Activity Timeline 화면 (06-timeline.html)
- [x] View Switcher 연결 (Missions ↔ Todos ↔ Timeline)
- [x] 모든 화면 인터랙션 연결 (클릭, 모달, 슬라이드 패널)
- [x] 완전한 단일 페이지 통합 (모달과 패널 방식)
- [x] **모든 탭 완전 구현 (공백 없음)**

### 🔜 다음 할 일

1. **화면 프로토타입 검토 및 피드백**
   - 00-missions-board.html에서 전체 플로우 테스트
   - Mission 카드 클릭 → 모달 → Todo 보드 → 상세 패널
   - 수정이 필요한 부분 정리
   - 추가로 필요한 화면 확인

2. **기능 최종 확정**
   - 위의 "검토 필요한 기능" 7가지 결정
   - "최종 확정이 필요한 사항" 답변

3. **백엔드 개발 시작**
   - Spring Boot 프로젝트 생성
   - JPA Entity 작성
   - REST API Controller 구현

4. **프론트엔드 개발 시작**
   - React + Next.js 프로젝트 생성
   - 프로토타입 HTML을 React 컴포넌트로 변환

---

## 💬 피드백 방법

프로토타입을 확인하신 후 다음 사항을 알려주세요:

1. **마음에 드는 부분**
   - 어떤 UI/UX가 좋았나요?
   - 어떤 기능이 유용해 보이나요?

2. **수정이 필요한 부분**
   - 어떤 UI/UX가 불편했나요?
   - 어떤 기능이 부족해 보이나요?

3. **추가로 필요한 화면**
   - 빠진 화면이 있나요?
   - 더 보고 싶은 상태/플로우는?

4. **기능 확정**
   - 위의 "검토 필요한 기능" 7가지 중 어떤 옵션을 선택하시나요?

---

**만든 날짜:** 2026-01-24
**버전:** Prototype v1.0

🧵 **ThreadCast** - Thread your AI workflow, never lose context
