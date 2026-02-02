import { create } from 'zustand';
import type { Todo, TodoStatus, StepType, StepStatus, Priority, Complexity, StepProgressUpdate } from '../types';
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
    isBlocked: false,
    isReadyToStart: false,
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
    dependencies: [{ id: 'todo-1', title: 'JWT 토큰 발급 구현', status: 'WOVEN' as TodoStatus }],
    isBlocked: false,
    isReadyToStart: false,
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
    dependencies: [{ id: 'todo-2', title: 'API 엔드포인트 구현', status: 'THREADING' as TodoStatus }],
    isBlocked: true,
    isReadyToStart: false,
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
    isBlocked: false,
    isReadyToStart: true,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

interface DependencyChangedPayload {
  todoId: string;
  missionId: string;
  dependencyIds: string[];
  isBlocked: boolean;
  isReadyToStart: boolean;
}

interface TodoReadyPayload {
  todoId: string;
  missionId: string;
  title: string;
  status: TodoStatus;
}

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
  updateDependencies: (id: string, dependencies: string[]) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  selectTodo: (todo: Todo | null) => void;
  clearTodos: () => void;
  clearError: () => void;

  // WebSocket handlers
  onTodoCreated: (todo: Todo) => void;
  onTodoUpdated: (todo: Todo) => void;
  onTodoDeleted: (id: string) => void;
  onStepProgress: (progress: StepProgressUpdate) => void;
  onTodoReadyToStart: (payload: TodoReadyPayload) => void;
  onDependenciesChanged: (payload: DependencyChangedPayload) => void;
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
      const currentSelectedId = get().selectedTodo?.id;
      const updatedSelectedTodo = currentSelectedId
        ? todos.find(t => t.id === currentSelectedId) || null
        : null;
      set({
        todos,
        selectedTodo: updatedSelectedTodo ?? get().selectedTodo,
        isLoading: false
      });
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

      // If status is THREADING, also start the terminal session with Claude
      if (status === 'THREADING') {
        try {
          await todoService.startTerminal(id, true);
          console.log(`Terminal session started for todo: ${id}`);
        } catch (terminalError) {
          console.warn('Failed to start terminal session:', terminalError);
          // Don't fail the status update if terminal fails
        }
      }
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

  updateDependencies: async (id, dependencies) => {
    try {
      const updated = await todoService.updateDependencies(id, dependencies);
      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? updated : t)),
        selectedTodo: state.selectedTodo?.id === id ? updated : state.selectedTodo,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update dependencies',
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

  // Handle real-time step progress updates
  onStepProgress: (progress) => {
    set((state) => ({
      todos: state.todos.map((todo) => {
        if (todo.id !== progress.todoId) return todo;

        // Update the specific step
        const updatedSteps = todo.steps.map((step) => {
          if (step.stepType !== progress.stepType) return step;
          return {
            ...step,
            id: progress.stepId,
            status: progress.status,
            progress: progress.progress,
            message: progress.message,
            notes: progress.output || step.notes,
            startedAt: progress.startedAt || step.startedAt,
            completedAt: progress.completedAt || step.completedAt,
          };
        });

        // Update todo status based on step progress
        let newStatus = todo.status;
        if (progress.status === 'IN_PROGRESS' && (todo.status === 'PENDING' || todo.status === 'BACKLOG')) {
          newStatus = 'THREADING';
        } else if (progress.completedSteps === progress.totalSteps) {
          newStatus = 'WOVEN';
        } else if (progress.status === 'FAILED') {
          newStatus = 'TANGLED';
        }

        return {
          ...todo,
          status: newStatus,
          steps: updatedSteps,
        };
      }),
      // Also update selectedTodo if it matches
      selectedTodo: state.selectedTodo?.id === progress.todoId
        ? {
            ...state.selectedTodo,
            steps: state.selectedTodo.steps.map((step) => {
              if (step.stepType !== progress.stepType) return step;
              return {
                ...step,
                id: progress.stepId,
                status: progress.status,
                progress: progress.progress,
                message: progress.message,
                notes: progress.output || step.notes,
                startedAt: progress.startedAt || step.startedAt,
                completedAt: progress.completedAt || step.completedAt,
              };
            }),
          }
        : state.selectedTodo,
    }));
  },

  // Handle todo ready to start notification
  onTodoReadyToStart: (payload) => {
    set((state) => ({
      todos: state.todos.map((todo) => {
        if (todo.id !== payload.todoId) return todo;
        return {
          ...todo,
          status: payload.status,
          isReadyToStart: true,
          isBlocked: false,
        };
      }),
    }));
  },

  // Handle dependencies changed notification
  onDependenciesChanged: (payload) => {
    set((state) => ({
      todos: state.todos.map((todo) => {
        if (todo.id !== payload.todoId) return todo;
        return {
          ...todo,
          isBlocked: payload.isBlocked,
          isReadyToStart: payload.isReadyToStart,
          // Note: We don't update dependencies here as they need TodoDependency objects
          // The full data will be fetched on next reload
        };
      }),
      selectedTodo: state.selectedTodo?.id === payload.todoId
        ? {
            ...state.selectedTodo,
            isBlocked: payload.isBlocked,
            isReadyToStart: payload.isReadyToStart,
          }
        : state.selectedTodo,
    }));
  },
}));
