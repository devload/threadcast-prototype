import { clsx } from 'clsx';
import { Clock, History, ChevronRight, MessageCircleQuestion, Settings2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, StepType, TimelineEvent } from '../../types';
import { Drawer } from '../feedback/Modal';
import { Button } from '../common/Button';
import { useAIQuestionStore } from '../../stores/aiQuestionStore';
import { MetaEditor } from '../meta/MetaEditor';
import { metaService, type MetaData } from '../../services';

interface TodoDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  todo: Todo | null;
  recentEvents?: TimelineEvent[];
  onMarkComplete?: () => void;
  onViewTimeline?: () => void;
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

type TabType = 'details' | 'timeline' | 'meta';

export function TodoDetailDrawer({
  isOpen,
  onClose,
  todo,
  recentEvents = [],
  onMarkComplete,
  onViewTimeline,
}: TodoDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const { questions, openPanelForTodo } = useAIQuestionStore();
  const [todoMeta, setTodoMeta] = useState<MetaData>({});
  const [effectiveMeta, setEffectiveMeta] = useState<MetaData>({});
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);

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
  const completedSteps = sortedSteps.filter((s) => s.status === 'COMPLETED').length;
  const isThreading = status === 'THREADING' || status === 'IN_PROGRESS';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`TODO-${id.slice(-4).toUpperCase()}: ${title}`}
      position="right"
      size="lg"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-200 -mx-4 px-4">
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
      </div>

      {activeTab === 'meta' ? (
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
          <div className="mb-3">
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
                        isWaitingForAI ? 'bg-pink-500 text-white' :
                        step.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' :
                        step.status === 'FAILED' ? 'bg-red-500 text-white' :
                        'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                      )}>
                        {step.status === 'COMPLETED' ? '✓' :
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
          {recentEvents.length > 0 && (
            <div className="mb-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5 flex items-center gap-1">
                <History size={10} />
                Recent
              </h4>
              <div className="flex flex-col gap-0.5">
                {recentEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-1.5 text-[10px] text-slate-500 py-0.5"
                  >
                    <div className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                    <span className="text-slate-700 truncate flex-1">{event.title}</span>
                    <span className="text-slate-400 flex-shrink-0">
                      {new Date(event.timestamp || event.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="text-[10px] text-indigo-600 hover:text-indigo-700 mt-1 flex items-center gap-0.5"
                onClick={onViewTimeline}
              >
                전체 보기 <ChevronRight size={10} />
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-2 pt-4 border-t border-slate-200">
            {!isThreading && status !== 'WOVEN' && status !== 'COMPLETED' && (
              <Button variant="primary" className="flex-1" onClick={onMarkComplete}>
                Mark as Complete
              </Button>
            )}
            <Button variant="secondary" className="flex-1" onClick={onViewTimeline}>
              View Full Timeline
            </Button>
          </div>
        </div>
      ) : (
        /* Timeline Tab */
        <div className="pt-2">
          {recentEvents.length > 0 ? (
            <div className="flex flex-col">
              {recentEvents.map((event, index) => (
                <div key={event.id} className="flex gap-2 pb-2">
                  <div className="relative flex-shrink-0">
                    <div className={clsx(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[8px]',
                      event.actorType === 'AI' ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white' :
                      event.actorType === 'USER' ? 'bg-pink-500 text-white' :
                      'bg-slate-200 text-slate-500'
                    )}>
                      {event.actorType === 'AI' ? '🤖' :
                       event.actorType === 'USER' ? '👤' : '⚙️'}
                    </div>
                    {index < recentEvents.length - 1 && (
                      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-px h-full bg-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-900 truncate">
                        {event.title}
                      </span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(event.timestamp || event.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
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
    </Drawer>
  );
}
