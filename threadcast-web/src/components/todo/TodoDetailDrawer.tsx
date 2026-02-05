import { clsx } from 'clsx';
import { Clock, History, ChevronRight, MessageCircleQuestion, Settings2, Terminal, Play, Square, Loader2, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, StepType, TimelineEvent } from '../../types';
import { Drawer, ConfirmDialog } from '../feedback/Modal';
import { Button } from '../common/Button';
import { useAIQuestionStore } from '../../stores/aiQuestionStore';
import { MetaEditor } from '../meta/MetaEditor';
import { metaService, api, timelineService, todoService, type MetaData } from '../../services';
import { TerminalViewer } from '../terminal';

interface TodoDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  todo: Todo | null;
  recentEvents?: TimelineEvent[];
  onMarkComplete?: () => void;
  onViewTimeline?: () => void;
  onStartWeaving?: () => void;
  onRefresh?: () => void;
  onDelete?: () => void;
}

const stepLabels: Record<StepType, string> = {
  ANALYSIS: 'Analysis',
  DESIGN: 'Design',
  IMPLEMENTATION: 'Implementation',
  VERIFICATION: 'Verification',
  REVIEW: 'Review',
  INTEGRATION: 'Integration',
};

const stepOrder: StepType[] = ['ANALYSIS', 'DESIGN', 'IMPLEMENTATION', 'VERIFICATION', 'REVIEW', 'INTEGRATION'];

type TabType = 'details' | 'timeline' | 'meta' | 'terminal';

export function TodoDetailDrawer({
  isOpen,
  onClose,
  todo,
  recentEvents: _recentEvents = [], // kept for backwards compatibility
  onMarkComplete,
  onViewTimeline,
  onStartWeaving,
  onRefresh,
  onDelete,
}: TodoDetailDrawerProps) {
  void _recentEvents; // suppress unused warning
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const { questions, openPanelForTodo } = useAIQuestionStore();
  const [todoMeta, setTodoMeta] = useState<MetaData>({});
  const [effectiveMeta, setEffectiveMeta] = useState<MetaData>({});
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStartWeaving = async () => {
    if (!todo) return;
    setIsStarting(true);
    try {
      await api.post(`/hub/todos/${todo.id}/start-worker`, {
        workDir: todo.workingPath || '/tmp/threadcast'
      });
      onStartWeaving?.();
      // 상태 새로고침을 위해 잠시 대기 후 refresh
      setTimeout(() => onRefresh?.(), 1000);
    } catch (error) {
      console.error('Failed to start weaving:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopWeaving = async () => {
    if (!todo) return;
    setIsStopping(true);
    try {
      await api.delete(`/todos/${todo.id}/terminal/stop`);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to stop weaving:', error);
    } finally {
      setIsStopping(false);
    }
  };

  const handleDelete = async () => {
    if (!todo) return;
    setIsDeleting(true);
    try {
      await todoService.delete(todo.id);
      setShowDeleteConfirm(false);
      onClose();
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 메타데이터 로드
  const loadMeta = useCallback(async () => {
    if (!todo) return;
    setIsLoadingMeta(true);
    try {
      const [metaRes, effectiveRes] = await Promise.all([
        metaService.getTodoMeta(todo.id),
        metaService.getTodoEffectiveMeta(todo.id),
      ]);
      setTodoMeta(metaRes || {});
      setEffectiveMeta(effectiveRes || {});
    } catch (error) {
      console.error('Failed to load todo meta:', error);
    } finally {
      setIsLoadingMeta(false);
    }
  }, [todo]);

  useEffect(() => {
    if (isOpen && todo && activeTab === 'meta') {
      loadMeta();
    }
  }, [isOpen, todo, activeTab, loadMeta]);

  // Load timeline events
  const loadTimeline = useCallback(async () => {
    if (!todo) return;
    setIsLoadingTimeline(true);
    try {
      const response = await timelineService.getEvents({ todoId: todo.id, size: 50 });
      setTimelineEvents(response.content || []);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setIsLoadingTimeline(false);
    }
  }, [todo]);

  // Load timeline when drawer opens or todo changes
  useEffect(() => {
    if (isOpen && todo) {
      loadTimeline();
    }
  }, [isOpen, todo, loadTimeline]);

  // 메타 저장
  const handleSaveMeta = async (meta: MetaData, replace?: boolean) => {
    if (!todo) return;
    const result = await metaService.updateTodoMeta(todo.id, { meta, replace });
    setTodoMeta(result || meta);
    // effective meta 다시 로드
    const effectiveRes = await metaService.getTodoEffectiveMeta(todo.id);
    setEffectiveMeta(effectiveRes || {});
  };

  if (!todo) return null;

  const { id, title, description, status, steps, estimatedTime, complexity, aiContext } = todo;

  // Get AI questions for this todo
  const todoQuestions = questions.filter(q => q.todoId === id);
  const hasAIQuestions = todoQuestions.length > 0;
  const sortedSteps = steps ? [...steps].sort((a, b) =>
    stepOrder.indexOf(a.stepType) - stepOrder.indexOf(b.stepType)
  ) : [];
  const completedSteps = sortedSteps.filter((s) => s.status === 'COMPLETED' || s.status === 'SKIPPED').length;
  const isThreading = status === 'THREADING' || status === 'IN_PROGRESS';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`TODO-${id.slice(-4).toUpperCase()}: ${title}`}
      position="right"
      size="lg"
      data-tour="todo-detail-drawer"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-200 -mx-4 px-4" data-tour="todo-drawer-tabs">
        <button
          className={clsx(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'details'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={clsx(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'timeline'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
        <button
          className={clsx(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
            activeTab === 'meta'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
          onClick={() => setActiveTab('meta')}
        >
          <Settings2 size={14} />
          Meta
        </button>
        {isThreading && (
          <button
            className={clsx(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
              activeTab === 'terminal'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
            onClick={() => setActiveTab('terminal')}
          >
            <Terminal size={14} />
            Terminal
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </button>
        )}
      </div>

      {activeTab === 'terminal' && isThreading ? (
        /* Terminal Tab - only shown when threading */
        <div className="pt-4 h-[500px]">
          <TerminalViewer
            todoId={id}
            sessionActive={isThreading}
          />
        </div>
      ) : activeTab === 'meta' ? (
        /* Meta Tab */
        <div className="pt-4">
          <MetaEditor
            meta={todoMeta}
            effectiveMeta={effectiveMeta}
            onSave={handleSaveMeta}
            isLoading={isLoadingMeta}
            parentLevel="Todo"
            title="Todo 메타데이터"
          />
        </div>
      ) : activeTab === 'details' ? (
        <div className="pt-4">
          {/* Status & Meta */}
          <div className="flex items-center gap-2 mb-4">
            <span className={clsx(
              'px-2.5 py-1 rounded-full text-xs font-semibold',
              isThreading ? 'bg-amber-50 text-amber-600' :
              status === 'WOVEN' || status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
              'bg-slate-100 text-slate-600'
            )}>
              {isThreading ? '🧵 Threading' :
               status === 'WOVEN' || status === 'COMPLETED' ? '✅ Woven' :
               'Pending'}
            </span>
            {complexity && (
              <span className={clsx(
                'px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
                complexity === 'HIGH' || complexity === 'COMPLEX' ? 'bg-red-100 text-red-700' :
                complexity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              )}>
                {complexity}
              </span>
            )}
            {estimatedTime && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={12} />
                {estimatedTime}min
              </span>
            )}
          </div>

          {/* AI Question Waiting Banner */}
          {hasAIQuestions && (
            <div
              className="mb-3 p-2 rounded bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/50 dark:to-purple-950/50 border border-pink-300 dark:border-pink-700 cursor-pointer hover:from-pink-100 hover:to-purple-100 transition-all"
              onClick={() => openPanelForTodo(id)}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                  <span className="text-base animate-pulse">🤔</span>
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {todoQuestions.length}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-pink-700 dark:text-pink-400 text-[10px]">
                    AI 답변 대기 중
                  </h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                    Q: {todoQuestions[0]?.question?.slice(0, 40)}...
                  </p>
                </div>
                <MessageCircleQuestion size={12} className="text-pink-500 flex-shrink-0" />
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
              {description}
            </p>
          )}

          {/* Step Progress */}
          <div className="mb-3" data-tour="todo-step-progress">
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Steps ({completedSteps}/{sortedSteps.length})
            </h4>
            <div className="flex flex-col gap-1">
              {sortedSteps.map((step, index) => {
                const isWaitingForAI = step.status === 'IN_PROGRESS' && hasAIQuestions;
                const hasProgress = step.progress !== undefined && step.progress > 0;
                return (
                  <div
                    key={step.id}
                    className={clsx(
                      'flex flex-col gap-1 px-2 py-1.5 rounded border transition-all',
                      step.status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' :
                      step.status === 'SKIPPED' ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 opacity-60' :
                      isWaitingForAI ? 'bg-pink-50 dark:bg-pink-950/30 border-pink-300 dark:border-pink-700 cursor-pointer hover:bg-pink-100' :
                      step.status === 'IN_PROGRESS' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700' :
                      step.status === 'FAILED' ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700' :
                      'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    )}
                    onClick={isWaitingForAI ? () => openPanelForTodo(id) : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <div className={clsx(
                        'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-semibold flex-shrink-0',
                        step.status === 'COMPLETED' ? 'bg-green-500 text-white' :
                        step.status === 'SKIPPED' ? 'bg-gray-400 text-white' :
                        isWaitingForAI ? 'bg-pink-500 text-white' :
                        step.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' :
                        step.status === 'FAILED' ? 'bg-red-500 text-white' :
                        'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                      )}>
                        {step.status === 'COMPLETED' ? '✓' :
                         step.status === 'SKIPPED' ? '−' :
                         step.status === 'FAILED' ? '!' :
                         isWaitingForAI ? '?' : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                          {stepLabels[step.stepType]}
                        </div>
                      </div>
                      <div className={clsx(
                        'text-[10px] flex-shrink-0 flex items-center gap-1',
                        isWaitingForAI ? 'text-pink-600 dark:text-pink-400 animate-pulse' :
                        step.status === 'IN_PROGRESS' ? 'text-amber-600 dark:text-amber-400' :
                        step.status === 'COMPLETED' ? 'text-green-600' :
                        step.status === 'SKIPPED' ? 'text-gray-400' :
                        step.status === 'FAILED' ? 'text-red-600' :
                        'text-slate-400'
                      )}>
                        {isWaitingForAI ? '답변 필요' :
                         step.status === 'IN_PROGRESS' ? (
                           hasProgress ? (
                             <span className="font-semibold tabular-nums">{step.progress}%</span>
                           ) : (
                             <span className="animate-pulse">Active</span>
                           )
                         ) :
                         step.status === 'COMPLETED' ? 'Done' :
                         step.status === 'SKIPPED' ? 'Skipped' :
                         step.status === 'FAILED' ? 'Failed' : 'Pending'}
                      </div>
                    </div>

                    {/* Progress bar for IN_PROGRESS */}
                    {step.status === 'IN_PROGRESS' && hasProgress && (
                      <div className="w-full h-1 bg-amber-200 dark:bg-amber-900/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-500 ease-out"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Real-time message */}
                    {step.status === 'IN_PROGRESS' && step.message && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 truncate pl-6">
                        {step.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Context */}
          {aiContext && (
            <div className="mb-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                AI Context
              </h4>
              <div className="bg-indigo-50 rounded p-2 text-[10px] text-indigo-700 border border-indigo-200 font-mono">
                {aiContext}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {timelineEvents.length > 0 && (
            <div className="mb-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5 flex items-center gap-1">
                <History size={10} />
                Recent
              </h4>
              <div className="flex flex-col gap-0.5">
                {timelineEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-1.5 text-[10px] text-slate-500 py-0.5"
                  >
                    <div className={clsx(
                      'w-1.5 h-1.5 rounded-full flex-shrink-0',
                      event.eventType === 'AI_ACTIVITY' ? 'bg-cyan-400' : 'bg-slate-300'
                    )} />
                    <span className="text-slate-700 dark:text-slate-300 truncate flex-1">{event.title}</span>
                    <span className="text-slate-400 flex-shrink-0">
                      {new Date(event.timestamp || event.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="text-[10px] text-indigo-600 hover:text-indigo-700 mt-1 flex items-center gap-0.5"
                onClick={() => setActiveTab('timeline')}
              >
                전체 보기 <ChevronRight size={10} />
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-2 pt-4 border-t border-slate-200" data-tour="todo-drawer-actions">
            {(status === 'PENDING' || status === 'BACKLOG') && (
              <Button
                variant="primary"
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={handleStartWeaving}
                isLoading={isStarting}
                data-tour="todo-start-weaving"
              >
                <Play size={16} className="mr-1" />
                Start Weaving
              </Button>
            )}
            {isThreading && (
              <>
                <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Loader2 size={16} className="animate-spin text-amber-600" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Threading...</span>
                </div>
                <Button
                  variant="secondary"
                  className="text-red-600 hover:bg-red-50 border-red-200"
                  onClick={handleStopWeaving}
                  isLoading={isStopping}
                >
                  <Square size={14} className="mr-1" />
                  Stop
                </Button>
              </>
            )}
            {!isThreading && status !== 'WOVEN' && status !== 'COMPLETED' && status !== 'PENDING' && status !== 'BACKLOG' && (
              <Button variant="primary" className="flex-1" onClick={onMarkComplete}>
                Mark as Complete
              </Button>
            )}
            <Button variant="secondary" className="flex-1" onClick={onViewTimeline}>
              View Full Timeline
            </Button>
            <Button
              variant="secondary"
              className="text-red-600 hover:bg-red-50 border-red-200"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ) : (
        /* Timeline Tab */
        <div className="pt-2">
          {isLoadingTimeline ? (
            <div className="text-center py-6 text-slate-400">
              <Loader2 size={20} className="mx-auto mb-1 animate-spin" />
              <p className="text-xs">Loading timeline...</p>
            </div>
          ) : timelineEvents.length > 0 ? (
            <div className="flex flex-col">
              {timelineEvents.map((event, index) => (
                <div key={event.id} className="flex gap-2 pb-2">
                  <div className="relative flex-shrink-0">
                    <div className={clsx(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[8px]',
                      event.eventType === 'AI_ACTIVITY' ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white' :
                      event.actorType === 'AI' ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white' :
                      event.actorType === 'USER' ? 'bg-pink-500 text-white' :
                      'bg-slate-200 text-slate-500'
                    )}>
                      {event.eventType === 'AI_ACTIVITY' ? '💭' :
                       event.actorType === 'AI' ? '🤖' :
                       event.actorType === 'USER' ? '👤' : '⚙️'}
                    </div>
                    {index < timelineEvents.length - 1 && (
                      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-px h-full bg-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                        {event.title}
                      </span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(event.timestamp || event.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {event.eventType === 'AI_ACTIVITY' && event.metadata && (
                      <p className="text-[10px] text-cyan-600 dark:text-cyan-400">
                        {String(event.metadata.model || 'unknown')} • {String(event.metadata.inputTokens || 0)}+{String(event.metadata.outputTokens || 0)} tokens
                      </p>
                    )}
                    {event.description && (
                      <p className="text-[10px] text-slate-500 truncate">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <History size={20} className="mx-auto mb-1 opacity-50" />
              <p className="text-xs">No activity yet</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Todo"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </Drawer>
  );
}
