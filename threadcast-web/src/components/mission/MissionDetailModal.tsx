import { clsx } from 'clsx';
import { Play, Pause } from 'lucide-react';
import type { Mission, Todo, MissionStatus } from '../../types';
import { Modal } from '../feedback/Modal';
import { Button } from '../common/Button';

interface MissionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission | null;
  todos?: Todo[];
  onStartWeaving?: () => void;
  onPauseWeaving?: () => void;
  onTodoClick?: (todoId: string) => void;
}

const statusBadgeStyles: Record<MissionStatus, { label: string; className: string }> = {
  BACKLOG: { label: 'Backlog', className: 'bg-slate-100 text-slate-600' },
  PENDING: { label: 'Pending', className: 'bg-slate-100 text-slate-600' },
  THREADING: { label: '🧵 Threading', className: 'bg-amber-50 text-amber-600' },
  IN_PROGRESS: { label: '🧵 In Progress', className: 'bg-amber-50 text-amber-600' },
  WOVEN: { label: '✅ Woven', className: 'bg-green-50 text-green-600' },
  COMPLETED: { label: '✅ Completed', className: 'bg-green-50 text-green-600' },
  TANGLED: { label: '❌ Tangled', className: 'bg-red-50 text-red-600' },
  ARCHIVED: { label: 'Archived', className: 'bg-purple-50 text-purple-600' },
  SKIPPED: { label: 'Skipped', className: 'bg-slate-100 text-slate-500' },
};

const todoStatusDot: Record<string, string> = {
  BACKLOG: 'bg-slate-400',
  PENDING: 'bg-slate-400',
  THREADING: 'bg-amber-500',
  IN_PROGRESS: 'bg-amber-500',
  WOVEN: 'bg-green-500',
  COMPLETED: 'bg-green-500',
  TANGLED: 'bg-red-500',
};

export function MissionDetailModal({
  isOpen,
  onClose,
  mission,
  todos = [],
  onStartWeaving,
  onPauseWeaving,
  onTodoClick,
}: MissionDetailModalProps) {
  if (!mission) return null;

  const { id, title, description, status, progress, todoStats, tags } = mission;
  const isThreading = status === 'THREADING' || status === 'IN_PROGRESS';
  const isWoven = status === 'WOVEN' || status === 'COMPLETED';

  const footer = (
    <>
      <span className="text-xs text-slate-400">
        Press ESC to close
      </span>
      <div className="flex gap-2">
        {isThreading ? (
          <Button
            variant="secondary"
            leftIcon={<Pause size={16} />}
            onClick={onPauseWeaving}
          >
            Pause Weaving
          </Button>
        ) : !isWoven && (
          <Button
            variant="primary"
            leftIcon={<Play size={16} />}
            onClick={onStartWeaving}
          >
            Start Weaving
          </Button>
        )}
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`MISSION-${id.slice(-4).toUpperCase()}: ${title}`}
      footer={footer}
      size="xl"
    >
      {/* Status Badge */}
      <div className="flex items-center gap-3 mb-4">
        <span className={clsx(
          'px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5',
          statusBadgeStyles[status].className
        )}>
          {statusBadgeStyles[status].label}
        </span>
        {tags && tags.length > 0 && tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          {description}
        </p>
      )}

      {/* Progress Section */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <p className="text-xs text-slate-500 mb-2">Overall Progress</p>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              isThreading ? 'progress-gradient' : 'bg-green-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-indigo-600">{todoStats.total}</div>
            <div className="text-[10px] text-slate-500 uppercase">Total</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-500">{todoStats.threading}</div>
            <div className="text-[10px] text-slate-500 uppercase">Threading</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-500">{todoStats.woven}</div>
            <div className="text-[10px] text-slate-500 uppercase">Woven</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-400">{todoStats.pending}</div>
            <div className="text-[10px] text-slate-500 uppercase">Pending</div>
          </div>
        </div>
      </div>

      {/* Todo List */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Todo Threads ({todos.length})
        </h4>
        <div className="flex flex-col gap-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={clsx(
                'bg-slate-50 rounded-lg p-3 cursor-pointer border border-transparent transition-all',
                'hover:bg-white hover:border-indigo-500 hover:translate-x-1',
                (todo.status === 'THREADING' || todo.status === 'IN_PROGRESS') && 'bg-white border-amber-400'
              )}
              onClick={() => onTodoClick?.(todo.id)}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={clsx('w-2 h-2 rounded-full', todoStatusDot[todo.status] || 'bg-slate-400')} />
                  <span className="text-[11px] font-semibold text-slate-400">
                    TODO-{todo.id.slice(-4).toUpperCase()}
                  </span>
                </div>
                {todo.complexity && (
                  <span className={clsx(
                    'px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase',
                    todo.complexity === 'HIGH' ? 'bg-red-100 text-red-700' :
                    todo.complexity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  )}>
                    {todo.complexity}
                  </span>
                )}
              </div>
              <h5 className="text-sm font-medium text-slate-900 mb-1">
                {todo.title}
              </h5>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{todo.steps?.filter(s => s.status === 'COMPLETED').length ?? 0}/{todo.steps?.length ?? 6} steps</span>
                {todo.estimatedTime && <span>{todo.estimatedTime}min</span>}
              </div>
            </div>
          ))}

          {todos.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No todos yet</p>
              <p className="text-xs mt-1">Start weaving to generate todo threads</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
