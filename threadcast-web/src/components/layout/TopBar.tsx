import { Home, ArrowLeft, RefreshCw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';

export interface ViewTab {
  id: string;
  label: string;
  icon?: string;
  path: string;
}

export interface TopBarProps {
  // Navigation
  navigation?: 'home' | 'back';
  homeLink?: string;
  backLink?: string;
  backLabel?: string;

  // Title
  title: string;

  // View Switcher
  tabs?: ViewTab[];
  activeTab?: string;

  // Right side actions
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showSettings?: boolean;
  onSettingsClick?: () => void;

  // Action button
  actionLabel?: string;
  onActionClick?: () => void;
  actionDataTour?: string;

  // Extra actions (rendered before the main action button)
  extraActions?: React.ReactNode;
}

export function TopBar({
  navigation = 'home',
  homeLink = '/workspaces',
  backLink,
  backLabel,
  title,
  tabs,
  activeTab,
  onRefresh,
  isRefreshing = false,
  showSettings = true,
  onSettingsClick,
  actionLabel,
  onActionClick,
  actionDataTour,
  extraActions,
}: TopBarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 justify-between flex-shrink-0">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        {/* Navigation Button */}
        {navigation === 'home' ? (
          <button
            onClick={() => navigate(homeLink)}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Switch Workspace"
          >
            <Home size={20} />
          </button>
        ) : (
          <button
            onClick={() => backLink ? navigate(backLink) : navigate(-1)}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
            {backLabel && <span className="text-sm">{backLabel}</span>}
          </button>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-600" />

        {/* Title */}
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h1>

        {/* View Switcher */}
        {tabs && tabs.length > 0 && (
          <div className="view-switcher">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`view-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => navigate(tab.path)}
              >
                {tab.icon && <span>{tab.icon}</span>} {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw
              size={20}
              className={`text-slate-500 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        )}

        {/* Settings Button */}
        {showSettings && (
          <button
            onClick={() => onSettingsClick ? onSettingsClick() : navigate('/settings')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={t('settings.title')}
          >
            <Settings size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        )}

        {/* Extra Actions */}
        {extraActions}

        {/* Action Button */}
        {actionLabel && onActionClick && (
          <Button
            size="sm"
            onClick={onActionClick}
            data-tour={actionDataTour}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default TopBar;
