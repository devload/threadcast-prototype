import { useState } from 'react';

interface ClaudeCodeWizardProps {
  workspaceId?: string;
  workspacePath?: string;
  onClose: () => void;
  onComplete: () => void;
}

type WizardStep = 'welcome' | 'install' | 'config' | 'test';

export function ClaudeCodeWizard({
  workspaceId,
  workspacePath,
  onClose,
  onComplete
}: ClaudeCodeWizardProps) {
  const [activeStep, setActiveStep] = useState<WizardStep>('welcome');
  const [configCopied, setConfigCopied] = useState(false);

  const steps: { id: WizardStep; label: string; icon: string }[] = [
    { id: 'welcome', label: '소개', icon: '👋' },
    { id: 'install', label: '설치', icon: '💻' },
    { id: 'config', label: '설정', icon: '⚙️' },
    { id: 'test', label: '테스트', icon: '✅' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === activeStep);

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setActiveStep(steps[nextIndex].id);
    }
  };

  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setActiveStep(steps[prevIndex].id);
    }
  };

  // Generate MCP configuration JSON
  const getMcpConfig = () => {
    const apiUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:8080/api'
      : 'https://api.threadcast.io/api';

    const config = {
      mcpServers: {
        threadcast: {
          command: 'npx',
          args: ['-y', '@threadcast/mcp'],
          env: {
            THREADCAST_API_URL: apiUrl,
            THREADCAST_WORKSPACE_ID: workspaceId || '<your-workspace-id>',
            THREADCAST_EMAIL: '<your-email>',
            THREADCAST_PASSWORD: '<your-password>',
          },
        },
      },
    };

    return JSON.stringify(config, null, 2);
  };

  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(getMcpConfig());
      setConfigCopied(true);
      setTimeout(() => setConfigCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadConfig = () => {
    const blob = new Blob([getMcpConfig()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.mcp.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-2xl">🤖</span> Claude Code MCP 설정
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activeStep === step.id
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : index < currentStepIndex
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    activeStep === step.id
                      ? 'bg-indigo-600 text-white'
                      : index < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-600'
                  }`}>
                    {index < currentStepIndex ? '✓' : step.icon}
                  </span>
                  <span className="font-medium hidden sm:inline">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Welcome */}
          {activeStep === 'welcome' && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl mb-4">
                  🔗
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Claude Code와 ThreadCast 연결하기
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  MCP(Model Context Protocol)를 통해 Claude Code에서 직접 ThreadCast의 미션과 Todo를 관리할 수 있습니다.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">미션/Todo 관리</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Claude Code에서 "/mission", "/todo" 명령으로 작업을 생성하고 관리합니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🔄</span>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">실시간 동기화</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        작업 진행 상황이 ThreadCast 웹에 실시간으로 반영됩니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">컨텍스트 공유</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        워크스페이스 메타데이터가 AI에게 전달되어 더 정확한 작업이 가능합니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">진행 추적</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        각 단계별 진행 상황을 타임라인에서 확인할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">설정 과정</h4>
                <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>1. Claude Code 설치 확인</li>
                  <li>2. MCP 설정 파일 생성</li>
                  <li>3. 연결 테스트</li>
                </ol>
              </div>
            </div>
          )}

          {/* Step 2: Install */}
          {activeStep === 'install' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>💻</span> Claude Code 설치 확인
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">1</span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 dark:text-slate-200">Claude Code 설치</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        아직 설치하지 않았다면, Anthropic에서 Claude Code를 설치하세요.
                      </p>
                      <a
                        href="https://claude.ai/code"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Claude Code 다운로드 →
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">2</span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 dark:text-slate-200">설치 확인</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-2">
                        터미널에서 다음 명령어로 설치를 확인하세요:
                      </p>
                      <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-sm overflow-x-auto">
                        <code>claude --version</code>
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">3</span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 dark:text-slate-200">MCP 지원 확인</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Claude Code 1.0.17 이상 버전에서 MCP를 지원합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <span>💡</span> 팁
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Claude Code는 터미널에서 <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">claude</code> 명령으로 실행합니다.
                  프로젝트 폴더에서 실행하면 해당 프로젝트 컨텍스트가 자동으로 로드됩니다.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Config */}
          {activeStep === 'config' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span>⚙️</span> MCP 설정하기
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  두 가지 방법 중 편한 방법을 선택하세요.
                </p>
              </div>

              {/* Method 1: Prompt-based (Easiest) */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl p-5 border-2 border-purple-300 dark:border-purple-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 text-xs font-bold bg-purple-500 text-white rounded">가장 쉬움</span>
                  <h4 className="font-semibold text-slate-900 dark:text-white">방법 1: Claude에게 요청하기</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Claude Code에서 아래 프롬프트를 입력하면 자동으로 설정됩니다.
                </p>

                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">프로젝트 폴더에서 Claude Code 실행 후:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-purple-700 dark:text-purple-300 font-medium">
                        &quot;ThreadCast MCP 세팅해줘&quot;
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('ThreadCast MCP 세팅해줘');
                          setConfigCopied(true);
                          setTimeout(() => setConfigCopied(false), 2000);
                        }}
                        className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                      >
                        복사
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">특정 워크스페이스로 설정하려면:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-purple-700 dark:text-purple-300 font-medium">
                        &quot;My Workspace 워크스페이스로 MCP 세팅해줘&quot;
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('My Workspace 워크스페이스로 MCP 세팅해줘');
                        }}
                        className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                      >
                        복사
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-purple-600 dark:text-purple-400 mt-3">
                  💡 Claude가 워크스페이스를 찾아서 <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">.mcp.json</code> 파일을 자동으로 생성합니다.
                </p>
              </div>

              {/* Method 2: Manual config */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">방법 2: 직접 설정하기</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  프로젝트 루트에 <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">.mcp.json</code> 파일을 직접 생성합니다.
                </p>

                {workspacePath && (
                  <div className="mb-3 p-2 bg-slate-200 dark:bg-slate-800 rounded text-sm">
                    <span className="text-slate-600 dark:text-slate-400">📁 위치: </span>
                    <code className="text-slate-800 dark:text-slate-200">{workspacePath}/.mcp.json</code>
                  </div>
                )}

                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto max-h-48">
                    <code>{getMcpConfig()}</code>
                  </pre>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={copyConfig}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        configCopied
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      {configCopied ? '복사됨!' : '복사'}
                    </button>
                    <button
                      onClick={downloadConfig}
                      className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                    >
                      다운로드
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                  ⚠️ <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">&lt;your-email&gt;</code>과 <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">&lt;your-password&gt;</code>를 실제 계정 정보로 변경하세요.
                </p>
              </div>

              {/* Tip */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <span>💡</span> 팁
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  설정 완료 후 Claude Code를 재시작하면 ThreadCast MCP가 자동으로 로드됩니다.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Test */}
          {activeStep === 'test' && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full text-4xl mb-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
                  🎉
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  설정 완료!
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  이제 Claude Code에서 ThreadCast MCP를 사용할 수 있습니다.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">연결 확인 방법</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">1</span>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">프로젝트 폴더에서 Claude Code 실행</p>
                      <pre className="mt-1 bg-slate-900 text-slate-100 p-2 rounded text-xs">
                        <code>cd {workspacePath || '/your/project'} && claude</code>
                      </pre>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center font-bold flex-shrink-0">2</span>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">ThreadCast 현황 확인</p>
                      <pre className="mt-1 bg-slate-900 text-slate-100 p-2 rounded text-xs">
                        <code>/thread</code>
                      </pre>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-sm flex items-center justify-center font-bold flex-shrink-0">✓</span>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">미션/Todo 목록이 표시되면 연결 성공!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Commands */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">사용 가능한 명령어</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <code className="text-indigo-600 dark:text-indigo-400">/thread</code>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">현황 보기</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <code className="text-indigo-600 dark:text-indigo-400">/mission</code>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">미션 생성</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <code className="text-indigo-600 dark:text-indigo-400">/todo</code>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Todo 생성</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <code className="text-indigo-600 dark:text-indigo-400">/weave</code>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">작업 시작</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-center">
                <p className="text-green-800 dark:text-green-300 font-medium">
                  🚀 Claude Code와 ThreadCast 연동 준비 완료!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  &quot;완료&quot; 버튼을 눌러 설정을 마무리하세요.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between">
          <div>
            {currentStepIndex > 0 && (
              <button
                onClick={goToPrevStep}
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
            {currentStepIndex < steps.length - 1 ? (
              <button
                onClick={goToNextStep}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                다음 →
              </button>
            ) : (
              <button
                onClick={() => {
                  onComplete();
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                완료 ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
