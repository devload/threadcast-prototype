import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useUIStore } from '../../stores/uiStore';

interface SentrySettingsPanelProps {
  onBack: () => void;
}

interface SentryIntegration {
  organizationSlug: string;
  projectSlug: string;
  connected: boolean;
  lastSyncAt?: string;
}

interface TestResult {
  success: boolean;
  message: string;
  organizationName?: string;
}

export function SentrySettingsPanel({ onBack }: SentrySettingsPanelProps) {
  const { currentWorkspaceId } = useUIStore();

  // Integration state
  const [integration, setIntegration] = useState<SentryIntegration | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [authToken, setAuthToken] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [projectSlug, setProjectSlug] = useState('');

  // Test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Load status on mount
  useEffect(() => {
    if (currentWorkspaceId) {
      fetchStatus();
    }
  }, [currentWorkspaceId]);

  const fetchStatus = async () => {
    if (!currentWorkspaceId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sentry/status?workspaceId=${currentWorkspaceId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setIntegration(data.data);
          setIsConnected(data.data.connected);
        }
      }
    } catch {
      // Not connected yet
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!authToken || !organizationSlug) return;

    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await fetch('/api/sentry/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authToken,
          organizationSlug,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: '연결 성공!',
          organizationName: data.data?.organizationName,
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || '연결 실패',
        });
      }
    } catch {
      setTestResult({ success: false, message: '테스트 중 오류가 발생했습니다.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sentry/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspaceId,
          authToken,
          organizationSlug,
          projectSlug: projectSlug || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setIntegration(data.data);
        setIsConnected(true);
        setAuthToken('');
      } else {
        setError(data.message || '연결에 실패했습니다.');
      }
    } catch {
      setError('연결 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentWorkspaceId) return;
    if (!window.confirm('Sentry 연결을 해제하시겠습니까?')) return;

    setIsLoading(true);
    try {
      await fetch(`/api/sentry/disconnect?workspaceId=${currentWorkspaceId}`, {
        method: 'DELETE',
      });
      setIntegration(null);
      setIsConnected(false);
    } catch {
      setError('연결 해제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
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
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-500" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Sentry Integration
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              에러 모니터링 연동
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
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {isConnected && integration ? (
        // Connected State
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Organization</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {integration.organizationSlug}
              </span>
            </div>
            {integration.projectSlug && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Project</span>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {integration.projectSlug}
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

          <a
            href={`https://sentry.io/organizations/${integration.organizationSlug}/issues/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ExternalLink size={16} />
            Sentry 대시보드 열기
          </a>

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
        <form onSubmit={handleConnect} className="space-y-4">
          {/* Auth Token Guide */}
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-2 font-medium">
              Auth Token 생성 방법
            </p>
            <ol className="list-decimal ml-4 space-y-1 text-sm text-purple-600 dark:text-purple-400">
              <li>Sentry 설정 → Auth Tokens 이동</li>
              <li>Create New Token 클릭</li>
              <li>project:read, org:read 권한 선택</li>
              <li>생성된 토큰 복사</li>
            </ol>
            <a
              href="https://sentry.io/settings/auth-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-purple-600 dark:text-purple-400 hover:underline text-sm"
            >
              Auth Token 생성 페이지
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Auth Token */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Auth Token
            </label>
            <input
              type="password"
              value={authToken}
              onChange={(e) => {
                setAuthToken(e.target.value);
                setTestResult(null);
              }}
              placeholder="sntrys_..."
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Organization Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Organization Slug
            </label>
            <input
              type="text"
              value={organizationSlug}
              onChange={(e) => setOrganizationSlug(e.target.value)}
              placeholder="your-org"
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Sentry URL에서 확인: sentry.io/organizations/<strong>your-org</strong>/
            </p>
          </div>

          {/* Project Slug (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Project Slug <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={projectSlug}
              onChange={(e) => setProjectSlug(e.target.value)}
              placeholder="my-project"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              특정 프로젝트만 연동하려면 입력 (비우면 전체)
            </p>
          </div>

          {/* Test Connection */}
          <div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !authToken || !organizationSlug}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  연결 테스트 중...
                </>
              ) : (
                '연결 테스트'
              )}
            </button>

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
                  {testResult.organizationName && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Organization: {testResult.organizationName}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Connect Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                연결 중...
              </span>
            ) : (
              'Sentry 연결'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
