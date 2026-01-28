import { clsx } from 'clsx';
import { Check, Circle, Loader2 } from 'lucide-react';
import type { TodoStep, StepType } from '../../types';

interface TodoStepsProps {
  steps: TodoStep[];
  onStepClick?: (step: TodoStep) => void;
  compact?: boolean;
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

export function TodoSteps({ steps, onStepClick, compact = false }: TodoStepsProps) {
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
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                step.status === 'COMPLETED' && 'bg-green-500 text-white',
                step.status === 'IN_PROGRESS' && 'bg-amber-500 text-white animate-pulse',
                step.status === 'PENDING' && 'bg-slate-200 text-slate-500',
                step.status === 'SKIPPED' && 'bg-gray-300 text-gray-600',
                onStepClick && 'hover:ring-2 hover:ring-offset-1 hover:ring-indigo-500 cursor-pointer'
              )}
              title={`${stepLabels[step.stepType]}: ${step.status}`}
            >
              {step.status === 'COMPLETED' ? (
                <Check size={14} />
              ) : step.status === 'IN_PROGRESS' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                index + 1
              )}
            </button>
            {index < sortedSteps.length - 1 && (
              <div
                className={clsx(
                  'w-4 h-0.5 mx-0.5',
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
            step.status === 'COMPLETED' && 'bg-green-50',
            step.status === 'IN_PROGRESS' && 'bg-amber-50',
            step.status === 'PENDING' && 'bg-slate-50',
            step.status === 'SKIPPED' && 'bg-gray-50',
            onStepClick && 'cursor-pointer hover:ring-2 hover:ring-indigo-300'
          )}
        >
          {/* Step indicator */}
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                step.status === 'COMPLETED' && 'bg-green-500 text-white',
                step.status === 'IN_PROGRESS' && 'bg-amber-500 text-white',
                step.status === 'PENDING' && 'bg-slate-200 text-slate-500',
                step.status === 'SKIPPED' && 'bg-gray-300 text-gray-600'
              )}
            >
              {step.status === 'COMPLETED' ? (
                <Check size={16} />
              ) : step.status === 'IN_PROGRESS' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Circle size={16} />
              )}
            </div>
            {index < sortedSteps.length - 1 && (
              <div
                className={clsx(
                  'w-0.5 h-6 mt-1',
                  step.status === 'COMPLETED' ? 'bg-green-300' : 'bg-slate-200'
                )}
              />
            )}
          </div>

          {/* Step content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base">{stepIcons[step.stepType]}</span>
              <h4
                className={clsx(
                  'font-medium',
                  step.status === 'COMPLETED' && 'text-green-700',
                  step.status === 'IN_PROGRESS' && 'text-amber-700',
                  step.status === 'PENDING' && 'text-slate-500',
                  step.status === 'SKIPPED' && 'text-gray-500'
                )}
              >
                {stepLabels[step.stepType]}
              </h4>
              {step.status === 'IN_PROGRESS' && (
                <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                  In Progress
                </span>
              )}
              {step.status === 'SKIPPED' && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                  Skipped
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {step.notes || stepDescriptions[step.stepType]}
            </p>
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
