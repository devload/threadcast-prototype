import { create } from 'zustand';
import {
  sentryService,
  SentryIntegration,
  SentryProject,
  SentryIssue,
  SentryImportResult,
  SentryConnectRequest,
} from '../services/sentryService';

interface SentryState {
  // Connection
  integration: SentryIntegration | null;
  isConnected: boolean;
  isConnecting: boolean;

  // Data
  projects: SentryProject[];
  issues: SentryIssue[];

  // UI State
  isLoading: boolean;
  isSearching: boolean;
  isImporting: boolean;
  error: string | null;
  lastQuery: string | null;

  // Actions - Connection
  fetchStatus: (workspaceId: string) => Promise<void>;
  connect: (request: SentryConnectRequest) => Promise<void>;
  disconnect: (workspaceId: string) => Promise<void>;
  testConnection: (workspaceId: string) => Promise<boolean>;

  // Actions - Data
  fetchProjects: (workspaceId: string) => Promise<void>;
  fetchIssues: (workspaceId: string, query?: string, projectSlug?: string) => Promise<void>;
  getIssue: (workspaceId: string, issueId: string) => Promise<SentryIssue | null>;

  // Actions - Import
  importIssue: (
    workspaceId: string,
    issueId: string,
    missionId?: string
  ) => Promise<SentryImportResult | null>;

  // Utility
  clearError: () => void;
  reset: () => void;
}

export const useSentryStore = create<SentryState>((set) => ({
  // Initial state
  integration: null,
  isConnected: false,
  isConnecting: false,
  projects: [],
  issues: [],
  isLoading: false,
  isSearching: false,
  isImporting: false,
  error: null,
  lastQuery: null,

  // Connection actions
  fetchStatus: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const integration = await sentryService.getStatus(workspaceId);
      set({
        integration,
        isConnected: integration.connected,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch Sentry status';
      set({ error: message, isLoading: false, isConnected: false });
    }
  },

  connect: async (request: SentryConnectRequest) => {
    set({ isConnecting: true, error: null });
    try {
      const integration = await sentryService.connect(request);
      set({
        integration,
        isConnected: true,
        isConnecting: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect to Sentry';
      set({ error: message, isConnecting: false });
      throw error;
    }
  },

  disconnect: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      await sentryService.disconnect(workspaceId);
      set({
        integration: null,
        isConnected: false,
        projects: [],
        issues: [],
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect Sentry';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  testConnection: async (workspaceId: string) => {
    try {
      const result = await sentryService.testConnection(workspaceId);
      set({ isConnected: result.connected });
      return result.connected;
    } catch {
      set({ isConnected: false });
      return false;
    }
  },

  // Data actions
  fetchProjects: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const projects = await sentryService.getProjects(workspaceId);
      set({ projects, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch Sentry projects';
      set({ error: message, isLoading: false });
    }
  },

  fetchIssues: async (workspaceId: string, query?: string, projectSlug?: string) => {
    set({ isSearching: true, error: null, lastQuery: query || null });
    try {
      const issues = await sentryService.getIssues(workspaceId, query, projectSlug);
      set({ issues, isSearching: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch Sentry issues';
      set({ error: message, isSearching: false, issues: [] });
    }
  },

  getIssue: async (workspaceId: string, issueId: string) => {
    try {
      return await sentryService.getIssue(workspaceId, issueId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get Sentry issue';
      set({ error: message });
      return null;
    }
  },

  // Import actions
  importIssue: async (workspaceId: string, issueId: string, missionId?: string) => {
    set({ isImporting: true, error: null });
    try {
      const result = await sentryService.importIssue(workspaceId, issueId, missionId);

      if (!result.success) {
        set({ error: result.errorMessage || 'Import failed', isImporting: false });
        return result;
      }

      // Update issue as imported in local state
      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.id === issueId
            ? { ...issue, imported: true, mappedEntityType: missionId ? 'TODO' : 'MISSION' }
            : issue
        ),
        isImporting: false,
      }));

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import issue';
      set({ error: message, isImporting: false });
      return null;
    }
  },

  // Utility
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      integration: null,
      isConnected: false,
      isConnecting: false,
      projects: [],
      issues: [],
      isLoading: false,
      isSearching: false,
      isImporting: false,
      error: null,
      lastQuery: null,
    }),
}));
