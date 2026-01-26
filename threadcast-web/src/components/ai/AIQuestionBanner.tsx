import { clsx } from 'clsx';
import { AlertCircle, ChevronRight, X } from 'lucide-react';

export interface AIQuestionBannerProps {
  count: number;
  urgentCount?: number;
  onClick?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function AIQuestionBanner({
  count,
  urgentCount = 0,
  onClick,
  onDismiss,
  className,
}: AIQuestionBannerProps) {
  if (count === 0) return null;

  return (
    <div
      className={clsx(
        'flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all',
        urgentCount > 0
          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
          : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-lg">🤔</span>
        </div>
        <div>
          <p className="text-sm font-semibold">
            {count} question{count > 1 ? 's' : ''} waiting for your answer
          </p>
          {urgentCount > 0 && (
            <p className="text-xs text-white/80">
              {urgentCount} urgent
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium flex items-center gap-1">
          Answer now
          <ChevronRight size={16} />
        </span>
        {onDismiss && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// Compact inline version
export interface AIQuestionInlineProps {
  count: number;
  onClick?: () => void;
}

export function AIQuestionInline({ count, onClick }: AIQuestionInlineProps) {
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-lg text-xs font-medium hover:bg-pink-100 transition-colors"
    >
      <AlertCircle size={14} />
      <span>{count} question{count > 1 ? 's' : ''} pending</span>
      <ChevronRight size={14} />
    </button>
  );
}

// Small badge for cards
export interface AIQuestionDotProps {
  count: number;
  size?: 'sm' | 'md';
}

export function AIQuestionDot({ count, size = 'sm' }: AIQuestionDotProps) {
  if (count === 0) return null;

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full bg-pink-500 text-white font-semibold',
        size === 'sm' ? 'w-4 h-4 text-[10px]' : 'w-5 h-5 text-xs'
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
