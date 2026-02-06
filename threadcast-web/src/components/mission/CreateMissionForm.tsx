import { useState } from 'react';
import { clsx } from 'clsx';
import { X, Plus, Sparkles, PenLine, Link2 } from 'lucide-react';
import { Button } from '../common/Button';
import { JiraTicketSelector } from './JiraTicketSelector';
import { SentryIssueSelector } from './SentryIssueSelector';
import type { Priority } from '../../types';
import type { JiraIssue } from '../../services/jiraService';
import type { SentryIssue } from '../../services/sentryService';

export interface CreateMissionFormData {
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
}

export interface CreateMissionFormProps {
  onSubmit: (data: CreateMissionFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultPriority?: Priority;
}

const priorityOptions: { value: Priority; label: string; description: string }[] = [
  { value: 'CRITICAL', label: 'Critical', description: '즉시 처리 필요' },
  { value: 'HIGH', label: 'High', description: '빠른 처리 권장' },
  { value: 'MEDIUM', label: 'Medium', description: '일반적인 우선순위' },
  { value: 'LOW', label: 'Low', description: '여유있게 처리' },
];

const priorityColors: Record<Priority, string> = {
  CRITICAL: 'border-red-500 bg-red-50 text-red-700',
  HIGH: 'border-orange-500 bg-orange-50 text-orange-700',
  MEDIUM: 'border-yellow-500 bg-yellow-50 text-yellow-700',
  LOW: 'border-blue-500 bg-blue-50 text-blue-700',
};

const suggestedTags = ['backend', 'frontend', 'api', 'database', 'auth', 'ui', 'test', 'docs', 'refactor', 'feature'];

type CreateMode = 'manual' | 'integration';
type IntegrationSource = 'jira' | 'sentry';

export function CreateMissionForm({
  onSubmit,
  onCancel,
  isLoading = false,
  defaultPriority = 'MEDIUM',
}: CreateMissionFormProps) {
  const [createMode, setCreateMode] = useState<CreateMode>('manual');
  const [integrationSource, setIntegrationSource] = useState<IntegrationSource>('jira');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [selectedJiraIssue, setSelectedJiraIssue] = useState<JiraIssue | null>(null);
  const [selectedSentryIssue, setSelectedSentryIssue] = useState<SentryIssue | null>(null);

  const handleJiraIssueSelect = (issue: JiraIssue) => {
    setSelectedJiraIssue(issue);
    setSelectedSentryIssue(null);
    setTitle(issue.summary);
    setDescription(issue.description || '');

    // Map JIRA priority to our priority
    const jiraPriority = issue.priority?.toLowerCase() || '';
    if (jiraPriority.includes('highest') || jiraPriority.includes('critical')) {
      setPriority('CRITICAL');
    } else if (jiraPriority.includes('high')) {
      setPriority('HIGH');
    } else if (jiraPriority.includes('low') || jiraPriority.includes('lowest')) {
      setPriority('LOW');
    } else {
      setPriority('MEDIUM');
    }

    // Add issue type as tag
    if (issue.issueType) {
      const typeTag = issue.issueType.toLowerCase().replace(/\s+/g, '-');
      if (!tags.includes(typeTag)) {
        setTags(prev => [...prev, typeTag]);
      }
    }
    // Add jira tag
    if (!tags.includes('jira')) {
      setTags(prev => [...prev, 'jira']);
    }
  };

  const handleSentryIssueSelect = (issue: SentryIssue) => {
    setSelectedSentryIssue(issue);
    setSelectedJiraIssue(null);
    setTitle(`[${issue.shortId}] ${issue.title}`);
    setDescription(issue.culprit ? `Culprit: ${issue.culprit}\n\nLevel: ${issue.level}\nEvents: ${issue.count}\nLast seen: ${issue.lastSeen}` : '');

    // Map Sentry level to our priority
    const level = issue.level?.toLowerCase() || '';
    if (level === 'fatal') {
      setPriority('CRITICAL');
    } else if (level === 'error') {
      setPriority('HIGH');
    } else if (level === 'warning') {
      setPriority('MEDIUM');
    } else {
      setPriority('LOW');
    }

    // Add tags
    const newTags = ['sentry', 'bug'];
    if (issue.level) {
      newTags.push(issue.level.toLowerCase());
    }
    setTags(prev => {
      const combined = [...prev];
      newTags.forEach(tag => {
        if (!combined.includes(tag)) {
          combined.push(tag);
        }
      });
      return combined;
    });
  };

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags([...tags, normalizedTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: { title?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Mission 제목을 입력해주세요';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      tags,
    });
  };

  const availableSuggestedTags = suggestedTags.filter(tag => !tags.includes(tag));

  return (
    <div className="space-y-6">
      {/* Create Mode Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          type="button"
          onClick={() => setCreateMode('manual')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors',
            createMode === 'manual'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <PenLine size={16} />
          직접 입력
        </button>
        <button
          type="button"
          onClick={() => setCreateMode('integration')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors',
            createMode === 'integration'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Link2 size={16} />
          Integration
        </button>
      </div>

      {/* Integration Selector */}
      {createMode === 'integration' && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
          {/* Integration Source Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setIntegrationSource('jira')}
              className={clsx(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                integrationSource === 'jira'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              <JiraIcon className="w-4 h-4" />
              JIRA
            </button>
            <button
              type="button"
              onClick={() => setIntegrationSource('sentry')}
              className={clsx(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                integrationSource === 'sentry'
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              <SentryIcon className="w-4 h-4" />
              Sentry
            </button>
          </div>

          {/* Integration Content */}
          <div className="p-4">
            {integrationSource === 'jira' ? (
              <>
                <JiraTicketSelector
                  onSelect={handleJiraIssueSelect}
                  selectedIssueKey={selectedJiraIssue?.key}
                />
                {selectedJiraIssue && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-blue-600">{selectedJiraIssue.key}</span>
                      <span className="text-slate-500">→</span>
                      <span className="font-medium text-slate-900">아래 내용으로 Mission 생성</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <SentryIssueSelector
                  onSelect={handleSentryIssueSelect}
                  selectedIssueId={selectedSentryIssue?.id}
                />
                {selectedSentryIssue && (
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-purple-600">{selectedSentryIssue.shortId}</span>
                      <span className="text-slate-500">→</span>
                      <span className="font-medium text-slate-900">아래 내용으로 Mission 생성</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="mission-title" className="block text-sm font-medium text-slate-700 mb-2">
          Mission 제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="mission-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({});
          }}
          placeholder="예: 사용자 인증 시스템 구현"
          className={clsx(
            'w-full px-4 py-3 border rounded-lg text-sm transition-all',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            errors.title ? 'border-red-300 bg-red-50' : 'border-slate-300'
          )}
        />
        {errors.title && (
          <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="mission-description" className="block text-sm font-medium text-slate-700 mb-2">
          설명 <span className="text-slate-400 text-xs">(선택)</span>
        </label>
        <textarea
          id="mission-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mission의 목표와 범위를 설명해주세요. AI가 더 정확하게 작업을 분해할 수 있습니다."
          rows={4}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          우선순위
        </label>
        <div className="grid grid-cols-2 gap-2">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPriority(option.value)}
              className={clsx(
                'px-4 py-3 border-2 rounded-lg text-left transition-all',
                priority === option.value
                  ? priorityColors[option.value]
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          태그 <span className="text-slate-400 text-xs">(선택)</span>
        </label>

        {/* Selected Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Tag Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="태그 입력 후 Enter"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleAddTag(tagInput)}
            disabled={!tagInput.trim()}
          >
            <Plus size={16} />
          </Button>
        </div>

        {/* Suggested Tags */}
        {availableSuggestedTags.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-2">추천 태그:</p>
            <div className="flex flex-wrap gap-1.5">
              {availableSuggestedTags.slice(0, 6).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Hint */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-900">AI가 자동으로 Todo를 생성합니다</p>
            <p className="text-xs text-indigo-700 mt-1">
              Mission을 생성하면 AI가 분석하여 세부 Todo 항목들을 자동으로 만들어 줍니다.
              설명이 자세할수록 더 정확한 Todo가 생성됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          Mission 생성
        </Button>
      </div>
      </form>
    </div>
  );
}

// Compact inline form variant
export interface CreateMissionInlineProps {
  onSubmit: (title: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function CreateMissionInline({
  onSubmit,
  onCancel,
  placeholder = '새 Mission 제목 입력...',
  isLoading = false,
}: CreateMissionInlineProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        autoFocus
      />
      <Button
        type="submit"
        size="sm"
        variant="primary"
        disabled={!title.trim()}
        isLoading={isLoading}
      >
        생성
      </Button>
      {onCancel && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
        >
          취소
        </Button>
      )}
    </form>
  );
}

// Icons
function JiraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84H11.53zM6.77 6.8a4.362 4.362 0 0 0 4.34 4.38h1.8v1.7c0 2.4 1.93 4.35 4.33 4.35V7.63a.84.84 0 0 0-.83-.83H6.77zM2 11.6c0 2.4 1.95 4.34 4.35 4.35h1.78v1.7c.01 2.39 1.95 4.34 4.34 4.35v-9.57a.84.84 0 0 0-.84-.83H2z"/>
    </svg>
  );
}

function SentryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 66" fill="currentColor">
      <path d="M29,2.26a4.67,4.67,0,0,0-8,0L14.42,13.53A32.21,32.21,0,0,1,32.17,40.19H27.55A27.68,27.68,0,0,0,12.09,17.47L6,28a15.92,15.92,0,0,1,9.23,12.17H4.62A.76.76,0,0,1,4,39.06l2.94-5a10.74,10.74,0,0,0-3.36-1.9l-2.91,5a4.54,4.54,0,0,0,1.69,6.24A4.66,4.66,0,0,0,4.62,44H19.15a19.4,19.4,0,0,0-8-17.31l2.31-4A23.87,23.87,0,0,1,23.76,44H36.07a35.88,35.88,0,0,0-16.41-31.8l4.67-8a.77.77,0,0,1,1.05-.27c.53.29,20.29,34.77,20.66,35.17a.76.76,0,0,1-.68,1.13H40.6q.09,1.91,0,3.81h4.78A4.59,4.59,0,0,0,50,42.67a4.49,4.49,0,0,0-.62-2.29Z"/>
    </svg>
  );
}
