import { create } from 'zustand';
import { pmAgentService, type PmAgentStatusResponse, type PmAgentStatus } from '../services/pmAgentService';

interface PmAgentState {
  // Status
  status: PmAgentStatus;
  online: boolean;
  agentInfo: PmAgentStatusResponse | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStatus: (workspaceId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;

  // WebSocket update handler
  handleStatusUpdate: (status: PmAgentStatusResponse) => void;
}

export const usePmAgentStore = create<PmAgentState>((set) => ({
  // Initial state
  status: 'DISCONNECTED',
  online: false,
  agentInfo: null,
  isLoading: false,
  error: null,

  // Fetch PM Agent status
  fetchStatus: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await pmAgentService.getStatus(workspaceId);
      set({
        status: response.status,
        online: response.online,
        agentInfo: response,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch PM Agent status',
        isLoading: false,
        status: 'DISCONNECTED',
        online: false,
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      status: 'DISCONNECTED',
      online: false,
      agentInfo: null,
      isLoading: false,
      error: null,
    }),

  // Handle WebSocket status updates
  handleStatusUpdate: (status: PmAgentStatusResponse) => {
    set({
      status: status.status,
      online: status.online,
      agentInfo: status,
    });
  },
}));
