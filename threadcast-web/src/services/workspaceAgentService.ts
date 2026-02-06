import { api } from './api';

// Workspace Agent API Types
export interface WorkspaceAgentStatus {
  workspaceId: string;
  status: 'NOT_RUNNING' | 'STARTING' | 'IDLE' | 'ANALYZING' | 'ERROR';
  sessionName?: string;
  projectPath?: string;
  startedAt?: string;
  lastActivityAt?: string;
  currentRequestId?: string;
  errorMessage?: string;
}

export interface SuggestedTodoFromAgent {
  title: string;
  description: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedTime: number;
  relatedFiles?: string[];
  reasoning?: string;
  isUncertain?: boolean;
  uncertainReason?: string;
}

export interface ProjectInsights {
  framework: string;
  stateManagement: string;
  styling: string;
  existingPatterns: string[];
}

export interface UncertainItem {
  todoIndex: number;
  question: string;
  options: string[];
  recommendation?: string;
}

// New Analysis Request API Types
export interface AnalysisRequest {
  id: string;
  workspaceId: string;
  missionId?: string;
  missionTitle?: string;
  missionDescription?: string;
  analysisType: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  resultJson?: string;
  errorMessage?: string;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
}

export interface AnalysisResult {
  suggestedTodos: SuggestedTodoFromAgent[];
  projectInsights?: ProjectInsights;
  uncertainItems?: UncertainItem[];
}

export interface CreateAnalysisRequestParams {
  workspaceId: string;
  missionId?: string;
  missionTitle?: string;
  missionDescription?: string;
  analysisType?: 'MISSION_TODOS' | 'TODO_CONTEXT' | 'PROJECT_SCAN';
}

/**
 * Workspace Agent Service
 * Manages Claude Code agents for project analysis
 *
 * NEW Architecture (HTTP Callback):
 * 1. Frontend creates analysis request via /api/analysis/request
 * 2. Backend queues the request for PM Agent
 * 3. PM Agent spawns Workspace Agent and processes the request
 * 4. Workspace Agent sends results via HTTP callback
 * 5. Backend notifies Frontend via WebSocket (ANALYSIS_COMPLETED event)
 */
export const workspaceAgentService = {
  /**
   * Get the status of a workspace agent
   */
  getStatus: async (workspaceId: string): Promise<WorkspaceAgentStatus> => {
    return api.get<WorkspaceAgentStatus>(`/workspace-agent/status?workspaceId=${workspaceId}`);
  },

  /**
   * Spawn a new workspace agent
   */
  spawn: async (workspaceId: string, projectPath?: string): Promise<WorkspaceAgentStatus> => {
    return api.post<WorkspaceAgentStatus>('/workspace-agent/spawn', {
      workspaceId,
      projectPath,
    });
  },

  /**
   * Stop a workspace agent
   */
  stop: async (workspaceId: string): Promise<void> => {
    await api.post(`/workspace-agent/stop?workspaceId=${workspaceId}`, null);
  },

  /**
   * Create an analysis request (NEW - HTTP Callback Architecture)
   * Results will be delivered via WebSocket ANALYSIS_COMPLETED event
   */
  createAnalysisRequest: async (params: CreateAnalysisRequestParams): Promise<AnalysisRequest> => {
    return api.post<AnalysisRequest>('/analysis/request', {
      workspaceId: params.workspaceId,
      missionId: params.missionId,
      missionTitle: params.missionTitle,
      missionDescription: params.missionDescription,
      analysisType: params.analysisType || 'MISSION_TODOS',
    });
  },

  /**
   * Get an analysis request status
   */
  getAnalysisRequest: async (requestId: string): Promise<AnalysisRequest> => {
    return api.get<AnalysisRequest>(`/analysis/request/${requestId}`);
  },

  /**
   * Get recent analysis requests for a workspace
   */
  getRecentAnalysisRequests: async (workspaceId: string, limit: number = 10): Promise<AnalysisRequest[]> => {
    return api.get<AnalysisRequest[]>(`/analysis/requests?workspaceId=${workspaceId}&limit=${limit}`);
  },

  /**
   * Ensure agent is running, spawn if needed
   */
  ensureAgentRunning: async (workspaceId: string, projectPath?: string): Promise<WorkspaceAgentStatus> => {
    // Check current status
    const status = await workspaceAgentService.getStatus(workspaceId);

    if (status.status === 'IDLE' || status.status === 'ANALYZING') {
      return status;
    }

    // Need to spawn
    if (status.status === 'NOT_RUNNING' || status.status === 'ERROR') {
      return workspaceAgentService.spawn(workspaceId, projectPath);
    }

    // Starting - wait for it
    if (status.status === 'STARTING') {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = async () => {
          attempts++;
          if (attempts > 30) { // 30 seconds max wait for startup
            reject(new Error('Agent startup timeout'));
            return;
          }
          const s = await workspaceAgentService.getStatus(workspaceId);
          if (s.status === 'IDLE' || s.status === 'ANALYZING') {
            resolve(s);
          } else if (s.status === 'ERROR') {
            reject(new Error(s.errorMessage || 'Agent startup failed'));
          } else {
            setTimeout(check, 1000);
          }
        };
        check();
      });
    }

    return status;
  },

  /**
   * Request mission analysis (NEW - HTTP Callback Architecture)
   * This creates an analysis request and returns immediately.
   * Results will be delivered via WebSocket.
   *
   * @returns AnalysisRequest with requestId for tracking
   */
  requestMissionAnalysis: async (
    workspaceId: string,
    missionId: string,
    missionTitle: string,
    missionDescription: string,
    onProgress?: (message: string) => void
  ): Promise<AnalysisRequest> => {
    onProgress?.('분석 요청 생성 중...');

    // Create analysis request - this queues it for PM Agent
    const request = await workspaceAgentService.createAnalysisRequest({
      workspaceId,
      missionId,
      missionTitle,
      missionDescription,
      analysisType: 'MISSION_TODOS',
    });

    onProgress?.('분석 요청이 대기열에 추가되었습니다. PM Agent가 처리를 시작하면 알림이 표시됩니다.');

    return request;
  },

  /**
   * Parse analysis result from AnalysisRequest.resultJson
   */
  parseAnalysisResult: (resultJson: string | undefined): AnalysisResult | null => {
    if (!resultJson) return null;
    try {
      return JSON.parse(resultJson);
    } catch {
      return null;
    }
  },
};
