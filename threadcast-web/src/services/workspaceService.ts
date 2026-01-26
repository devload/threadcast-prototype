import { api } from './api';
import type { Workspace } from '../types';

export const workspaceService = {
  getAll: () =>
    api.get<Workspace[]>('/workspaces'),

  getById: (id: string) =>
    api.get<Workspace>(`/workspaces/${id}`),
};
