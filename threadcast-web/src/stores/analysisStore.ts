import { create } from 'zustand';
import type { AIAnalysisResult } from '../types';
import type { AnalysisRequest, AnalysisResult } from '../services/workspaceAgentService';

interface AnalysisState {
  // Pending analysis requests by requestId
  pendingRequests: Map<string, AnalysisRequest>;

  // Completed analysis results by missionId
  completedResults: Map<string, AIAnalysisResult>;

  // Currently active analysis for a mission
  activeAnalysisByMission: Map<string, string>; // missionId -> requestId

  // Actions
  addPendingRequest: (request: AnalysisRequest, missionId?: string) => void;
  updateRequestStatus: (requestId: string, status: AnalysisRequest['status']) => void;
  setAnalysisResult: (requestId: string, result: AIAnalysisResult) => void;
  clearPendingRequest: (requestId: string) => void;
  getActiveAnalysisForMission: (missionId: string) => AnalysisRequest | null;
  getResultForMission: (missionId: string) => AIAnalysisResult | null;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  pendingRequests: new Map(),
  completedResults: new Map(),
  activeAnalysisByMission: new Map(),

  addPendingRequest: (request, missionId) => {
    set((state) => {
      const newPendingRequests = new Map(state.pendingRequests);
      newPendingRequests.set(request.id, request);

      const newActiveByMission = new Map(state.activeAnalysisByMission);
      if (missionId) {
        newActiveByMission.set(missionId, request.id);
      } else if (request.missionId) {
        newActiveByMission.set(request.missionId, request.id);
      }

      return {
        pendingRequests: newPendingRequests,
        activeAnalysisByMission: newActiveByMission,
      };
    });
  },

  updateRequestStatus: (requestId, status) => {
    set((state) => {
      const request = state.pendingRequests.get(requestId);
      if (!request) return state;

      const newPendingRequests = new Map(state.pendingRequests);
      newPendingRequests.set(requestId, { ...request, status });

      return { pendingRequests: newPendingRequests };
    });
  },

  setAnalysisResult: (requestId, result) => {
    set((state) => {
      const request = state.pendingRequests.get(requestId);
      const missionId = request?.missionId || result.missionId;

      const newCompletedResults = new Map(state.completedResults);
      newCompletedResults.set(missionId, result);

      // Clear from pending
      const newPendingRequests = new Map(state.pendingRequests);
      newPendingRequests.delete(requestId);

      // Clear from active
      const newActiveByMission = new Map(state.activeAnalysisByMission);
      newActiveByMission.delete(missionId);

      return {
        pendingRequests: newPendingRequests,
        completedResults: newCompletedResults,
        activeAnalysisByMission: newActiveByMission,
      };
    });
  },

  clearPendingRequest: (requestId) => {
    set((state) => {
      const request = state.pendingRequests.get(requestId);
      const newPendingRequests = new Map(state.pendingRequests);
      newPendingRequests.delete(requestId);

      const newActiveByMission = new Map(state.activeAnalysisByMission);
      if (request?.missionId) {
        newActiveByMission.delete(request.missionId);
      }

      return {
        pendingRequests: newPendingRequests,
        activeAnalysisByMission: newActiveByMission,
      };
    });
  },

  getActiveAnalysisForMission: (missionId) => {
    const requestId = get().activeAnalysisByMission.get(missionId);
    if (!requestId) return null;
    return get().pendingRequests.get(requestId) || null;
  },

  getResultForMission: (missionId) => {
    return get().completedResults.get(missionId) || null;
  },
}));

/**
 * Handle ANALYSIS_COMPLETED WebSocket event
 */
export function handleAnalysisCompletedEvent(event: {
  requestId: string;
  status: string;
  analysis?: AnalysisResult;
}) {
  const store = useAnalysisStore.getState();
  const request = store.pendingRequests.get(event.requestId);

  if (!request) {
    console.warn('Received ANALYSIS_COMPLETED for unknown request:', event.requestId);
    return;
  }

  if (event.status === 'COMPLETED' && event.analysis) {
    // Import aiAnalysisService dynamically to avoid circular dependency
    import('../services/aiAnalysisService').then(({ aiAnalysisService }) => {
      const resultJson = JSON.stringify(event.analysis);
      const result = aiAnalysisService.parseAnalysisResult(
        resultJson,
        request.missionId || ''
      );

      if (result) {
        store.setAnalysisResult(event.requestId, {
          ...result,
          status: 'COMPLETED',
        });
      }
    });
  } else if (event.status === 'FAILED') {
    store.updateRequestStatus(event.requestId, 'FAILED');
  }
}

/**
 * Handle ANALYSIS_STATUS_CHANGED WebSocket event
 */
export function handleAnalysisStatusChangedEvent(event: {
  requestId: string;
  status: string;
}) {
  const store = useAnalysisStore.getState();
  store.updateRequestStatus(
    event.requestId,
    event.status as AnalysisRequest['status']
  );
}
