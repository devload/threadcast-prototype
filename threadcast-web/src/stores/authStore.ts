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
          set({ user: null, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        set({ isLoading: true });
        const user = await authService.me();
        if (user) {
          set({ user, isAuthenticated: true, isLoading: false });
        } else {
          // Token invalid or expired - silently logout
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
