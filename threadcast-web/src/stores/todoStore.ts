import { create } from 'zustand';
import type { Todo, TodoStatus, StepType, StepStatus, Priority, Complexity } from '../types';
import { todoService, type CreateTodoRequest, type UpdateTodoRequest } from '../services';
import { DEMO_MODE } from '../services/api';

// Helper to create step data
const createSteps = (todoId: string, completedCount: number, inProgressIndex?: number): Todo['steps'] => {
  const stepTypes: StepType[] = ['ANALYSIS', 'DESIGN', 'IMPLEMENTATION', 'VERIFICATION', 'REVIEW', 'INTEGRATION'];
  return stepTypes.map((stepType, index) => ({
    id: `${todoId}-step-${index}`,
    todoId,
    stepType,
    status: index < completedCount
      ? 'COMPLETED' as StepStatus
      : index === inProgressIndex
        ? 'IN_PROGRESS' as StepStatus
        : 'PENDING' as StepStatus,
  }));
};

// Demo todos for prototype
const demoTodos: Todo[] = [
  {
    id: 'todo-1',
    missionId: 'mission-42',
    title: 'JWT 토큰 발급 구현',
    description: 'Spring Security를 이용한 JWT 토큰 발급 로직 구현',
    status: 'WOVEN' as TodoStatus,
    priority: 'HIGH' as Priority,
    complexity: 'MEDIUM' as Complexity,
    estimatedTime: 120,
    orderIndex: 0,
    steps: createSteps('todo-1', 6),
    dependencies: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: 'todo-2',
    missionId: 'mission-42',
    title: 'API 엔드포인트 구현',
    description: '/auth/login, /auth/register 엔드포인트 구현',
    status: 'THREADING' as TodoStatus,
    priority: 'HIGH' as Priority,
    complexity: 'MEDIUM' as Complexity,
    estimatedTime: 90,
    orderIndex: 1,
    steps: createSteps('todo-2', 3, 3),
    dependencies: ['todo-1'],
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    startedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'todo-3',
    missionId: 'mission-42',
    title: '인증 미들웨어 구현',
    description: '요청 인터셉터에서 JWT 토큰 검증 로직 구현',
    status: 'PENDING' as TodoStatus,
    priority: 'MEDIUM' as Priority,
    complexity: 'HIGH' as Complexity,
    estimatedTime: 60,
    orderIndex: 2,
    steps: createSteps('todo-3', 0),
    dependencies: ['todo-2'],
    createdAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: 'todo-4',
    missionId: 'mission-42',
    title: 'Google OAuth 연동',
    description: 'Google OAuth 2.0 로그인 기능 추가',
    status: 'PENDING' as TodoStatus,
    priority: 'LOW' as Priority,
    complexity: 'MEDIUM' as Complexity,
    estimatedTime: 180,
    orderIndex: 3,
    steps: createSteps('todo-4', 1, 1),
    dependencies: [],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

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
    if (DEMO_MODE) {
      const filteredDemos = demoTodos.filter(t => t.missionId === missionId);
      set({ todos: filteredDemos.length > 0 ? filteredDemos : demoTodos, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const todos = await todoService.getByMission(missionId);
      set({ todos, isLoading: false });
    } catch {
      const filteredDemos = demoTodos.filter(t => t.missionId === missionId);
      set({ todos: filteredDemos.length > 0 ? filteredDemos : demoTodos, isLoading: false });
    }
  },

  fetchTodo: async (id) => {
    if (DEMO_MODE) {
      const demoTodo = demoTodos.find(t => t.id === id);
      set({ selectedTodo: demoTodo || null, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const todo = await todoService.getById(id);
      set({ selectedTodo: todo, isLoading: false });
    } catch {
      const demoTodo = demoTodos.find(t => t.id === id);
      set({ selectedTodo: demoTodo || null, isLoading: false });
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
    // Optimistic update (works for both API and demo mode)
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, status } : t)),
    }));

    try {
      await todoService.updateStatus(id, status);
    } catch {
      // Demo mode: keep the optimistic update (no rollback)
      // The UI already reflects the change
    }
  },

  updateStepStatus: async (todoId, stepType, status, notes) => {
    // Optimistic update (works for both API and demo mode)
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
    } catch {
      // Demo mode: keep the optimistic update (no rollback)
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
