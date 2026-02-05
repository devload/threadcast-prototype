import { api } from './api';
import type { Mission, MissionStatus, Priority, PageResponse } from '../types';

export interface CreateMissionRequest {
  workspaceId: string;
  title: string;
  description?: string;
  priority?: Priority;
  // JIRA 연동 정보 (선택)
  jiraIssueKey?: string;
  jiraIssueUrl?: string;
}

export interface UpdateMissionRequest {
  title?: string;
  description?: string;
  priority?: Priority;
}

export const missionService = {
  getAll: (workspaceId: string, params?: { status?: MissionStatus; page?: number; size?: number }) =>
    api.get<PageResponse<Mission>>(`/missions`, { workspaceId, ...params }),

  getById: (id: string) =>
    api.get<Mission>(`/missions/${id}`),

  create: (data: CreateMissionRequest) =>
    api.post<Mission>('/missions', data),

  update: (id: string, data: UpdateMissionRequest) =>
    api.put<Mission>(`/missions/${id}`, data),

  updateStatus: (id: string, status: MissionStatus) =>
    api.patch<Mission>(`/missions/${id}/status`, { status }),

  delete: (id: string) =>
    api.delete<void>(`/missions/${id}`),

  start: (id: string) =>
    api.post<Mission>(`/missions/${id}/start`),

  complete: (id: string) =>
    api.post<Mission>(`/missions/${id}/complete`),

  archive: (id: string) =>
    api.post<Mission>(`/missions/${id}/archive`),
};
