import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authService, workspaceService } from '../services';
import { useUIStore } from './uiStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          set({ user: response.user, isAuthenticated: true, isLoading: false });

          // Fetch and set default workspace
          const workspaces = await workspaceService.getAll();
          if (workspaces.length > 0) {
            useUIStore.getState().setCurrentWorkspaceId(workspaces[0].id);
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      loginWithOAuth: async (accessToken, refreshToken, user) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, isAuthenticated: true, isLoading: false, error: null });

        // Fetch and set default workspace
        const workspaces = await workspaceService.getAll();
        if (workspaces.length > 0) {
          useUIStore.getState().setCurrentWorkspaceId(workspaces[0].id);
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({ email, password, name });
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          set({ user: response.user, isAuthenticated: true, isLoading: false });

          // Fetch and set default workspace
          const workspaces = await workspaceService.getAll();
          if (workspaces.length > 0) {
            useUIStore.getState().setCurrentWorkspaceId(workspaces[0].id);
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Clear workspace selection to prevent data leakage between users
          useUIStore.getState().setCurrentWorkspaceId(null);
          set({ user: null, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          // No token - clear any stale persisted auth state
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authService.me();
          if (user) {
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            // Token invalid or expired - silently logout
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch {
          // API error - clear auth state and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
