import { useState } from 'react';
import { useOnboardingStore } from './OnboardingStore';

interface SetupChecklistProps {
  onStartTour: () => void;
  onOpenSettings?: () => void;
}

type GuideType = 'sessioncast' | 'swiftcast' | 'mcp' | null;

export function SetupChecklist({ onStartTour, onOpenSettings: _onOpenSettings }: SetupChecklistProps) {
  const { setupSteps, completeSetupStep, isOnboardingComplete } = useOnboardingStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showGuide, setShowGuide] = useState<GuideType>(null);

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
      key: 'sessioncastConnected' as const,
      title: 'SessionCast 연결',
      description: 'AI 명령 실행을 위한 SessionCast SaaS에 가입하고 에이전트를 설치하세요',
      icon: '🤖',
      action: () => setShowGuide('sessioncast'),
      actionLabel: '설정 가이드',
      priority: true,
    },
    {
      key: 'swiftcastInstalled' as const,
      title: 'SwiftCast 설치',
      description: 'Claude Code를 실행할 macOS 앱을 설치하세요',
      icon: '🚀',
      action: () => setShowGuide('swiftcast'),
      actionLabel: '설치 가이드',
      priority: true,
    },
    {
      key: 'mcpConnected' as const,
      title: 'MCP 서버 연결',
      description: 'Claude Code에서 ThreadCast MCP 서버를 설정하세요',
      icon: '🔌',
      action: () => setShowGuide('mcp'),
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
            {steps.map((step, index) => {
              const isPriority = 'priority' in step && step.priority && !setupSteps[step.key];
              return (
                <div
                  key={step.key}
                  className={`px-4 py-3 flex items-start gap-3 ${
                    index !== steps.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''
                  } ${isPriority ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20' : ''}`}
                >
                  {/* Checkbox */}
                  <div className="mt-0.5">
                    {setupSteps[step.key] ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : isPriority ? (
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center animate-pulse">
                        <span className="text-white text-xs">!</span>
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
                      {isPriority && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded">필수</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {step.description}
                    </p>
                    {step.action && !setupSteps[step.key] && (
                      <button
                        onClick={step.action}
                        className={`mt-2 text-sm font-medium hover:underline ${
                          isPriority ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {step.actionLabel} →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guide Modals */}
      {showGuide === 'sessioncast' && (
        <SessionCastGuideModal
          onClose={() => setShowGuide(null)}
          onComplete={() => {
            completeSetupStep('sessioncastConnected');
            setShowGuide(null);
          }}
        />
      )}
      {showGuide === 'swiftcast' && (
        <SwiftCastGuideModal
          onClose={() => setShowGuide(null)}
          onComplete={() => {
            completeSetupStep('swiftcastInstalled');
            setShowGuide(null);
          }}
        />
      )}
      {showGuide === 'mcp' && (
        <McpGuideModal
          onClose={() => setShowGuide(null)}
          onComplete={() => {
            completeSetupStep('mcpConnected');
            setShowGuide(null);
          }}
        />
      )}
    </>
  );
}

// SessionCast SaaS Guide Modal
function SessionCastGuideModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [activeTab, setActiveTab] = useState<'signup' | 'token' | 'agent' | 'verify'>('signup');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🤖</span> SessionCast 연결 가이드
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            SessionCast는 ThreadCast에서 Claude Code에 명령을 전달하고 실행하는 핵심 서비스입니다.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {[
            { id: 'signup', label: '1. 가입', icon: '📝' },
            { id: 'token', label: '2. 토큰', icon: '🔑' },
            { id: 'agent', label: '3. 에이전트', icon: '⚙️' },
            { id: 'verify', label: '4. 확인', icon: '✅' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'signup' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <h4 className="font-medium text-indigo-800 dark:text-indigo-300 mb-2">🌐 SessionCast SaaS란?</h4>
                <p className="text-sm text-indigo-700 dark:text-indigo-400">
                  SessionCast는 터미널 세션을 원격으로 제어하고 Claude Code에 명령을 전달하는 서비스입니다.
                  ThreadCast에서 "Start Weaving"을 누르면 SessionCast를 통해 AI가 작업을 시작합니다.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">SessionCast 가입하기</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">1</span>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">SessionCast 웹사이트 접속</p>
                      <a
                        href="https://app.sessioncast.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                      >
                        app.sessioncast.io 열기 →
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">2</span>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">Google 계정으로 로그인</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        무료 요금제로 1개 에이전트 연결 가능
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'token' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">API 토큰 발급받기</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">1</span>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">로그인 후 Account → API Tokens 메뉴 이동</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">2</span>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">"Create Token" 클릭하여 새 토큰 생성</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">3</span>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">토큰을 안전한 곳에 복사해두세요</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">⚠️ 중요!</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  토큰은 생성 시 <strong>한 번만</strong> 표시됩니다. 반드시 안전한 곳에 저장해두세요.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'agent' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">에이전트 설치 및 설정</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">1</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">에이전트 저장소 클론 및 빌드</p>
                      <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                        <code>{`git clone https://github.com/anthropics/sessioncast-agent
cd sessioncast-agent
./gradlew build`}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">2</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">설정 파일 생성</p>
                      <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                        <code>{`# ~/.tmux-remote.yml
machineId: "my-macbook"
relay: "wss://relay.sessioncast.io/ws"
token: "<발급받은-API-토큰>"`}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">3</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">에이전트 실행</p>
                      <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                        <code>./gradlew run</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'verify' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">연결 확인하기</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-2xl">1️⃣</span>
                    <div>
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">SessionCast 웹 대시보드 확인</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        app.sessioncast.io에서 에이전트가 <span className="text-green-600">●</span> 온라인으로 표시되는지 확인
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-2xl">2️⃣</span>
                    <div>
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">터미널 세션 테스트</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        웹에서 터미널 세션을 열어 명령이 실행되는지 확인
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">🎉 연결 성공!</h4>
                <p className="text-sm text-green-700 dark:text-green-400">
                  SessionCast 에이전트가 정상 연결되었다면, ThreadCast에서 AI 작업을 시작할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between">
          <div className="flex gap-2">
            {activeTab !== 'signup' && (
              <button
                onClick={() => {
                  const tabs = ['signup', 'token', 'agent', 'verify'] as const;
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                ← 이전
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              나중에
            </button>
            {activeTab !== 'verify' ? (
              <button
                onClick={() => {
                  const tabs = ['signup', 'token', 'agent', 'verify'] as const;
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                다음 →
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                설정 완료 ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// SwiftCast Installation Guide Modal
function SwiftCastGuideModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [activeTab, setActiveTab] = useState<'install' | 'config' | 'verify'>('install');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🚀</span> SwiftCast 설치 가이드
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            SwiftCast는 ThreadCast에서 AI(Claude Code)를 실행하는 에이전트입니다.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'install', label: '1. 설치', icon: '📦' },
            { id: 'config', label: '2. 설정', icon: '⚙️' },
            { id: 'verify', label: '3. 확인', icon: '✅' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'install' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">⚡ SwiftCast란?</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  SwiftCast는 ThreadCast 웹에서 "Start Weaving" 버튼을 누르면 로컬 환경에서 Claude Code를 실행해주는 에이전트입니다.
                  macOS 앱으로 제공되며, 백그라운드에서 실행됩니다.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">macOS 설치</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">1</span>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">SwiftCast 다운로드</p>
                      <a
                        href="https://github.com/anthropics/swiftcast/releases/latest"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        → GitHub Releases에서 다운로드
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">2</span>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">앱을 Applications 폴더로 이동</p>
                      <pre className="mt-1 bg-slate-900 text-slate-100 p-2 rounded text-xs overflow-x-auto">
                        <code>mv ~/Downloads/SwiftCast.app /Applications/</code>
                      </pre>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">3</span>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">앱 실행 (메뉴바에 아이콘 표시됨)</p>
                      <pre className="mt-1 bg-slate-900 text-slate-100 p-2 rounded text-xs overflow-x-auto">
                        <code>open /Applications/SwiftCast.app</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  💡 SwiftCast는 로그인 시 자동 시작되도록 설정할 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">ThreadCast 연결 설정</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  SwiftCast 메뉴바 아이콘 클릭 → Settings에서 다음을 설정하세요:
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Server URL</h4>
                    <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-2 rounded text-sm">
                      <code>https://api.threadcast.io</code>
                    </pre>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API Token</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      ThreadCast 웹 → Settings → API Token에서 복사
                    </p>
                    <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-2 rounded text-sm">
                      <code>your-api-token-here</code>
                    </pre>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Claude Code Path (선택)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      기본값: /usr/local/bin/claude
                    </p>
                    <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-2 rounded text-sm">
                      <code>which claude</code>
                    </pre>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  🔐 <strong>SessionCast 인증:</strong> SwiftCast는 ThreadCast 로그인과 동일한 SessionCast OAuth를 사용합니다.
                  웹에서 로그인하면 SwiftCast도 자동으로 인증됩니다.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'verify' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">연결 확인하기</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-2xl">1️⃣</span>
                    <div>
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">메뉴바 아이콘 확인</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        SwiftCast 아이콘이 <span className="text-green-600">●</span> 초록색이면 연결됨
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-2xl">2️⃣</span>
                    <div>
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">테스트 Todo 실행</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        ThreadCast에서 간단한 Todo를 만들고 "Start Weaving" 클릭
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-2xl">3️⃣</span>
                    <div>
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">터미널 확인</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Claude Code가 새 터미널에서 자동 실행되면 성공!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">🎉 모두 준비되었나요?</h4>
                <p className="text-sm text-green-700 dark:text-green-400">
                  SwiftCast가 정상 작동하면 ThreadCast에서 AI가 실제로 코드를 작성할 수 있습니다.
                  "설정 완료" 버튼을 눌러 다음 단계로 진행하세요!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between">
          <div className="flex gap-2">
            {activeTab !== 'install' && (
              <button
                onClick={() => setActiveTab(activeTab === 'verify' ? 'config' : 'install')}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                ← 이전
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              나중에
            </button>
            {activeTab !== 'verify' ? (
              <button
                onClick={() => setActiveTab(activeTab === 'install' ? 'config' : 'verify')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                다음 →
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                설정 완료 ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
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
