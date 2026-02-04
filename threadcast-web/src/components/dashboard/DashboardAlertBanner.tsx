import { clsx } from 'clsx';
import type { ReactNode, HTMLAttributes } from 'react';
import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';

export interface DashboardAlertBannerProps extends HTMLAttributes<HTMLDivElement> {
  /** Alert type determines color scheme */
  type?: 'info' | 'success' | 'warning' | 'error' | 'ai';
  /** Optional icon (defaults based on type) */
  icon?: ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Optional badge/count indicator */
  badge?: ReactNode;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Dismissible */
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Tags or additional info */
  tags?: Array<{
    label: string;
    onClick?: () => void;
  }>;
}

const typeStyles = {
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    action: 'bg-blue-500 hover:bg-blue-600',
  },
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    title: 'text-green-800',
    action: 'bg-green-500 hover:bg-green-600',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    title: 'text-amber-800',
    action: 'bg-amber-500 hover:bg-amber-600',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-800',
    action: 'bg-red-500 hover:bg-red-600',
  },
  ai: {
    container: 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200',
    icon: 'text-pink-600',
    title: 'text-pink-700',
    action: 'bg-pink-500 hover:bg-pink-600',
  },
};

const defaultIcons = {
  info: <Info size={24} />,
  success: <CheckCircle size={24} />,
  warning: <AlertTriangle size={24} />,
  error: <AlertCircle size={24} />,
  ai: <span className="text-2xl">🤔</span>,
};

/**
 * An alert banner component for important notifications on dashboards.
 * Supports different types (info, success, warning, error, ai).
 */
export function DashboardAlertBanner({
  type = 'info',
  icon,
  title,
  description,
  badge,
  action,
  dismissible,
  onDismiss,
  tags,
  className,
  ...props
}: DashboardAlertBannerProps) {
  const styles = typeStyles[type];
  const displayIcon = icon ?? defaultIcons[type];

  return (
    <div
      className={clsx(
        'rounded-xl border p-4 flex items-start gap-4',
        styles.container,
        className
      )}
      {...props}
    >
      {/* Icon */}
      <div className={clsx('flex-shrink-0 relative', styles.icon)}>
        {displayIcon}
        {badge && (
          <div className="absolute -top-1 -right-1">
            {badge}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={clsx('font-semibold', styles.title)}>{title}</div>
        {description && (
          <p className="text-sm text-slate-600 mt-1">{description}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={clsx(
                  'px-2 py-1 rounded text-xs font-medium',
                  type === 'ai'
                    ? 'bg-pink-100 text-pink-600'
                    : 'bg-white/50 text-slate-600',
                  tag.onClick && 'cursor-pointer hover:opacity-80'
                )}
                onClick={tag.onClick}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {action && (
          <button
            onClick={action.onClick}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors',
              styles.action
            )}
          >
            {action.label}
          </button>
        )}
        {dismissible && (
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-black/5 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * A simple notification badge for use with alert banners.
 */
export interface NotificationBadgeProps {
  count: number;
  animate?: boolean;
}

export function NotificationBadge({ count, animate = true }: NotificationBadgeProps) {
  return (
    <span
      className={clsx(
        'w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center',
        animate && 'animate-pulse'
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
