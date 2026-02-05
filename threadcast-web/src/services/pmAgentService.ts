import { api } from './api';

export type PmAgentStatus = 'DISCONNECTED' | 'CONNECTED' | 'WORKING';

export interface PmAgentStatusResponse {
  id?: string;
  workspaceId?: string;
  machineId?: string;
  label?: string;
  status: PmAgentStatus;
  online: boolean;
  lastHeartbeat?: string;
  currentTodoId?: string;
  currentTodoTitle?: string;
  activeTodoCount: number;
  agentVersion?: string;
  connectedAt?: string;
  disconnectedAt?: string;
}

export const pmAgentService = {
  /**
   * Get PM Agent status for workspace
   */
  getStatus: (workspaceId: string) =>
    api.get<PmAgentStatusResponse>('/pm-agent/status', { workspaceId }),
};
