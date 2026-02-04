import { clsx } from 'clsx';
import { Sparkles, AlertTriangle, Clock, X, Check } from 'lucide-react';
import type { Mission, SuggestedTodo } from '../../types';
import { Modal } from '../feedback/Modal';
import { Button } from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useAIAnalysisStore } from '../../stores/aiAnalysisStore';
import { useToast } from '../../stores/uiStore';

interface AIAnalysisModalProps {
  mission: Mission | null;
  onTodosCreated?: (count: number) => void;  // Callback when todos are created
}

const complexityBadgeStyles: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400',
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  SIMPLE: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
  COMPLEX: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  UNKNOWN: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-400',
};

// Format time in human-readable format
const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

function TodoItem({
  todo,
  isSelected,
  onToggle,
  onRemove,
}: {
  todo: SuggestedTodo;
  isSelected: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={clsx(
        'group relative rounded-lg p-3 border-2 transition-all cursor-pointer',
        isSelected
          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
        todo.isUncertain && 'bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20'
      )}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all',
            isSelected
              ? 'bg-indigo-500 border-indigo-500 text-white'
              : 'border-slate-300 dark:border-slate-600'
          )}
        >
          {isSelected && <Check size={12} strokeWidth={3} />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title and badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h5 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {todo.title}
            </h5>
            {todo.isUncertain && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                <AlertTriangle size={10} />
                <span className="text-[10px] font-semibold">{t('aiAnalysis.needsConfirmation')}</span>
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
            {todo.description}
          </p>

          {/* Uncertain reason */}
          {todo.isUncertain && todo.uncertainReason && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-2 italic">
              "{todo.uncertainReason}"
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase',
                complexityBadgeStyles[todo.complexity]
              )}
            >
              {todo.complexity}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <Clock size={10} />
              {formatTime(todo.estimatedTime)}
            </span>
          </div>
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          title="Remove"
        >
          <X size={14} className="text-slate-400" />
        </button>
      </div>
    </div>
  );
}

function AnalyzingState({ missionTitle }: { missionTitle: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Animated AI icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-ping">
          <Sparkles size={48} className="text-purple-300" />
        </div>
        <Sparkles size={48} className="text-purple-500 animate-pulse" />
      </div>

      {/* Loading text */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {t('aiAnalysis.analyzing')}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs mb-4">
        "{missionTitle}"
      </p>

      {/* Loading bar */}
      <div className="w-48 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

function ResultState({
  mission,
  onClose,
  onTodosCreated,
}: {
  mission: Mission;
  onClose: () => void;
  onTodosCreated?: (count: number) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const {
    result,
    selectedTodoIds,
    toggleTodoSelection,
    removeSuggestedTodo,
    selectAllTodos,
    deselectAllTodos,
    confirmAndCreate,
    getSelectedTodos,
    getUncertainTodos,
  } = useAIAnalysisStore();

  if (!result) return null;

  const selectedTodos = getSelectedTodos();
  const uncertainTodos = getUncertainTodos();
  const totalTime = selectedTodos.reduce((acc, t) => acc + t.estimatedTime, 0);
  const isAllSelected = selectedTodoIds.size === result.suggestedTodos.length;
  const isNoneSelected = selectedTodoIds.size === 0;

  const handleConfirm = async () => {
    const createdCount = await confirmAndCreate(mission);
    if (createdCount > 0) {
      toast.success(
        t('aiAnalysis.todosCreated'),
        t('aiAnalysis.todosCreatedDesc', { count: createdCount.toString() })
      );
      // Notify parent that todos were created
      onTodosCreated?.(createdCount);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-purple-500" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t('aiAnalysis.suggested', { count: result.suggestedTodos.length.toString() })}
          </h3>
        </div>

        {/* Select all / deselect all */}
        <div className="flex items-center gap-2">
          <button
            onClick={isAllSelected ? deselectAllTodos : selectAllTodos}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {isAllSelected ? t('common.deselectAll') : t('common.selectAll')}
          </button>
        </div>
      </div>

      {/* Confidence badge */}
      <div className="flex items-center gap-3 mb-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div className="flex items-center gap-1.5">
          <div className={clsx(
            'w-2 h-2 rounded-full',
            result.confidence >= 0.8 ? 'bg-green-500' :
            result.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
          )} />
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {t('aiAnalysis.confidence')}: {Math.round(result.confidence * 100)}%
          </span>
        </div>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {t('aiAnalysis.analysisTime')}: {result.analysisTime.toFixed(1)}s
        </span>
        {uncertainTodos.length > 0 && (
          <>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle size={12} />
              {t('aiAnalysis.uncertainItems', { count: uncertainTodos.length.toString() })}
            </span>
          </>
        )}
      </div>

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[350px]">
        {result.suggestedTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            isSelected={selectedTodoIds.has(todo.id)}
            onToggle={() => toggleTodoSelection(todo.id)}
            onRemove={() => removeSuggestedTodo(todo.id)}
          />
        ))}
      </div>

      {/* Summary bar */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-3">
          <span>
            {t('aiAnalysis.selectedCount', { count: selectedTodoIds.size.toString() })}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {t('aiAnalysis.totalTime')}: {formatTime(totalTime)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isNoneSelected}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {t('aiAnalysis.createTodos', { count: selectedTodoIds.size.toString() })}
          </Button>
        </div>

        {/* Uncertain items note */}
        {uncertainTodos.length > 0 && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 text-center">
            {t('aiAnalysis.uncertainNote')}
          </p>
        )}
      </div>
    </div>
  );
}

export function AIAnalysisModal({ mission, onTodosCreated }: AIAnalysisModalProps) {
  const { t } = useTranslation();
  const { isModalOpen, isAnalyzing, closeModal, error } = useAIAnalysisStore();

  if (!mission) return null;

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={t('aiAnalysis.title')}
      size="lg"
    >
      {error ? (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button variant="secondary" onClick={closeModal} className="mt-4">
            {t('common.close')}
          </Button>
        </div>
      ) : isAnalyzing ? (
        <AnalyzingState missionTitle={mission.title} />
      ) : (
        <ResultState mission={mission} onClose={closeModal} onTodosCreated={onTodosCreated} />
      )}
    </Modal>
  );
}

export type { AIAnalysisModalProps };
