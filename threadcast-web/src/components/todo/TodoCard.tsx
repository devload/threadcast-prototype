import { clsx } from 'clsx';
import { MoreHorizontal, Clock, ChevronRight } from 'lucide-react';
import type { Todo, TodoStatus, StepType } from '../../types';

interface TodoCardProps {
  todo: Todo;
  onClick?: () => void;
  onMenuClick?: () => void;
  selected?: boolean;
  highlighted?: boolean;
  showSteps?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  aiQuestionCount?: number;
  onAIQuestionClick?: () => void;
}

const statusDotColors: Record<TodoStatus, string> = {
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

const complexityBadge: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'complexity-low' },
  MEDIUM: { label: 'Medium', className: 'complexity-medium' },
  HIGH: { label: 'High', className: 'complexity-high' },
};

const stepLabels: Record<StepType, string> = {
  ANALYSIS: 'Analysis',
  DESIGN: 'Design',
  IMPLEMENTATION: 'Implementation',
  VERIFICATION: 'Verification',
  REVIEW: 'Review',
  INTEGRATION: 'Integration',
};

const stepOrder: StepType[] = ['ANALYSIS', 'DESIGN', 'IMPLEMENTATION', 'VERIFICATION', 'REVIEW', 'INTEGRATION'];

export function TodoCard({
  todo,
  onClick,
  onMenuClick,
  selected,
  highlighted = false,
  showSteps = true,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  aiQuestionCount = 0,
  onAIQuestionClick,
}: TodoCardProps) {
  const { id, title, description, status, steps, estimatedTime, complexity } = todo;
  const hasAIQuestion = aiQuestionCount > 0;

  const completedSteps = steps?.filter((s) => s.status === 'COMPLETED').length ?? 0;
  const currentStep = steps?.find((s) => s.status === 'IN_PROGRESS');
  const totalSteps = steps?.length ?? 6;
  const isThreading = status === 'THREADING' || status === 'IN_PROGRESS';

  // Sort steps by order
  const sortedSteps = steps ? [...steps].sort((a, b) =>
    stepOrder.indexOf(a.stepType) - stepOrder.indexOf(b.stepType)
  ) : [];

  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 border rounded-lg p-3 card-interactive group',
        selected && 'ring-2 ring-indigo-500',
        highlighted && 'card-highlighted',
        hasAIQuestion
          ? 'border-pink-400 border-2 bg-gradient-to-br from-pink-50/30 to-purple-50/30 dark:from-pink-950/30 dark:to-purple-950/30'
          : isThreading
          ? 'border-amber-400'
          : 'border-slate-200 dark:border-slate-700',
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
        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full', statusDotColors[status])} />
          <span className="text-[11px] font-semibold text-slate-400">
            TODO-{id.slice(-4).toUpperCase()}
          </span>
        </div>
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

      {/* Title */}
      <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1 line-clamp-2 break-words">{title}</h4>

      {/* AI Question Badge */}
      {hasAIQuestion && (
        <div
          className="flex items-center gap-1.5 px-2 py-1 mb-2 rounded-md bg-gradient-to-r from-pink-100/80 to-purple-100/80 dark:from-pink-900/50 dark:to-purple-900/50 cursor-pointer hover:from-pink-200 hover:to-purple-200 dark:hover:from-pink-800/50 dark:hover:to-purple-800/50 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onAIQuestionClick?.();
          }}
        >
          <span className="text-xs animate-pulse">🤔</span>
          <span className="text-[10px] font-semibold text-pink-600 dark:text-pink-400">AI 질문 대기 - 클릭하여 답변</span>
          <span className="ml-auto bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full">
            {aiQuestionCount}
          </span>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-xs text-slate-500 mb-2 line-clamp-1 break-words">{description}</p>
      )}

      {/* Step Progress */}
      {showSteps && sortedSteps.length > 0 && (
        <div className="mb-2">
          <div className="flex gap-0.5">
            {sortedSteps.map((step) => (
              <div
                key={step.id}
                className={clsx(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  step.status === 'COMPLETED'
                    ? 'bg-green-500'
                    : step.status === 'IN_PROGRESS'
                    ? 'bg-amber-500'
                    : 'bg-slate-200'
                )}
                title={`${stepLabels[step.stepType]}: ${step.status}`}
              />
            ))}
          </div>
          {currentStep && (
            <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
              <ChevronRight size={12} />
              <span>{stepLabels[currentStep.stepType]}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>{completedSteps}/{totalSteps} steps</span>
          {complexity && complexityBadge[complexity] && (
            <span className={clsx(
              'px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase',
              complexityBadge[complexity].className
            )}>
              {complexityBadge[complexity].label}
            </span>
          )}
        </div>
        {estimatedTime && (
          <div className="flex items-center gap-1">
            <Clock size={10} />
            <span>{estimatedTime}m</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function TodoCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-slate-200 rounded-full" />
        <div className="w-16 h-3 bg-slate-200 rounded" />
      </div>
      <div className="h-4 bg-slate-200 rounded mb-2 w-3/4" />
      <div className="h-3 bg-slate-200 rounded mb-2 w-full" />
      <div className="flex gap-0.5 mb-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-1.5 flex-1 bg-slate-200 rounded-full" />
        ))}
      </div>
      <div className="flex justify-between">
        <div className="w-16 h-3 bg-slate-200 rounded" />
        <div className="w-10 h-3 bg-slate-200 rounded" />
      </div>
    </div>
  );
}
