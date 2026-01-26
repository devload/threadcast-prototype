import { create } from 'zustand';
import type { TimelineEvent } from '../types';
import { timelineService, type TimelineParams } from '../services';

interface TimelineState {
  events: TimelineEvent[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;

  // Actions
  fetchEvents: (params: TimelineParams) => Promise<void>;
  fetchMore: (params: TimelineParams) => Promise<void>;
  clearEvents: () => void;
  clearError: () => void;

  // WebSocket handler
  onNewEvent: (event: TimelineEvent) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  events: [],
  isLoading: false,
  hasMore: true,
  error: null,

  fetchEvents: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await timelineService.getEvents({ ...params, page: 0 });
      set({
        events: response.content,
        hasMore: response.number < response.totalPages - 1,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch events',
        isLoading: false,
      });
    }
  },

  fetchMore: async (params) => {
    const { events, hasMore, isLoading } = get();
    if (!hasMore || isLoading) return;

    const currentPage = Math.floor(events.length / (params.size || 20));
    set({ isLoading: true });

    try {
      const response = await timelineService.getEvents({ ...params, page: currentPage });
      set((state) => ({
        events: [...state.events, ...response.content],
        hasMore: response.number < response.totalPages - 1,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch more events',
        isLoading: false,
      });
    }
  },

  clearEvents: () => set({ events: [], hasMore: true }),

  clearError: () => set({ error: null }),

  onNewEvent: (event) => {
    set((state) => {
      if (state.events.some((e) => e.id === event.id)) return state;
      return { events: [event, ...state.events] };
    });
  },
}));
