import { api } from './api';

// Types
export interface SentryIntegration {
  id: string;
  workspaceId: string;
  organizationSlug: string;
  defaultProjectSlug?: string;
  connected: boolean;
  lastSyncAt?: string;
  createdAt?: string;
}

export interface SentryProject {
  id: string;
  slug: string;
  name: string;
  platform?: string;
  dateCreated?: string;
}

export interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit?: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  status: 'resolved' | 'unresolved' | 'ignored';
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
  projectSlug?: string;
  projectName?: string;
  imported?: boolean;
  mappedEntityType?: string;
  mappedEntityId?: string;
}

export interface SentryImportResult {
  success: boolean;
  mission?: {
    id: string;
    title: string;
  };
  todo?: {
    id: string;
    title: string;
  };
  errorMessage?: string;
}

export interface SentryConnectRequest {
  workspaceId: string;
  authToken: string;
  organizationSlug: string;
  defaultProjectSlug?: string;
}

// Service
class SentryService {
  async getStatus(workspaceId: string): Promise<SentryIntegration> {
    const response = await api.get<SentryIntegration>(`/sentry/status?workspaceId=${workspaceId}`);
    return response;
  }

  async connect(request: SentryConnectRequest): Promise<SentryIntegration> {
    const response = await api.post<SentryIntegration>('/sentry/connect', request);
    return response;
  }

  async disconnect(workspaceId: string): Promise<void> {
    await api.delete(`/sentry/disconnect?workspaceId=${workspaceId}`);
  }

  async testConnection(workspaceId: string): Promise<{ connected: boolean; message?: string }> {
    const response = await api.get<{ connected: boolean; message?: string }>(`/sentry/test?workspaceId=${workspaceId}`);
    return response;
  }

  async getProjects(workspaceId: string): Promise<SentryProject[]> {
    const response = await api.get<SentryProject[]>(`/sentry/projects?workspaceId=${workspaceId}`);
    return response;
  }

  async getIssues(workspaceId: string, query?: string, projectSlug?: string): Promise<SentryIssue[]> {
    const params = new URLSearchParams({ workspaceId });
    if (query) params.append('query', query);
    if (projectSlug) params.append('projectSlug', projectSlug);
    const response = await api.get<SentryIssue[]>(`/sentry/issues?${params.toString()}`);
    return response;
  }

  async getIssue(workspaceId: string, issueId: string): Promise<SentryIssue> {
    const response = await api.get<SentryIssue>(`/sentry/issues/${issueId}?workspaceId=${workspaceId}`);
    return response;
  }

  async importIssue(
    workspaceId: string,
    issueId: string,
    missionId?: string
  ): Promise<SentryImportResult> {
    const response = await api.post<SentryImportResult>('/sentry/import', {
      workspaceId,
      issueId,
      missionId,
    });
    return response;
  }
}

export const sentryService = new SentryService();
