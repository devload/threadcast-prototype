# ThreadCast Search API Design Document

## 개요

ThreadCast 검색 API는 워크스페이스 내의 Mission, Todo, Comment, Project를 통합 검색하는 기능을 제공합니다.

---

## 1. API 엔드포인트

### 1.1 통합 검색 API

#### `GET /api/search`

워크스페이스 내 모든 엔티티를 검색합니다.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | 검색어 (2-200자) |
| `workspaceId` | UUID | Yes | - | 워크스페이스 ID |
| `type` | enum | No | ALL | 검색 대상 타입 |
| `missionStatus` | enum | No | - | 미션 상태 필터 |
| `todoStatus` | enum | No | - | 투두 상태 필터 |
| `page` | int | No | 0 | 페이지 번호 (0-based) |
| `size` | int | No | 20 | 페이지 크기 (최대 100) |

**Type Enum:**
- `ALL` - 모든 타입 검색 (기본값)
- `MISSION` - 미션만 검색
- `TODO` - 투두만 검색
- `COMMENT` - 댓글만 검색
- `PROJECT` - 프로젝트만 검색

**Status Enums:**
```
MissionStatus: BACKLOG, PENDING, THREADING, IN_PROGRESS, WOVEN, COMPLETED, TANGLED, ARCHIVED, SKIPPED
TodoStatus: BACKLOG, PENDING, THREADING, IN_PROGRESS, WOVEN, COMPLETED, TANGLED, ARCHIVED, SKIPPED
```

---

### 1.2 워크스페이스별 검색 API

#### `GET /api/workspaces/{workspaceId}/search`

특정 워크스페이스 내 검색 (대안 엔드포인트)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `workspaceId` | UUID | 워크스페이스 ID |

**Query Parameters:** `/api/search`와 동일 (workspaceId 제외)

---

## 2. Request/Response 스키마

### 2.1 SearchRequest

```typescript
interface SearchRequest {
  q: string;              // 검색어 (2-200자, 필수)
  workspaceId: string;    // 워크스페이스 ID (필수)
  type?: SearchResultType; // 검색 타입 (기본: ALL)
  missionStatus?: string;  // 미션 상태 필터
  todoStatus?: string;     // 투두 상태 필터
  page?: number;           // 페이지 번호 (기본: 0)
  size?: number;           // 페이지 크기 (기본: 20, 최대: 100)
}
```

### 2.2 SearchResponse

```typescript
interface SearchResponse {
  query: string;           // 검색어
  totalCount: number;      // 전체 결과 수
  missionCount: number;    // 미션 결과 수
  todoCount: number;       // 투두 결과 수
  commentCount: number;    // 댓글 결과 수
  projectCount: number;    // 프로젝트 결과 수
  results: SearchResultItem[];
}
```

### 2.3 SearchResultItem

```typescript
interface SearchResultItem {
  id: string;                    // 엔티티 ID
  type: SearchResultType;        // 결과 타입
  title: string;                 // 제목 (댓글: "Comment on: {todoTitle}")
  description?: string;          // 설명 (최대 200자)
  highlightedContent?: string;   // 매치 하이라이트 (전후 30/70자)
  status?: string;               // 상태 (Mission, Todo만)
  priority?: string;             // 우선순위 (Mission, Todo만)
  parentId?: string;             // 부모 ID (Todo→Mission, Comment→Todo)
  parentTitle?: string;          // 부모 제목
  workspaceId?: string;          // 워크스페이스 ID
  createdAt?: string;            // 생성일시
  updatedAt?: string;            // 수정일시
}
```

---

## 3. 검색 동작 상세

### 3.1 검색 대상 필드

| Entity | 검색 대상 필드 |
|--------|---------------|
| Mission | title, description |
| Todo | title, description |
| Comment | content |
| Project | name, description, path |

### 3.2 검색 방식

- **대소문자 구분 없음** (Case-insensitive)
- **부분 일치** (LIKE '%query%')
- **정렬**: 수정일시 내림차순 (updatedAt DESC)

### 3.3 하이라이트 규칙

```
매치 위치 기준:
- 앞: 최대 30자
- 뒤: 최대 70자
- 잘린 경우 "..." 추가
```

### 3.4 결과 제한

- 단일 타입 검색: 페이지 크기만큼 반환
- ALL 타입 검색: 각 타입별 페이지 크기만큼 조회 후 전체를 updatedAt 기준 재정렬, 최종 size만큼 반환

---

## 4. HTTP 응답 코드

| Code | Description |
|------|-------------|
| 200 OK | 검색 성공 |
| 400 Bad Request | 검색어 2자 미만 또는 200자 초과 |
| 401 Unauthorized | 인증 토큰 없음/만료 |
| 403 Forbidden | 워크스페이스 접근 권한 없음 |
| 500 Internal Server Error | 서버 오류 |

### 에러 응답 형식

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_QUERY",
    "message": "Search query must be at least 2 characters"
  },
  "timestamp": "2026-01-28T10:30:00"
}
```

---

## 5. 사용 예시

### 5.1 기본 검색

```bash
GET /api/search?q=로그인&workspaceId=550e8400-e29b-41d4-a716-446655440000
```

### 5.2 미션만 검색 (상태 필터 포함)

```bash
GET /api/search?q=인증&workspaceId=550e8400-e29b-41d4-a716-446655440000&type=MISSION&missionStatus=IN_PROGRESS
```

### 5.3 페이지네이션

```bash
GET /api/search?q=버그&workspaceId=550e8400-e29b-41d4-a716-446655440000&page=2&size=10
```

### 5.4 TypeScript 클라이언트 사용

```typescript
// 기본 검색
const result = await searchService.search('로그인', workspaceId);

// 필터 검색
const missions = await searchService.searchMissions('인증', workspaceId, 'IN_PROGRESS');

// 빠른 검색 (자동완성용)
const suggestions = await searchService.quickSearch('버', workspaceId, 5);
```

---

## 6. 프론트엔드 서비스 인터페이스

```typescript
const searchService = {
  // 메인 검색 함수
  search(q: string, workspaceId: string, options?: SearchOptions): Promise<SearchResponse>;

  // 전체 요청 객체로 검색
  searchWithRequest(request: SearchRequest): Promise<SearchResponse>;

  // 빠른 검색 (자동완성용)
  quickSearch(q: string, workspaceId: string, limit?: number): Promise<SearchResultItem[]>;

  // 타입별 검색
  searchMissions(q: string, workspaceId: string, status?: string, page?: number, size?: number): Promise<SearchResponse>;
  searchTodos(q: string, workspaceId: string, status?: string, page?: number, size?: number): Promise<SearchResponse>;
  searchProjects(q: string, workspaceId: string, page?: number, size?: number): Promise<SearchResponse>;
  searchComments(q: string, workspaceId: string, page?: number, size?: number): Promise<SearchResponse>;
};
```

---

## 7. 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   searchService.ts                        │    │
│  │  - search(), quickSearch(), searchMissions(), ...        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP GET
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Spring Boot)                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               SearchController.java                       │    │
│  │  GET /api/search                                          │    │
│  │  GET /api/workspaces/{id}/search                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 SearchService.java                        │    │
│  │  - searchMissions(), searchTodos()                        │    │
│  │  - 결과 통합 및 정렬                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐│
│  │ Mission      │ │ Todo         │ │ Comment      │ │ Project ││
│  │ Repository   │ │ Repository   │ │ Repository   │ │ Repo    ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ JPA/JPQL
┌─────────────────────────────────────────────────────────────────┐
│                     Database (H2/PostgreSQL)                     │
│  mission, todo, comment, project tables                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. 데이터베이스 쿼리

### 8.1 기본 검색 쿼리 (Mission 예시)

```sql
SELECT m FROM Mission m
WHERE m.workspace.id = :workspaceId
AND (LOWER(m.title) LIKE LOWER(CONCAT('%', :query, '%'))
     OR LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%')))
ORDER BY m.updatedAt DESC
```

### 8.2 상태 필터 포함 쿼리

```sql
SELECT m FROM Mission m
WHERE m.workspace.id = :workspaceId
AND m.status = :status
AND (LOWER(m.title) LIKE LOWER(CONCAT('%', :query, '%'))
     OR LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%')))
ORDER BY m.updatedAt DESC
```

### 8.3 카운트 쿼리

```sql
SELECT COUNT(m) FROM Mission m
WHERE m.workspace.id = :workspaceId
AND (LOWER(m.title) LIKE LOWER(CONCAT('%', :query, '%'))
     OR LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%')))
```

---

## 9. 향후 개선 사항

### 9.1 단기 개선

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 정렬 옵션 | relevance, createdAt, title 정렬 지원 | HIGH |
| 날짜 범위 필터 | createdAfter, createdBefore 파라미터 | MEDIUM |
| 우선순위 필터 | priority 필터 추가 | MEDIUM |
| 검색 제안 | 오타 교정, 자동완성 | LOW |

### 9.2 중기 개선

| 기능 | 설명 |
|------|------|
| Full-Text Search | PostgreSQL FTS 또는 Elasticsearch 도입 |
| 검색어 하이라이트 | `<mark>` 태그로 매치 부분 강조 |
| Faceted Search | 필터별 결과 수 미리 표시 |
| 검색 히스토리 | 최근 검색어 저장 및 제안 |

### 9.3 장기 개선

| 기능 | 설명 |
|------|------|
| AI 기반 검색 | 의미적 유사성 검색 (Embedding) |
| 검색 분석 | 인기 검색어, 검색 효율 분석 |
| 다국어 검색 | 형태소 분석기 적용 (한국어, 일본어) |
| 필드별 검색 | `title:인증 status:진행중` 구문 지원 |

---

## 10. 보안 고려사항

1. **입력 검증**: 검색어 길이 제한 (2-200자)
2. **워크스페이스 격리**: 항상 workspaceId로 범위 제한
3. **SQL Injection 방지**: JPA 파라미터 바인딩 사용
4. **Rate Limiting**: (향후) 과도한 검색 요청 제한
5. **결과 접근 제어**: 사용자가 접근 권한이 있는 데이터만 반환

---

## 11. 파일 구조

```
threadcast-server/
└── src/main/java/io/threadcast/
    ├── controller/
    │   └── SearchController.java      # API 엔드포인트
    ├── service/
    │   └── SearchService.java         # 비즈니스 로직
    ├── dto/
    │   ├── request/
    │   │   └── SearchRequest.java     # 요청 DTO
    │   └── response/
    │       └── SearchResponse.java    # 응답 DTO
    └── domain/enums/
        └── SearchType.java            # 검색 타입 enum

threadcast-web/
└── src/
    ├── services/
    │   └── searchService.ts           # API 클라이언트
    └── types/
        └── search.ts                  # TypeScript 타입
```

---

## 12. 프론트엔드 컴포넌트

### 12.1 SearchModal 컴포넌트

전역 검색 모달 UI를 제공합니다.

**주요 기능:**
- 키보드 단축키: `Cmd/Ctrl + K`로 열기
- 실시간 검색: 300ms 디바운스 적용
- 타입별 필터 탭: ALL, Mission, Todo, Project, Comment
- 키보드 네비게이션: 화살표 키로 결과 선택, Enter로 이동
- 최근 검색 기록: localStorage에 최대 10개 저장

**결과 네비게이션:**
| 타입 | 이동 경로 |
|------|-----------|
| Mission | `/missions/{id}/todos` |
| Todo | `/missions/{parentId}/todos?todo={id}` |
| Project | `/projects/{id}` |
| Comment | `/todos?todo={parentId}` |

### 12.2 searchStore (Zustand)

```typescript
interface SearchStore {
  // State
  query: string;
  response: SearchResponse | null;
  isSearching: boolean;
  isOpen: boolean;
  selectedIndex: number;
  recentSearches: string[];
  filters: SearchFilters;
  error: string | null;

  // Actions
  setQuery: (query: string) => void;
  search: () => Promise<void>;
  openSearch: () => void;
  closeSearch: () => void;
  moveSelection: (direction: 'up' | 'down') => void;
  getSelectedResult: () => SearchResultItem | null;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setFilters: (filters: SearchFilters) => void;

  // Computed
  getResults: () => SearchResultItem[];
  getMissionResults: () => SearchResultItem[];
  getTodoResults: () => SearchResultItem[];
  getProjectResults: () => SearchResultItem[];
  getCommentResults: () => SearchResultItem[];
}
```

**영속성:**
- `recentSearches`만 localStorage에 저장
- 스토리지 키: `threadcast-search`

---

## 13. 구현 현황

### 13.1 백엔드 구현 완료

| 파일 | 상태 | 설명 |
|------|------|------|
| `SearchController.java` | ✅ 완료 | REST API 엔드포인트 |
| `SearchService.java` | ✅ 완료 | 비즈니스 로직 |
| `SearchRequest.java` | ✅ 완료 | 요청 DTO |
| `SearchResponse.java` | ✅ 완료 | 응답 DTO + 결과 변환 |
| `SearchType.java` | ✅ 완료 | 검색 타입 Enum |
| Repository 쿼리 | ✅ 완료 | 각 엔티티별 검색 메서드 |

### 13.2 프론트엔드 구현 완료

| 파일 | 상태 | 설명 |
|------|------|------|
| `searchService.ts` | ✅ 완료 | API 클라이언트 |
| `searchStore.ts` | ✅ 완료 | Zustand 스토어 |
| `search.ts` (types) | ✅ 완료 | TypeScript 타입 정의 |
| `SearchModal.tsx` | ✅ 완료 | 검색 UI 컴포넌트 |
| `SearchTrigger.tsx` | ✅ 완료 | 검색 버튼 컴포넌트 |

### 13.3 기능 체크리스트

| 기능 | 상태 |
|------|------|
| 통합 검색 API | ✅ |
| 타입별 필터링 | ✅ |
| 상태별 필터링 | ✅ |
| 페이지네이션 | ✅ |
| 결과 하이라이팅 | ✅ |
| 최근 검색 기록 | ✅ |
| 키보드 단축키 | ✅ |
| 키보드 네비게이션 | ✅ |
| N+1 방지 (FETCH JOIN) | ✅ |
| 대소문자 무시 검색 | ✅ |
| 실시간 검색 (디바운스) | ✅ |

---

## 14. API 테스트

### 14.1 cURL 테스트 예시

```bash
# 전체 검색
curl -X GET "http://localhost:8080/api/search?q=로그인&workspaceId=UUID" \
  -H "Content-Type: application/json"

# 타입별 검색
curl -X GET "http://localhost:8080/api/search?q=버그&workspaceId=UUID&type=TODO"

# 상태 필터 포함
curl -X GET "http://localhost:8080/api/search?q=기능&workspaceId=UUID&type=MISSION&missionStatus=IN_PROGRESS"

# 페이지네이션
curl -X GET "http://localhost:8080/api/search?q=API&workspaceId=UUID&page=1&size=10"
```

### 14.2 응답 예시

```json
{
  "success": true,
  "data": {
    "query": "로그인",
    "totalCount": 15,
    "missionCount": 3,
    "todoCount": 8,
    "commentCount": 2,
    "projectCount": 2,
    "results": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "type": "TODO",
        "title": "로그인 기능 버그 수정",
        "description": "OAuth 로그인 시 토큰 갱신 문제",
        "highlightedContent": "...OAuth 로그인 시 토큰 갱신 문제가 발생하여...",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "parentId": "550e8400-e29b-41d4-a716-446655440000",
        "parentTitle": "인증 시스템 개선",
        "workspaceId": "550e8400-e29b-41d4-a716-446655440099",
        "createdAt": "2026-01-28T10:00:00",
        "updatedAt": "2026-01-30T15:30:00"
      }
    ]
  },
  "error": null,
  "timestamp": "2026-01-30T16:00:00"
}
```

---

*문서 작성일: 2026-01-28*
*마지막 수정: 2026-01-30*
*버전: 1.1*
