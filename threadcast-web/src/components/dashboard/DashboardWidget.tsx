import { clsx } from 'clsx';
import type { ReactNode, HTMLAttributes } from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

export interface DashboardWidgetProps extends HTMLAttributes<HTMLDivElement> {
  /** Widget title */
  title: string;
  /** Optional icon before title */
  icon?: ReactNode;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Widget content */
  children: ReactNode;
  /** Action button on header */
  headerAction?: ReactNode;
  /** "View all" link */
  viewAllLink?: {
    label?: string;
    onClick: () => void;
  };
  /** Show more options button */
  showMoreOptions?: boolean;
  onMoreOptions?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Empty state */
  empty?: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  /** Padding inside widget */
  contentPadding?: 'none' | 'sm' | 'md' | 'lg';
  /** Max height with scroll */
  maxHeight?: string;
  /** Border accent color on left */
  accentColor?: 'indigo' | 'amber' | 'green' | 'red' | 'purple' | 'pink';
}

const accentStyles = {
  indigo: 'border-l-4 border-l-indigo-500',
  amber: 'border-l-4 border-l-amber-500',
  green: 'border-l-4 border-l-green-500',
  red: 'border-l-4 border-l-red-500',
  purple: 'border-l-4 border-l-purple-500',
  pink: 'border-l-4 border-l-pink-500',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * A container widget for dashboard sections.
 * Supports headers, actions, loading/empty states.
 */
export function DashboardWidget({
  title,
  icon,
  subtitle,
  children,
  headerAction,
  viewAllLink,
  showMoreOptions,
  onMoreOptions,
  loading,
  empty,
  contentPadding = 'md',
  maxHeight,
  accentColor,
  className,
  ...props
}: DashboardWidgetProps) {
  const isEmpty = empty && !loading;

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-slate-200 overflow-hidden',
        accentColor && accentStyles[accentColor],
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {headerAction}
          {viewAllLink && (
            <button
              onClick={viewAllLink.onClick}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              {viewAllLink.label || 'View all'}
              <ChevronRight size={16} />
            </button>
          )}
          {showMoreOptions && (
            <button
              onClick={onMoreOptions}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <MoreHorizontal size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className={clsx(paddingStyles[contentPadding], maxHeight && 'overflow-y-auto')}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {empty.icon && <div className="text-4xl mb-3">{empty.icon}</div>}
            <p className="text-slate-900 font-medium">{empty.title}</p>
            {empty.description && (
              <p className="text-sm text-slate-500 mt-1">{empty.description}</p>
            )}
            {empty.action && (
              <button
                onClick={empty.action.onClick}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {empty.action.label}
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/**
 * A list item component for use inside DashboardWidget.
 */
export interface DashboardWidgetListItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Left content/icon */
  left?: ReactNode;
  /** Main title */
  title: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Right side content (badge, action, etc.) */
  right?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Highlight state */
  highlight?: boolean;
  /** Border between items */
  showBorder?: boolean;
}

export function DashboardWidgetListItem({
  left,
  title,
  subtitle,
  right,
  onClick,
  highlight,
  showBorder = true,
  className,
  ...props
}: DashboardWidgetListItemProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-3 py-3',
        showBorder && 'border-b border-slate-100 last:border-b-0',
        highlight && 'bg-amber-50 -mx-4 px-4',
        onClick && 'cursor-pointer hover:bg-slate-50 -mx-4 px-4 transition-colors',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {left && <div className="flex-shrink-0">{left}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}
