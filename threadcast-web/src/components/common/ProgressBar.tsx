import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'default',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorStyles = {
    default: 'bg-indigo-600',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  // Auto color based on percentage
  const autoColor = percentage >= 100
    ? 'success'
    : percentage >= 50
    ? 'default'
    : percentage >= 25
    ? 'warning'
    : 'danger';

  const finalColor = color === 'default' ? autoColor : color;

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-slate-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-slate-200 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500', colorStyles[finalColor])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface StepProgressProps {
  current: number;
  total: number;
  labels?: string[];
  className?: string;
}

export function StepProgress({ current, total, labels: _labels, className }: StepProgressProps) {
  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {Array.from({ length: total }).map((_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
              index < current
                ? 'bg-green-500 text-white'
                : index === current
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-500'
            )}
          >
            {index < current ? '✓' : index + 1}
          </div>
          {index < total - 1 && (
            <div
              className={clsx(
                'w-8 h-0.5 mx-1',
                index < current ? 'bg-green-500' : 'bg-slate-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
