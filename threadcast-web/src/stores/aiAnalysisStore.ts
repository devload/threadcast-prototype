import { create } from 'zustand';
import type { Mission, AIAnalysisResult, SuggestedTodo } from '../types';
import { aiAnalysisService } from '../services';
import { useTodoStore } from './todoStore';
import { useAIQuestionStore } from './aiQuestionStore';

interface AIAnalysisState {
  isAnalyzing: boolean;
  currentMissionId: string | null;
  result: AIAnalysisResult | null;
  selectedTodoIds: Set<string>;       // IDs of todos to be created
  isModalOpen: boolean;
  error: string | null;

  // Actions
  openModal: () => void;
  closeModal: () => void;
  startAnalysis: (mission: Mission) => Promise<void>;
  toggleTodoSelection: (todoId: string) => void;
  selectAllTodos: () => void;
  deselectAllTodos: () => void;
  removeSuggestedTodo: (todoId: string) => void;
  confirmAndCreate: (mission: Mission) => Promise<number>;
  reset: () => void;

  // Getters
  getSelectedTodos: () => SuggestedTodo[];
  getUncertainTodos: () => SuggestedTodo[];
}

export const useAIAnalysisStore = create<AIAnalysisState>((set, get) => ({
  isAnalyzing: false,
  currentMissionId: null,
  result: null,
  selectedTodoIds: new Set(),
  isModalOpen: false,
  error: null,

  openModal: () => set({ isModalOpen: true }),

  closeModal: () => set({
    isModalOpen: false,
    isAnalyzing: false,
    result: null,
    selectedTodoIds: new Set(),
    currentMissionId: null,
    error: null,
  }),

  startAnalysis: async (mission: Mission) => {
    set({
      isAnalyzing: true,
      currentMissionId: mission.id,
      result: null,
      error: null,
      isModalOpen: true,
    });

    try {
      const result = await aiAnalysisService.analyzeMission(mission);

      // Select all todos by default
      const allTodoIds = new Set(result.suggestedTodos.map(t => t.id));

      set({
        result,
        selectedTodoIds: allTodoIds,
        isAnalyzing: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Analysis failed',
        isAnalyzing: false,
      });
    }
  },

  toggleTodoSelection: (todoId: string) => {
    set((state) => {
      const newSelected = new Set(state.selectedTodoIds);
      if (newSelected.has(todoId)) {
        newSelected.delete(todoId);
      } else {
        newSelected.add(todoId);
      }
      return { selectedTodoIds: newSelected };
    });
  },

  selectAllTodos: () => {
    const { result } = get();
    if (result) {
      const allTodoIds = new Set(result.suggestedTodos.map(t => t.id));
      set({ selectedTodoIds: allTodoIds });
    }
  },

  deselectAllTodos: () => {
    set({ selectedTodoIds: new Set() });
  },

  removeSuggestedTodo: (todoId: string) => {
    set((state) => {
      if (!state.result) return state;

      const newSelected = new Set(state.selectedTodoIds);
      newSelected.delete(todoId);

      return {
        result: {
          ...state.result,
          suggestedTodos: state.result.suggestedTodos.filter(t => t.id !== todoId),
          questions: state.result.questions.filter(q => q.relatedTodoId !== todoId),
        },
        selectedTodoIds: newSelected,
      };
    });
  },

  confirmAndCreate: async (mission: Mission) => {
    const { result, selectedTodoIds } = get();
    if (!result) return 0;

    const todoStore = useTodoStore.getState();
    const aiQuestionStore = useAIQuestionStore.getState();

    // Get selected todos
    const selectedTodos = result.suggestedTodos.filter(t => selectedTodoIds.has(t.id));
    let createdCount = 0;

    // Create todos
    for (const todoData of selectedTodos) {
      try {
        await todoStore.createTodo({
          missionId: mission.id,
          title: todoData.title,
          description: todoData.description,
          complexity: todoData.complexity,
          estimatedTime: todoData.estimatedTime,
        });
        createdCount++;
      } catch {
        // Continue with other todos even if one fails
        console.error(`Failed to create todo: ${todoData.title}`);
      }
    }

    // Check for uncertain todos and add AI questions
    const uncertainTodos = selectedTodos.filter(t => t.isUncertain);
    if (uncertainTodos.length > 0) {
      // Get related questions for uncertain todos
      const selectedTodoIdSet = new Set(selectedTodos.map(t => t.id));
      const relatedQuestions = result.questions.filter(q => selectedTodoIdSet.has(q.relatedTodoId));

      if (relatedQuestions.length > 0) {
        // Add questions to the AI Question store
        aiQuestionStore.addQuestions(relatedQuestions, mission.id, mission.title);
      }

      // Open AI question panel for follow-up
      aiQuestionStore.openPanel();
    }

    // Close the modal after creation
    get().closeModal();

    return createdCount;
  },

  reset: () => set({
    isAnalyzing: false,
    currentMissionId: null,
    result: null,
    selectedTodoIds: new Set(),
    isModalOpen: false,
    error: null,
  }),

  getSelectedTodos: () => {
    const { result, selectedTodoIds } = get();
    if (!result) return [];
    return result.suggestedTodos.filter(t => selectedTodoIds.has(t.id));
  },

  getUncertainTodos: () => {
    const { result, selectedTodoIds } = get();
    if (!result) return [];
    return result.suggestedTodos.filter(t => selectedTodoIds.has(t.id) && t.isUncertain);
  },
}));
