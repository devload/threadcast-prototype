import { clsx } from 'clsx';
import { Check, Circle, Loader2, AlertTriangle } from 'lucide-react';
import type { TodoStep, StepType } from '../../types';

interface TodoStepsProps {
  steps: TodoStep[];
  onStepClick?: (step: TodoStep) => void;
  compact?: boolean;
  /** Show real-time progress indicators */
  showProgress?: boolean;
}

const stepIcons: Record<StepType, string> = {
  ANALYSIS: '🔍',
  DESIGN: '✏️',
  IMPLEMENTATION: '⚙️',
  VERIFICATION: '🧪',
  REVIEW: '👀',
  INTEGRATION: '🔗',
};

const stepLabels: Record<StepType, string> = {
  ANALYSIS: 'Analysis',
  DESIGN: 'Design',
  IMPLEMENTATION: 'Implementation',
  VERIFICATION: 'Verification',
  REVIEW: 'Review',
  INTEGRATION: 'Integration',
};

const stepDescriptions: Record<StepType, string> = {
  ANALYSIS: 'Analyze requirements and context',
  DESIGN: 'Design solution approach',
  IMPLEMENTATION: 'Implement the solution',
  VERIFICATION: 'Test and validate',
  REVIEW: 'Review and refine',
  INTEGRATION: 'Finalize and integrate',
};

const stepOrder: StepType[] = ['ANALYSIS', 'DESIGN', 'IMPLEMENTATION', 'VERIFICATION', 'REVIEW', 'INTEGRATION'];

export function TodoSteps({ steps, onStepClick, compact = false, showProgress = true }: TodoStepsProps) {
  // Sort steps by order
  const sortedSteps = [...steps].sort((a, b) =>
    stepOrder.indexOf(a.stepType) - stepOrder.indexOf(b.stepType)
  );

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {sortedSteps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => onStepClick?.(step)}
              disabled={!onStepClick}
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all relative overflow-hidden',
                step.status === 'COMPLETED' && 'bg-green-500 text-white',
                step.status === 'IN_PROGRESS' && 'bg-amber-100 text-amber-700',
                step.status === 'FAILED' && 'bg-red-500 text-white',
                step.status === 'PENDING' && 'bg-slate-200 text-slate-500',
                step.status === 'SKIPPED' && 'bg-gray-300 text-gray-600',
                onStepClick && 'hover:ring-2 hover:ring-offset-1 hover:ring-indigo-500 cursor-pointer'
              )}
              title={`${stepLabels[step.stepType]}: ${step.status}${step.progress ? ` (${step.progress}%)` : ''}${step.message ? ` - ${step.message}` : ''}`}
            >
              {/* Progress ring for IN_PROGRESS */}
              {step.status === 'IN_PROGRESS' && showProgress && step.progress !== undefined && (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 28 28">
                  <circle
                    className="text-amber-200"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    r="12"
                    cx="14"
                    cy="14"
                  />
                  <circle
                    className="text-amber-500 transition-all duration-500"
                    strokeWidth="3"
                    strokeDasharray={`${(step.progress / 100) * 75.4} 75.4`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="12"
                    cx="14"
                    cy="14"
                  />
                </svg>
              )}
              {step.status === 'COMPLETED' ? (
                <Check size={14} />
              ) : step.status === 'IN_PROGRESS' ? (
                <Loader2 size={14} className="animate-spin relative z-10" />
              ) : step.status === 'FAILED' ? (
                <AlertTriangle size={14} />
              ) : (
                index + 1
              )}
            </button>
            {index < sortedSteps.length - 1 && (
              <div
                className={clsx(
                  'w-4 h-0.5 mx-0.5 transition-colors duration-300',
                  step.status === 'COMPLETED' ? 'bg-green-500' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedSteps.map((step, index) => (
        <div
          key={step.id}
          onClick={() => onStepClick?.(step)}
          className={clsx(
            'flex items-start gap-3 p-3 rounded-lg transition-all',
            step.status === 'COMPLETED' && 'bg-green-50 dark:bg-green-950/30',
            step.status === 'IN_PROGRESS' && 'bg-amber-50 dark:bg-amber-950/30',
            step.status === 'FAILED' && 'bg-red-50 dark:bg-red-950/30',
            step.status === 'PENDING' && 'bg-slate-50 dark:bg-slate-800/50',
            step.status === 'SKIPPED' && 'bg-gray-50 dark:bg-gray-800/50',
            onStepClick && 'cursor-pointer hover:ring-2 hover:ring-indigo-300'
          )}
        >
          {/* Step indicator */}
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm relative',
                step.status === 'COMPLETED' && 'bg-green-500 text-white',
                step.status === 'IN_PROGRESS' && 'bg-amber-500 text-white',
                step.status === 'FAILED' && 'bg-red-500 text-white',
                step.status === 'PENDING' && 'bg-slate-200 text-slate-500',
                step.status === 'SKIPPED' && 'bg-gray-300 text-gray-600'
              )}
            >
              {/* Progress ring overlay for IN_PROGRESS */}
              {step.status === 'IN_PROGRESS' && showProgress && step.progress !== undefined && (
                <svg className="absolute -inset-0.5 w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    className="text-amber-200/50"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    r="16"
                    cx="18"
                    cy="18"
                  />
                  <circle
                    className="text-amber-300 transition-all duration-500"
                    strokeWidth="3"
                    strokeDasharray={`${(step.progress / 100) * 100.53} 100.53`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="16"
                    cx="18"
                    cy="18"
                  />
                </svg>
              )}
              {step.status === 'COMPLETED' ? (
                <Check size={16} />
              ) : step.status === 'IN_PROGRESS' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : step.status === 'FAILED' ? (
                <AlertTriangle size={16} />
              ) : (
                <Circle size={16} />
              )}
            </div>
            {index < sortedSteps.length - 1 && (
              <div
                className={clsx(
                  'w-0.5 h-6 mt-1 transition-colors duration-300',
                  step.status === 'COMPLETED' ? 'bg-green-300' : 'bg-slate-200 dark:bg-slate-600'
                )}
              />
            )}
          </div>

          {/* Step content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">{stepIcons[step.stepType]}</span>
              <h4
                className={clsx(
                  'font-medium',
                  step.status === 'COMPLETED' && 'text-green-700 dark:text-green-400',
                  step.status === 'IN_PROGRESS' && 'text-amber-700 dark:text-amber-400',
                  step.status === 'FAILED' && 'text-red-700 dark:text-red-400',
                  step.status === 'PENDING' && 'text-slate-500 dark:text-slate-400',
                  step.status === 'SKIPPED' && 'text-gray-500 dark:text-gray-400'
                )}
              >
                {stepLabels[step.stepType]}
              </h4>
              {step.status === 'IN_PROGRESS' && (
                <span className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full flex items-center gap-1">
                  {step.progress !== undefined && step.progress > 0 && (
                    <span className="font-semibold tabular-nums">{step.progress}%</span>
                  )}
                  {(!step.progress || step.progress === 0) && 'In Progress'}
                </span>
              )}
              {step.status === 'FAILED' && (
                <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full">
                  Failed
                </span>
              )}
              {step.status === 'SKIPPED' && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                  Skipped
                </span>
              )}
            </div>

            {/* Real-time message for IN_PROGRESS */}
            {step.status === 'IN_PROGRESS' && step.message && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 animate-pulse">
                {step.message}
              </p>
            )}

            {/* Notes/Output */}
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {step.notes || stepDescriptions[step.stepType]}
            </p>

            {/* Timestamps */}
            {step.startedAt && !step.completedAt && (
              <p className="text-xs text-slate-400 mt-1">
                Started: {new Date(step.startedAt).toLocaleString('ko-KR')}
              </p>
            )}
            {step.completedAt && (
              <p className="text-xs text-slate-400 mt-1">
                Completed: {new Date(step.completedAt).toLocaleString('ko-KR')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
