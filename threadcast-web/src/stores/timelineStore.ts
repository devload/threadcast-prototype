import { create } from 'zustand';
import type { TimelineEvent, ActorType, EventType } from '../types';
import { timelineService, type TimelineParams } from '../services';
import { DEMO_MODE } from '../services/api';

// Demo timeline events for prototype
const demoEvents: TimelineEvent[] = [
  {
    id: 'event-1',
    workspaceId: 'ws-1',
    missionId: 'mission-42',
    todoId: 'todo-1',
    eventType: 'TODO_COMPLETED' as EventType,
    title: 'Todo 완료',
    description: 'API 엔드포인트 구현이 완료되었습니다. 모든 테스트가 통과했습니다.',
    actorType: 'AI' as ActorType,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'event-2',
    workspaceId: 'ws-1',
    missionId: 'mission-42',
    eventType: 'STEP_COMPLETED' as EventType,
    title: 'Step 완료',
    description: 'Implementation 단계가 완료되었습니다.',
    actorType: 'AI' as ActorType,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'event-3',
    workspaceId: 'ws-1',
    missionId: 'mission-42',
    todoId: 'todo-2',
    eventType: 'AI_QUESTION' as EventType,
    title: 'AI 질문',
    description: '인증 미들웨어에서 세션 만료 시 자동 로그아웃 처리는 어떤 방식으로 구현할까요?',
    actorType: 'AI' as ActorType,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'event-4',
    workspaceId: 'ws-1',
    missionId: 'mission-42',
    eventType: 'MISSION_STARTED' as EventType,
    title: 'Mission 시작',
    description: '로그인 기능 구현 Mission이 시작되었습니다.',
    actorType: 'SYSTEM' as ActorType,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'event-5',
    workspaceId: 'ws-1',
    missionId: 'mission-43',
    eventType: 'MISSION_CREATED' as EventType,
    title: 'Mission 생성',
    description: '대시보드 리디자인 Mission이 생성되었습니다.',
    actorType: 'USER' as ActorType,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'event-6',
    workspaceId: 'ws-1',
    missionId: 'mission-41',
    eventType: 'MISSION_COMPLETED' as EventType,
    title: 'Mission 완료',
    description: '회원가입 기능 구현이 완료되었습니다.',
    actorType: 'AI' as ActorType,
    createdAt: new Date(Date.now() - 86400000 - 3600000).toISOString(),
  },
];

interface TimelineState {
  events: TimelineEvent[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;

  // Actions
  fetchEvents: (params: TimelineParams) => Promise<void>;
  fetchMore: (params: TimelineParams) => Promise<void>;
  clearEvents: () => void;
  clearError: () => void;

  // WebSocket handler
  onNewEvent: (event: TimelineEvent) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  events: [],
  isLoading: false,
  hasMore: true,
  error: null,

  fetchEvents: async (params) => {
    if (DEMO_MODE) {
      set({ events: demoEvents, hasMore: false, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await timelineService.getEvents({ ...params, page: 0 });
      set({
        events: response.content,
        hasMore: response.number < response.totalPages - 1,
        isLoading: false,
      });
    } catch {
      set({ events: demoEvents, hasMore: false, isLoading: false });
    }
  },

  fetchMore: async (params) => {
    if (DEMO_MODE) {
      set({ hasMore: false });
      return;
    }

    const { events, hasMore, isLoading } = get();
    if (!hasMore || isLoading) return;

    const currentPage = Math.floor(events.length / (params.size || 20));
    set({ isLoading: true });

    try {
      const response = await timelineService.getEvents({ ...params, page: currentPage });
      set((state) => ({
        events: [...state.events, ...response.content],
        hasMore: response.number < response.totalPages - 1,
        isLoading: false,
      }));
    } catch {
      set({ hasMore: false, isLoading: false });
    }
  },

  clearEvents: () => set({ events: [], hasMore: true }),

  clearError: () => set({ error: null }),

  onNewEvent: (event) => {
    set((state) => {
      if (state.events.some((e) => e.id === event.id)) return state;
      return { events: [event, ...state.events] };
    });
  },
}));
