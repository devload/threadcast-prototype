import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useOnboardingStore } from './OnboardingStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useMissionStore } from '../../stores/missionStore';
import { useUIStore } from '../../stores/uiStore';
import { api } from '../../services/api';

interface TourStep extends Step {
  route?: string;
  beforeAction?: () => Promise<void> | void;
  afterAction?: () => Promise<void> | void;
}

// 투어 시나리오 데이터
const TOUR_SCENARIO = {
  workspace: {
    name: '🚀 스타트업 MVP',
    description: '빠르게 시장 검증을 위한 MVP 프로젝트입니다.',
    path: '~/projects/startup-mvp',
  },
  mission: {
    title: '사용자 인증 시스템 구현',
    description: '소셜 로그인(Google, GitHub)과 이메일 인증을 지원하는 안전한 인증 시스템을 구현합니다.',
    priority: 'HIGH' as const,
  },
  todos: [
    { title: 'JWT 토큰 설정 및 미들웨어 구현', complexity: 'MEDIUM', estimatedTime: 30 },
    { title: '로그인 API 엔드포인트 개발', complexity: 'MEDIUM', estimatedTime: 45 },
    { title: '회원가입 폼 UI 구현', complexity: 'LOW', estimatedTime: 30 },
    { title: 'Google OAuth 연동', complexity: 'HIGH', estimatedTime: 60 },
  ],
};

export function InteractiveTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isTourActive,
    tourStepIndex,
    endTour,
    setTourStepIndex,
    completeSetupStep,
    tourContext,
    setTourContext,
  } = useOnboardingStore();
  const { workspaces, createWorkspace, setCurrentWorkspace, fetchWorkspaces } = useWorkspaceStore();
  const { createMission, fetchMissions } = useMissionStore();
  const { currentWorkspaceId, setCurrentWorkspaceId } = useUIStore();

  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(null);
  const [createdMissionId, setCreatedMissionId] = useState<string | null>(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState('준비 중...');
  const [isReady, setIsReady] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasCheckedResume, setHasCheckedResume] = useState(false);

  // 새로고침 감지 - 투어가 진행 중이었는데 step > 0이면 resume dialog 표시
  useEffect(() => {
    if (isTourActive && tourStepIndex > 0 && !hasCheckedResume) {
      setHasCheckedResume(true);
      setShowResumeDialog(true);
    }
  }, [isTourActive, tourStepIndex, hasCheckedResume]);

  const handleRestartTour = () => {
    setShowResumeDialog(false);
    setTourStepIndex(0);
    navigate('/workspaces');
  };

  const handleCancelTour = () => {
    setShowResumeDialog(false);
    endTour();
    navigate('/workspaces');
  };

  // Helper: 요소가 나타날 때까지 대기
  const waitForElement = useCallback((selector: string, timeout = 3000): Promise<Element | null> => {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }, timeout);
    });
  }, []);

  // 1. Workspace 생성 모달 열기
  const openWorkspaceModal = useCallback(async () => {
    setActionMessage('Workspace 생성 화면 열기...');
    if (tourContext.openCreateWorkspaceModal) {
      tourContext.openCreateWorkspaceModal();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }, [tourContext]);

  // 2. Workspace 생성 (데이터 입력 + 저장)
  const createTourWorkspace = useCallback(async () => {
    setActionMessage('Workspace 생성 중...');

    // 모달 닫기
    if (tourContext.closeCreateWorkspaceModal) {
      tourContext.closeCreateWorkspaceModal();
    }

    // 이미 존재하는지 확인
    const existing = workspaces.find(w => w.name === TOUR_SCENARIO.workspace.name);
    if (existing) {
      setCreatedWorkspaceId(existing.id);
      setCurrentWorkspaceId(existing.id);
      setCurrentWorkspace(existing);
      return existing;
    }

    try {
      const workspace = await createWorkspace(
        TOUR_SCENARIO.workspace.name,
        TOUR_SCENARIO.workspace.description,
        TOUR_SCENARIO.workspace.path
      );
      if (workspace) {
        setCreatedWorkspaceId(workspace.id);
        completeSetupStep('workspaceCreated');
        await fetchWorkspaces();
        return workspace;
      }
    } catch (e) {
      console.error('Failed to create workspace:', e);
    }
    return null;
  }, [workspaces, createWorkspace, completeSetupStep, fetchWorkspaces, tourContext, setCurrentWorkspaceId, setCurrentWorkspace]);

  // 3. Workspace 선택 & Missions 페이지로 이동
  const selectWorkspaceAndNavigate = useCallback(async () => {
    setActionMessage('Workspace로 이동 중...');

    await fetchWorkspaces();
    const workspace = workspaces.find(w => w.name === TOUR_SCENARIO.workspace.name) || workspaces[0];

    if (workspace) {
      setCurrentWorkspace(workspace);
      setCurrentWorkspaceId(workspace.id);
      setCreatedWorkspaceId(workspace.id);
      navigate(`/workspaces/${workspace.id}/missions`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }, [workspaces, fetchWorkspaces, setCurrentWorkspace, setCurrentWorkspaceId, navigate]);

  // 4. Mission 생성
  const createTourMission = useCallback(async () => {
    setActionMessage('Mission 생성 중...');

    // 모달 닫기
    if (tourContext.closeCreateMissionModal) {
      tourContext.closeCreateMissionModal();
    }

    const wsId = createdWorkspaceId || currentWorkspaceId;
    if (!wsId) {
      console.error('No workspace ID available for mission creation');
      // workspace가 없으면 첫 번째 workspace 사용 시도
      if (workspaces.length > 0) {
        const ws = workspaces[0];
        setCurrentWorkspaceId(ws.id);
        setCreatedWorkspaceId(ws.id);
      } else {
        return null;
      }
    }

    const finalWsId = createdWorkspaceId || currentWorkspaceId || workspaces[0]?.id;
    if (!finalWsId) return null;

    try {
      const mission = await createMission({
        workspaceId: finalWsId,
        title: TOUR_SCENARIO.mission.title,
        description: TOUR_SCENARIO.mission.description,
        priority: TOUR_SCENARIO.mission.priority,
      });

      if (mission) {
        setCreatedMissionId(mission.id);
        setTourContext({ demoMissionId: mission.id });
        completeSetupStep('firstMissionCreated');
        await fetchMissions(finalWsId);

        // Mission 생성 후 잠시 대기 (UI 업데이트)
        await new Promise(resolve => setTimeout(resolve, 500));
        return mission;
      }
    } catch (e) {
      console.error('Failed to create mission:', e);
    }
    return null;
  }, [createdWorkspaceId, currentWorkspaceId, workspaces, createMission, fetchMissions, completeSetupStep, setTourContext, tourContext, setCurrentWorkspaceId]);

  // 5. Todo 생성
  const createTourTodos = useCallback(async () => {
    setActionMessage('Todo 생성 중...');

    const missionId = createdMissionId || tourContext.demoMissionId;
    if (!missionId) return;

    try {
      let firstTodoId: string | undefined = undefined;
      for (const todo of TOUR_SCENARIO.todos) {
        const createdTodo = await api.post<{ id: string }>('/todos', {
          missionId,
          title: todo.title,
          complexity: todo.complexity,
          estimatedTime: todo.estimatedTime,
        });
        // 첫 번째 Todo ID 저장
        if (!firstTodoId && createdTodo?.id) {
          firstTodoId = createdTodo.id;
          setTourContext({ demoTodoId: firstTodoId });
        }
      }

      // Refresh missions to show todos
      const wsId = createdWorkspaceId || currentWorkspaceId;
      if (wsId) {
        await fetchMissions(wsId);
      }
    } catch (e) {
      console.error('Failed to create todos:', e);
    }
  }, [createdMissionId, createdWorkspaceId, currentWorkspaceId, fetchMissions, tourContext, setTourContext]);

  const tourSteps: TourStep[] = [
    // === 1. 환영 & 시나리오 소개 ===
    {
      target: 'body',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-xl mb-3">🤖 AI와 함께 개발해요!</h3>
          <p className="text-sm text-slate-600 mb-4">
            ThreadCast는 <strong>AI(Claude Code)</strong>가 실제로 코드를 작성하는
            <br />새로운 개발 경험이에요.
          </p>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl text-sm">
            <p className="font-semibold text-indigo-700 mb-2">✨ ThreadCast의 핵심:</p>
            <div className="space-y-2 text-slate-600">
              <div className="flex items-start gap-2">
                <span>🧵</span>
                <span><strong>Weaving</strong> - AI가 코드를 직조하듯 작업</span>
              </div>
              <div className="flex items-start gap-2">
                <span>🎯</span>
                <span><strong>Mission → Todo</strong> - 큰 목표를 작은 단위로</span>
              </div>
              <div className="flex items-start gap-2">
                <span>💬</span>
                <span><strong>AI 질문</strong> - 필요할 때 사람에게 확인</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            → 가상 프로젝트로 직접 체험해볼게요!
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
      route: '/workspaces',
    },

    // === 2. Workspace 개념 설명 ===
    {
      target: 'body',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">🏠 Workspace = AI의 작업 공간</h3>
          <p className="text-sm text-slate-600 mb-3">
            <strong>Workspace</strong>는 AI가 작업할 프로젝트 폴더와 연결돼요.
          </p>
          <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-2">
            <div className="flex items-start gap-2">
              <span>📁</span>
              <span>로컬 프로젝트 폴더 지정</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🤖</span>
              <span>AI가 해당 폴더에서 코드 작성</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🎯</span>
              <span>여러 Mission을 하나의 Workspace에서 관리</span>
            </div>
          </div>
          <p className="text-xs text-indigo-600 mt-3 font-medium">
            👆 이제 Workspace를 만들어볼게요!
          </p>
        </div>
      ),
      placement: 'center',
      route: '/workspaces',
    },

    // === 3. New Workspace 버튼 클릭 유도 ===
    {
      target: '[data-tour="new-workspace-btn"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">➕ Workspace 생성</h3>
          <p className="text-sm text-slate-600 mb-3">
            이 버튼으로 AI가 작업할 공간을 만들어요.
          </p>
          <div className="bg-indigo-50 p-3 rounded-lg text-sm">
            <p className="text-indigo-700">
              <strong>"{TOUR_SCENARIO.workspace.name}"</strong> 프로젝트를 시작해볼게요!
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
            <span className="animate-pulse">👆</span>
            <span>다음 버튼을 누르면 자동으로 모달이 열려요</span>
          </div>
        </div>
      ),
      placement: 'bottom',
      route: '/workspaces',
      afterAction: openWorkspaceModal,
    },

    // === 4. Workspace 모달 설명 ===
    {
      target: '[data-tour="create-workspace-modal"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">📝 Workspace 정보 입력</h3>
          <p className="text-sm text-slate-600 mb-3">
            Workspace 이름과 프로젝트 경로를 입력해요.
          </p>
          <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-2">
            <div><strong>이름:</strong> {TOUR_SCENARIO.workspace.name}</div>
            <div><strong>경로:</strong> {TOUR_SCENARIO.workspace.path}</div>
            <div><strong>설명:</strong> {TOUR_SCENARIO.workspace.description}</div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            → 자동으로 생성합니다
          </p>
        </div>
      ),
      placement: 'right',
      route: '/workspaces',
      afterAction: async () => {
        await createTourWorkspace();
      },
    },

    // === 5. Workspace 목록 확인 ===
    {
      target: 'body',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">✅ Workspace 준비 완료!</h3>
          <p className="text-sm text-slate-600 mb-3">
            <strong>"{TOUR_SCENARIO.workspace.name}"</strong> 공간이 생성되었어요!
          </p>
          <div className="bg-green-50 p-3 rounded-lg text-sm space-y-2">
            <p className="text-green-700 font-medium">
              🤖 이제 AI에게 시킬 작업(Mission)을 등록해볼게요.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
            <span className="animate-bounce">➡️</span>
            <span>다음 버튼을 누르면 Mission 페이지로 이동해요</span>
          </div>
        </div>
      ),
      placement: 'center',
      route: '/workspaces',
      afterAction: selectWorkspaceAndNavigate,
    },

    // === 6. Sidebar 소개 ===
    {
      target: '[data-tour="sidebar"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">🎛️ AI 컨트롤 패널</h3>
          <p className="text-sm text-slate-600 mb-3">
            사이드바에서 AI 작업을 관리하고 모니터링해요.
          </p>
          <ul className="text-sm text-slate-500 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center text-xs">🎯</span>
              <span>Mission - AI에게 시킬 작업 목록</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-100 rounded flex items-center justify-center text-xs">🤖</span>
              <span>Autonomy - AI 자율성 레벨 조절</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 bg-pink-100 rounded flex items-center justify-center text-xs">💬</span>
              <span>AI 질문 - AI가 물어보는 것들</span>
            </li>
          </ul>
        </div>
      ),
      placement: 'right',
      route: '/missions',
    },

    // === 7. Mission 보드 하이라이팅 ===
    {
      target: '[data-tour="mission-list"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">🤖 AI 작업 모니터링 보드</h3>
          <p className="text-sm text-slate-600 mb-3">
            단순한 칸반이 아니에요! <strong>AI가 실제로 작업하는 상태</strong>를 실시간으로 볼 수 있어요.
          </p>
          <div className="flex gap-2 text-xs mb-3">
            <div className="flex flex-col items-center">
              <span className="px-2 py-1 bg-slate-100 rounded font-medium">BACKLOG</span>
              <span className="text-slate-400 mt-1">AI 대기</span>
            </div>
            <span className="text-slate-300 self-center">→</span>
            <div className="flex flex-col items-center">
              <span className="px-2 py-1 bg-amber-100 rounded font-medium animate-pulse">THREADING</span>
              <span className="text-slate-400 mt-1">AI 작업 중</span>
            </div>
            <span className="text-slate-300 self-center">→</span>
            <div className="flex flex-col items-center">
              <span className="px-2 py-1 bg-green-100 rounded font-medium">WOVEN</span>
              <span className="text-slate-400 mt-1">AI 완료</span>
            </div>
          </div>
          <p className="text-xs text-indigo-600 mt-2">
            🧵 "Threading" = AI가 코드를 직조하는 중!
          </p>
        </div>
      ),
      placement: 'center',
      isFixed: true,
      route: '/missions',
    },

    // === 8. New Mission 버튼 하이라이팅 ===
    {
      target: '[data-tour="create-mission-btn"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">🎯 AI에게 Mission 주기</h3>
          <p className="text-sm text-slate-600 mb-3">
            Mission은 <strong>AI에게 시킬 작업의 목표</strong>예요.
          </p>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-purple-700">예시 Mission:</p>
            <p className="text-purple-600 mt-1 font-semibold">"{TOUR_SCENARIO.mission.title}"</p>
            <p className="text-xs text-slate-500 mt-2">
              → AI가 이 목표를 달성하기 위해 코드를 작성해요
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
            <span className="animate-pulse">👆</span>
            <span>다음 버튼을 누르면 생성 화면이 열려요</span>
          </div>
        </div>
      ),
      placement: 'bottom',
      route: '/missions',
      afterAction: async () => {
        // Mission 생성 모달 열기
        if (tourContext.openCreateMissionModal) {
          tourContext.openCreateMissionModal();
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      },
    },

    // === 9. Mission 생성 모달 설명 ===
    {
      target: '[data-tour="create-mission-modal"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">✨ AI가 Mission도 만들어줘요!</h3>
          <p className="text-sm text-slate-600 mb-3">
            Mission을 만드는 <strong>두 가지 방법</strong>이 있어요.
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <div className="flex items-center gap-2 font-medium text-slate-700 mb-1">
                <span>✏️</span>
                <span>직접 입력</span>
              </div>
              <p className="text-xs text-slate-500 ml-6">제목과 설명을 직접 작성</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg text-sm border border-purple-200">
              <div className="flex items-center gap-2 font-medium text-purple-700 mb-1">
                <span className="animate-pulse">🤖</span>
                <span>AI로 생성 (추천!)</span>
              </div>
              <p className="text-xs text-purple-600 ml-6">
                "다크모드 추가해줘" 같이 말하면<br/>
                → AI가 Mission + Todo까지 자동 생성!
              </p>
            </div>
          </div>
          <div className="mt-3 bg-amber-50 p-2 rounded-lg text-xs text-amber-700">
            💡 <strong>AI로 생성</strong>하면 Todo 분해까지 한 번에!
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 bg-slate-100 p-2 rounded-lg">
            <span className="animate-pulse">➡️</span>
            <span>투어에서는 자동으로 Mission을 생성해요</span>
          </div>
        </div>
      ),
      placement: 'right',
      route: '/missions',
      afterAction: async () => {
        await createTourMission();
      },
    },

    // === 10. Mission 생성 완료 & 클릭 유도 ===
    {
      target: '[data-tour="mission-list"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">✅ Mission 등록 완료!</h3>
          <p className="text-sm text-slate-600 mb-3">
            AI에게 줄 작업이 <strong>BACKLOG</strong>에 추가되었어요!
          </p>
          <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-2">
            <p className="text-slate-700">
              🤔 Mission이 너무 크면 AI가 헤맬 수 있어요.
            </p>
            <p className="text-indigo-600 font-medium">
              → <strong>Todo</strong>로 쪼개서 AI가 집중하게!
            </p>
          </div>
          <div className="mt-2 p-2 bg-purple-50 rounded-lg text-xs text-purple-600 border border-purple-200">
            💡 <strong>Tip:</strong> "AI로 생성"하면 Todo까지 한 번에 생성돼요!
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
            <span className="animate-bounce">👆</span>
            <span>다음 버튼을 누르면 Mission 상세 화면이 열려요</span>
          </div>
        </div>
      ),
      placement: 'center',
      isFixed: true,
      route: '/missions',
      afterAction: async () => {
        // Mission Detail 모달 열기
        const missionId = createdMissionId || tourContext.demoMissionId;
        if (missionId && tourContext.openMissionDetail) {
          tourContext.openMissionDetail(missionId);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      },
    },

    // === 11. Todo 분해 설명 ===
    {
      target: 'body',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">🧩 Todo = AI의 실행 단위</h3>
          <p className="text-sm text-slate-600 mb-3">
            <strong>Todo 하나 = AI가 한 번에 집중할 작업</strong>
          </p>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg text-sm mb-3 border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700 font-medium mb-1">
              <span>🤖</span>
              <span>AI가 Todo도 자동 생성!</span>
            </div>
            <p className="text-xs text-purple-600">
              Mission 상세에서 "AI 분석" 버튼을 누르면<br/>
              AI가 적절한 Todo들을 자동으로 만들어줘요
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-slate-700 mb-2">예시 Todo들:</p>
            <ul className="space-y-1 text-slate-600">
              {TOUR_SCENARIO.todos.map((todo, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-100 rounded text-xs flex items-center justify-center text-indigo-600">{i + 1}</span>
                  <span className="text-xs">{todo.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
            <span className="animate-pulse">✨</span>
            <span>다음 버튼을 누르면 {TOUR_SCENARIO.todos.length}개의 Todo가 자동 생성돼요</span>
          </div>
        </div>
      ),
      placement: 'center',
      route: '/missions',
      afterAction: async () => {
        await createTourTodos();
        // Todo 생성 후 Mission Detail 새로고침
        const missionId = createdMissionId || tourContext.demoMissionId;
        if (missionId && tourContext.openMissionDetail) {
          // 모달 닫았다 다시 열어서 Todo 표시
          if (tourContext.closeMissionDetail) {
            tourContext.closeMissionDetail();
          }
          await new Promise(resolve => setTimeout(resolve, 300));
          tourContext.openMissionDetail(missionId);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      },
    },

    // === 12. Todo 카드 리스트 뷰 설명 ===
    {
      target: '[data-tour="todo-list-view"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">📋 AI 작업 현황 (리스트 뷰)</h3>
          <p className="text-sm text-slate-600 mb-3">
            각 Todo의 <strong>AI 작업 상태</strong>를 한눈에 볼 수 있어요.
          </p>
          <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>노란색 = AI가 작업 중</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span>초록색 = AI 작업 완료</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">HIGH</span>
              <span>복잡도 = AI 예상 난이도</span>
            </div>
          </div>
        </div>
      ),
      placement: 'left',
      route: '/missions',
      beforeAction: async () => {
        // 리스트 뷰로 전환
        if (tourContext.switchToListView) {
          tourContext.switchToListView();
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      },
    },

    // === 13. 뷰 전환 토글 설명 ===
    {
      target: '[data-tour="todo-view-toggle"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">👀 두 가지 모니터링 뷰</h3>
          <p className="text-sm text-slate-600 mb-3">
            AI 작업을 두 가지 방식으로 볼 수 있어요.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded">
              <span>📋</span>
              <span><strong>List</strong> - 작업 목록으로 보기</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
              <span>🔀</span>
              <span><strong>Graph</strong> - 의존성 관계로 보기</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
            <span className="animate-bounce">➡️</span>
            <span>그래프 뷰로 전환해볼게요!</span>
          </div>
        </div>
      ),
      placement: 'bottom',
      route: '/missions',
      afterAction: async () => {
        // 그래프 뷰로 전환
        if (tourContext.switchToGraphView) {
          tourContext.switchToGraphView();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      },
    },

    // === 14. Todo 그래프 뷰 설명 ===
    {
      target: '[data-tour="todo-graph-view"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">🔀 AI 실행 순서 그래프</h3>
          <p className="text-sm text-slate-600 mb-3">
            AI가 <strong>어떤 순서로 작업할지</strong> 시각적으로 보여줘요.
          </p>
          <div className="bg-purple-50 p-3 rounded-lg text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>노드 = AI가 실행할 Todo</span>
            </div>
            <div className="flex items-center gap-2">
              <span>➡️</span>
              <span>화살표 = "이거 먼저 해야 함"</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
              <span>노란색 = AI 작업 중</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            💡 의존성을 설정하면 AI가 순서대로 실행해요
          </p>
        </div>
      ),
      placement: 'left',
      route: '/missions',
      afterAction: async () => {
        // Mission Detail 모달 닫고 Todo Detail Drawer 열기
        if (tourContext.closeMissionDetail) {
          tourContext.closeMissionDetail();
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        // 첫 번째 Todo의 상세 Drawer 열기
        if (tourContext.openTodoDetail && tourContext.demoTodoId) {
          tourContext.openTodoDetail(tourContext.demoTodoId);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      },
    },

    // === 15. Todo 상세 Drawer ===
    {
      target: '[data-tour="todo-detail-drawer"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">🔍 AI 작업 상세 모니터링</h3>
          <p className="text-sm text-slate-600 mb-3">
            각 Todo의 <strong>AI 작업 진행 상황</strong>을 상세히 볼 수 있어요.
          </p>
          <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span>🤖</span>
              <span>AI 작업 상태 (대기/진행/완료)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span>6단계 진행 과정 추적</span>
            </div>
            <div className="flex items-center gap-2">
              <span>▶️</span>
              <span>여기서 AI 작업 시작!</span>
            </div>
          </div>
        </div>
      ),
      placement: 'left',
      route: '/missions',
    },

    // === 16. Todo Step Progress ===
    {
      target: '[data-tour="todo-step-progress"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">🤖 AI의 6단계 작업 과정</h3>
          <p className="text-sm text-slate-600 mb-3">
            AI(Claude Code)가 <strong>체계적으로 코드를 작성</strong>해요:
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 p-1.5 bg-blue-50 rounded">
              <span className="w-4 h-4 rounded-full bg-blue-200 text-[8px] flex items-center justify-center">1</span>
              <span>🔍 Analysis - 요구사항 분석</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-purple-50 rounded">
              <span className="w-4 h-4 rounded-full bg-purple-200 text-[8px] flex items-center justify-center">2</span>
              <span>📐 Design - 설계 및 구조 결정</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-amber-50 rounded">
              <span className="w-4 h-4 rounded-full bg-amber-200 text-[8px] flex items-center justify-center">3</span>
              <span>💻 Implementation - 코드 작성</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-green-50 rounded">
              <span className="w-4 h-4 rounded-full bg-green-200 text-[8px] flex items-center justify-center">4</span>
              <span>✅ Verification - 테스트 실행</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-pink-50 rounded">
              <span className="w-4 h-4 rounded-full bg-pink-200 text-[8px] flex items-center justify-center">5</span>
              <span>👀 Review - 코드 검토</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-indigo-50 rounded">
              <span className="w-4 h-4 rounded-full bg-indigo-200 text-[8px] flex items-center justify-center">6</span>
              <span>🔗 Integration - 통합 완료</span>
            </div>
          </div>
        </div>
      ),
      placement: 'left',
      route: '/missions',
    },

    // === 17. Todo Start Weaving 버튼 ===
    {
      target: '[data-tour="todo-start-weaving"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">🚀 AI 작업 시작!</h3>
          <p className="text-sm text-slate-600 mb-3">
            <strong>"Start Weaving"</strong> = AI(Claude Code)에게 작업 지시!
          </p>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="animate-pulse">🤖</span>
              <span>Claude Code가 터미널에서 실행</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📝</span>
              <span>AI가 실제로 코드 파일 생성/수정</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span>진행 상황 실시간 업데이트</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700">
            🧵 <strong>Weaving</strong> = AI가 코드를 직조한다는 의미예요
          </div>
        </div>
      ),
      placement: 'top',
      route: '/missions',
      afterAction: async () => {
        // Todo Detail Drawer 닫기
        if (tourContext.closeTodoDetail) {
          tourContext.closeTodoDetail();
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      },
    },

    // === 18. AI 질문 패널 ===
    {
      target: '[data-tour="ai-questions"]',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">💬 AI ↔ 사람 소통</h3>
          <p className="text-sm text-slate-600 mb-3">
            AI가 작업 중 <strong>사람의 판단이 필요하면</strong> 여기서 물어봐요.
          </p>
          <div className="bg-pink-50 p-3 rounded-lg text-sm space-y-2">
            <div className="p-2 bg-white rounded border-l-2 border-pink-400">
              <p className="text-xs text-slate-500">🤖 AI 질문:</p>
              <p className="text-slate-700">"JWT 만료 시간을 1시간 / 24시간 중 어떤 걸로 할까요?"</p>
            </div>
          </div>
          <div className="mt-3 text-sm space-y-1">
            <p className="text-green-600">✅ 답변하면 → AI가 계속 작업</p>
            <p className="text-amber-600">⏭️ 스킵하면 → AI가 알아서 결정</p>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            💡 Autonomy 레벨이 높으면 AI가 스스로 결정해요
          </p>
        </div>
      ),
      placement: 'right',
      route: '/missions',
    },

    // === 19. 완료! ===
    {
      target: 'body',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-xl mb-3">🎉 이제 AI와 함께 개발할 준비 완료!</h3>
          <p className="text-sm text-slate-600 mb-4">
            ThreadCast로 AI가 실제 코드를 작성하는 경험을 시작해보세요.
          </p>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-xl text-sm">
            <p className="font-bold mb-2">🤖 이제 할 수 있는 것:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span>✅</span> AI에게 작업 지시하기 (Mission)
              </div>
              <div className="flex items-center gap-2">
                <span>✅</span> 작은 단위로 나누기 (Todo)
              </div>
              <div className="flex items-center gap-2">
                <span>✅</span> AI 작업 실시간 모니터링
              </div>
              <div className="flex items-center gap-2">
                <span>✅</span> AI와 소통하기 (질문/답변)
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-amber-50 rounded-lg text-sm">
            <p className="text-amber-700 font-medium">🚀 다음 단계:</p>
            <p className="text-amber-600 text-xs mt-1">
              실제 프로젝트 Workspace를 만들고,<br />
              Mission에서 <strong>"Start Weaving"</strong> 버튼을 눌러보세요!
            </p>
          </div>
        </div>
      ),
      placement: 'center',
      route: '/missions',
    },
  ];

  // Navigation and readiness effect
  useEffect(() => {
    if (!isTourActive) {
      setIsReady(false);
      return;
    }
    if (isPerformingAction || showResumeDialog) return;

    const currentStep = tourSteps[tourStepIndex];
    if (!currentStep) {
      console.warn('Tour step not found:', tourStepIndex);
      endTour();
      return;
    }

    const targetRoute = currentStep.route || '/workspaces';

    // Check if we're on the correct route (handle dynamic workspace routes)
    const isOnCorrectRoute = () => {
      // For /workspaces route, exact match
      if (targetRoute === '/workspaces') {
        return location.pathname === '/workspaces' || location.pathname === '/';
      }
      // For /missions route, check if pathname includes /missions
      if (targetRoute === '/missions') {
        return location.pathname.includes('/missions');
      }
      // For /timeline route, check if pathname includes /timeline
      if (targetRoute === '/timeline') {
        return location.pathname.includes('/timeline');
      }
      // Default: exact match
      return location.pathname === targetRoute;
    };

    // Navigate if on wrong route
    if (!isOnCorrectRoute()) {
      setIsReady(false);
      // For workspace-scoped routes, navigate to the correct workspace path
      if (targetRoute === '/missions' && currentWorkspaceId) {
        navigate(`/workspaces/${currentWorkspaceId}/missions`);
      } else if (targetRoute === '/timeline' && currentWorkspaceId) {
        navigate(`/workspaces/${currentWorkspaceId}/timeline`);
      } else {
        navigate(targetRoute === '/' ? '/workspaces' : targetRoute);
      }
      return;
    }

    // On correct route - wait for target element and mark ready
    let isCancelled = false;
    const prepareStep = async () => {
      try {
        const target = currentStep.target;
        if (target && target !== 'body') {
          const element = await waitForElement(target as string, 3000);
          if (!element) {
            console.warn(`Tour target not found: ${target}, proceeding anyway`);
          }
        }
        // Small delay to ensure DOM is stable
        await new Promise(resolve => setTimeout(resolve, 150));
        if (!isCancelled) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('Tour prepareStep error:', error);
        if (!isCancelled) {
          setIsReady(true); // Proceed anyway on error
        }
      }
    };

    // Safety timeout - force ready after 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (!isCancelled && !isReady) {
        console.warn('Tour safety timeout triggered, forcing ready');
        setIsReady(true);
      }
    }, 5000);

    prepareStep();

    return () => {
      isCancelled = true;
      clearTimeout(safetyTimeout);
    };
  }, [isTourActive, tourStepIndex, location.pathname, navigate, isPerformingAction, showResumeDialog, waitForElement, endTour, isReady]);

  const handleCallback = async (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      endTour();
      return;
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const isNext = action !== ACTIONS.PREV;
      const nextIndex = index + (isNext ? 1 : -1);
      const currentStep = tourSteps[index];
      const nextStep = tourSteps[nextIndex];

      // afterAction
      if (isNext && currentStep?.afterAction) {
        setIsPerformingAction(true);
        setActionMessage('다음 단계 준비 중...');
        try {
          await currentStep.afterAction();
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (e) {
          console.error('Tour afterAction failed:', e);
        }
      }

      // beforeAction
      if (isNext && nextStep?.beforeAction) {
        setIsPerformingAction(true);
        try {
          await nextStep.beforeAction();
        } catch (e) {
          console.error('Tour beforeAction failed:', e);
        }
      }

      setIsPerformingAction(false);

      // Mark not ready before changing step - the effect will handle navigation and readiness
      setIsReady(false);
      setTourStepIndex(nextIndex);
    }
  };

  if (!isTourActive) return null;

  // 새로고침 후 resume dialog 표시
  if (showResumeDialog) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[10001] flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm">
          <h3 className="font-bold text-lg mb-3">🔄 투어가 중단되었어요</h3>
          <p className="text-sm text-slate-600 mb-4">
            페이지가 새로고침되어 투어가 중단되었습니다. 처음부터 다시 시작하시겠어요?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancelTour}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              투어 종료
            </button>
            <button
              onClick={handleRestartTour}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              처음부터 시작
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {(isPerformingAction || !isReady) && (
        <div className="fixed inset-0 bg-black/50 z-[10001] flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
              <span className="text-slate-700">{isPerformingAction ? actionMessage : '투어 준비 중...'}</span>
            </div>
            <button
              onClick={handleCancelTour}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              투어 취소
            </button>
          </div>
        </div>
      )}
      <Joyride
        run={isReady && !isPerformingAction}
        steps={tourSteps}
        stepIndex={tourStepIndex}
        callback={handleCallback}
        continuous
        showProgress
        showSkipButton
        disableOverlayClose
        spotlightClicks={false}
        disableScrolling={false}
        styles={{
          options: {
            arrowColor: '#fff',
            backgroundColor: '#fff',
            overlayColor: 'rgba(0, 0, 0, 0.75)',
            primaryColor: '#6366f1',
            textColor: '#1e293b',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 16,
            padding: 24,
            maxWidth: 420,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          buttonNext: {
            backgroundColor: '#6366f1',
            borderRadius: 10,
            padding: '10px 20px',
            fontWeight: 600,
          },
          buttonBack: {
            color: '#6366f1',
            marginRight: 10,
          },
          buttonSkip: {
            color: '#94a3b8',
          },
          spotlight: {
            borderRadius: 12,
          },
        }}
        locale={{
          back: '이전',
          close: '닫기',
          last: '완료!',
          next: '다음',
          skip: '건너뛰기',
        }}
      />
    </>
  );
}
