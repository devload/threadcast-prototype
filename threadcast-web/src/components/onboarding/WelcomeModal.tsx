import { useState } from 'react';
import { useOnboardingStore } from './OnboardingStore';
import { Logo } from '../common/Logo';

interface WelcomeModalProps {
  onCreateWorkspace: () => void;
  onStartTour: () => void;
  onCreateDemo: () => void;
}

export function WelcomeModal({ onCreateWorkspace, onStartTour, onCreateDemo }: WelcomeModalProps) {
  const { hasSeenWelcome, setHasSeenWelcome } = useOnboardingStore();
  const [isVisible, setIsVisible] = useState(!hasSeenWelcome);

  if (!isVisible) return null;

  const handleClose = () => {
    setHasSeenWelcome(true);
    setIsVisible(false);
  };

  const handleCreateWorkspace = () => {
    handleClose();
    onCreateWorkspace();
  };

  const handleStartTour = () => {
    handleClose();
    onStartTour();
  };

  const handleCreateDemo = () => {
    handleClose();
    onCreateDemo();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-center text-white">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 backdrop-blur rounded-2xl p-3">
              <Logo size="lg" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">ThreadCast에 오신 것을 환영합니다!</h1>
          <p className="text-white/80 text-sm">
            AI와 함께 개발 작업을 체계적으로 관리하세요
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <span className="text-2xl">📋</span>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Mission → Todo 자동 분해</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  큰 작업을 AI가 작은 단위로 나눠드립니다
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Claude Code 연동</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  MCP 서버로 AI 에이전트와 협업하세요
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">실시간 진행 추적</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Timeline에서 모든 활동을 확인하세요
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleCreateWorkspace}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              첫 Workspace 만들기
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleStartTour}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>📖</span>
                둘러보기
              </button>
              <button
                onClick={handleCreateDemo}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>▶️</span>
                데모 체험
              </button>
            </div>
          </div>

          {/* Skip */}
          <button
            onClick={handleClose}
            className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            나중에 할게요
          </button>
        </div>
      </div>
    </div>
  );
}
