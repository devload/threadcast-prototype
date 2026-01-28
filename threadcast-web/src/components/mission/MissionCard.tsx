import { clsx } from 'clsx';
import { MoreHorizontal, CheckSquare } from 'lucide-react';
import type { Mission, MissionStatus, Priority } from '../../types';

interface MissionCardProps {
  mission: Mission;
  onClick?: () => void;
  onMenuClick?: () => void;
  selected?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  aiQuestionCount?: number;
}

const statusDotColors: Record<MissionStatus, string> = {
  BACKLOG: 'bg-slate-400',
  PENDING: 'bg-slate-400',
  THREADING: 'bg-amber-500 status-dot-pulse',
  IN_PROGRESS: 'bg-amber-500 status-dot-pulse',
  WOVEN: 'bg-green-500',
  COMPLETED: 'bg-green-500',
  TANGLED: 'bg-red-500',
  ARCHIVED: 'bg-purple-500',
  SKIPPED: 'bg-slate-300',
};

const priorityTags: Record<Priority, { label: string; className: string }> = {
  CRITICAL: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
  HIGH: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  MEDIUM: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
  LOW: { label: 'Low', className: 'bg-blue-100 text-blue-700' },
};

export function MissionCard({
  mission,
  onClick,
  onMenuClick,
  selected,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  aiQuestionCount = 0,
}: MissionCardProps) {
  const { id, title, description, status, priority, progress, todoStats, tags } = mission;
  const hasAIQuestion = aiQuestionCount > 0;

  const completedTodos = todoStats.woven;
  const totalTodos = todoStats.total;
  const isThreading = status === 'THREADING' || status === 'IN_PROGRESS';

  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 border rounded-lg p-4 card-interactive group',
        hasAIQuestion
          ? 'border-pink-400 border-2 bg-gradient-to-br from-pink-50/30 to-purple-50/30 dark:from-pink-950/30 dark:to-purple-950/30'
          : 'border-slate-200 dark:border-slate-700',
        selected && 'ring-2 ring-indigo-500',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 scale-105 rotate-2 shadow-lg'
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          MISSION-{id.slice(-4).toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full', statusDotColors[status])} />
          {onMenuClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMenuClick();
              }}
              className="p-1 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal size={14} className="text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-[15px] leading-snug mb-2 line-clamp-2 break-words">
        {title}
      </h3>

      {/* AI Question Badge */}
      {hasAIQuestion && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-2 rounded-md bg-gradient-to-r from-pink-100/80 to-purple-100/80 dark:from-pink-900/50 dark:to-purple-900/50">
          <span className="text-sm animate-pulse">🤔</span>
          <span className="text-[11px] font-semibold text-pink-600 dark:text-pink-400">AI 질문 대기 중</span>
          <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {aiQuestionCount}
          </span>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed break-words">
          {description}
        </p>
      )}

      {/* Progress */}
      <div className="mb-2.5">
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-300',
              isThreading ? 'progress-gradient' : 'bg-green-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{completedTodos}/{totalTodos} woven</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <CheckSquare size={12} />
          <span>{totalTodos} todos</span>
        </div>
      </div>

      {/* Tags */}
      {((tags && tags.length > 0) || priority) && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {priority && (priority === 'CRITICAL' || priority === 'HIGH') && (
            <span className={clsx(
              'px-2 py-0.5 rounded-full text-[10px] font-medium',
              priorityTags[priority].className
            )}>
              {priorityTags[priority].label}
            </span>
          )}
          {tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Skeleton for loading state
export function MissionCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="w-20 h-3 bg-slate-200 rounded" />
        <div className="w-2 h-2 bg-slate-200 rounded-full" />
      </div>
      <div className="h-5 bg-slate-200 rounded mb-2 w-3/4" />
      <div className="h-4 bg-slate-200 rounded mb-3 w-full" />
      <div className="h-1.5 bg-slate-200 rounded-full mb-1.5" />
      <div className="flex justify-between mb-2">
        <div className="w-16 h-3 bg-slate-200 rounded" />
        <div className="w-8 h-3 bg-slate-200 rounded" />
      </div>
      <div className="flex gap-1.5">
        <div className="w-12 h-4 bg-slate-200 rounded-full" />
        <div className="w-14 h-4 bg-slate-200 rounded-full" />
      </div>
    </div>
  );
}
