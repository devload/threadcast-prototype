import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace, Project, ProjectDashboard } from '../types';
import { api } from '../services/api';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  projects: Project[];
  currentProject: Project | null;
  currentProjectDashboard: ProjectDashboard | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspaceDashboard: (workspaceId: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  createWorkspace: (name: string, description: string, path: string) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;

  // Projects
  fetchProjects: (workspaceId: string) => Promise<void>;
  fetchProject: (workspaceId: string, projectId: string) => Promise<void>;
  fetchProjectDashboard: (workspaceId: string, projectId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  createProject: (workspaceId: string, data: CreateProjectData) => Promise<Project>;
  updateProject: (workspaceId: string, projectId: string, data: Partial<CreateProjectData>) => Promise<void>;
  deleteProject: (workspaceId: string, projectId: string) => Promise<void>;
}

interface CreateProjectData {
  name: string;
  description?: string;
  path: string;
  language?: string;
  buildTool?: string;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      projects: [],
      currentProject: null,
      currentProjectDashboard: null,
      isLoading: false,
      error: null,

      fetchWorkspaces: async () => {
        set({ isLoading: true, error: null });
        try {
          const workspaces = await api.get<Workspace[]>('/workspaces');
          set({ workspaces, isLoading: false });

          // Auto-select first workspace if none selected
          if (!get().currentWorkspace && workspaces.length > 0) {
            set({ currentWorkspace: workspaces[0] });
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to fetch workspaces';
          set({ error: message, isLoading: false });
        }
      },

      fetchWorkspaceDashboard: async (workspaceId: string) => {
        set({ isLoading: true, error: null });
        try {
          const workspace = await api.get<Workspace>(`/workspaces/${workspaceId}/dashboard`);
          set({ currentWorkspace: workspace, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to fetch workspace dashboard';
          set({ error: message, isLoading: false });
        }
      },

      setCurrentWorkspace: (workspace) => {
        set({ currentWorkspace: workspace });
      },

      createWorkspace: async (name, description, path) => {
        set({ isLoading: true, error: null });
        try {
          const workspace = await api.post<Workspace>('/workspaces', {
            name,
            description,
            path,
          });
          set((state) => ({
            workspaces: [...state.workspaces, workspace],
            currentWorkspace: workspace,
            isLoading: false,
          }));
          return workspace;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to create workspace';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      updateWorkspace: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const updatedWorkspace = await api.put<Workspace>(`/workspaces/${id}`, data);
          set((state) => ({
            workspaces: state.workspaces.map((w) =>
              w.id === id ? updatedWorkspace : w
            ),
            currentWorkspace:
              state.currentWorkspace?.id === id
                ? updatedWorkspace
                : state.currentWorkspace,
            isLoading: false,
          }));
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to update workspace';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      fetchProjects: async (workspaceId: string) => {
        set({ isLoading: true, error: null });
        try {
          const projects = await api.get<Project[]>(
            `/workspaces/${workspaceId}/projects`
          );
          set({ projects, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to fetch projects';
          set({ error: message, isLoading: false });
        }
      },

      fetchProject: async (workspaceId: string, projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          const project = await api.get<Project>(
            `/workspaces/${workspaceId}/projects/${projectId}`
          );
          set({ currentProject: project, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to fetch project';
          set({ error: message, isLoading: false });
        }
      },

      fetchProjectDashboard: async (workspaceId: string, projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          const dashboard = await api.get<ProjectDashboard>(
            `/workspaces/${workspaceId}/projects/${projectId}/dashboard`
          );
          set({ currentProjectDashboard: dashboard, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to fetch project dashboard';
          set({ error: message, isLoading: false });
        }
      },

      setCurrentProject: (project) => {
        set({ currentProject: project });
      },

      createProject: async (workspaceId, data) => {
        set({ isLoading: true, error: null });
        try {
          const project = await api.post<Project>(
            `/workspaces/${workspaceId}/projects`,
            data
          );
          set((state) => ({
            projects: [...state.projects, project],
            isLoading: false,
          }));
          return project;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to create project';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      updateProject: async (workspaceId, projectId, data) => {
        set({ isLoading: true, error: null });
        try {
          const updatedProject = await api.put<Project>(
            `/workspaces/${workspaceId}/projects/${projectId}`,
            data
          );
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId ? updatedProject : p
            ),
            isLoading: false,
          }));
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to update project';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      deleteProject: async (workspaceId, projectId) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/workspaces/${workspaceId}/projects/${projectId}`);
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== projectId),
            isLoading: false,
          }));
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to delete project';
          set({ error: message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'threadcast-workspace-storage',
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace
          ? { id: state.currentWorkspace.id, name: state.currentWorkspace.name }
          : null,
      }),
    }
  )
);
