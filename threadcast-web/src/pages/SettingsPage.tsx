import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Copy, Check, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from '../hooks/useTranslation';
import { useUIStore, type Language } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { JiraSettingsPanel } from '../components/jira';
import { SentrySettingsPanel } from '../components/settings/SentrySettingsPanel';
import { Logo } from '../components/common/Logo';

type SettingsTab = 'general' | 'integrations';
type IntegrationView = null | 'jira' | 'sentry';

export function SettingsPage() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useUIStore();
  const { isAuthenticated, isLoading: authLoading, fetchUser, user, logout } = useAuthStore();

  // Parse hash from URL (예: #integrations, #integrations/jira)
  const parseHash = useCallback((): { tab: SettingsTab; integration: IntegrationView } => {
    const hash = window.location.hash.slice(1); // Remove '#'
    if (!hash) return { tab: 'general', integration: null };

    const parts = hash.split('/');
    const tab = (parts[0] === 'integrations' ? 'integrations' : 'general') as SettingsTab;
    const integration = parts[1] as IntegrationView || null;

    return { tab, integration };
  }, []);

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => parseHash().tab);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationView>(() => parseHash().integration);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [configCopied, setConfigCopied] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get access token from localStorage
  const accessToken = localStorage.getItem('accessToken') || '';

  const handleCopyToken = async () => {
    await navigator.clipboard.writeText(accessToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const getMcpConfig = () => {
    return JSON.stringify({
      "mcpServers": {
        "threadcast": {
          "command": "npx",
          "args": ["-y", "threadcast-mcp"],
          "env": {
            "THREADCAST_API_URL": "https://api.threadcast.io",
            "THREADCAST_TOKEN": accessToken
          }
        }
      }
    }, null, 2);
  };

  const handleCopyConfig = async () => {
    await navigator.clipboard.writeText(getMcpConfig());
    setConfigCopied(true);
    setTimeout(() => setConfigCopied(false), 2000);
  };

  // Hash 변경 함수
  const updateHash = useCallback((tab: SettingsTab, integration?: IntegrationView) => {
    let hash: string = tab;
    if (tab === 'integrations' && integration) {
      hash = `${tab}/${integration}`;
    }
    window.history.replaceState(null, '', `#${hash}`);
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tab: SettingsTab) => {
    setActiveTab(tab);
    setSelectedIntegration(null);
    updateHash(tab);
  }, [updateHash]);

  // Integration 선택 핸들러
  const handleIntegrationSelect = useCallback((integration: IntegrationView) => {
    setSelectedIntegration(integration);
    if (integration) {
      updateHash('integrations', integration);
    } else {
      updateHash('integrations');
    }
  }, [updateHash]);

  // Hash 변경 감지 (브라우저 뒤로가기/앞으로가기)
  useEffect(() => {
    const handleHashChange = () => {
      const { tab, integration } = parseHash();
      setActiveTab(tab);
      setSelectedIntegration(integration);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [parseHash]);

  // Check auth on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'general', label: t('settings.general') || '일반', icon: '⚙️' },
    { id: 'integrations', label: t('settings.integrations') || '연동', icon: '🔗' },
  ];

  const languageOptions: { value: Language; label: string; flag: string }[] = [
    { value: 'ko', label: t('settings.languageKo'), flag: '🇰🇷' },
    { value: 'en', label: t('settings.languageEn'), flag: '🇺🇸' },
  ];

  const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: string }[] = [
    { value: 'light', label: t('settings.themeLight'), icon: '☀️' },
    { value: 'dark', label: t('settings.themeDark'), icon: '🌙' },
    { value: 'system', label: t('settings.themeSystem'), icon: '💻' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header - HomePage와 동일한 스타일 */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-8 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/workspaces')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <span>🏠</span> Workspaces
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 hidden sm:block">
                  {user?.name || 'User'}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={18} />
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-8 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('settings.title')} ⚙️
          </h1>
        </div>

        <div className="max-w-4xl flex gap-8">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0">
            <nav className="space-y-1 sticky top-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              {activeTab === 'general' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                      {t('settings.general')}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('settings.generalDesc')}
                    </p>
                  </div>

                  {/* Language Setting */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      {t('settings.language')}
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      {languageOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setLanguage(option.value)}
                          className={clsx(
                            'flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all',
                            language === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300'
                          )}
                        >
                          <span className="text-2xl">{option.flag}</span>
                          <span className="font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Setting */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      {t('settings.theme')}
                    </label>
                    <div className="grid grid-cols-3 gap-3 max-w-md">
                      {themeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTheme(option.value)}
                          className={clsx(
                            'flex flex-col items-center gap-2 px-4 py-4 rounded-lg border-2 transition-all',
                            theme === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300'
                          )}
                        >
                          <span className="text-2xl">{option.icon}</span>
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* API Token Section */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                      🔑 {t('settings.apiToken')}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      {t('settings.apiTokenDesc')}
                    </p>

                    {/* Token Display */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          {t('settings.accessToken')}
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <input
                              type={showToken ? 'text' : 'password'}
                              value={accessToken}
                              readOnly
                              className="w-full px-3 py-2 pr-20 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-mono text-slate-700 dark:text-slate-300"
                            />
                            <button
                              onClick={() => setShowToken(!showToken)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              title={showToken ? t('settings.hide') : t('settings.show')}
                            >
                              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <button
                            onClick={handleCopyToken}
                            className={clsx(
                              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                              tokenCopied
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                            )}
                          >
                            {tokenCopied ? <Check size={16} /> : <Copy size={16} />}
                            {tokenCopied ? t('settings.copied') : t('settings.copy')}
                          </button>
                        </div>
                      </div>

                      {/* MCP Config */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            {t('settings.mcpConfig')}
                          </label>
                          <button
                            onClick={handleCopyConfig}
                            className={clsx(
                              'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all',
                              configCopied
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                            )}
                          >
                            {configCopied ? <Check size={12} /> : <Copy size={12} />}
                            {configCopied ? t('settings.copied') : t('settings.copyConfig')}
                          </button>
                        </div>
                        <pre className="p-4 bg-slate-900 dark:bg-slate-950 rounded-lg text-xs text-green-400 overflow-x-auto">
                          <code>{getMcpConfig()}</code>
                        </pre>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {t('settings.mcpConfigHint')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                      {t('settings.integrations')}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('settings.integrationsDesc')}
                    </p>
                  </div>

                  {!selectedIntegration ? (
                    // Integration List
                    <div className="space-y-3">
                      {/* JIRA */}
                      <button
                        onClick={() => handleIntegrationSelect('jira')}
                        className="w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z"/>
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            JIRA
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            이슈 트래킹 시스템 연동
                          </p>
                        </div>
                        <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </button>

                      {/* Sentry */}
                      <button
                        onClick={() => handleIntegrationSelect('sentry')}
                        className="w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                          <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13.91 2.505c-.873-1.448-2.972-1.448-3.844 0L6.53 8.893a2.182 2.182 0 0 1 1.882 1.09l.58.985a6.55 6.55 0 0 1 5.996 5.94h1.635A8.223 8.223 0 0 0 8.88 9.12l-.39-.663 3.093-5.28 3.496 5.97a12.36 12.36 0 0 1 6.098 10.762h1.635A13.972 13.972 0 0 0 15.906 8.88zm-9.842 10.68a4.248 4.248 0 0 1 3.09 3.725H3.57a2.182 2.182 0 0 1-1.93-3.275z"/>
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            Sentry
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            에러 모니터링 시스템 연동
                          </p>
                        </div>
                        <ChevronRight size={20} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
                      </button>
                    </div>
                  ) : selectedIntegration === 'jira' ? (
                    // JIRA Settings
                    <div className="space-y-4">
                      <button
                        onClick={() => handleIntegrationSelect(null)}
                        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <ChevronRight size={16} className="rotate-180" />
                        연동 목록으로 돌아가기
                      </button>
                      <JiraSettingsPanel />
                    </div>
                  ) : (
                    // Sentry Settings
                    <SentrySettingsPanel onBack={() => handleIntegrationSelect(null)} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
