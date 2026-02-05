import { useEffect } from 'react';
import { clsx } from 'clsx';
import { Cpu, Loader2, AlertCircle } from 'lucide-react';
import { usePmAgentStore } from '../../stores/pmAgentStore';
import { useUIStore } from '../../stores/uiStore';
import { useTranslation } from '../../hooks/useTranslation';

interface PmAgentStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function PmAgentStatusIndicator({
  className,
  showLabel = true,
}: PmAgentStatusIndicatorProps) {
  const { currentWorkspaceId } = useUIStore();
  const { status, online, agentInfo, isLoading, fetchStatus } = usePmAgentStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchStatus(currentWorkspaceId);

      // Poll every 30 seconds
      const interval = setInterval(() => {
        fetchStatus(currentWorkspaceId);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentWorkspaceId, fetchStatus]);

  const getStatusConfig = () => {
    if (isLoading) {
      return {
        color: 'text-slate-400',
        bgColor: 'bg-slate-100 dark:bg-slate-700',
        dotColor: 'bg-slate-400',
        label: t('pmAgent.checking'),
        icon: <Loader2 size={14} className="animate-spin" />,
      };
    }

    if (!online || status === 'DISCONNECTED') {
      return {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/30',
        dotColor: 'bg-red-500',
        label: t('pmAgent.needsConnection'),
        icon: <AlertCircle size={14} />,
      };
    }

    if (status === 'WORKING') {
      return {
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/30',
        dotColor: 'bg-blue-500 animate-pulse',
        label: agentInfo?.currentTodoTitle
          ? t('pmAgent.workingOn', { title: agentInfo.currentTodoTitle.slice(0, 20) })
          : t('pmAgent.working'),
        icon: <Cpu size={14} />,
      };
    }

    // CONNECTED
    return {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      dotColor: 'bg-green-500',
      label: t('pmAgent.ready'),
      icon: <Cpu size={14} />,
    };
  };

  const config = getStatusConfig();

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
        config.bgColor,
        config.color,
        className
      )}
      title={
        agentInfo
          ? `${agentInfo.label || 'PM Agent'} (${agentInfo.machineId})`
          : 'PM Agent'
      }
    >
      <span className={clsx('w-2 h-2 rounded-full', config.dotColor)} />
      {config.icon}
      {showLabel && <span>{config.label}</span>}
      {status === 'WORKING' && agentInfo?.activeTodoCount && agentInfo.activeTodoCount > 0 && (
        <span className="ml-1 px-1.5 py-0.5 bg-white/50 dark:bg-slate-800/50 rounded text-[10px]">
          {t('count.items', { count: agentInfo.activeTodoCount.toString() })}
        </span>
      )}
    </div>
  );
}

/**
 * Compact version for tight spaces
 */
export function PmAgentStatusDot({ className }: { className?: string }) {
  const { status, online, isLoading } = usePmAgentStore();
  const { t } = useTranslation();

  const getDotColor = () => {
    if (isLoading) return 'bg-slate-400';
    if (!online || status === 'DISCONNECTED') return 'bg-red-500';
    if (status === 'WORKING') return 'bg-blue-500 animate-pulse';
    return 'bg-green-500';
  };

  const getTitle = () => {
    if (isLoading) return t('pmAgent.statusChecking');
    if (!online || status === 'DISCONNECTED') return t('pmAgent.notConnected');
    if (status === 'WORKING') return t('pmAgent.working');
    return t('pmAgent.connected');
  };

  return (
    <span
      className={clsx('w-2.5 h-2.5 rounded-full', getDotColor(), className)}
      title={getTitle()}
    />
  );
}
