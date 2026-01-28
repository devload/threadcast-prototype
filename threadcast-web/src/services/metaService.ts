import { api } from './api';

export interface MetaData {
  [key: string]: unknown;
}

export interface UpdateMetaRequest {
  meta: MetaData;
  replace?: boolean;
}

export const metaService = {
  // Workspace Meta
  getWorkspaceMeta: (workspaceId: string) =>
    api.get<MetaData>(`/workspaces/${workspaceId}/meta`),

  updateWorkspaceMeta: (workspaceId: string, data: UpdateMetaRequest) =>
    api.patch<MetaData>(`/workspaces/${workspaceId}/meta`, data),

  // Mission Meta
  getMissionMeta: (missionId: string) =>
    api.get<MetaData>(`/missions/${missionId}/meta`),

  getMissionEffectiveMeta: (missionId: string) =>
    api.get<MetaData>(`/missions/${missionId}/effective-meta`),

  updateMissionMeta: (missionId: string, data: UpdateMetaRequest) =>
    api.patch<MetaData>(`/missions/${missionId}/meta`, data),

  // Todo Meta
  getTodoMeta: (todoId: string) =>
    api.get<MetaData>(`/todos/${todoId}/meta`),

  getTodoEffectiveMeta: (todoId: string) =>
    api.get<MetaData>(`/todos/${todoId}/effective-meta`),

  updateTodoMeta: (todoId: string, data: UpdateMetaRequest) =>
    api.patch<MetaData>(`/todos/${todoId}/meta`, data),
};
