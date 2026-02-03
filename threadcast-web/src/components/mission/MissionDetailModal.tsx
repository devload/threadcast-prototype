import { useState, useCallback, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { Play, Pause, Sparkles, List, GitBranch, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Mission, Todo, MissionStatus } from '../../types';
import { Modal } from '../feedback/Modal';
import { Button } from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useAIAnalysisStore } from '../../stores/aiAnalysisStore';
import { AIAnalysisModal } from '../ai/AIAnalysisModal';
import { TodoGraph } from '../todo/TodoGraph';
import { todoService } from '../../services/todoService';
import { useOnboardingStore } from '../onboarding/OnboardingStore';

type ViewMode = 'list' | 'graph';

interface MissionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission | null;
  todos?: Todo[];
  onStartWeaving?: () => void;
  onPauseWeaving?: () => void;
  onTodoClick?: (todoId: string) => void;
  aiQuestionsByTodo?: Record<string, number>;
  onTodosCreated?: () => void;  // Called when todos are created via AI analysis
  onTodosRefresh?: () => void;  // Called when todos need to be refreshed
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
  aiQuestionsByTodo = {},
  onTodosCreated,
  onTodosRefresh,
}: MissionDetailModalProps) {
  const { t } = useTranslation();
  const { startAnalysis, isModalOpen } = useAIAnalysisStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { setTourContext, isTourActive } = useOnboardingStore();
  const hasRegisteredTourContext = useRef(false);
  const onStartWeavingRef = useRef(onStartWeaving);

  // Keep ref updated
  onStartWeavingRef.current = onStartWeaving;

  // Register tour context functions for interactive tour
  useEffect(() => {
    if (isOpen && isTourActive && !hasRegisteredTourContext.current) {
      hasRegisteredTourContext.current = true;
      setTourContext({
        switchToListView: () => setViewMode('list'),
        switchToGraphView: () => setViewMode('graph'),
        startWeaving: () => onStartWeavingRef.current?.(),
      });
    }
    // Reset when modal closes
    if (!isOpen) {
      hasRegisteredTourContext.current = false;
    }
  }, [isOpen, isTourActive, setTourContext]);

  // Handle dependency changes from graph view - must be before conditional return
  const handleDependencyAdd = useCallback(async (sourceId: string, targetId: string) => {
    try {
      // Find the target todo
      const targetTodo = todos.find(t => t.id === targetId);
      if (!targetTodo) return;

      // Get existing dependencies
      const existingDeps = targetTodo.dependencies?.map(d =>
        typeof d === 'string' ? d : d.id
      ) || [];

      // Add new dependency if not already present
      if (!existingDeps.includes(sourceId)) {
        await todoService.updateDependencies(targetId, [...existingDeps, sourceId]);
        onTodosRefresh?.();
      }
    } catch (error) {
      console.error('Failed to add dependency:', error);
    }
  }, [todos, onTodosRefresh]);

  const handleDependencyRemove = useCallback(async (sourceId: string, targetId: string) => {
    try {
      // Find the target todo
      const targetTodo = todos.find(t => t.id === targetId);
      if (!targetTodo) return;

      // Remove the dependency
      const newDeps = targetTodo.dependencies
        ?.map(d => typeof d === 'string' ? d : d.id)
        .filter(id => id !== sourceId) || [];

      await todoService.updateDependencies(targetId, newDeps);
      onTodosRefresh?.();
    } catch (error) {
      console.error('Failed to remove dependency:', error);
    }
  }, [todos, onTodosRefresh]);

  // Early return after all hooks
  if (!mission) return null;

  const { id, title, description, status, progress, todoStats, tags } = mission;
  const isThreading = status === 'THREADING' || status === 'IN_PROGRESS';
  const isWoven = status === 'WOVEN' || status === 'COMPLETED';

  const handleAIAnalysis = () => {
    startAnalysis(mission);
  };

  const footer = (
    <>
      <span className="text-xs text-slate-400">
        {t('common.pressEscToClose')}
      </span>
      <div className="flex gap-2">
        {/* AI로 Todo 자동 생성 버튼 */}
        {!isWoven && todos.length === 0 && (
          <Button
            variant="secondary"
            leftIcon={<Sparkles size={16} />}
            onClick={handleAIAnalysis}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
          >
            {t('aiAnalysis.generateTodos')}
          </Button>
        )}
        {isThreading ? (
          <Button
            variant="secondary"
            leftIcon={<Pause size={16} />}
            onClick={onPauseWeaving}
            data-tour="pause-weaving-btn"
          >
            {t('mission.pauseWeaving')}
          </Button>
        ) : !isWoven && (
          <Button
            variant="primary"
            leftIcon={<Play size={16} />}
            onClick={onStartWeaving}
            data-tour="start-weaving-btn"
          >
            {t('mission.startWeaving')}
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

      {/* Description - Markdown */}
      {description && (
        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none mb-6
          prose-headings:text-slate-800 dark:prose-headings:text-slate-200
          prose-h2:text-base prose-h2:font-semibold prose-h2:mt-4 prose-h2:mb-2
          prose-h3:text-sm prose-h3:font-semibold prose-h3:mt-3 prose-h3:mb-1
          prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:my-1.5
          prose-ul:my-1.5 prose-li:my-0.5 prose-li:text-slate-600 dark:prose-li:text-slate-400
          prose-code:text-xs prose-code:bg-slate-100 dark:prose-code:bg-slate-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800 prose-pre:text-xs
          max-h-[250px] overflow-y-auto pr-2">
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      )}

      {/* Progress Section */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <p className="text-xs text-slate-500 mb-2">{t('mission.overallProgress')}</p>
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
            <div className="text-[10px] text-slate-500 uppercase">{t('common.total')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-500">{todoStats.threading}</div>
            <div className="text-[10px] text-slate-500 uppercase">{t('status.threading')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-500">{todoStats.woven}</div>
            <div className="text-[10px] text-slate-500 uppercase">{t('status.woven')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-400">{todoStats.pending}</div>
            <div className="text-[10px] text-slate-500 uppercase">{t('status.pending')}</div>
          </div>
        </div>
      </div>

      {/* Todo Section */}
      <div>
        {/* Header with view toggle */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('mission.todoThreads')} ({todos.length})
          </h4>

          {/* View Mode Toggle */}
          {todos.length > 0 && (
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg" data-tour="todo-view-toggle">
              <button
                onClick={() => setViewMode('list')}
                data-tour="todo-list-btn"
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                <List size={14} />
                {t('graph.listView')}
              </button>
              <button
                onClick={() => setViewMode('graph')}
                data-tour="todo-graph-btn"
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all',
                  viewMode === 'graph'
                    ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                <GitBranch size={14} />
                {t('graph.graphView')}
              </button>
            </div>
          )}
        </div>

        {/* Graph View */}
        {viewMode === 'graph' && todos.length > 0 && (
          <div data-tour="todo-graph-view">
            <TodoGraph
              todos={todos}
              onTodoClick={onTodoClick}
              onDependencyAdd={handleDependencyAdd}
              onDependencyRemove={handleDependencyRemove}
            />
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1" data-tour="todo-list-view">
            {todos.map((todo) => {
              const questionCount = aiQuestionsByTodo[todo.id] || 0;
              const hasAIQuestion = questionCount > 0;
              return (
                <div
                  key={todo.id}
                  className={clsx(
                    'bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 cursor-pointer border transition-all',
                    'hover:bg-white dark:hover:bg-slate-700 hover:border-indigo-500 hover:translate-x-1',
                    hasAIQuestion
                      ? 'border-pink-400 border-2 bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-950/30 dark:to-purple-950/30'
                      : (todo.status === 'THREADING' || todo.status === 'IN_PROGRESS')
                      ? 'bg-white dark:bg-slate-700 border-amber-400'
                      : todo.isBlocked
                      ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20'
                      : todo.isReadyToStart
                      ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20'
                      : 'border-transparent'
                  )}
                  onClick={() => onTodoClick?.(todo.id)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={clsx('w-2 h-2 rounded-full', todoStatusDot[todo.status] || 'bg-slate-400')} />
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        TODO-{todo.id.slice(-4).toUpperCase()}
                      </span>
                      {/* Blocked indicator */}
                      {todo.isBlocked && (
                        <span className="flex items-center gap-0.5 text-[9px] text-red-500">
                          <Lock size={10} />
                          {t('graph.blocked')}
                        </span>
                      )}
                      {/* Ready to start indicator */}
                      {todo.isReadyToStart && (
                        <span className="text-[9px] text-green-500 font-medium">
                          {t('graph.readyToStart')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasAIQuestion && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400">
                          <span className="text-[10px] animate-pulse">🤔</span>
                          <span className="text-[9px] font-semibold">{questionCount}</span>
                        </span>
                      )}
                      {todo.complexity && (
                        <span className={clsx(
                          'px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase',
                          todo.complexity === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' :
                          todo.complexity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                        )}>
                          {todo.complexity}
                        </span>
                      )}
                    </div>
                  </div>
                  <h5 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                    {todo.title}
                  </h5>
                  <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                    <span>{todo.steps?.filter(s => s.status === 'COMPLETED').length ?? 0}/{todo.steps?.length ?? 6} {t('mission.steps')}</span>
                    {todo.estimatedTime && <span>{todo.estimatedTime}min</span>}
                    {todo.dependencies && todo.dependencies.length > 0 && (
                      <span className="flex items-center gap-1">
                        <GitBranch size={10} />
                        {todo.dependencies.length} {t('graph.dependencies')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {todos.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">{t('mission.noTodos')}</p>
                <p className="text-xs mt-1">{t('mission.noTodosHint')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Analysis Modal */}
      {isModalOpen && (
        <AIAnalysisModal
          mission={mission}
          onTodosCreated={() => {
            // Close MissionDetailModal when todos are created
            onClose();
            onTodosCreated?.();
          }}
        />
      )}
    </Modal>
  );
}
