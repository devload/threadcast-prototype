import { useState } from 'react';
import { useOnboardingStore } from './OnboardingStore';

interface SetupChecklistProps {
  onStartTour: () => void;
  onOpenSettings?: () => void;
}

export function SetupChecklist({ onStartTour, onOpenSettings: _onOpenSettings }: SetupChecklistProps) {
  const { setupSteps, completeSetupStep, isOnboardingComplete } = useOnboardingStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMcpGuide, setShowMcpGuide] = useState(false);

  // Calculate progress
  const totalSteps = Object.keys(setupSteps).length;
  const completedSteps = Object.values(setupSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // If all done, show minimal or hide
  if (isOnboardingComplete()) {
    return null;
  }

  const steps = [
    {
      key: 'mcpConnected' as const,
      title: 'MCP 서버 연결',
      description: 'Claude Code에서 ThreadCast MCP 서버를 설정하세요',
      icon: '🔌',
      action: () => setShowMcpGuide(true),
      actionLabel: '설정 방법 보기',
    },
    {
      key: 'workspaceCreated' as const,
      title: 'Workspace 생성',
      description: '프로젝트 폴더와 연결된 Workspace를 만드세요',
      icon: '📁',
      action: undefined,
      actionLabel: undefined,
    },
    {
      key: 'firstMissionCreated' as const,
      title: '첫 Mission 만들기',
      description: 'Mission을 만들면 AI가 Todo로 분해해드립니다',
      icon: '📋',
      action: undefined,
      actionLabel: undefined,
    },
    {
      key: 'tourCompleted' as const,
      title: 'UI 둘러보기',
      description: '주요 기능을 빠르게 살펴보세요',
      icon: '🎯',
      action: onStartTour,
      actionLabel: '투어 시작',
    },
  ];

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">⚙️</span>
            <div className="text-left">
              <h3 className="font-medium text-slate-900 dark:text-white">시작하기</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {completedSteps}/{totalSteps} 완료
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress bar */}
            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Steps */}
        {isExpanded && (
          <div className="border-t border-slate-200 dark:border-slate-700">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={`px-4 py-3 flex items-start gap-3 ${
                  index !== steps.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''
                }`}
              >
                {/* Checkbox */}
                <div className="mt-0.5">
                  {setupSteps[step.key] ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{step.icon}</span>
                    <h4 className={`font-medium ${setupSteps[step.key] ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.description}
                  </p>
                  {step.action && !setupSteps[step.key] && (
                    <button
                      onClick={step.action}
                      className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      {step.actionLabel} →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MCP Guide Modal */}
      {showMcpGuide && (
        <McpGuideModal
          onClose={() => setShowMcpGuide(false)}
          onComplete={() => {
            completeSetupStep('mcpConnected');
            setShowMcpGuide(false);
          }}
        />
      )}
    </>
  );
}

function McpGuideModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🔌</span> MCP 서버 연결 가이드
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {/* Step 1 */}
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold">1</span>
                Claude Code 설정 파일 열기
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                터미널에서 다음 명령어를 실행하세요:
              </p>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-sm overflow-x-auto">
                <code>code ~/.claude/claude_desktop_config.json</code>
              </pre>
            </div>

            {/* Step 2 */}
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold">2</span>
                MCP 서버 설정 추가
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                다음 내용을 추가하세요:
              </p>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-sm overflow-x-auto">
                <code>{`{
  "mcpServers": {
    "threadcast": {
      "command": "npx",
      "args": ["-y", "threadcast-mcp"],
      "env": {
        "THREADCAST_API_URL": "https://api.threadcast.io",
        "THREADCAST_TOKEN": "<your-token>"
      }
    }
  }
}`}</code>
              </pre>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold">3</span>
                토큰 발급받기
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                설정 페이지에서 API 토큰을 발급받아 위 설정의 <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">&lt;your-token&gt;</code> 부분을 교체하세요.
              </p>
            </div>

            {/* Step 4 */}
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold">4</span>
                Claude Code 재시작
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                설정을 저장한 후 Claude Code를 재시작하면 ThreadCast MCP가 연결됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            나중에
          </button>
          <button
            onClick={onComplete}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            설정 완료했어요
          </button>
        </div>
      </div>
    </div>
  );
}
