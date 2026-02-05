import { api } from './api';
import type { Workspace } from '../types';

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  path: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  path?: string;
}

export const workspaceService = {
  getAll: () =>
    api.get<Workspace[]>('/workspaces'),

  getById: (id: string) =>
    api.get<Workspace>(`/workspaces/${id}`),

  create: (data: CreateWorkspaceRequest) =>
    api.post<Workspace>('/workspaces', data),

  update: (id: string, data: UpdateWorkspaceRequest) =>
    api.put<Workspace>(`/workspaces/${id}`, data),

  delete: (id: string) =>
    api.delete<{ deleted: boolean }>(`/workspaces/${id}`),
};
