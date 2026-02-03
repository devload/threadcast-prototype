import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingState {
  // First visit
  hasSeenWelcome: boolean;
  setHasSeenWelcome: (value: boolean) => void;

  // Setup checklist
  setupSteps: {
    sessioncastConnected: boolean;
    swiftcastInstalled: boolean;
    mcpConnected: boolean;
    workspaceCreated: boolean;
    firstMissionCreated: boolean;
    tourCompleted: boolean;
  };
  completeSetupStep: (step: keyof OnboardingState['setupSteps']) => void;
  resetSetupSteps: () => void;

  // Interactive tour
  isTourActive: boolean;
  tourStepIndex: number;
  startTour: () => void;
  endTour: () => void;
  setTourStepIndex: (index: number) => void;

  // Tour context - for communicating with pages
  tourContext: {
    // HomePage
    openCreateWorkspaceModal?: () => void;
    closeCreateWorkspaceModal?: () => void;
    // MissionsPage
    openCreateMissionModal?: () => void;
    closeCreateMissionModal?: () => void;
    openMissionDetail?: (missionId: string) => void;
    closeMissionDetail?: () => void;
    demoMissionId?: string;
    // MissionDetailModal
    switchToListView?: () => void;
    switchToGraphView?: () => void;
    startWeaving?: () => void;
    // TodoDetailDrawer
    openTodoDetail?: (todoId: string) => void;
    closeTodoDetail?: () => void;
    demoTodoId?: string;
  };
  setTourContext: (context: Partial<OnboardingState['tourContext']>) => void;

  // Demo workspace
  hasDemoWorkspace: boolean;
  setHasDemoWorkspace: (value: boolean) => void;

  // Overall
  isOnboardingComplete: () => boolean;
  resetOnboarding: () => void;
}

const initialSetupSteps = {
  sessioncastConnected: false,
  swiftcastInstalled: false,
  mcpConnected: false,
  workspaceCreated: false,
  firstMissionCreated: false,
  tourCompleted: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // First visit
      hasSeenWelcome: false,
      setHasSeenWelcome: (value) => set({ hasSeenWelcome: value }),

      // Setup checklist
      setupSteps: { ...initialSetupSteps },
      completeSetupStep: (step) =>
        set((state) => ({
          setupSteps: { ...state.setupSteps, [step]: true },
        })),
      resetSetupSteps: () => set({ setupSteps: { ...initialSetupSteps } }),

      // Interactive tour
      isTourActive: false,
      tourStepIndex: 0,
      startTour: () => set({ isTourActive: true, tourStepIndex: 0 }),
      endTour: () => {
        set({ isTourActive: false, tourContext: {} });
        get().completeSetupStep('tourCompleted');
      },
      setTourStepIndex: (index) => set({ tourStepIndex: index }),

      // Tour context
      tourContext: {},
      setTourContext: (context) =>
        set((state) => ({
          tourContext: { ...state.tourContext, ...context },
        })),

      // Demo workspace
      hasDemoWorkspace: false,
      setHasDemoWorkspace: (value) => set({ hasDemoWorkspace: value }),

      // Overall
      isOnboardingComplete: () => {
        const { setupSteps } = get();
        return Object.values(setupSteps).every(Boolean);
      },
      resetOnboarding: () =>
        set({
          hasSeenWelcome: false,
          setupSteps: { ...initialSetupSteps },
          isTourActive: false,
          tourStepIndex: 0,
          hasDemoWorkspace: false,
        }),
    }),
    {
      name: 'threadcast-onboarding',
    }
  )
);
