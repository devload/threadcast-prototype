import { create } from 'zustand';
import type { Mission, MissionStatus } from '../types';
import { missionService, type CreateMissionRequest, type UpdateMissionRequest } from '../services';

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
    set({ isLoading: true, error: null });
    try {
      const response = await missionService.getAll(workspaceId);
      set({ missions: response.content, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch missions',
        isLoading: false,
      });
    }
  },

  fetchMission: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const mission = await missionService.getById(id);
      set({ selectedMission: mission, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch mission',
        isLoading: false,
      });
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
    const previousMissions = get().missions;
    // Optimistic update
    set((state) => ({
      missions: state.missions.map((m) => (m.id === id ? { ...m, status } : m)),
    }));

    try {
      await missionService.updateStatus(id, status);
    } catch (error) {
      // Rollback on error
      set({ missions: previousMissions });
      set({
        error: error instanceof Error ? error.message : 'Failed to update status',
      });
      throw error;
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
