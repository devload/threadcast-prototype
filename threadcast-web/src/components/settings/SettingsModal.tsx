import { useState, useEffect } from 'react';
import { Modal } from '../feedback/Modal';
import { useTranslation } from '../../hooks/useTranslation';
import { useUIStore, type Language } from '../../stores/uiStore';
import { useJiraStore } from '../../stores/jiraStore';
import { JiraSettingsPanel } from '../jira';
import { IntegrationsListPanel, type IntegrationType } from './IntegrationsListPanel';
import { SentrySettingsPanel } from './SentrySettingsPanel';
import { ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

type SettingsTab = 'general' | 'integrations';
type IntegrationView = 'list' | IntegrationType;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// JIRA Icon Component
function JiraIcon() {
  return (
    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.53 2c-.27 0-.48.22-.48.5v7.97c0 .28.21.5.48.5h.95c.27 0 .48-.22.48-.5V2.5c0-.28-.21-.5-.48-.5h-.95zM6.36 7.8c-.2-.2-.51-.2-.71 0L2.3 11.15c-.2.2-.2.52 0 .71l3.36 3.36c.2.2.51.2.71 0l.67-.67c.2-.2.2-.51 0-.71l-2.32-2.32 2.32-2.32c.2-.2.2-.51 0-.71l-.68-.69zM17.64 7.8c.2-.2.51-.2.71 0l3.35 3.35c.2.2.2.52 0 .71l-3.35 3.36c-.2.2-.51.2-.71 0l-.67-.67c-.2-.2-.2-.51 0-.71l2.32-2.32-2.32-2.32c-.2-.2-.2-.51 0-.71l.67-.69z" />
    </svg>
  );
}

// Sentry Icon Component
function SentryIcon() {
  return (
    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.91 2.16c-.54-.94-1.89-.94-2.43 0L6.73 10.2a1.4 1.4 0 000 1.4l1.62 2.8a8.17 8.17 0 014.33-6.55l-.75-1.3a6.1 6.1 0 00-3.24 5.32H7.36l-.6-1.04L11.3 3.9a.47.47 0 01.81 0l6.6 11.44-.6 1.04h-2.86a3.88 3.88 0 01-1.64 2.08h5.1a1.4 1.4 0 001.22-.7l1.62-2.81a1.4 1.4 0 000-1.4l-6.64-11.5z"/>
      <path d="M12.5 14.5a2 2 0 11-4 0 2 2 0 014 0z"/>
    </svg>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme, currentWorkspaceId } = useUIStore();
  const { isConnected: jiraConnected, fetchStatus: fetchJiraStatus } = useJiraStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [integrationView, setIntegrationView] = useState<IntegrationView>('list');
  const [sentryConnected, setSentryConnected] = useState(false);

  // Reset integration view when tab changes or modal closes
  useEffect(() => {
    if (activeTab !== 'integrations') {
      setIntegrationView('list');
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isOpen) {
      setIntegrationView('list');
    }
  }, [isOpen]);

  // Fetch integration statuses
  useEffect(() => {
    if (isOpen && currentWorkspaceId) {
      fetchJiraStatus(currentWorkspaceId);
      // Fetch Sentry status
      fetch(`/api/sentry/status?workspaceId=${currentWorkspaceId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.data?.connected) {
            setSentryConnected(true);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, currentWorkspaceId, fetchJiraStatus]);

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

  const integrations = [
    {
      id: 'jira' as IntegrationType,
      name: 'JIRA',
      description: 'JIRA 이슈를 ThreadCast로 Import',
      icon: <JiraIcon />,
      connected: jiraConnected,
    },
    {
      id: 'sentry' as IntegrationType,
      name: 'Sentry',
      description: '에러 모니터링 및 Issue Import',
      icon: <SentryIcon />,
      connected: sentryConnected,
    },
  ];

  const handleIntegrationSelect = (id: IntegrationType) => {
    setIntegrationView(id);
  };

  const handleBackToList = () => {
    setIntegrationView('list');
    // Refresh statuses
    if (currentWorkspaceId) {
      fetchJiraStatus(currentWorkspaceId);
      fetch(`/api/sentry/status?workspaceId=${currentWorkspaceId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setSentryConnected(data?.data?.connected || false))
        .catch(() => {});
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.title')}
      size="lg"
    >
      <div className="flex gap-4">
        {/* Tab Navigation */}
        <div className="w-40 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 pr-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-[400px]">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Language Setting */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  {t('settings.language')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {languageOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLanguage(option.value)}
                      className={clsx(
                        'flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                        language === option.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300'
                      )}
                    >
                      <span className="text-xl">{option.flag}</span>
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
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={clsx(
                        'flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all',
                        theme === option.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300'
                      )}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-xs font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <>
              {integrationView === 'list' && (
                <IntegrationsListPanel
                  integrations={integrations}
                  onSelect={handleIntegrationSelect}
                />
              )}
              {integrationView === 'jira' && (
                <div className="space-y-4">
                  <button
                    onClick={handleBackToList}
                    className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <ArrowLeft size={16} />
                    연동 목록으로
                  </button>
                  <JiraSettingsPanel onClose={onClose} />
                </div>
              )}
              {integrationView === 'sentry' && (
                <SentrySettingsPanel onBack={handleBackToList} />
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
