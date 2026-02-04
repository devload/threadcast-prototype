import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { clsx } from 'clsx';
import type { Todo } from '../../types';
import { Lock, Unlock, Play, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface TodoGraphNodeProps {
  data: {
    todo: Todo;
    onClick?: (todoId: string) => void;
  };
  selected?: boolean;
}

const statusStyles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  PENDING: {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-600',
    icon: <Clock size={14} className="text-slate-400" />,
  },
  BACKLOG: {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-600',
    icon: <Clock size={14} className="text-slate-400" />,
  },
  THREADING: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-700',
    icon: <Play size={14} className="text-amber-500 animate-pulse" />,
  },
  IN_PROGRESS: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-700',
    icon: <Play size={14} className="text-amber-500 animate-pulse" />,
  },
  WOVEN: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    text: 'text-green-700',
    icon: <CheckCircle size={14} className="text-green-500" />,
  },
  COMPLETED: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    text: 'text-green-700',
    icon: <CheckCircle size={14} className="text-green-500" />,
  },
  TANGLED: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-700',
    icon: <AlertCircle size={14} className="text-red-500" />,
  },
};

function TodoGraphNodeComponent({ data, selected }: TodoGraphNodeProps) {
  const { todo, onClick } = data;
  const style = statusStyles[todo.status] || statusStyles.PENDING;
  const completedSteps = todo.steps?.filter(s => s.status === 'COMPLETED').length ?? 0;
  const totalSteps = todo.steps?.length ?? 6;
  const stepProgress = Math.round((completedSteps / totalSteps) * 100);

  const handleClick = () => {
    onClick?.(todo.id);
  };

  return (
    <div
      className={clsx(
        'px-3 py-2 rounded-lg border-2 min-w-[180px] max-w-[220px] cursor-pointer transition-all shadow-sm',
        style.bg,
        style.border,
        selected && 'ring-2 ring-indigo-500 ring-offset-2',
        todo.isBlocked && 'opacity-60'
      )}
      onClick={handleClick}
    >
      {/* Input handle (left side) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !w-2 !h-2 !border-0"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={clsx('text-[10px] font-mono uppercase', style.text)}>
          TODO-{todo.id.slice(-4)}
        </span>
        <div className="flex items-center gap-1">
          {todo.isBlocked ? (
            <Lock size={12} className="text-red-400" />
          ) : todo.isReadyToStart ? (
            <Unlock size={12} className="text-green-500" />
          ) : null}
          {style.icon}
        </div>
      </div>

      {/* Title */}
      <div className={clsx('text-xs font-medium truncate', style.text)} title={todo.title}>
        {todo.title}
      </div>

      {/* Progress bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              todo.status === 'THREADING' || todo.status === 'IN_PROGRESS'
                ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                : todo.status === 'WOVEN' || todo.status === 'COMPLETED'
                ? 'bg-green-400'
                : 'bg-slate-300'
            )}
            style={{ width: `${stepProgress}%` }}
          />
        </div>
        <span className="text-[9px] text-slate-400">
          {completedSteps}/{totalSteps}
        </span>
      </div>

      {/* Complexity badge */}
      {todo.complexity && (
        <div className="mt-1.5 flex items-center gap-1">
          <span
            className={clsx(
              'px-1 py-0.5 rounded text-[8px] font-semibold uppercase',
              todo.complexity === 'HIGH' || todo.complexity === 'COMPLEX'
                ? 'bg-red-100 text-red-600'
                : todo.complexity === 'MEDIUM'
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-green-100 text-green-600'
            )}
          >
            {todo.complexity}
          </span>
          {todo.estimatedTime && (
            <span className="text-[9px] text-slate-400">{todo.estimatedTime}min</span>
          )}
        </div>
      )}

      {/* Output handle (right side) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-400 !w-2 !h-2 !border-0"
      />
    </div>
  );
}

export const TodoGraphNode = memo(TodoGraphNodeComponent);
