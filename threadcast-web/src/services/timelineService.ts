import { api } from './api';
import type { TimelineEvent, EventType, PageResponse } from '../types';

export interface TimelineParams {
  workspaceId?: string;
  missionId?: string;
  todoId?: string;
  eventTypes?: EventType[];
  page?: number;
  size?: number;
}

export const timelineService = {
  getEvents: (params: TimelineParams) =>
    api.get<PageResponse<TimelineEvent>>('/timeline', params as unknown as Record<string, unknown>),

  getByMission: (missionId: string, params?: { page?: number; size?: number }) =>
    api.get<PageResponse<TimelineEvent>>(`/timeline/mission/${missionId}`, params),

  getByTodo: (todoId: string, params?: { page?: number; size?: number }) =>
    api.get<PageResponse<TimelineEvent>>(`/timeline/todo/${todoId}`, params),
};
