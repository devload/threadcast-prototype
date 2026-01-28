import { clsx } from 'clsx';
import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

export type QuestionPriority = 'urgent' | 'high' | 'medium' | 'low';
export type AnswerOption = {
  id: string;
  label: string;
  description?: string;
};

export interface AIQuestionCardProps {
  id: string;
  question: string;
  context?: string;
  todoId?: string;
  todoTitle?: string;
  priority?: QuestionPriority;
  options: AnswerOption[];
  allowCustomAnswer?: boolean;
  onAnswer: (questionId: string, answerId: string, customText?: string) => void;
  onSkip?: (questionId: string) => void;
  isLoading?: boolean;
  isAnswered?: boolean;
}

const priorityStyles: Record<QuestionPriority, { dot: string; bg: string; label: string }> = {
  urgent: { dot: 'bg-red-500', bg: 'bg-red-50 border-red-200', label: 'Urgent' },
  high: { dot: 'bg-orange-500', bg: 'bg-orange-50 border-orange-200', label: 'High' },
  medium: { dot: 'bg-yellow-500', bg: 'bg-yellow-50 border-yellow-200', label: 'Medium' },
  low: { dot: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200', label: 'Low' },
};

export function AIQuestionCard({
  id,
  question,
  context,
  todoId,
  todoTitle,
  priority = 'medium',
  options,
  allowCustomAnswer = true,
  onAnswer,
  onSkip,
  isLoading = false,
  isAnswered = false,
}: AIQuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const priorityStyle = priorityStyles[priority];

  const handleSubmit = () => {
    if (selectedOption) {
      onAnswer(id, selectedOption, showCustomInput ? customText : undefined);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    if (optionId === 'custom') {
      setShowCustomInput(true);
      setSelectedOption('custom');
    } else {
      setShowCustomInput(false);
      setSelectedOption(optionId);
    }
  };

  if (isAnswered) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Answered</span>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('border rounded-lg overflow-hidden', priorityStyle.bg)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-inherit bg-white/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={clsx('w-2 h-2 rounded-full', priorityStyle.dot)} />
            <span className="text-xs font-semibold text-slate-500">
              {priorityStyle.label} Priority
            </span>
          </div>
          {todoId && (
            <span className="text-xs font-mono text-slate-400">
              TODO-{todoId.slice(-4).toUpperCase()}
            </span>
          )}
        </div>
        {todoTitle && (
          <p className="text-xs text-slate-500 truncate">{todoTitle}</p>
        )}
      </div>

      {/* Question */}
      <div className="px-4 py-4 bg-white">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs">🤔</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 leading-relaxed">
              {question}
            </p>
            {context && (
              <p className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded">
                {context}
              </p>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2 mt-4">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionSelect(option.id)}
              className={clsx(
                'w-full px-3 py-2.5 text-left rounded-lg border-2 transition-all text-sm',
                selectedOption === option.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={clsx(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                  selectedOption === option.id
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-slate-300'
                )}>
                  {selectedOption === option.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span className="font-medium">{option.label}</span>
              </div>
              {option.description && (
                <p className="text-xs text-slate-500 mt-1 ml-6">{option.description}</p>
              )}
            </button>
          ))}

          {/* AI Decides Option */}
          <button
            type="button"
            onClick={() => handleOptionSelect('ai_decides')}
            className={clsx(
              'w-full px-3 py-2.5 text-left rounded-lg border-2 transition-all text-sm',
              selectedOption === 'ai_decides'
                ? 'border-purple-500 bg-purple-50 text-purple-900'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-600'
            )}
          >
            <div className="flex items-center gap-2">
              <div className={clsx(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                selectedOption === 'ai_decides'
                  ? 'border-purple-500 bg-purple-500'
                  : 'border-slate-300'
              )}>
                {selectedOption === 'ai_decides' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <span className="font-medium">🤖 Let AI decide</span>
            </div>
          </button>

          {/* Custom Answer */}
          {allowCustomAnswer && (
            <button
              type="button"
              onClick={() => handleOptionSelect('custom')}
              className={clsx(
                'w-full px-3 py-2.5 text-left rounded-lg border-2 transition-all text-sm',
                selectedOption === 'custom'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'border-dashed border-slate-300 bg-white hover:border-slate-400 text-slate-600'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={clsx(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                  selectedOption === 'custom'
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-slate-300'
                )}>
                  {selectedOption === 'custom' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span className="font-medium">Custom answer...</span>
              </div>
            </button>
          )}

          {showCustomInput && (
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          {onSkip && (
            <button
              type="button"
              onClick={() => onSkip(id)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Skip for now
            </button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!selectedOption || (selectedOption === 'custom' && !customText.trim())}
            isLoading={isLoading}
            className="ml-auto"
          >
            Submit Answer
          </Button>
        </div>
      </div>
    </div>
  );
}

// Compact version for inline display
export interface AIQuestionBadgeProps {
  count: number;
  onClick?: () => void;
}

export function AIQuestionBadge({ count, onClick }: AIQuestionBadgeProps) {
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold hover:bg-pink-200 transition-colors"
    >
      <AlertCircle size={12} />
      <span>{count} question{count > 1 ? 's' : ''}</span>
    </button>
  );
}
