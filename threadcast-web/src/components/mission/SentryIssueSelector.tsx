import { useState, useEffect } from 'react';
import { Search, ExternalLink, AlertCircle, Settings, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useSentryStore } from '../../stores/sentryStore';
import { useUIStore } from '../../stores/uiStore';
import type { SentryIssue } from '../../services/sentryService';

export interface SentryIssueSelectorProps {
  onSelect: (issue: SentryIssue) => void;
  selectedIssueId?: string;
}

export function SentryIssueSelector({ onSelect, selectedIssueId }: SentryIssueSelectorProps) {
  const navigate = useNavigate();
  const { currentWorkspaceId } = useUIStore();
  const {
    integration,
    isConnected,
    projects,
    issues,
    isLoading,
    isSearching,
    fetchStatus,
    fetchProjects,
    fetchIssues,
  } = useSentryStore();

  const [query, setQuery] = useState('is:unresolved');
  const [selectedProject, setSelectedProject] = useState('');

  // Check connection status
  useEffect(() => {
    if (currentWorkspaceId) {
      fetchStatus(currentWorkspaceId);
    }
  }, [currentWorkspaceId, fetchStatus]);

  // Load projects when connected
  useEffect(() => {
    if (isConnected && currentWorkspaceId) {
      fetchProjects(currentWorkspaceId);
    }
  }, [isConnected, currentWorkspaceId, fetchProjects]);

  // Fetch issues when project or query changes
  useEffect(() => {
    if (!currentWorkspaceId || !isConnected) return;

    const debounceTimer = setTimeout(() => {
      fetchIssues(currentWorkspaceId, query, selectedProject || undefined);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [currentWorkspaceId, isConnected, query, selectedProject, fetchIssues]);

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'fatal':
        return 'bg-red-100 text-red-700';
      case 'error':
        return 'bg-orange-100 text-orange-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Not connected - show guide
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
          <AlertCircle size={32} className="text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Sentry 연동이 필요합니다
        </h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          Sentry를 연동하면 이슈를 검색하여 Mission으로 가져올 수 있습니다.
        </p>
        <button
          onClick={() => navigate('/settings?tab=integrations')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Settings size={16} />
          Sentry 연동하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Project Selector */}
      {projects.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            프로젝트
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">모든 프로젝트</option>
            {projects.map((project) => (
              <option key={project.id} value={project.slug}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          이슈 검색 (Sentry Query)
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="is:unresolved level:error"
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        {integration && (
          <p className="mt-1.5 text-xs text-slate-500">
            Connected to <span className="font-medium">{integration.organizationSlug}</span>
          </p>
        )}
      </div>

      {/* Issue List */}
      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-purple-500" />
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            검색 결과가 없습니다
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {issues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => onSelect(issue)}
                className={clsx(
                  'w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors',
                  selectedIssueId === issue.id && 'bg-purple-50'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium', getLevelColor(issue.level))}>
                        {issue.level}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {issue.shortId}
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 truncate">{issue.title}</p>
                    {issue.culprit && (
                      <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">
                        {issue.culprit}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span>{issue.count?.toLocaleString()} events</span>
                      <span>{formatRelativeTime(issue.lastSeen)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={issue.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded hover:bg-slate-200 transition-colors"
                      title="Open in Sentry"
                    >
                      <ExternalLink size={14} className="text-slate-400" />
                    </a>
                    {selectedIssueId === issue.id && (
                      <Check size={16} className="text-purple-600" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SentryIssueSelector;
