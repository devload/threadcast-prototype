import { api } from './api';

// Types
export interface JiraIntegration {
  id: string;
  workspaceId: string;
  instanceType: 'CLOUD' | 'SERVER' | 'DATA_CENTER';
  baseUrl: string;
  authType: 'OAUTH2' | 'API_TOKEN' | 'PAT';
  email?: string;
  defaultProjectKey?: string;
  syncEnabled: boolean;
  lastSyncAt?: string;
  lastStatusMessage?: string;
  connected: boolean;
  createdAt?: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey?: string;
  avatarUrl?: string;
  leadName?: string;
  description?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  issueType: string;
  issueTypeIconUrl?: string;
  status: string;
  statusCategory?: string;
  priority?: string;
  priorityIconUrl?: string;
  assignee?: string;
  reporter?: string;
  projectKey: string;
  projectName?: string;
  epicKey?: string;
  epicName?: string;
  storyPoints?: number;
  timeEstimate?: number;
  timeSpent?: number;
  labels?: string[];
  components?: string[];
  webUrl: string;
  createdAt?: string;
  updatedAt?: string;
  imported?: boolean;
  mappedEntityType?: string;
  mappedEntityId?: string;
}

export interface JiraIssueMapping {
  id: string;
  jiraIssueKey: string;
  jiraIssueId: string;
  jiraIssueType?: string;
  jiraSummary?: string;
  jiraStatus?: string;
  jiraUrl?: string;
  entityType: 'MISSION' | 'TODO';
  missionId?: string;
  missionTitle?: string;
  todoId?: string;
  todoTitle?: string;
  syncDirection: string;
  lastSyncAt?: string;
  createdAt?: string;
}

export interface JiraImportResult {
  success: boolean;
  mission?: {
    id: string;
    title: string;
    status: string;
  };
  todo?: {
    id: string;
    title: string;
    status: string;
    jiraIssueKey: string;
  };
  todos?: Array<{
    id: string;
    title: string;
    status: string;
    jiraIssueKey: string;
  }>;
  mapping?: JiraIssueMapping;
  mappings?: JiraIssueMapping[];
  errorMessage?: string;
  skippedCount?: number;
}

export interface JiraConnectRequest {
  workspaceId: string;
  instanceType: 'CLOUD' | 'SERVER' | 'DATA_CENTER';
  baseUrl: string;
  authType: 'API_TOKEN' | 'PAT';
  apiToken: string;
  email?: string;
  defaultProjectKey?: string;
}

// API Functions
export const jiraService = {
  /**
   * Get JIRA connection status
   */
  getStatus: async (workspaceId: string): Promise<JiraIntegration> => {
    return api.get<JiraIntegration>('/jira/status', { workspaceId });
  },

  /**
   * Connect to JIRA
   */
  connect: async (request: JiraConnectRequest): Promise<JiraIntegration> => {
    return api.post<JiraIntegration>('/jira/connect', request);
  },

  /**
   * Disconnect JIRA
   */
  disconnect: async (workspaceId: string): Promise<{ disconnected: boolean }> => {
    return api.delete<{ disconnected: boolean }>(`/jira/disconnect?workspaceId=${workspaceId}`);
  },

  /**
   * Test connection
   */
  testConnection: async (workspaceId: string): Promise<{ connected: boolean }> => {
    return api.post<{ connected: boolean }>(`/jira/test?workspaceId=${workspaceId}`);
  },

  /**
   * Test credentials (before saving)
   */
  testCredentials: async (request: Omit<JiraConnectRequest, 'workspaceId'>): Promise<{
    success: boolean;
    message: string;
    displayName?: string;
    emailAddress?: string;
  }> => {
    return api.post<{
      success: boolean;
      message: string;
      displayName?: string;
      emailAddress?: string;
    }>('/jira/test-credentials', { ...request, workspaceId: '00000000-0000-0000-0000-000000000000' });
  },

  /**
   * Get JIRA projects
   */
  getProjects: async (workspaceId: string): Promise<JiraProject[]> => {
    return api.get<JiraProject[]>('/jira/projects', { workspaceId });
  },

  /**
   * Search issues with JQL
   */
  searchIssues: async (
    workspaceId: string,
    jql: string,
    maxResults: number = 50
  ): Promise<JiraIssue[]> => {
    return api.get<JiraIssue[]>('/jira/issues/search', { workspaceId, jql, maxResults });
  },

  /**
   * Get single issue
   */
  getIssue: async (workspaceId: string, issueKey: string): Promise<JiraIssue> => {
    return api.get<JiraIssue>(`/jira/issues/${issueKey}`, { workspaceId });
  },

  /**
   * Import single issue
   */
  importIssue: async (
    workspaceId: string,
    issueKey: string,
    targetType: 'MISSION' | 'TODO',
    missionId?: string,
    orderIndex?: number
  ): Promise<JiraImportResult> => {
    return api.post<JiraImportResult>('/jira/import/issue', {
      workspaceId,
      issueKey,
      targetType,
      missionId,
      orderIndex,
    });
  },

  /**
   * Import Epic with children
   */
  importEpic: async (
    workspaceId: string,
    epicKey: string,
    includeChildren: boolean = true,
    issueTypes?: string[],
    includeCompleted: boolean = false
  ): Promise<JiraImportResult> => {
    return api.post<JiraImportResult>('/jira/import/epic', {
      workspaceId,
      epicKey,
      includeChildren,
      issueTypes,
      includeCompleted,
    });
  },

  /**
   * Get mappings
   */
  getMappings: async (workspaceId: string): Promise<JiraIssueMapping[]> => {
    return api.get<JiraIssueMapping[]>('/jira/mappings', { workspaceId });
  },

  /**
   * Unlink mapping
   */
  unlinkMapping: async (mappingId: string): Promise<{ unlinked: boolean }> => {
    return api.delete<{ unlinked: boolean }>(`/jira/mappings/${mappingId}`);
  },

  /**
   * Set default project
   */
  setDefaultProject: async (
    workspaceId: string,
    projectKey: string
  ): Promise<JiraIntegration> => {
    return api.patch<JiraIntegration>(
      `/jira/default-project?workspaceId=${workspaceId}&projectKey=${projectKey}`
    );
  },
};

export default jiraService;
