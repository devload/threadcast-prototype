# ThreadCast E2E Test Cases

Based on Feature Specification v1.0.0

---

## Test Case Format

```
TC-{PageID}-{FeatureID}-{Seq}
Example: TC-P01-F01-01

Exception Cases: TC-{PageID}-EX-{Seq}
Edge Cases: TC-{PageID}-ED-{Seq}
Performance Cases: TC-{PageID}-PF-{Seq}
```

---

## P01: HomePage Test Cases

### TC-P01-F01: Global Stats Display
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P01-F01-01 | 통계 카드 5개 표시 | 1. HomePage 접속 | Workspaces, Missions, Todos, AI Actions, Pending Questions 카드 표시 |
| TC-P01-F01-02 | 통계 값 계산 정확성 | 1. 여러 Workspace 데이터 확인 | 모든 Workspace의 합산 값 표시 |

### TC-P01-F02: Workspace Card List
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P01-F02-01 | Workspace 카드 표시 | 1. HomePage 접속 | 등록된 모든 Workspace 카드 표시 |
| TC-P01-F02-02 | 빈 상태 메시지 | 1. Workspace 없는 상태에서 접속 | "Workspace가 없습니다" 메시지 표시 |

### TC-P01-F03: Workspace Card Stats
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P01-F03-01 | 카드 내 통계 표시 | 1. Workspace 카드 확인 | Projects, Missions, Todos, Progress 표시 |
| TC-P01-F03-02 | Progress 계산 | 1. 진행률 확인 | 완료 미션/전체 미션 * 100 |

### TC-P01-F04: Workspace Click Navigate
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P01-F04-01 | Workspace 클릭 이동 | 1. Workspace 카드 클릭 | /dashboard 페이지로 이동 |
| TC-P01-F04-02 | currentWorkspace 설정 | 1. 클릭 후 Store 확인 | currentWorkspace가 설정됨 |

### TC-P01-F05: AI Alert Banner
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P01-F05-01 | 배너 표시 조건 | 1. 대기중 질문 있는 상태 | 핑크 그라데이션 배너 표시 |
| TC-P01-F05-02 | 배너 숨김 조건 | 1. 대기중 질문 없는 상태 | 배너 숨김 |
| TC-P01-F05-03 | 질문 수 표시 | 1. 배너 텍스트 확인 | "AI가 N개의 질문을 기다리고 있습니다" |

### TC-P01-F06: AI Alert Click
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P01-F06-01 | 배너 클릭 | 1. AI 배너 클릭 | AIQuestionPanel 열림 |

### TC-P01-F07~F09: Workspace Create
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P01-F07-01 | 생성 버튼 클릭 | 1. "+ 새 Workspace 추가" 클릭 | 생성 모달 열림 |
| TC-P01-F08-01 | 폼 필드 표시 | 1. 모달 확인 | 이름, 설명, 경로 입력 필드 |
| TC-P01-F08-02 | 필수 필드 검증 | 1. 빈 상태로 제출 | 이름 필드 에러 표시 |
| TC-P01-F09-01 | 생성 성공 | 1. 유효한 데이터 입력 2. 생성 버튼 클릭 | 모달 닫힘, 목록에 추가 |

### TC-P01-F11: Settings Button
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P01-F11-01 | 설정 버튼 클릭 | 1. 톱니바퀴 아이콘 클릭 | SettingsModal 열림 |

### TC-P01-F13: Question Badge
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P01-F13-01 | 배지 표시 | 1. 질문 있는 Workspace 카드 확인 | 노란 배지 "N 질문" 표시 |

### P01 Exception Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P01-EX-01 | API 타임아웃 (Workspace 목록) | 1. 네트워크 지연 10초 설정 2. 페이지 접속 | 로딩 스피너 표시 → 타임아웃 에러 메시지 |
| TC-P01-EX-02 | API 500 에러 | 1. 서버 500 응답 Mock 2. 페이지 접속 | "서버 오류가 발생했습니다" 메시지 |
| TC-P01-EX-03 | API 401 에러 (인증 만료) | 1. 토큰 만료 상태 2. 페이지 접속 | 로그인 페이지로 리다이렉트 |
| TC-P01-EX-04 | 네트워크 연결 끊김 | 1. 오프라인 상태 2. 페이지 접속 | "네트워크 연결을 확인하세요" 메시지 |
| TC-P01-EX-05 | Workspace 생성 실패 (중복 이름) | 1. 이미 존재하는 이름 입력 2. 생성 클릭 | "이미 존재하는 이름입니다" 에러 |
| TC-P01-EX-06 | Workspace 생성 실패 (잘못된 경로) | 1. 존재하지 않는 경로 입력 2. 생성 클릭 | "유효하지 않은 경로입니다" 에러 |

### P01 Edge Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P01-ED-01 | Workspace 0개 상태 | 1. 빈 상태로 접속 | Empty state UI 표시, 생성 유도 |
| TC-P01-ED-02 | Workspace 100개 이상 | 1. 대량 데이터 상태 | 스크롤 동작, 성능 유지 |
| TC-P01-ED-03 | 매우 긴 Workspace 이름 | 1. 100자 이상 이름 | 텍스트 truncate 처리 |
| TC-P01-ED-04 | 특수문자 Workspace 이름 | 1. 이름에 <>&"' 포함 | XSS 방지, 정상 표시 |
| TC-P01-ED-05 | 한글/영문 혼합 이름 | 1. "테스트 Test 123" 입력 | 정상 저장 및 표시 |
| TC-P01-ED-06 | 통계가 0인 Workspace | 1. 프로젝트/미션 없는 Workspace | 0 표시, Progress 0% |
| TC-P01-ED-07 | Progress 100% Workspace | 1. 모든 미션 완료 상태 | 100% 표시, 완료 스타일 |

### P01 Performance Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P01-PF-01 | 느린 네트워크 (3G) | 1. 3G 속도 제한 2. 페이지 접속 | 스켈레톤 UI 표시, 5초 내 로드 |
| TC-P01-PF-02 | 동시 다수 요청 | 1. 새로고침 연타 | 중복 요청 방지, 마지막 요청만 처리 |
| TC-P01-PF-03 | 대용량 활동 데이터 | 1. 1000개 이상 활동 | 가상 스크롤 또는 페이지네이션 |

---

## P03: MissionsPage Test Cases

### TC-P03-F01: Mission Kanban Board
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P03-F01-01 | 4개 컬럼 표시 | 1. /missions 접속 | Backlog, Threading, Woven, Archived 컬럼 |
| TC-P03-F01-02 | 컬럼별 카드 수 | 1. 각 컬럼 헤더 확인 | 상태별 미션 개수 표시 |

### TC-P03-F02: Mission Card Display
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P03-F02-01 | 카드 정보 표시 | 1. 미션 카드 확인 | ID, 제목, 설명, 진행도, Todo 수 |
| TC-P03-F02-02 | 진행도 바 | 1. 진행도 확인 | woven/total * 100 비율 |

### TC-P03-F03: Mission Card Click
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P03-F03-01 | 카드 클릭 | 1. 미션 카드 클릭 | MissionDetailModal 열림 |
| TC-P03-F03-02 | 모달에 올바른 데이터 | 1. 모달 내용 확인 | 클릭한 미션 정보 표시 |

### TC-P03-F04~F05: AI Question Banner
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P03-F04-01 | 배너 표시 | 1. 대기중 질문 있는 상태 | 배너에 질문 수, 미션 태그 표시 |
| TC-P03-F05-01 | 배너 클릭 | 1. "답변하기" 버튼 클릭 | AIQuestionPanel 열림 |

### TC-P03-F06: Mission AI Badge
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P03-F06-01 | 배지 표시 | 1. 질문 있는 미션 카드 확인 | "AI 질문 대기 중" 노란 배지 |

### TC-P03-F07~F09: Mission Create
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P03-F07-01 | 생성 버튼 클릭 | 1. "+ New Mission" 클릭 | 생성 모달 열림 |
| TC-P03-F08-01 | 폼 필드 | 1. 모달 확인 | 제목, 설명, 우선순위 필드 |
| TC-P03-F08-02 | 템플릿 선택 | 1. 템플릿 버튼 클릭 | 제목, 설명 자동 채움 |
| TC-P03-F09-01 | 생성 성공 | 1. 데이터 입력 2. 생성 클릭 | Backlog 컬럼에 추가 |

### TC-P03-F11: Overview Stats
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P03-F11-01 | 통계 표시 | 1. 사이드바 확인 | Total, Active, Success Rate, Remaining |

### TC-P03-F12: Sidebar Filter
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P03-F12-01 | All Missions 필터 | 1. "All Missions" 클릭 | 모든 미션 표시 |
| TC-P03-F12-02 | Active 필터 | 1. "Active" 클릭 | Threading 상태만 표시 |
| TC-P03-F12-03 | Completed 필터 | 1. "Completed" 클릭 | Woven 상태만 표시 |

### P03 Exception Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P03-EX-01 | Mission 목록 로드 실패 | 1. API 500 에러 Mock | 에러 메시지, 재시도 버튼 |
| TC-P03-EX-02 | Mission 생성 실패 (서버 에러) | 1. 생성 API 실패 | Toast 에러 메시지, 모달 유지 |
| TC-P03-EX-03 | Mission 생성 중 네트워크 끊김 | 1. 생성 중 오프라인 | 에러 메시지, 재시도 가능 |
| TC-P03-EX-04 | Workspace 선택 안됨 | 1. currentWorkspace null 상태 | "Workspace를 선택하세요" 리다이렉트 |
| TC-P03-EX-05 | 삭제된 Workspace 접근 | 1. 존재하지 않는 workspace ID | 404 에러 처리, 홈으로 이동 |

### P03 Edge Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P03-ED-01 | Mission 0개 상태 | 1. 빈 Kanban 보드 | "미션이 없습니다" + 생성 유도 |
| TC-P03-ED-02 | 특정 컬럼만 미션 있음 | 1. Backlog에만 미션 | 다른 컬럼 빈 상태 표시 |
| TC-P03-ED-03 | 컬럼당 50개 이상 미션 | 1. 대량 데이터 | 스크롤 동작, 가상화 |
| TC-P03-ED-04 | 매우 긴 미션 제목 | 1. 200자 제목 | 카드에서 truncate |
| TC-P03-ED-05 | 매우 긴 미션 설명 | 1. 1000자 설명 | 카드에서 3줄 후 ... 처리 |
| TC-P03-ED-06 | AI 질문 100개 이상 | 1. 대량 질문 상태 | 배너에 정확한 숫자, 성능 유지 |
| TC-P03-ED-07 | 동시에 같은 미션 편집 | 1. 두 탭에서 동시 수정 | Optimistic UI + 충돌 처리 |

### P03 Performance Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P03-PF-01 | 초기 로드 시간 | 1. 페이지 접속 | 1.5초 내 첫 화면 표시 |
| TC-P03-PF-02 | 미션 생성 응답 | 1. 생성 버튼 클릭 | 2초 내 응답, 로딩 표시 |
| TC-P03-PF-03 | 필터 전환 속도 | 1. 필터 클릭 | 100ms 내 UI 업데이트 |
| TC-P03-PF-04 | 스크롤 성능 | 1. 100개 미션 스크롤 | 60fps 유지 |

---

## P04: TodosPage Test Cases

### TC-P04-F01: Todo Kanban Board
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P04-F01-01 | 5개 컬럼 표시 | 1. /missions/1/todos 접속 | Backlog, Pending, Threading, Woven, Tangled |
| TC-P04-F01-02 | 컬럼별 카드 수 | 1. 컬럼 헤더 확인 | 상태별 Todo 개수 |

### TC-P04-F02: Todo Card Display
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P04-F02-01 | 카드 정보 | 1. Todo 카드 확인 | ID, 제목, Steps 바, 예상 시간, 복잡도 |
| TC-P04-F02-02 | Steps 진행 바 | 1. 진행 바 확인 | 완료 step/전체 step 색상 표시 |

### TC-P04-F03: Todo Card Click
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P04-F03-01 | 카드 클릭 | 1. Todo 카드 클릭 | 상세 드로어 열림 |

### TC-P04-F05~F06: Status Filter
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P04-F05-01 | All Todos 필터 | 1. "All Todos" 클릭 | 모든 Todo 표시 |
| TC-P04-F05-02 | Threading 필터 | 1. "Threading" 클릭 | Threading 상태만 표시 |
| TC-P04-F06-01 | 필터 배지 | 1. 필터 버튼 확인 | 각 상태별 개수 배지 |

### TC-P04-F07~F08: Todo Create
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P04-F07-01 | 생성 버튼 | 1. "+ Add Todo" 클릭 | 생성 모달 열림 |
| TC-P04-F08-01 | 폼 필드 | 1. 모달 확인 | 제목, 설명, 복잡도, 예상 시간 |

### TC-P04-F09~F11: Todo Detail & Steps
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P04-F09-01 | 드로어 정보 | 1. 드로어 확인 | 설명, 우선순위, 복잡도, Steps |
| TC-P04-F10-01 | Step 토글 | 1. Step 체크박스 클릭 | 상태 변경 API 호출 |
| TC-P04-F10-02 | Step 완료 표시 | 1. 완료된 Step 확인 | 체크마크, 취소선 |
| TC-P04-F11-01 | 진행률 업데이트 | 1. Step 완료 후 확인 | Todo 진행률 재계산 |

### P04 Exception Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P04-EX-01 | Todo 목록 로드 실패 | 1. API 에러 Mock | 에러 메시지, 재시도 버튼 |
| TC-P04-EX-02 | Step 상태 변경 실패 | 1. PATCH API 실패 | 체크박스 롤백, 에러 Toast |
| TC-P04-EX-03 | Step 상태 변경 중 네트워크 끊김 | 1. 토글 중 오프라인 | Optimistic UI 롤백, 에러 표시 |
| TC-P04-EX-04 | 존재하지 않는 Mission ID | 1. 잘못된 missionId로 접근 | "미션을 찾을 수 없습니다" 에러 |
| TC-P04-EX-05 | Todo 생성 실패 | 1. 생성 API 실패 | 에러 메시지, 폼 데이터 유지 |
| TC-P04-EX-06 | 동시 Step 업데이트 충돌 | 1. 두 탭에서 동시 토글 | 마지막 상태 동기화 |

### P04 Edge Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P04-ED-01 | Todo 0개 상태 | 1. 빈 미션 | "Todo가 없습니다" 메시지 |
| TC-P04-ED-02 | Steps 0개인 Todo | 1. Step 없는 Todo 확인 | "진행 단계 없음" 표시 |
| TC-P04-ED-03 | Steps 20개 이상 Todo | 1. 다수 Step Todo | 스크롤 가능, 전체 표시 |
| TC-P04-ED-04 | 모든 Steps 완료 | 1. 100% 완료 Todo | 완료 스타일, Woven으로 이동 가능 |
| TC-P04-ED-05 | 예상 시간 0분 | 1. 시간 미입력 Todo | "-" 또는 "미정" 표시 |
| TC-P04-ED-06 | 예상 시간 1000분 이상 | 1. 매우 긴 시간 | "16h 40m" 형식 변환 |
| TC-P04-ED-07 | Tangled 상태 Todo | 1. 실패한 Todo 확인 | 빨간 스타일, 재시도 버튼 |

### P04 Performance Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P04-PF-01 | Step 토글 응답 | 1. 체크박스 클릭 | 100ms 내 UI 반영 |
| TC-P04-PF-02 | 드로어 열기 속도 | 1. Todo 클릭 | 200ms 내 드로어 표시 |
| TC-P04-PF-03 | 대량 Todo 렌더링 | 1. 200개 Todo 페이지 | 스크롤 부드럽게 동작 |

---

## P05: TimelinePage Test Cases

### TC-P05-F01: Timeline Event List
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P05-F01-01 | 이벤트 목록 | 1. /timeline 접속 | 이벤트 목록 표시 |
| TC-P05-F01-02 | 날짜 그룹화 | 1. 그룹 헤더 확인 | Today, Yesterday, 날짜별 |

### TC-P05-F02: Event Type Filter
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P05-F02-01 | All Activity | 1. "All Activity" 클릭 | 모든 이벤트 |
| TC-P05-F02-02 | Missions 필터 | 1. "Missions" 클릭 | 미션 이벤트만 |
| TC-P05-F02-03 | AI Activity 필터 | 1. "AI Activity" 클릭 | AI 관련 이벤트만 |

### TC-P05-F03: Event Card Display
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P05-F03-01 | 이벤트 정보 | 1. 이벤트 카드 확인 | 아이콘, 제목, 상태, 시간, 메타 |

### TC-P05-F07: Load More
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P05-F07-01 | 더 불러오기 | 1. "더 불러오기" 클릭 | 추가 이벤트 로드 |

### P05 Exception Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P05-EX-01 | Timeline 로드 실패 | 1. API 에러 Mock | 에러 메시지, 재시도 |
| TC-P05-EX-02 | Load More 실패 | 1. 페이지네이션 API 실패 | "로드 실패" 메시지, 재시도 |
| TC-P05-EX-03 | Export 실패 | 1. 다운로드 실패 | 에러 Toast |

### P05 Edge Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P05-ED-01 | 이벤트 0개 | 1. 빈 타임라인 | "활동이 없습니다" 메시지 |
| TC-P05-ED-02 | 오늘 이벤트만 있음 | 1. Today 그룹만 | Today 헤더만 표시 |
| TC-P05-ED-03 | 1년 전 이벤트 | 1. 오래된 데이터 | "2025년 1월 27일" 형식 |
| TC-P05-ED-04 | 같은 시간 다수 이벤트 | 1. 동시 발생 이벤트 | 순서대로 표시 |
| TC-P05-ED-05 | 필터 후 결과 0개 | 1. AI Activity 필터 (없는 경우) | "해당 활동이 없습니다" |

### P05 Performance Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-P05-PF-01 | 초기 로드 | 1. 페이지 접속 | 1초 내 표시 |
| TC-P05-PF-02 | 무한 스크롤 | 1. 계속 스크롤 | 끊김 없이 로드 |
| TC-P05-PF-03 | 1000개 이벤트 | 1. 대량 데이터 | 가상화로 성능 유지 |

---

## M01: SettingsModal Test Cases

### TC-M01-F01~F02: Language
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M01-F01-01 | 한국어 선택 | 1. "한국어" 버튼 클릭 | UI 한국어로 변경 |
| TC-M01-F01-02 | English 선택 | 1. "English" 버튼 클릭 | UI 영어로 변경 |
| TC-M01-F02-01 | 새로고침 유지 | 1. 언어 변경 2. 새로고침 | 설정된 언어 유지 |

### TC-M01-F03: Theme
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M01-F03-01 | Light 테마 | 1. "Light" 클릭 | 라이트 모드 |
| TC-M01-F03-02 | Dark 테마 | 1. "Dark" 클릭 | 다크 모드 |

### TC-M01-F04: Close
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M01-F04-01 | ESC 닫기 | 1. ESC 키 | 모달 닫힘 |
| TC-M01-F04-02 | 외부 클릭 닫기 | 1. 백드롭 클릭 | 모달 닫힘 |

### M01 Edge Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M01-ED-01 | localStorage 비활성화 | 1. 저장소 차단 상태 | 메모리 저장, 새로고침 시 초기화 |
| TC-M01-ED-02 | 손상된 설정값 | 1. 잘못된 값 저장 | 기본값으로 복구 |

---

## M02: AIQuestionPanel Test Cases (Critical)

### TC-M02-F01: Question List
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M02-F01-01 | 질문 목록 표시 | 1. AI Panel 열기 | 대기중 질문 목록 |
| TC-M02-F01-02 | 미션/Todo 태그 | 1. 질문 확인 | 관련 미션/Todo ID 표시 |

### TC-M02-F02: Answer Input
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M02-F02-01 | 선택지 답변 | 1. 옵션 버튼 클릭 | 선택 표시 |
| TC-M02-F02-02 | 텍스트 답변 | 1. 텍스트 입력 | 입력 값 표시 |

### TC-M02-F03: Submit Answer (CRITICAL)
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M02-F03-01 | 답변 제출 | 1. 답변 입력 2. 제출 클릭 | API 호출, 목록에서 제거 |
| TC-M02-F03-02 | API 요청 확인 | 1. 네트워크 탭 확인 | POST /api/ai-questions/{id}/answer |
| TC-M02-F03-03 | 모든 질문 답변 후 | 1. 마지막 질문 답변 | "모든 질문에 답변했습니다" 표시 |

### TC-M02-F04: Skip Question
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M02-F04-01 | 질문 건너뛰기 | 1. "건너뛰기" 클릭 | 목록에서 제거, API 호출 |

### M02 Exception Cases (Critical)
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M02-EX-01 | 답변 제출 실패 | 1. API 500 에러 | 에러 메시지, 재시도 가능 |
| TC-M02-EX-02 | 답변 제출 중 네트워크 끊김 | 1. 제출 중 오프라인 | 에러 메시지, 입력값 유지 |
| TC-M02-EX-03 | 답변 제출 타임아웃 | 1. 10초 지연 응답 | 타임아웃 메시지, 재시도 |
| TC-M02-EX-04 | 이미 답변된 질문 | 1. 다른 곳에서 이미 답변 | "이미 처리된 질문입니다" |
| TC-M02-EX-05 | 질문 목록 로드 실패 | 1. API 에러 | 에러 메시지, 패널 닫기 옵션 |
| TC-M02-EX-06 | WebSocket 연결 끊김 | 1. 실시간 업데이트 불가 | Polling fallback 또는 새로고침 유도 |

### M02 Edge Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M02-ED-01 | 질문 0개 | 1. 대기 질문 없음 | "모든 질문에 답변했습니다" |
| TC-M02-ED-02 | 질문 50개 이상 | 1. 대량 질문 | 스크롤 가능, 성능 유지 |
| TC-M02-ED-03 | 매우 긴 질문 텍스트 | 1. 500자 질문 | 전체 표시 또는 더보기 |
| TC-M02-ED-04 | 선택지 10개 이상 | 1. 다수 옵션 | 스크롤 또는 검색 |
| TC-M02-ED-05 | 빈 답변 제출 시도 | 1. 답변 없이 제출 | 유효성 에러, 제출 막힘 |
| TC-M02-ED-06 | 특수문자 포함 답변 | 1. HTML/JS 코드 입력 | XSS 방지, 이스케이프 처리 |
| TC-M02-ED-07 | 패널 열린 상태에서 새 질문 | 1. 실시간 질문 추가 | 목록 자동 업데이트 |

### M02 Performance Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M02-PF-01 | 패널 열기 속도 | 1. 배너 클릭 | 300ms 내 표시 |
| TC-M02-PF-02 | 답변 제출 응답 | 1. 제출 클릭 | 2초 내 응답 |
| TC-M02-PF-03 | 실시간 업데이트 | 1. WebSocket 메시지 | 100ms 내 UI 반영 |

---

## M03: MissionDetailModal Test Cases

### TC-M03-F01~F03: Mission Info
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M03-F01-01 | 헤더 정보 | 1. 모달 열기 | ID, 제목, 상태 배지 |
| TC-M03-F02-01 | 설명 표시 | 1. 설명 영역 확인 | 미션 설명 텍스트 |
| TC-M03-F03-01 | 진행도 표시 | 1. 진행도 영역 확인 | 진행 바, 통계 4개 |

### TC-M03-F04~F06: Todo List
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M03-F04-01 | Todo 목록 | 1. Todo 섹션 확인 | 미션의 Todo 목록 |
| TC-M03-F05-01 | AI 배지 | 1. 질문 있는 Todo 확인 | 핑크 배지 표시 |
| TC-M03-F06-01 | Todo 클릭 | 1. Todo 항목 클릭 | Todos 페이지로 이동 |

### TC-M03-F07: Start Weaving (CRITICAL)
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M03-F07-01 | Weaving 시작 | 1. "Start Weaving" 클릭 | 상태 THREADING으로 변경 |
| TC-M03-F07-02 | 버튼 텍스트 변경 | 1. 시작 후 확인 | "Pause Weaving" 표시 |
| TC-M03-F07-03 | API 호출 | 1. 네트워크 확인 | PATCH /api/missions/{id}/status |

### TC-M03-F08: Pause Weaving
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M03-F08-01 | Weaving 일시정지 | 1. "Pause Weaving" 클릭 | 상태 PAUSED로 변경 |

### M03 Exception Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M03-EX-01 | Start Weaving 실패 | 1. API 에러 | 에러 메시지, 버튼 원상복구 |
| TC-M03-EX-02 | Pause Weaving 실패 | 1. API 에러 | 에러 메시지, 상태 유지 |
| TC-M03-EX-03 | Todo 목록 로드 실패 | 1. Todo API 에러 | "Todo를 불러올 수 없습니다" |
| TC-M03-EX-04 | 동시에 Start/Pause | 1. 빠른 연속 클릭 | 중복 요청 방지, 마지막만 처리 |
| TC-M03-EX-05 | 이미 완료된 미션 Start | 1. Woven 상태에서 시작 | Start 버튼 숨김 또는 비활성 |

### M03 Edge Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M03-ED-01 | Todo 0개 미션 | 1. Todo 없는 미션 | "Todo가 없습니다" |
| TC-M03-ED-02 | Todo 100개 미션 | 1. 대량 Todo | 스크롤 가능 |
| TC-M03-ED-03 | 설명 없는 미션 | 1. description null | "설명이 없습니다" |
| TC-M03-ED-04 | 모든 Todo 완료 | 1. 100% 진행 | 완료 스타일, Woven 전환 가능 |
| TC-M03-ED-05 | Tangled Todo 존재 | 1. 실패 Todo 있음 | 빨간 표시, 전체 진행률 영향 |

### M03 Performance Cases
| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC-M03-PF-01 | 모달 열기 | 1. 미션 클릭 | 300ms 내 표시 |
| TC-M03-PF-02 | Start Weaving 응답 | 1. 버튼 클릭 | 1초 내 상태 변경 |
| TC-M03-PF-03 | Todo 목록 렌더링 | 1. 50개 Todo 모달 | 부드러운 렌더링 |

---

## Test Execution Summary

### Test Count by Category

| Category | Normal | Exception | Edge | Performance | Total |
|----------|--------|-----------|------|-------------|-------|
| P01 HomePage | 18 | 6 | 7 | 3 | 34 |
| P03 MissionsPage | 16 | 5 | 7 | 4 | 32 |
| P04 TodosPage | 15 | 6 | 7 | 3 | 31 |
| P05 TimelinePage | 8 | 3 | 5 | 3 | 19 |
| M01 SettingsModal | 6 | 0 | 2 | 0 | 8 |
| M02 AIQuestionPanel | 8 | 6 | 7 | 3 | 24 |
| M03 MissionDetailModal | 11 | 5 | 5 | 3 | 24 |
| **Total** | **82** | **31** | **40** | **19** | **172** |

### Priority Distribution

| Priority | Count | Coverage Target |
|----------|-------|-----------------|
| Critical | 5 | 100% |
| High | 45 | 100% |
| Medium | 72 | 80% |
| Low | 50 | 50% |

### Critical Path Tests (Must Pass)

1. TC-M02-F03-01: AI 답변 제출
2. TC-M02-F03-02: AI 답변 API 호출
3. TC-M02-EX-01: AI 답변 실패 처리
4. TC-M03-F07-01: Mission Start Weaving
5. TC-M03-F07-03: Start Weaving API 호출

---

## Test Environment Requirements

### Network Conditions to Test
- Normal (100Mbps+)
- Slow 3G (400Kbps)
- Offline
- Flaky (intermittent)

### API Response Scenarios
- Success (200)
- Created (201)
- Bad Request (400)
- Unauthorized (401)
- Forbidden (403)
- Not Found (404)
- Conflict (409)
- Server Error (500)
- Gateway Timeout (504)

### Data Scenarios
- Empty state (0 items)
- Normal state (10-50 items)
- Large dataset (100+ items)
- Edge values (very long strings, special chars)

---

## Notes

1. **Optimistic UI**: Step 토글, 상태 변경 시 즉시 UI 반영 후 API 결과로 확정/롤백
2. **Rate Limiting**: 연속 클릭 방지, debounce 처리 확인
3. **Concurrent Updates**: 다중 탭/사용자 동시 수정 시나리오
4. **Recovery**: 실패 후 재시도 시 데이터 일관성 유지
