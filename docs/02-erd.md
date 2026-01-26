# ThreadCast 데이터베이스 설계 (ERD)

## 1. 개요

ThreadCast의 데이터 모델은 AI 기반 작업 관리 시스템의 핵심 개념을 반영합니다.

### 핵심 개념
- **Workspace**: 사용자의 작업 공간
- **Mission**: 큰 목표 단위 (여러 Todo로 구성)
- **Todo**: AI가 실행하는 구체적인 작업
- **TodoStep**: Todo의 6단계 진행 상황
- **TimelineEvent**: 모든 활동의 기록

## 2. ERD 다이어그램

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │    Workspace    │
├─────────────────┤       ├─────────────────┤
│ id          PK  │───┐   │ id          PK  │
│ email           │   │   │ name            │
│ password_hash   │   │   │ description     │
│ name            │   └──▶│ owner_id    FK  │
│ avatar_url      │       │ created_at      │
│ autonomy_level  │       │ updated_at      │
│ created_at      │       └────────┬────────┘
│ updated_at      │                │
└─────────────────┘                │
                                   │ 1:N
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                          Mission                             │
├─────────────────────────────────────────────────────────────┤
│ id              PK     │ status         ENUM                │
│ workspace_id    FK     │ priority       ENUM                │
│ title           VARCHAR│ progress       INT (0-100)         │
│ description     TEXT   │ estimated_time INT (minutes)       │
│ created_at      TIMESTAMP                                   │
│ updated_at      TIMESTAMP                                   │
│ started_at      TIMESTAMP                                   │
│ completed_at    TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   │ 1:N
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                            Todo                              │
├─────────────────────────────────────────────────────────────┤
│ id              PK     │ status          ENUM               │
│ mission_id      FK     │ priority        ENUM               │
│ title           VARCHAR│ complexity      ENUM               │
│ description     TEXT   │ order_index     INT                │
│ estimated_time  INT    │ actual_time     INT (minutes)      │
│ created_at      TIMESTAMP                                   │
│ updated_at      TIMESTAMP                                   │
│ started_at      TIMESTAMP                                   │
│ completed_at    TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────┘
          │                              │
          │ 1:N                          │ 1:N
          ▼                              ▼
┌───────────────────┐         ┌─────────────────────┐
│     TodoStep      │         │   TodoDependency    │
├───────────────────┤         ├─────────────────────┤
│ id            PK  │         │ id              PK  │
│ todo_id       FK  │         │ todo_id         FK  │
│ step_type     ENUM│         │ depends_on_id   FK  │
│ status        ENUM│         │ created_at          │
│ started_at        │         └─────────────────────┘
│ completed_at      │
│ output        TEXT│
└───────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       TimelineEvent                          │
├─────────────────────────────────────────────────────────────┤
│ id              PK     │ event_type      ENUM               │
│ workspace_id    FK     │ actor_type      ENUM               │
│ mission_id      FK     │ metadata        JSONB              │
│ todo_id         FK     │ created_at      TIMESTAMP          │
│ description     TEXT   │                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        AIQuestion                            │
├─────────────────────────────────────────────────────────────┤
│ id              PK     │ status          ENUM               │
│ todo_id         FK     │ category        ENUM               │
│ question        TEXT   │ options         JSONB              │
│ context         TEXT   │ created_at      TIMESTAMP          │
└─────────────────────────────────────────────────────────────┘
          │
          │ 1:1
          ▼
┌───────────────────┐
│     AIAnswer      │
├───────────────────┤
│ id            PK  │
│ question_id   FK  │
│ answer        TEXT│
│ answered_by   ENUM│
│ created_at        │
└───────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         Comment                              │
├─────────────────────────────────────────────────────────────┤
│ id              PK     │ content         TEXT               │
│ todo_id         FK     │ has_ai_mention  BOOLEAN            │
│ user_id         FK     │ created_at      TIMESTAMP          │
│ parent_id       FK     │ updated_at      TIMESTAMP          │
└─────────────────────────────────────────────────────────────┘
```

## 3. 엔티티 상세 명세

### 3.1 User (사용자)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 사용자 고유 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 (로그인 ID) |
| password_hash | VARCHAR(255) | NOT NULL | 암호화된 비밀번호 |
| name | VARCHAR(100) | NOT NULL | 표시 이름 |
| avatar_url | VARCHAR(500) | NULLABLE | 프로필 이미지 URL |
| autonomy_level | INT | DEFAULT 3 | AI 자율성 레벨 (1-5) |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

### 3.2 Workspace (작업 공간)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 작업 공간 고유 ID |
| name | VARCHAR(200) | NOT NULL | 작업 공간 이름 |
| description | TEXT | NULLABLE | 설명 |
| owner_id | UUID | FK → User.id | 소유자 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

### 3.3 Mission (미션)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 미션 고유 ID |
| workspace_id | UUID | FK → Workspace.id | 소속 작업 공간 |
| title | VARCHAR(300) | NOT NULL | 미션 제목 |
| description | TEXT | NULLABLE | 미션 설명 |
| status | ENUM | NOT NULL | 상태 (아래 참조) |
| priority | ENUM | DEFAULT 'MEDIUM' | 우선순위 |
| progress | INT | DEFAULT 0 | 진행률 (0-100) |
| estimated_time | INT | NULLABLE | 예상 시간 (분) |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |
| started_at | TIMESTAMP | NULLABLE | 시작일시 |
| completed_at | TIMESTAMP | NULLABLE | 완료일시 |

**Mission Status Enum:**
```
BACKLOG    = 계획됨 (대기)
THREADING  = 진행 중
WOVEN      = 완료됨
ARCHIVED   = 보관됨
```

### 3.4 Todo (할 일)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | Todo 고유 ID |
| mission_id | UUID | FK → Mission.id | 소속 미션 |
| title | VARCHAR(300) | NOT NULL | Todo 제목 |
| description | TEXT | NULLABLE | Todo 설명 |
| status | ENUM | NOT NULL | 상태 (아래 참조) |
| priority | ENUM | DEFAULT 'MEDIUM' | 우선순위 |
| complexity | ENUM | DEFAULT 'MEDIUM' | 복잡도 |
| order_index | INT | NOT NULL | 순서 |
| estimated_time | INT | NULLABLE | 예상 시간 (분) |
| actual_time | INT | NULLABLE | 실제 소요 시간 (분) |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |
| started_at | TIMESTAMP | NULLABLE | 시작일시 |
| completed_at | TIMESTAMP | NULLABLE | 완료일시 |

**Todo Status Enum:**
```
PENDING    = 대기 중
THREADING  = AI 작업 중
WOVEN      = 완료됨
TANGLED    = 에러 발생
```

**Priority Enum:**
```
LOW      = 낮음
MEDIUM   = 보통
HIGH     = 높음
CRITICAL = 긴급
```

**Complexity Enum:**
```
LOW    = 낮음
MEDIUM = 보통
HIGH   = 높음
```

### 3.5 TodoStep (Todo 단계)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 단계 고유 ID |
| todo_id | UUID | FK → Todo.id | 소속 Todo |
| step_type | ENUM | NOT NULL | 단계 유형 (아래 참조) |
| status | ENUM | DEFAULT 'PENDING' | 단계 상태 |
| started_at | TIMESTAMP | NULLABLE | 시작일시 |
| completed_at | TIMESTAMP | NULLABLE | 완료일시 |
| output | TEXT | NULLABLE | AI 출력 결과 |

**Step Type Enum (6단계):**
```
ANALYSIS       = 1. 분석
DESIGN         = 2. 설계
IMPLEMENTATION = 3. 구현
VERIFICATION   = 4. 검증
REVIEW         = 5. 리뷰
INTEGRATION    = 6. 통합
```

**Step Status Enum:**
```
PENDING    = 대기
IN_PROGRESS = 진행 중
COMPLETED  = 완료
FAILED     = 실패
SKIPPED    = 건너뜀
```

### 3.6 TodoDependency (Todo 의존성)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 의존성 고유 ID |
| todo_id | UUID | FK → Todo.id | 현재 Todo |
| depends_on_id | UUID | FK → Todo.id | 의존하는 Todo |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

### 3.7 TimelineEvent (타임라인 이벤트)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 이벤트 고유 ID |
| workspace_id | UUID | FK → Workspace.id | 소속 작업 공간 |
| mission_id | UUID | FK → Mission.id, NULLABLE | 관련 미션 |
| todo_id | UUID | FK → Todo.id, NULLABLE | 관련 Todo |
| event_type | ENUM | NOT NULL | 이벤트 유형 |
| actor_type | ENUM | NOT NULL | 행위자 유형 |
| description | TEXT | NOT NULL | 이벤트 설명 |
| metadata | JSONB | NULLABLE | 추가 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 발생일시 |

**Event Type Enum:**
```
MISSION_CREATED   = 미션 생성
MISSION_STARTED   = 미션 시작
MISSION_COMPLETED = 미션 완료
TODO_CREATED      = Todo 생성
TODO_STARTED      = Todo 시작
TODO_COMPLETED    = Todo 완료
TODO_FAILED       = Todo 실패
STEP_STARTED      = 단계 시작
STEP_COMPLETED    = 단계 완료
FILE_CREATED      = 파일 생성
FILE_MODIFIED     = 파일 수정
FILE_DELETED      = 파일 삭제
COMMENT_ADDED     = 코멘트 추가
AI_QUESTION       = AI 질문 발생
AI_ANSWER         = AI 질문 답변
```

**Actor Type Enum:**
```
AI     = AI 에이전트
SYSTEM = 시스템
USER   = 사용자
```

### 3.8 AIQuestion (AI 질문)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 질문 고유 ID |
| todo_id | UUID | FK → Todo.id | 관련 Todo |
| question | TEXT | NOT NULL | 질문 내용 |
| context | TEXT | NULLABLE | 질문 컨텍스트 |
| status | ENUM | DEFAULT 'PENDING' | 질문 상태 |
| category | ENUM | NOT NULL | 질문 카테고리 |
| options | JSONB | NULLABLE | 선택지 옵션 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

**Question Status Enum:**
```
PENDING   = 답변 대기
ANSWERED  = 답변 완료
EXPIRED   = 만료됨
AUTO_RESOLVED = AI 자동 결정
```

**Question Category Enum:**
```
ARCHITECTURE   = 아키텍처 결정
IMPLEMENTATION = 구현 방식
CONFIGURATION  = 설정값
SECURITY       = 보안 관련
NAMING         = 네이밍
OTHER          = 기타
```

### 3.9 AIAnswer (AI 질문 답변)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 답변 고유 ID |
| question_id | UUID | FK → AIQuestion.id, UNIQUE | 질문 ID |
| answer | TEXT | NOT NULL | 답변 내용 |
| answered_by | ENUM | NOT NULL | 답변자 유형 |
| created_at | TIMESTAMP | NOT NULL | 답변일시 |

**Answered By Enum:**
```
USER = 사용자 답변
AI   = AI 자동 결정
```

### 3.10 Comment (코멘트)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 코멘트 고유 ID |
| todo_id | UUID | FK → Todo.id | 소속 Todo |
| user_id | UUID | FK → User.id | 작성자 |
| parent_id | UUID | FK → Comment.id, NULLABLE | 부모 코멘트 (대댓글) |
| content | TEXT | NOT NULL | 코멘트 내용 |
| has_ai_mention | BOOLEAN | DEFAULT false | @ai 멘션 포함 여부 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

## 4. 인덱스 설계

```sql
-- Mission 인덱스
CREATE INDEX idx_mission_workspace ON mission(workspace_id);
CREATE INDEX idx_mission_status ON mission(status);
CREATE INDEX idx_mission_created_at ON mission(created_at DESC);

-- Todo 인덱스
CREATE INDEX idx_todo_mission ON todo(mission_id);
CREATE INDEX idx_todo_status ON todo(status);
CREATE INDEX idx_todo_order ON todo(mission_id, order_index);

-- TodoStep 인덱스
CREATE INDEX idx_todostep_todo ON todo_step(todo_id);

-- TimelineEvent 인덱스
CREATE INDEX idx_timeline_workspace ON timeline_event(workspace_id);
CREATE INDEX idx_timeline_mission ON timeline_event(mission_id);
CREATE INDEX idx_timeline_todo ON timeline_event(todo_id);
CREATE INDEX idx_timeline_created_at ON timeline_event(created_at DESC);

-- AIQuestion 인덱스
CREATE INDEX idx_aiquestion_todo ON ai_question(todo_id);
CREATE INDEX idx_aiquestion_status ON ai_question(status);

-- Comment 인덱스
CREATE INDEX idx_comment_todo ON comment(todo_id);
CREATE INDEX idx_comment_parent ON comment(parent_id);
```

## 5. JPA Entity 매핑 예시

### 5.1 Mission Entity

```java
@Entity
@Table(name = "mission")
public class Mission extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MissionStatus status = MissionStatus.BACKLOG;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority = Priority.MEDIUM;

    @Column(nullable = false)
    private Integer progress = 0;

    private Integer estimatedTime;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "mission", cascade = CascadeType.ALL)
    @OrderBy("orderIndex ASC")
    private List<Todo> todos = new ArrayList<>();
}
```

### 5.2 Todo Entity

```java
@Entity
@Table(name = "todo")
public class Todo extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id", nullable = false)
    private Mission mission;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TodoStatus status = TodoStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Complexity complexity = Complexity.MEDIUM;

    @Column(nullable = false)
    private Integer orderIndex;

    private Integer estimatedTime;

    private Integer actualTime;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "todo", cascade = CascadeType.ALL)
    @OrderBy("stepType ASC")
    private List<TodoStep> steps = new ArrayList<>();

    @ManyToMany
    @JoinTable(
        name = "todo_dependency",
        joinColumns = @JoinColumn(name = "todo_id"),
        inverseJoinColumns = @JoinColumn(name = "depends_on_id")
    )
    private Set<Todo> dependencies = new HashSet<>();
}
```

## 6. 데이터 마이그레이션 전략

### 6.1 개발 환경 (H2)
- `spring.jpa.hibernate.ddl-auto=create-drop`
- 애플리케이션 시작 시 스키마 자동 생성/삭제

### 6.2 프로덕션 환경 (PostgreSQL)
- Flyway 또는 Liquibase 사용
- 버전 관리된 마이그레이션 스크립트

```
migrations/
├── V1__init_schema.sql
├── V2__add_workspace_table.sql
├── V3__add_mission_table.sql
├── V4__add_todo_tables.sql
├── V5__add_timeline_event.sql
└── V6__add_ai_question_tables.sql
```

---

**문서 버전**: 1.0
**작성일**: 2026-01-26
**최종 수정**: 2026-01-26
