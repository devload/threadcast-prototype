import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SearchResponse, SearchResultItem, SearchFilters } from '../types/search';
import { searchService } from '../services/searchService';

const EMPTY_RESPONSE: SearchResponse = {
  query: '',
  totalCount: 0,
  missionCount: 0,
  todoCount: 0,
  commentCount: 0,
  projectCount: 0,
  results: [],
};

interface SearchState {
  // State
  query: string;
  response: SearchResponse;
  isSearching: boolean;
  isOpen: boolean;
  selectedIndex: number;
  recentSearches: string[];
  filters: SearchFilters;
  error: string | null;

  // Actions
  setQuery: (query: string) => void;
  search: (workspaceId: string) => Promise<void>;
  setIsSearching: (isSearching: boolean) => void;
  setIsOpen: (isOpen: boolean) => void;
  setSelectedIndex: (index: number) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setFilters: (filters: SearchFilters) => void;
  setError: (error: string | null) => void;
  clearSearch: () => void;

  // Keyboard navigation
  moveSelection: (direction: 'up' | 'down') => void;
  getSelectedResult: () => SearchResultItem | null;

  // Computed
  getResults: () => SearchResultItem[];
  getMissionResults: () => SearchResultItem[];
  getTodoResults: () => SearchResultItem[];
  getProjectResults: () => SearchResultItem[];
  getCommentResults: () => SearchResultItem[];
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      // Initial state
      query: '',
      response: EMPTY_RESPONSE,
      isSearching: false,
      isOpen: false,
      selectedIndex: -1,
      recentSearches: [],
      filters: {},
      error: null,

      // Actions
      setQuery: (query) => set({ query }),

      search: async (workspaceId: string) => {
        const { query, filters } = get();

        if (!query || query.trim().length < 2) {
          set({ response: EMPTY_RESPONSE, error: null });
          return;
        }

        set({ isSearching: true, error: null });

        try {
          const response = await searchService.search(query, workspaceId, {
            type: filters.type,
            missionStatus: filters.missionStatus,
            todoStatus: filters.todoStatus,
          });

          set({
            response,
            isSearching: false,
            selectedIndex: -1,
          });

          // Add to recent searches
          get().addRecentSearch(query);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Search failed',
            isSearching: false,
            response: EMPTY_RESPONSE,
          });
        }
      },

      setIsSearching: (isSearching) => set({ isSearching }),

      setIsOpen: (isOpen) =>
        set({
          isOpen,
          selectedIndex: isOpen ? -1 : get().selectedIndex,
        }),

      setSelectedIndex: (selectedIndex) => set({ selectedIndex }),

      addRecentSearch: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        set((state) => {
          const filtered = state.recentSearches.filter((s) => s !== trimmed);
          return {
            recentSearches: [trimmed, ...filtered].slice(0, 10),
          };
        });
      },

      clearRecentSearches: () => set({ recentSearches: [] }),

      setFilters: (filters) => set({ filters }),

      setError: (error) => set({ error }),

      clearSearch: () =>
        set({
          query: '',
          response: EMPTY_RESPONSE,
          isSearching: false,
          isOpen: false,
          selectedIndex: -1,
          error: null,
        }),

      // Keyboard navigation
      moveSelection: (direction) => {
        const { response, selectedIndex } = get();
        const results = response.results;

        if (results.length === 0) return;

        let newIndex: number;
        if (direction === 'down') {
          newIndex = selectedIndex < results.length - 1 ? selectedIndex + 1 : 0;
        } else {
          newIndex = selectedIndex > 0 ? selectedIndex - 1 : results.length - 1;
        }

        set({ selectedIndex: newIndex });
      },

      getSelectedResult: () => {
        const { response, selectedIndex } = get();
        if (selectedIndex < 0 || selectedIndex >= response.results.length) return null;
        return response.results[selectedIndex];
      },

      // Computed helpers
      getResults: () => get().response.results,

      getMissionResults: () =>
        get().response.results.filter((r) => r.type === 'MISSION'),

      getTodoResults: () =>
        get().response.results.filter((r) => r.type === 'TODO'),

      getProjectResults: () =>
        get().response.results.filter((r) => r.type === 'PROJECT'),

      getCommentResults: () =>
        get().response.results.filter((r) => r.type === 'COMMENT'),
    }),
    {
      name: 'threadcast-search',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
      }),
    }
  )
);
