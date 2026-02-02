import { api } from './api';
import type { Todo, TodoStatus, Priority, Complexity, StepType, StepStatus } from '../types';

export interface CreateTodoRequest {
  missionId: string;
  title: string;
  description?: string;
  priority?: Priority;
  complexity?: Complexity;
  estimatedTime?: number;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  priority?: Priority;
  complexity?: Complexity;
  estimatedTime?: number;
}

export const todoService = {
  getByMission: (missionId: string, params?: { status?: TodoStatus; page?: number; size?: number }) =>
    api.get<Todo[]>(`/todos`, { missionId, ...params }),

  getById: (id: string) =>
    api.get<Todo>(`/todos/${id}`),

  create: (data: CreateTodoRequest) =>
    api.post<Todo>('/todos', data),

  update: (id: string, data: UpdateTodoRequest) =>
    api.put<Todo>(`/todos/${id}`, data),

  updateStatus: (id: string, status: TodoStatus) =>
    api.patch<Todo>(`/todos/${id}/status`, { status }),

  delete: (id: string) =>
    api.delete<void>(`/todos/${id}`),

  start: (id: string) =>
    api.post<Todo>(`/todos/${id}/start`),

  complete: (id: string) =>
    api.post<Todo>(`/todos/${id}/complete`),

  fail: (id: string, reason?: string) =>
    api.post<Todo>(`/todos/${id}/fail`, { reason }),

  updateStepStatus: (todoId: string, stepType: StepType, status: StepStatus, notes?: string) =>
    api.patch<Todo>(`/todos/${todoId}/steps/${stepType}`, { status, notes }),

  reorder: (missionId: string, todoIds: string[]) =>
    api.post<void>(`/todos/reorder`, { missionId, todoIds }),

  // Dependency management
  updateDependencies: (id: string, dependencies: string[]) =>
    api.patch<Todo>(`/todos/${id}/dependencies`, { dependencies }),

  getReady: (missionId: string) =>
    api.get<Todo[]>(`/todos/ready`, { missionId }),

  getDependents: (id: string) =>
    api.get<Todo[]>(`/todos/${id}/dependents`),

  // Terminal session management
  startTerminal: (id: string, launchClaude: boolean = true) =>
    api.post<string>(`/todos/${id}/terminal/start?launchClaude=${launchClaude}`, null),

  stopTerminal: (id: string) =>
    api.delete<void>(`/todos/${id}/terminal/stop`),

  sendKeys: (id: string, keys: string, enter: boolean = true) =>
    api.post<void>(`/todos/${id}/terminal/sendkeys`, { keys, enter }),
};
