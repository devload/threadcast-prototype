import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export type IntegrationType = 'jira' | 'sentry';

interface Integration {
  id: IntegrationType;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  comingSoon?: boolean;
}

interface IntegrationsListPanelProps {
  integrations: Integration[];
  onSelect: (id: IntegrationType) => void;
}

export function IntegrationsListPanel({ integrations, onSelect }: IntegrationsListPanelProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        외부 서비스와 연동하여 ThreadCast를 더 강력하게 사용하세요.
      </p>

      {integrations.map((integration) => (
        <button
          key={integration.id}
          onClick={() => !integration.comingSoon && onSelect(integration.id)}
          disabled={integration.comingSoon}
          className={clsx(
            'w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left',
            integration.comingSoon
              ? 'border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          )}
        >
          {/* Icon */}
          <div className={clsx(
            'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
            integration.id === 'jira' && 'bg-blue-100 dark:bg-blue-900/30',
            integration.id === 'sentry' && 'bg-purple-100 dark:bg-purple-900/30'
          )}>
            {integration.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 dark:text-white">
                {integration.name}
              </span>
              {integration.comingSoon && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  Coming Soon
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {integration.description}
            </p>
          </div>

          {/* Status & Arrow */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {integration.connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Connected
              </span>
            ) : !integration.comingSoon && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Not connected
              </span>
            )}
            {!integration.comingSoon && (
              <ChevronRight size={20} className="text-slate-400" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
