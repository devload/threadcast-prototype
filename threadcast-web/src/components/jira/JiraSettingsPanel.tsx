import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useJiraStore } from '../../stores/jiraStore';
import { useUIStore } from '../../stores/uiStore';
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface JiraSettingsPanelProps {
  onClose?: () => void;
}

type InstanceType = 'CLOUD' | 'SERVER' | 'DATA_CENTER';
type AuthType = 'API_TOKEN' | 'PAT';

interface TestResult {
  success: boolean;
  message: string;
  displayName?: string;
}

export function JiraSettingsPanel(_props: JiraSettingsPanelProps) {
  const { currentWorkspaceId } = useUIStore();
  const {
    integration,
    isConnected,
    isConnecting,
    isLoading,
    projects,
    error,
    fetchStatus,
    connect,
    disconnect,
    fetchProjects,
    setDefaultProject,
    testCredentials,
    clearError,
  } = useJiraStore();

  // Form state
  const [instanceType, setInstanceType] = useState<InstanceType>('CLOUD');
  const [authType, setAuthType] = useState<AuthType>('API_TOKEN');
  const [baseUrl, setBaseUrl] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  // Test & Guide state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Load status on mount
  useEffect(() => {
    if (currentWorkspaceId) {
      fetchStatus(currentWorkspaceId);
    }
  }, [currentWorkspaceId, fetchStatus]);

  // Load projects when connected
  useEffect(() => {
    if (isConnected && currentWorkspaceId) {
      fetchProjects(currentWorkspaceId);
    }
  }, [isConnected, currentWorkspaceId, fetchProjects]);

  // Update selected project from integration
  useEffect(() => {
    if (integration?.defaultProjectKey) {
      setSelectedProject(integration.defaultProjectKey);
    }
  }, [integration?.defaultProjectKey]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspaceId) return;

    clearError();

    try {
      await connect({
        workspaceId: currentWorkspaceId,
        instanceType,
        baseUrl: baseUrl.trim().replace(/\/$/, ''), // Remove trailing slash
        authType,
        apiToken,
        email: authType === 'API_TOKEN' ? email : undefined,
      });

      // Clear form on success
      setApiToken('');
    } catch {
      // Error is handled in store
    }
  };

  const handleDisconnect = async () => {
    if (!currentWorkspaceId) return;
    if (!window.confirm('JIRA 연결을 해제하시겠습니까? 모든 매핑 정보가 삭제됩니다.')) return;

    try {
      await disconnect(currentWorkspaceId);
    } catch {
      // Error is handled in store
    }
  };

  const handleSetDefaultProject = async (projectKey: string) => {
    if (!currentWorkspaceId) return;

    try {
      await setDefaultProject(currentWorkspaceId, projectKey);
      setSelectedProject(projectKey);
    } catch {
      // Error is handled in store
    }
  };

  const handleTestConnection = async () => {
    if (!baseUrl || !apiToken) return;
    if (authType === 'API_TOKEN' && !email) return;

    setIsTesting(true);
    setTestResult(null);
    clearError();

    try {
      const result = await testCredentials({
        instanceType,
        baseUrl: baseUrl.trim().replace(/\/$/, ''),
        authType,
        apiToken,
        email: authType === 'API_TOKEN' ? email : undefined,
      });

      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: '테스트 중 오류가 발생했습니다.' });
    } finally {
      setIsTesting(false);
    }
  };

  if (!currentWorkspaceId) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        워크스페이스를 먼저 선택해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.53 2c-.27 0-.48.22-.48.5v7.97c0 .28.21.5.48.5h.95c.27 0 .48-.22.48-.5V2.5c0-.28-.21-.5-.48-.5h-.95zM6.36 7.8c-.2-.2-.51-.2-.71 0L2.3 11.15c-.2.2-.2.52 0 .71l3.36 3.36c.2.2.51.2.71 0l.67-.67c.2-.2.2-.51 0-.71l-2.32-2.32 2.32-2.32c.2-.2.2-.51 0-.71l-.68-.69zM17.64 7.8c.2-.2.51-.2.71 0l3.35 3.35c.2.2.2.52 0 .71l-3.35 3.36c-.2.2-.51.2-.71 0l-.67-.67c-.2-.2-.2-.51 0-.71l2.32-2.32-2.32-2.32c-.2-.2-.2-.51 0-.71l.67-.69z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              JIRA Integration
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              JIRA 이슈를 ThreadCast로 Import
            </p>
          </div>
        </div>
        {isConnected && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Connected
          </span>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-red-600 dark:text-red-400 hover:underline mt-1"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {isConnected && integration ? (
        // Connected State
        <div className="space-y-4">
          {/* Connection Info */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">URL</span>
              <a
                href={integration.baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {integration.baseUrl}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Type</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {integration.instanceType}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Auth</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {integration.authType}
              </span>
            </div>
            {integration.email && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Email</span>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {integration.email}
                </span>
              </div>
            )}
            {integration.lastSyncAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Last Sync</span>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {new Date(integration.lastSyncAt).toLocaleString('ko-KR')}
                </span>
              </div>
            )}
          </div>

          {/* Default Project */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              기본 프로젝트
            </label>
            <select
              value={selectedProject}
              onChange={(e) => handleSetDefaultProject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading || projects.length === 0}
            >
              <option value="">프로젝트 선택...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.key}>
                  {project.key} - {project.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Import 시 기본으로 사용할 프로젝트
            </p>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            disabled={isLoading}
            className="w-full px-4 py-2 rounded-lg border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            {isLoading ? '처리 중...' : '연결 해제'}
          </button>
        </div>
      ) : (
        // Connection Form
        <div className="space-y-4">
          {/* Setup Guide */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="text-lg">📖</span>
                JIRA 연결 가이드
              </span>
              {showGuide ? (
                <ChevronUp size={18} className="text-slate-500" />
              ) : (
                <ChevronDown size={18} className="text-slate-500" />
              )}
            </button>

            {showGuide && (
              <div className="px-4 py-4 space-y-4 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/50">
                {/* Cloud vs Server */}
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                    JIRA 유형 선택
                  </h4>
                  <ul className="space-y-1.5 ml-4 list-disc">
                    <li>
                      <strong>Cloud</strong>: Atlassian에서 호스팅하는 JIRA
                      <br />
                      <span className="text-slate-500">예: https://회사이름.atlassian.net</span>
                    </li>
                    <li>
                      <strong>Server / Data Center</strong>: 자체 서버에 설치된 JIRA
                      <br />
                      <span className="text-slate-500">예: https://jira.company.com</span>
                    </li>
                  </ul>
                </div>

                {/* API Token 생성 */}
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                    API Token 생성 방법
                  </h4>

                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                        JIRA Cloud (API Token)
                      </p>
                      <ol className="list-decimal ml-4 space-y-1 text-blue-600 dark:text-blue-400">
                        <li>Atlassian 계정 페이지 접속</li>
                        <li>Security → API tokens → Create API token</li>
                        <li>토큰 이름 입력 후 생성</li>
                        <li>생성된 토큰을 복사하여 사용</li>
                      </ol>
                      <a
                        href="https://id.atlassian.com/manage-profile/security/api-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        API Token 생성 페이지
                        <ExternalLink size={14} />
                      </a>
                    </div>

                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="font-medium text-purple-700 dark:text-purple-300 mb-1">
                        JIRA Server / Data Center (PAT)
                      </p>
                      <ol className="list-decimal ml-4 space-y-1 text-purple-600 dark:text-purple-400">
                        <li>JIRA 프로필 → Personal Access Tokens</li>
                        <li>Create token 클릭</li>
                        <li>토큰 이름과 만료 기간 설정</li>
                        <li>생성된 토큰을 복사하여 사용</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* 주의사항 */}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="font-medium text-amber-700 dark:text-amber-300 mb-1">
                    ⚠️ 주의사항
                  </p>
                  <ul className="list-disc ml-4 space-y-1 text-amber-600 dark:text-amber-400">
                    <li>API Token은 생성 시에만 확인할 수 있으니 안전하게 보관하세요</li>
                    <li>토큰에 JIRA 프로젝트 읽기 권한이 있어야 합니다</li>
                    <li>Cloud의 경우 이메일은 Atlassian 계정 이메일을 입력하세요</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
          {/* Instance Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              JIRA 유형
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CLOUD', 'SERVER', 'DATA_CENTER'] as InstanceType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInstanceType(type)}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                    instanceType === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  )}
                >
                  {type === 'CLOUD' && 'Cloud'}
                  {type === 'SERVER' && 'Server'}
                  {type === 'DATA_CENTER' && 'Data Center'}
                </button>
              ))}
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              JIRA URL
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={
                instanceType === 'CLOUD'
                  ? 'https://your-domain.atlassian.net'
                  : 'https://jira.company.com'
              }
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Auth Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              인증 방식
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAuthType('API_TOKEN')}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                  authType === 'API_TOKEN'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                )}
              >
                API Token
              </button>
              <button
                type="button"
                onClick={() => setAuthType('PAT')}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                  authType === 'PAT'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                )}
              >
                Personal Access Token
              </button>
            </div>
          </div>

          {/* Email (for API Token) */}
          {authType === 'API_TOKEN' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@company.com"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* API Token / PAT */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {authType === 'API_TOKEN' ? 'API Token' : 'Personal Access Token'}
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => {
                setApiToken(e.target.value);
                setTestResult(null); // 입력 변경시 테스트 결과 초기화
              }}
              placeholder={authType === 'API_TOKEN' ? 'API Token을 입력하세요' : 'Personal Access Token을 입력하세요'}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {authType === 'API_TOKEN' ? (
                <>
                  <a
                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    API Token 생성하기
                  </a>{' '}
                  (Atlassian Account)
                </>
              ) : (
                'JIRA 설정 > Personal Access Tokens에서 생성'
              )}
            </p>
          </div>

          {/* Test Connection Button */}
          <div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !baseUrl || !apiToken || (authType === 'API_TOKEN' && !email)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  연결 테스트 중...
                </>
              ) : (
                <>🔍 연결 테스트</>
              )}
            </button>

            {/* Test Result */}
            {testResult && (
              <div
                className={clsx(
                  'mt-2 p-3 rounded-lg flex items-start gap-2',
                  testResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                )}
              >
                {testResult.success ? (
                  <CheckCircle size={18} className="text-green-500 mt-0.5" />
                ) : (
                  <XCircle size={18} className="text-red-500 mt-0.5" />
                )}
                <div>
                  <p
                    className={clsx(
                      'text-sm font-medium',
                      testResult.success
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    )}
                  >
                    {testResult.message}
                  </p>
                  {testResult.success && testResult.displayName && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      사용자: {testResult.displayName}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isConnecting}
            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isConnecting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                연결 중...
              </span>
            ) : (
              'JIRA 연결'
            )}
          </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default JiraSettingsPanel;
