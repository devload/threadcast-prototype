import { create } from 'zustand';
import type { Mission, MissionStatus, Priority } from '../types';
import { missionService, type CreateMissionRequest, type UpdateMissionRequest } from '../services';
import { DEMO_MODE } from '../services/api';

// Demo missions for prototype
const demoMissions: Mission[] = [
  {
    id: 'mission-42',
    workspaceId: 'ws-1',
    title: '로그인 기능 구현',
    description: 'JWT 기반 인증 시스템 구현. Google OAuth 연동 포함.',
    status: 'THREADING' as MissionStatus,
    priority: 'HIGH' as Priority,
    progress: 45,
    todoStats: { total: 4, pending: 2, threading: 1, woven: 1, tangled: 0 },
    tags: ['auth', 'backend'],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    startedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'mission-43',
    workspaceId: 'ws-1',
    title: '대시보드 리디자인',
    description: '매출 차트, 사용자 통계 등 새로운 UI 컴포넌트 추가',
    status: 'BACKLOG' as MissionStatus,
    priority: 'MEDIUM' as Priority,
    progress: 0,
    todoStats: { total: 0, pending: 0, threading: 0, woven: 0, tangled: 0 },
    tags: ['frontend', 'ui'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'mission-41',
    workspaceId: 'ws-1',
    title: '회원가입 기능 구현',
    description: '이메일 인증, 비밀번호 정책 적용',
    status: 'WOVEN' as MissionStatus,
    priority: 'HIGH' as Priority,
    progress: 100,
    todoStats: { total: 3, pending: 0, threading: 0, woven: 3, tangled: 0 },
    tags: ['auth', 'backend'],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    startedAt: new Date(Date.now() - 216000000).toISOString(),
    completedAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'mission-44',
    workspaceId: 'ws-1',
    title: '데이터 백업 시스템',
    description: '자동 백업 및 복구 기능 구현',
    status: 'ARCHIVED' as MissionStatus,
    priority: 'LOW' as Priority,
    progress: 100,
    todoStats: { total: 2, pending: 0, threading: 0, woven: 2, tangled: 0 },
    tags: ['infra', 'devops'],
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    completedAt: new Date(Date.now() - 345600000).toISOString(),
  },
];

interface MissionState {
  missions: Mission[];
  selectedMission: Mission | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMissions: (workspaceId: string) => Promise<void>;
  fetchMission: (id: string) => Promise<void>;
  createMission: (data: CreateMissionRequest) => Promise<Mission>;
  updateMission: (id: string, data: UpdateMissionRequest) => Promise<void>;
  updateMissionStatus: (id: string, status: MissionStatus) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;
  selectMission: (mission: Mission | null) => void;
  clearError: () => void;

  // Optimistic updates from WebSocket
  onMissionCreated: (mission: Mission) => void;
  onMissionUpdated: (mission: Mission) => void;
  onMissionDeleted: (id: string) => void;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  missions: [],
  selectedMission: null,
  isLoading: false,
  error: null,

  fetchMissions: async (workspaceId) => {
    if (DEMO_MODE) {
      set({ missions: demoMissions, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await missionService.getAll(workspaceId);
      set({ missions: response.content, isLoading: false });
    } catch {
      set({ missions: demoMissions, isLoading: false });
    }
  },

  fetchMission: async (id) => {
    if (DEMO_MODE) {
      const demoMission = demoMissions.find(m => m.id === id);
      set({ selectedMission: demoMission || null, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const mission = await missionService.getById(id);
      set({ selectedMission: mission, isLoading: false });
    } catch (error) {
      set({ selectedMission: null, isLoading: false, error: 'Mission not found' });
      throw error; // Re-throw so caller can handle (e.g., redirect)
    }
  },

  createMission: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const mission = await missionService.create(data);
      set((state) => ({
        missions: [...state.missions, mission],
        isLoading: false,
      }));
      return mission;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create mission',
        isLoading: false,
      });
      throw error;
    }
  },

  updateMission: async (id, data) => {
    set({ error: null });
    try {
      const updated = await missionService.update(id, data);
      set((state) => ({
        missions: state.missions.map((m) => (m.id === id ? updated : m)),
        selectedMission: state.selectedMission?.id === id ? updated : state.selectedMission,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update mission',
      });
      throw error;
    }
  },

  updateMissionStatus: async (id, status) => {
    // Optimistic update (works for both API and demo mode)
    set((state) => ({
      missions: state.missions.map((m) => (m.id === id ? { ...m, status } : m)),
    }));

    try {
      await missionService.updateStatus(id, status);
    } catch {
      // Demo mode: keep the optimistic update (no rollback)
    }
  },

  deleteMission: async (id) => {
    const previousMissions = get().missions;
    // Optimistic update
    set((state) => ({
      missions: state.missions.filter((m) => m.id !== id),
      selectedMission: state.selectedMission?.id === id ? null : state.selectedMission,
    }));

    try {
      await missionService.delete(id);
    } catch (error) {
      // Rollback on error
      set({ missions: previousMissions });
      set({
        error: error instanceof Error ? error.message : 'Failed to delete mission',
      });
      throw error;
    }
  },

  selectMission: (mission) => set({ selectedMission: mission }),

  clearError: () => set({ error: null }),

  // WebSocket handlers
  onMissionCreated: (mission) => {
    set((state) => {
      if (state.missions.some((m) => m.id === mission.id)) return state;
      return { missions: [...state.missions, mission] };
    });
  },

  onMissionUpdated: (mission) => {
    set((state) => ({
      missions: state.missions.map((m) => (m.id === mission.id ? mission : m)),
      selectedMission: state.selectedMission?.id === mission.id ? mission : state.selectedMission,
    }));
  },

  onMissionDeleted: (id) => {
    set((state) => ({
      missions: state.missions.filter((m) => m.id !== id),
      selectedMission: state.selectedMission?.id === id ? null : state.selectedMission,
    }));
  },
}));
