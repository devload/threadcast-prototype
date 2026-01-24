# 🧵 ThreadCast Prototype

> Thread your AI workflow, never lose context

AI-collaborative 프로젝트 관리 시스템의 인터랙티브 UI 프로토타입입니다.

---

## 📋 프로토타입 확인하기

프로토타입 HTML 파일들은 **`prototype` 브랜치**에 있습니다.

### 브랜치 전환
```bash
git checkout prototype
```

또는 GitHub에서 직접 확인:
👉 [**prototype 브랜치 바로가기**](https://github.com/devload/threadcast-prototype/tree/prototype)

---

## 📁 프로젝트 구조

```
threadcast-prototype/
├── main (현재 브랜치)           # 프로젝트 소개
└── prototype 브랜치              # 실제 프로토타입 파일들
    ├── 00-missions-board.html   # Mission 칸반 보드
    ├── 01-dashboard.html        # Todo 대시보드
    ├── 06-timeline.html         # 타임라인
    ├── README.md                # 상세 문서
    └── CHANGELOG.md             # 개발 히스토리
```

---

## ✨ 주요 기능

### 1. Mission & Todo 칸반 시스템
- **Mission**: 큰 목표 단위 (예: "로그인 기능 구현")
- **Todo**: AI가 실행하는 작은 작업 단위
- **드래그 앤 드롭**: 칸반 컬럼 간 자유로운 이동

### 2. 모달/패널 통합 UI
- **Mission Summary**: 중앙 모달
- **Todo Detail**: 우측 슬라이드 패널
- **Create Mission**: 중앙 모달
- **부드러운 애니메이션**: fade, slide 효과

### 3. AI 질문 시스템
- **다양한 질문 타입**: 객관식, Yes/No, 숫자 입력, 텍스트 입력
- **우선순위**: 긴급/높음/보통
- **필터링 & 정렬**: 우선순위별, 시간순, Mission순
- **일괄 답변**: 모든 질문에 한 번에 "AI가 결정" 선택
- **답변 히스토리**: 최근 답변 이력 확인

### 4. Workspace AI 자율성
- **5단계 레벨**: Minimal → Low → Balanced → High → Maximum
- **레벨별 동작**: AI가 질문하는 빈도와 범위 조정

---

## 🎨 디자인 시스템

```css
--thread-primary: #6366F1    /* 메인 브랜드 컬러 */
--thread-woven: #22C55E      /* 완료 상태 */
--thread-threading: #F59E0B  /* 진행 중 */
--thread-tangled: #EF4444    /* 에러 상태 */
```

---

## 🚀 로컬에서 실행

```bash
# 1. 저장소 클론
git clone https://github.com/devload/threadcast-prototype.git
cd threadcast-prototype

# 2. prototype 브랜치로 전환
git checkout prototype

# 3. 브라우저에서 열기
start 00-missions-board.html

# 또는 Live Server 사용 (VS Code 확장)
```

---

## 📖 문서

자세한 내용은 `prototype` 브랜치의 문서를 참고하세요:
- [README.md](https://github.com/devload/threadcast-prototype/blob/prototype/README.md) - 핵심 개념 및 사용법
- [CHANGELOG.md](https://github.com/devload/threadcast-prototype/blob/prototype/CHANGELOG.md) - 개발 히스토리

---

## 🛠️ 기술 스택

- **HTML5**: Semantic markup
- **CSS3**: Variables, Flexbox, Grid, Animations
- **Vanilla JavaScript**: Drag & Drop API, Event handling
- **Design**: Custom design system

---

## 🗺️ 향후 계획

### Phase 1: 백엔드 연동
- REST API 설계
- WebSocket 실시간 업데이트
- 데이터베이스 스키마

### Phase 2: AI 통합
- Claude API 연동
- AI 에이전트 시스템
- 질문/답변 처리 로직

### Phase 3: 프로덕션
- React/Vue 마이그레이션
- 상태 관리
- 테스트 코드

---

## 📝 라이선스

MIT License

---

## 👥 기여자

- **개발**: Claude Sonnet 4.5 + Human
- **날짜**: 2026-01-24

---

**🧵 ThreadCast** - Thread your AI workflow, never lose context
