import { create } from 'zustand';
import { api, DEMO_MODE } from '../services/api';
import { todoService } from '../services/todoService';
import type { AIQuestion } from '../types';

interface AIQuestionWithDetails extends AIQuestion {
  missionId?: string;
  missionTitle?: string;
  todoTitle?: string;
  category?: string;
}

interface AIQuestionState {
  questions: AIQuestionWithDetails[];
  isLoading: boolean;
  isPanelOpen: boolean;
  filteredTodoId: string | null; // Filter questions by todoId

  // Actions
  fetchQuestions: (workspaceId: string) => Promise<void>;
  answerQuestion: (questionId: string, answer: string) => Promise<void>;
  skipQuestion: (questionId: string) => Promise<void>;
  openPanel: () => void;
  openPanelForTodo: (todoId: string) => void; // Open panel filtered by todoId
  closePanel: () => void;
  togglePanel: () => void;
  getQuestionsForTodo: (todoId: string) => AIQuestionWithDetails[];
}

// Demo questions for prototype
const demoQuestions: AIQuestionWithDetails[] = [
  {
    id: 'q1',
    todoId: 'todo-42-3',
    question: '인증 미들웨어에서 세션 만료 시 자동 로그아웃 처리는 어떤 방식으로 구현할까요?',
    context: 'API 엔드포인트의 인증 미들웨어를 구현하는 중입니다. JWT 토큰 발급은 완료했으며, 세션 관리 로직이 필요합니다.',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    missionId: 'mission-42',
    missionTitle: '로그인 기능 구현',
    todoTitle: 'API 엔드포인트 구현',
    category: 'ARCHITECTURE',
  },
  {
    id: 'q2',
    todoId: 'todo-43-2',
    question: '차트 라이브러리로 Chart.js와 Recharts 중 어떤 것을 사용할까요?',
    context: '대시보드에 매출 차트를 추가해야 합니다. 반응형 지원과 커스터마이징이 중요합니다.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    missionId: 'mission-43',
    missionTitle: '대시보드 리디자인',
    todoTitle: '매출 차트 구현',
    category: 'TECHNOLOGY',
  },
  {
    id: 'q3',
    todoId: 'todo-42-4',
    question: 'Google OAuth 연동 시 추가 프로필 정보(프로필 사진, 이름)를 저장할까요?',
    context: 'Google OAuth 2.0 연동을 준비 중입니다. 기본 이메일 외에 추가 정보 수집 여부를 결정해야 합니다.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    missionId: 'mission-42',
    missionTitle: '로그인 기능 구현',
    todoTitle: 'Google OAuth 연동',
    category: 'REQUIREMENTS',
  },
];

export const useAIQuestionStore = create<AIQuestionState>((set, get) => ({
  questions: [],
  isLoading: false,
  isPanelOpen: false,
  filteredTodoId: null,

  fetchQuestions: async (workspaceId: string) => {
    set({ isLoading: true });

    if (DEMO_MODE) {
      set({ questions: demoQuestions, isLoading: false });
      return;
    }

    const data = await api.silentGet<AIQuestionWithDetails[]>(`/ai-questions?workspaceId=${workspaceId}`);

    if (data && data.length > 0) {
      // Get unique todoIds that don't have missionId
      const todoIds = [...new Set(data.filter(q => q.todoId && !q.missionId).map(q => q.todoId))];

      // Fetch todo details to get missionId
      const todoMissionMap: Record<string, string> = {};
      await Promise.all(
        todoIds.map(async (todoId) => {
          try {
            const todo = await todoService.getById(todoId);
            if (todo.missionId) {
              todoMissionMap[todoId] = todo.missionId;
            }
          } catch {
            // Ignore errors for individual todo fetches
          }
        })
      );

      // Enrich questions with missionId
      const enrichedQuestions = data.map(q => ({
        ...q,
        missionId: q.missionId || (q.todoId ? todoMissionMap[q.todoId] : undefined),
      }));

      set({ questions: enrichedQuestions, isLoading: false });
    } else {
      set({ questions: data || demoQuestions, isLoading: false });
    }
  },

  answerQuestion: async (questionId: string, answer: string) => {
    try {
      await api.post(`/ai-questions/${questionId}/answer`, { answer });
      // Remove answered question from list
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== questionId),
      }));
    } catch {
      // Demo mode: just remove the question
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== questionId),
      }));
    }
  },

  skipQuestion: async (questionId: string) => {
    try {
      await api.post(`/ai-questions/${questionId}/skip`);
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== questionId),
      }));
    } catch {
      // Demo mode: just remove the question
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== questionId),
      }));
    }
  },

  openPanel: () => set({ isPanelOpen: true, filteredTodoId: null }),
  openPanelForTodo: (todoId: string) => set({ isPanelOpen: true, filteredTodoId: todoId }),
  closePanel: () => set({ isPanelOpen: false, filteredTodoId: null }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen, filteredTodoId: null })),
  getQuestionsForTodo: (todoId: string) => get().questions.filter(q => q.todoId === todoId),
}));
