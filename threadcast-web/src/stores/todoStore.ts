import { create } from 'zustand';
import type { Todo, TodoStatus, StepType, StepStatus } from '../types';
import { todoService, type CreateTodoRequest, type UpdateTodoRequest } from '../services';

interface TodoState {
  todos: Todo[];
  selectedTodo: Todo | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTodos: (missionId: string) => Promise<void>;
  fetchTodo: (id: string) => Promise<void>;
  createTodo: (data: CreateTodoRequest) => Promise<Todo>;
  updateTodo: (id: string, data: UpdateTodoRequest) => Promise<void>;
  updateTodoStatus: (id: string, status: TodoStatus) => Promise<void>;
  updateStepStatus: (todoId: string, stepType: StepType, status: StepStatus, notes?: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  selectTodo: (todo: Todo | null) => void;
  clearTodos: () => void;
  clearError: () => void;

  // WebSocket handlers
  onTodoCreated: (todo: Todo) => void;
  onTodoUpdated: (todo: Todo) => void;
  onTodoDeleted: (id: string) => void;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  selectedTodo: null,
  isLoading: false,
  error: null,

  fetchTodos: async (missionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await todoService.getByMission(missionId);
      set({ todos: response.content, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch todos',
        isLoading: false,
      });
    }
  },

  fetchTodo: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const todo = await todoService.getById(id);
      set({ selectedTodo: todo, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch todo',
        isLoading: false,
      });
    }
  },

  createTodo: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const todo = await todoService.create(data);
      set((state) => ({
        todos: [...state.todos, todo],
        isLoading: false,
      }));
      return todo;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create todo',
        isLoading: false,
      });
      throw error;
    }
  },

  updateTodo: async (id, data) => {
    set({ error: null });
    try {
      const updated = await todoService.update(id, data);
      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? updated : t)),
        selectedTodo: state.selectedTodo?.id === id ? updated : state.selectedTodo,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update todo',
      });
      throw error;
    }
  },

  updateTodoStatus: async (id, status) => {
    const previousTodos = get().todos;
    // Optimistic update
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, status } : t)),
    }));

    try {
      await todoService.updateStatus(id, status);
    } catch (error) {
      // Rollback on error
      set({ todos: previousTodos });
      set({
        error: error instanceof Error ? error.message : 'Failed to update status',
      });
      throw error;
    }
  },

  updateStepStatus: async (todoId, stepType, status, notes) => {
    const previousTodos = get().todos;
    // Optimistic update
    set((state) => ({
      todos: state.todos.map((t) => {
        if (t.id !== todoId) return t;
        return {
          ...t,
          steps: t.steps.map((s) =>
            s.stepType === stepType ? { ...s, status, notes } : s
          ),
        };
      }),
    }));

    try {
      await todoService.updateStepStatus(todoId, stepType, status, notes);
    } catch (error) {
      // Rollback on error
      set({ todos: previousTodos });
      set({
        error: error instanceof Error ? error.message : 'Failed to update step',
      });
      throw error;
    }
  },

  deleteTodo: async (id) => {
    const previousTodos = get().todos;
    // Optimistic update
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
      selectedTodo: state.selectedTodo?.id === id ? null : state.selectedTodo,
    }));

    try {
      await todoService.delete(id);
    } catch (error) {
      // Rollback on error
      set({ todos: previousTodos });
      set({
        error: error instanceof Error ? error.message : 'Failed to delete todo',
      });
      throw error;
    }
  },

  selectTodo: (todo) => set({ selectedTodo: todo }),

  clearTodos: () => set({ todos: [], selectedTodo: null }),

  clearError: () => set({ error: null }),

  // WebSocket handlers
  onTodoCreated: (todo) => {
    set((state) => {
      if (state.todos.some((t) => t.id === todo.id)) return state;
      return { todos: [...state.todos, todo] };
    });
  },

  onTodoUpdated: (todo) => {
    set((state) => ({
      todos: state.todos.map((t) => (t.id === todo.id ? todo : t)),
      selectedTodo: state.selectedTodo?.id === todo.id ? todo : state.selectedTodo,
    }));
  },

  onTodoDeleted: (id) => {
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
      selectedTodo: state.selectedTodo?.id === id ? null : state.selectedTodo,
    }));
  },
}));
