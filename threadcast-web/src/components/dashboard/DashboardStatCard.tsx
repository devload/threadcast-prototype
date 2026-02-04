import { clsx } from 'clsx';
import type { ReactNode, HTMLAttributes } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface DashboardStatCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Main value to display */
  value: string | number;
  /** Label describing the value */
  label: string;
  /** Icon to display */
  icon?: ReactNode;
  /** Background color for icon container */
  iconBg?: 'indigo' | 'amber' | 'green' | 'red' | 'purple' | 'pink' | 'blue' | 'gray';
  /** Optional sub-value or additional info */
  subValue?: string;
  /** Change indicator */
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    label?: string;
  };
  /** Highlight style for urgent items */
  highlight?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler */
  onClick?: () => void;
}

const iconBgStyles = {
  indigo: 'bg-indigo-100 text-indigo-600',
  amber: 'bg-amber-100 text-amber-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  pink: 'bg-pink-100 text-pink-600',
  blue: 'bg-blue-100 text-blue-600',
  gray: 'bg-gray-100 text-gray-600',
};

const sizeStyles = {
  sm: {
    container: 'p-3',
    icon: 'w-8 h-8 text-lg',
    value: 'text-lg font-bold',
    label: 'text-xs',
  },
  md: {
    container: 'p-4',
    icon: 'w-10 h-10 text-xl',
    value: 'text-2xl font-bold',
    label: 'text-sm',
  },
  lg: {
    container: 'p-5',
    icon: 'w-12 h-12 text-2xl',
    value: 'text-3xl font-bold',
    label: 'text-base',
  },
};

/**
 * A stat card component for displaying metrics on dashboards.
 * Supports icons, trend indicators, and highlighting.
 */
export function DashboardStatCard({
  value,
  label,
  icon,
  iconBg = 'indigo',
  subValue,
  change,
  highlight = false,
  size = 'md',
  onClick,
  className,
  ...props
}: DashboardStatCardProps) {
  const styles = sizeStyles[size];

  const ChangeIcon = change?.type === 'increase'
    ? TrendingUp
    : change?.type === 'decrease'
    ? TrendingDown
    : Minus;

  const changeColorClass = change?.type === 'increase'
    ? 'text-green-600'
    : change?.type === 'decrease'
    ? 'text-red-600'
    : 'text-gray-500';

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border transition-all',
        highlight ? 'border-amber-300 shadow-sm shadow-amber-100' : 'border-slate-200',
        onClick && 'cursor-pointer hover:border-indigo-300 hover:shadow-sm',
        styles.container,
        className
      )}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={clsx(
              'rounded-xl flex items-center justify-center flex-shrink-0',
              iconBgStyles[iconBg],
              styles.icon
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={clsx('text-slate-900', styles.value)}>{value}</div>
          <div className={clsx('text-slate-500', styles.label)}>{label}</div>
        </div>
      </div>

      {(subValue || change) && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          {subValue && (
            <span
              className={clsx(
                'text-xs',
                highlight ? 'text-amber-600 font-medium' : 'text-slate-400'
              )}
            >
              {subValue}
            </span>
          )}
          {change && (
            <div className={clsx('flex items-center gap-1 text-xs', changeColorClass)}>
              <ChangeIcon size={14} />
              <span className="font-medium">
                {change.type === 'increase' ? '+' : change.type === 'decrease' ? '-' : ''}
                {Math.abs(change.value)}%
              </span>
              {change.label && <span className="text-slate-400">{change.label}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
