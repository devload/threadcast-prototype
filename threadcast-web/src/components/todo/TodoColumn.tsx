import { clsx } from 'clsx';
import { Plus } from 'lucide-react';
import type { Todo, TodoStatus } from '../../types';
import { TodoCard, TodoCardSkeleton } from './TodoCard';

interface TodoColumnProps {
  status: TodoStatus;
  todos: Todo[];
  onTodoClick?: (todo: Todo) => void;
  onAddClick?: () => void;
  selectedTodoId?: string;
  isLoading?: boolean;
}

const statusConfig: Record<TodoStatus, { label: string; color: string; bgColor: string }> = {
  BACKLOG: {
    label: 'Backlog',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  PENDING: {
    label: 'Pending',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  THREADING: {
    label: 'Threading',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  WOVEN: {
    label: 'Woven',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  TANGLED: {
    label: 'Tangled',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
  SKIPPED: {
    label: 'Skipped',
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
  },
};

export function TodoColumn({
  status,
  todos,
  onTodoClick,
  onAddClick,
  selectedTodoId,
  isLoading = false,
}: TodoColumnProps) {
  const config = statusConfig[status];
  const count = todos.length;

  return (
    <div className="kanban-column">
      {/* Header */}
      <div className="kanban-column-header">
        <div className="flex items-center gap-2">
          <span className={clsx('font-medium', config.color)}>{config.label}</span>
          <span
            className={clsx(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              config.bgColor,
              config.color
            )}
          >
            {count}
          </span>
        </div>
        {onAddClick && status === 'PENDING' && (
          <button
            onClick={onAddClick}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            title="Add Todo"
          >
            <Plus size={18} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="kanban-column-content">
        {isLoading ? (
          <>
            <TodoCardSkeleton />
            <TodoCardSkeleton />
            <TodoCardSkeleton />
          </>
        ) : todos.length > 0 ? (
          todos.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onClick={() => onTodoClick?.(todo)}
              selected={todo.id === selectedTodoId}
            />
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            No todos
          </div>
        )}
      </div>
    </div>
  );
}
