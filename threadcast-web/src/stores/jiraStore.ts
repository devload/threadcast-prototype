import { create } from 'zustand';
import {
  jiraService,
  JiraIntegration,
  JiraProject,
  JiraIssue,
  JiraIssueMapping,
  JiraImportResult,
  JiraConnectRequest,
} from '../services/jiraService';

interface JiraState {
  // Connection
  integration: JiraIntegration | null;
  isConnected: boolean;
  isConnecting: boolean;

  // Data
  projects: JiraProject[];
  issues: JiraIssue[];
  mappings: JiraIssueMapping[];

  // UI State
  isLoading: boolean;
  isSearching: boolean;
  isImporting: boolean;
  error: string | null;
  lastSearchJql: string | null;

  // Actions - Connection
  fetchStatus: (workspaceId: string) => Promise<void>;
  connect: (request: JiraConnectRequest) => Promise<void>;
  disconnect: (workspaceId: string) => Promise<void>;
  testConnection: (workspaceId: string) => Promise<boolean>;
  testCredentials: (request: Omit<JiraConnectRequest, 'workspaceId'>) => Promise<{
    success: boolean;
    message: string;
    displayName?: string;
    emailAddress?: string;
  }>;

  // Actions - Data
  fetchProjects: (workspaceId: string) => Promise<void>;
  searchIssues: (workspaceId: string, jql: string, maxResults?: number) => Promise<void>;
  getIssue: (workspaceId: string, issueKey: string) => Promise<JiraIssue | null>;

  // Actions - Import
  importIssue: (
    workspaceId: string,
    issueKey: string,
    targetType: 'MISSION' | 'TODO',
    missionId?: string,
    orderIndex?: number
  ) => Promise<JiraImportResult | null>;
  importEpic: (
    workspaceId: string,
    epicKey: string,
    options?: {
      includeChildren?: boolean;
      issueTypes?: string[];
      includeCompleted?: boolean;
    }
  ) => Promise<JiraImportResult | null>;

  // Actions - Mappings
  fetchMappings: (workspaceId: string) => Promise<void>;
  unlinkMapping: (mappingId: string) => Promise<void>;

  // Actions - Settings
  setDefaultProject: (workspaceId: string, projectKey: string) => Promise<void>;

  // Utility
  clearError: () => void;
  reset: () => void;
}

export const useJiraStore = create<JiraState>((set, get) => ({
  // Initial state
  integration: null,
  isConnected: false,
  isConnecting: false,
  projects: [],
  issues: [],
  mappings: [],
  isLoading: false,
  isSearching: false,
  isImporting: false,
  error: null,
  lastSearchJql: null,

  // Connection actions
  fetchStatus: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const integration = await jiraService.getStatus(workspaceId);
      set({
        integration,
        isConnected: integration.connected,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch JIRA status';
      set({ error: message, isLoading: false, isConnected: false });
    }
  },

  connect: async (request: JiraConnectRequest) => {
    set({ isConnecting: true, error: null });
    try {
      const integration = await jiraService.connect(request);
      set({
        integration,
        isConnected: true,
        isConnecting: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect to JIRA';
      set({ error: message, isConnecting: false });
      throw error;
    }
  },

  disconnect: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      await jiraService.disconnect(workspaceId);
      set({
        integration: null,
        isConnected: false,
        projects: [],
        issues: [],
        mappings: [],
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect JIRA';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  testConnection: async (workspaceId: string) => {
    try {
      const result = await jiraService.testConnection(workspaceId);
      set({ isConnected: result.connected });
      return result.connected;
    } catch {
      set({ isConnected: false });
      return false;
    }
  },

  testCredentials: async (request: Omit<JiraConnectRequest, 'workspaceId'>) => {
    try {
      const result = await jiraService.testCredentials(request);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to test credentials';
      return { success: false, message };
    }
  },

  // Data actions
  fetchProjects: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const projects = await jiraService.getProjects(workspaceId);
      set({ projects, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch JIRA projects';
      set({ error: message, isLoading: false });
    }
  },

  searchIssues: async (workspaceId: string, jql: string, maxResults = 50) => {
    set({ isSearching: true, error: null, lastSearchJql: jql });
    try {
      const issues = await jiraService.searchIssues(workspaceId, jql, maxResults);
      set({ issues, isSearching: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search JIRA issues';
      set({ error: message, isSearching: false, issues: [] });
    }
  },

  getIssue: async (workspaceId: string, issueKey: string) => {
    try {
      return await jiraService.getIssue(workspaceId, issueKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get JIRA issue';
      set({ error: message });
      return null;
    }
  },

  // Import actions
  importIssue: async (
    workspaceId: string,
    issueKey: string,
    targetType: 'MISSION' | 'TODO',
    missionId?: string,
    orderIndex?: number
  ) => {
    set({ isImporting: true, error: null });
    try {
      const result = await jiraService.importIssue(
        workspaceId,
        issueKey,
        targetType,
        missionId,
        orderIndex
      );

      if (!result.success) {
        set({ error: result.errorMessage || 'Import failed', isImporting: false });
        return result;
      }

      // Update issue as imported in local state
      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.key === issueKey
            ? { ...issue, imported: true, mappedEntityType: targetType }
            : issue
        ),
        isImporting: false,
      }));

      // Refresh mappings
      get().fetchMappings(workspaceId);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import issue';
      set({ error: message, isImporting: false });
      return null;
    }
  },

  importEpic: async (workspaceId: string, epicKey: string, options = {}) => {
    set({ isImporting: true, error: null });
    try {
      const result = await jiraService.importEpic(
        workspaceId,
        epicKey,
        options.includeChildren ?? true,
        options.issueTypes,
        options.includeCompleted ?? false
      );

      if (!result.success) {
        set({ error: result.errorMessage || 'Import failed', isImporting: false });
        return result;
      }

      // Update epic as imported in local state
      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.key === epicKey
            ? { ...issue, imported: true, mappedEntityType: 'MISSION' }
            : issue
        ),
        isImporting: false,
      }));

      // Refresh mappings
      get().fetchMappings(workspaceId);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import epic';
      set({ error: message, isImporting: false });
      return null;
    }
  },

  // Mapping actions
  fetchMappings: async (workspaceId: string) => {
    try {
      const mappings = await jiraService.getMappings(workspaceId);
      set({ mappings });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch mappings';
      set({ error: message });
    }
  },

  unlinkMapping: async (mappingId: string) => {
    try {
      await jiraService.unlinkMapping(mappingId);
      set((state) => ({
        mappings: state.mappings.filter((m) => m.id !== mappingId),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unlink mapping';
      set({ error: message });
      throw error;
    }
  },

  // Settings
  setDefaultProject: async (workspaceId: string, projectKey: string) => {
    try {
      const integration = await jiraService.setDefaultProject(workspaceId, projectKey);
      set({ integration });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set default project';
      set({ error: message });
      throw error;
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
      mappings: [],
      isLoading: false,
      isSearching: false,
      isImporting: false,
      error: null,
      lastSearchJql: null,
    }),
}));
