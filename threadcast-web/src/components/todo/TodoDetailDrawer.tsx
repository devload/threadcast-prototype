import { clsx } from 'clsx';
import { Clock, History, ChevronRight, MessageCircleQuestion } from 'lucide-react';
import { useState } from 'react';
import type { Todo, StepType, TimelineEvent } from '../../types';
import { Drawer } from '../feedback/Modal';
import { Button } from '../common/Button';
import { useAIQuestionStore } from '../../stores/aiQuestionStore';

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

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Pending' },
  IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'In Progress' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-600', label: 'Completed' },
};

type TabType = 'details' | 'timeline';

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
      </div>

      {activeTab === 'details' ? (
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
              className="mb-5 p-4 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/50 dark:to-purple-950/50 border-2 border-pink-300 dark:border-pink-700 cursor-pointer hover:from-pink-100 hover:to-purple-100 dark:hover:from-pink-900/50 dark:hover:to-purple-900/50 transition-all"
              onClick={() => openPanelForTodo(id)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <span className="text-2xl animate-pulse">🤔</span>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {todoQuestions.length}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-pink-700 dark:text-pink-400 text-sm mb-1">
                    AI가 답변을 기다리고 있습니다
                  </h4>
                  <p className="text-xs text-pink-600/80 dark:text-pink-400/80 mb-2">
                    작업을 계속하려면 아래 질문에 답변해주세요
                  </p>
                  {/* Show first question preview */}
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-md p-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Q:</span> {todoQuestions[0]?.question?.slice(0, 60)}...
                  </div>
                  <button className="mt-2 text-xs font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 flex items-center gap-1">
                    <MessageCircleQuestion size={14} />
                    클릭하여 답변하기
                  </button>
                </div>
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
          <div className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
              Step Progress ({completedSteps}/{sortedSteps.length})
            </h4>
            <div className="flex flex-col gap-2">
              {sortedSteps.map((step, index) => {
                const isWaitingForAI = step.status === 'IN_PROGRESS' && hasAIQuestions;
                return (
                  <div
                    key={step.id}
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all',
                      step.status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' :
                      isWaitingForAI ? 'bg-pink-50 dark:bg-pink-950/30 border-pink-300 dark:border-pink-700 cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-900/30' :
                      step.status === 'IN_PROGRESS' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700' :
                      'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    )}
                    onClick={isWaitingForAI ? () => openPanelForTodo(id) : undefined}
                  >
                    <div className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                      step.status === 'COMPLETED' ? 'bg-green-500 text-white' :
                      isWaitingForAI ? 'bg-pink-500 text-white' :
                      step.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' :
                      'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                    )}>
                      {step.status === 'COMPLETED' ? '✓' : isWaitingForAI ? '🤔' : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {stepLabels[step.stepType]}
                      </div>
                      <div className={clsx(
                        'text-xs',
                        isWaitingForAI ? 'text-pink-600 dark:text-pink-400' :
                        statusStyles[step.status]?.text || 'text-slate-500 dark:text-slate-400'
                      )}>
                        {isWaitingForAI ? 'AI 답변 대기 중' : statusStyles[step.status]?.label || step.status}
                      </div>
                    </div>
                    {isWaitingForAI ? (
                      <div className="flex items-center gap-1 text-xs text-pink-600 dark:text-pink-400 font-medium animate-pulse">
                        <MessageCircleQuestion size={14} />
                        답변 필요
                      </div>
                    ) : step.status === 'IN_PROGRESS' && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-medium animate-pulse">
                        Active
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Context */}
          {aiContext && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                AI Context
              </h4>
              <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-700 border border-indigo-200">
                {aiContext}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {recentEvents.length > 0 && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-2">
                <History size={14} />
                Recent Activity
              </h4>
              <div className="flex flex-col gap-2">
                {recentEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-2 text-xs text-slate-500"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-700">{event.title}</span>
                      <span className="ml-2 text-slate-400">
                        {new Date(event.timestamp || event.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="text-xs text-indigo-600 hover:text-indigo-700 mt-2 flex items-center gap-1"
                onClick={onViewTimeline}
              >
                View All History <ChevronRight size={12} />
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
        <div className="pt-4">
          {recentEvents.length > 0 ? (
            <div className="flex flex-col">
              {recentEvents.map((event, index) => (
                <div key={event.id} className="flex gap-3 pb-4">
                  <div className="relative">
                    <div className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs',
                      event.actorType === 'AI' ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white' :
                      event.actorType === 'USER' ? 'bg-pink-500 text-white' :
                      'bg-slate-200 text-slate-500'
                    )}>
                      {event.actorType === 'AI' ? '🤖' :
                       event.actorType === 'USER' ? '👤' : '⚙️'}
                    </div>
                    {index < recentEvents.length - 1 && (
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-full bg-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900">
                        {event.title}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(event.timestamp || event.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-slate-500">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <History size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No activity yet</p>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
