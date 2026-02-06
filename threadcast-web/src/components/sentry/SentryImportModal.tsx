import { useState, useEffect } from 'react';
import { X, Search, Loader2, AlertTriangle, Download, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { useUIStore } from '../../stores/uiStore';

interface SentryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionId?: string; // If provided, import as Todo under this Mission
  onImported?: (result: any) => void;
  onImportComplete?: () => void; // Called when import is complete (for page refresh)
}

interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit: string;
  level: string;
  status: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
  project: string;
  platform: string;
  isUnhandled: boolean;
}

interface SentryIntegration {
  organizationSlug: string;
  projectSlug: string;
  connected: boolean;
}

export function SentryImportModal({ isOpen, onClose, missionId, onImported, onImportComplete }: SentryImportModalProps) {
  const { currentWorkspaceId } = useUIStore();

  const [integration, setIntegration] = useState<SentryIntegration | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [issues, setIssues] = useState<SentryIssue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [query, setQuery] = useState('is:unresolved');
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentWorkspaceId) {
      checkConnection();
    }
  }, [isOpen, currentWorkspaceId]);

  useEffect(() => {
    if (isConnected && currentWorkspaceId) {
      fetchIssues();
    }
  }, [isConnected]);

  const checkConnection = async () => {
    if (!currentWorkspaceId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sentry/status?workspaceId=${currentWorkspaceId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data?.connected) {
          setIntegration(data.data);
          setIsConnected(true);
        }
      }
    } catch {
      // Not connected
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIssues = async () => {
    if (!currentWorkspaceId) return;
    setIsLoadingIssues(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        workspaceId: currentWorkspaceId,
        query,
        limit: '25',
      });
      const response = await fetch(`/api/sentry/issues?${params}`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data.data || []);
      } else {
        const data = await response.json();
        setError(data.error?.message || 'Failed to fetch issues');
      }
    } catch {
      setError('Failed to fetch issues');
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const handleImport = async (issueId: string) => {
    if (!currentWorkspaceId) return;

    setImportingIds(prev => new Set(prev).add(issueId));
    setError(null);

    try {
      const response = await fetch('/api/sentry/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspaceId,
          issueId,
          missionId: missionId || null,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setImportedIds(prev => new Set(prev).add(issueId));
        setSelectedIssues(prev => {
          const next = new Set(prev);
          next.delete(issueId);
          return next;
        });
        onImported?.(data.data);
        onImportComplete?.();
      } else {
        setError(data.error?.message || 'Import failed');
      }
    } catch {
      setError('Import failed');
    } finally {
      setImportingIds(prev => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
    }
  };

  const handleImportSelected = async () => {
    for (const issueId of selectedIssues) {
      await handleImport(issueId);
    }
  };

  const toggleSelect = (issueId: string) => {
    setSelectedIssues(prev => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'fatal':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'error':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <SentryIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Import from Sentry
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {missionId ? 'Import issues as Todos' : 'Import issues as Missions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-purple-500" />
            </div>
          ) : !isConnected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <SentryIcon className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-center">
                Sentry is not connected.
                <br />
                Go to Settings → Integrations to connect.
              </p>
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchIssues()}
                      placeholder="is:unresolved level:error"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={fetchIssues}
                    disabled={isLoadingIssues}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {isLoadingIssues ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Search
                  </button>
                </div>
                {integration && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Connected to <span className="font-medium">{integration.organizationSlug}</span>
                    {integration.projectSlug && ` / ${integration.projectSlug}`}
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Issues List */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {isLoadingIssues ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-purple-500" />
                  </div>
                ) : issues.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No issues found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {issues.map((issue) => {
                      const isImporting = importingIds.has(issue.id);
                      const isImported = importedIds.has(issue.id);
                      const isSelected = selectedIssues.has(issue.id);

                      return (
                        <div
                          key={issue.id}
                          className={clsx(
                            'p-3 rounded-lg border transition-colors cursor-pointer',
                            isImported
                              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                              : isSelected
                              ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-300 dark:border-purple-700'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          )}
                          onClick={() => !isImported && toggleSelect(issue.id)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className="pt-0.5">
                              <input
                                type="checkbox"
                                checked={isSelected || isImported}
                                disabled={isImported}
                                onChange={() => toggleSelect(issue.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium', getLevelColor(issue.level))}>
                                  {issue.level}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                  {issue.shortId}
                                </span>
                                {issue.isUnhandled && (
                                  <AlertTriangle size={12} className="text-orange-500" />
                                )}
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {issue.project}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                                {issue.title}
                              </p>
                              {issue.culprit && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                                  {issue.culprit}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>{issue.count?.toLocaleString()} events</span>
                                {issue.userCount > 0 && (
                                  <span>{issue.userCount?.toLocaleString()} users</span>
                                )}
                                <span>{formatRelativeTime(issue.lastSeen)}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <a
                                href={issue.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                title="Open in Sentry"
                              >
                                <ExternalLink size={14} className="text-slate-500" />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImport(issue.id);
                                }}
                                disabled={isImporting || isImported}
                                className={clsx(
                                  'p-1.5 rounded transition-colors',
                                  isImported
                                    ? 'bg-green-100 dark:bg-green-900/30'
                                    : 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
                                )}
                                title={missionId ? 'Import as Todo' : 'Import as Mission'}
                              >
                                {isImporting ? (
                                  <Loader2 size={14} className="animate-spin text-purple-500" />
                                ) : isImported ? (
                                  <CheckCircle size={14} className="text-green-500" />
                                ) : (
                                  <Download size={14} className="text-purple-500" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedIssues.size > 0 && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedIssues.size} issue{selectedIssues.size > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={handleImportSelected}
                    disabled={importingIds.size > 0}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {importingIds.size > 0 ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Import Selected
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SentryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 66" fill="currentColor">
      <path d="M29,2.26a4.67,4.67,0,0,0-8,0L14.42,13.53A32.21,32.21,0,0,1,32.17,40.19H27.55A27.68,27.68,0,0,0,12.09,17.47L6,28a15.92,15.92,0,0,1,9.23,12.17H4.62A.76.76,0,0,1,4,39.06l2.94-5a10.74,10.74,0,0,0-3.36-1.9l-2.91,5a4.54,4.54,0,0,0,1.69,6.24A4.66,4.66,0,0,0,4.62,44H19.15a19.4,19.4,0,0,0-8-17.31l2.31-4A23.87,23.87,0,0,1,23.76,44H36.07a35.88,35.88,0,0,0-16.41-31.8l4.67-8a.77.77,0,0,1,1.05-.27c.53.29,20.29,34.77,20.66,35.17a.76.76,0,0,1-.68,1.13H40.6q.09,1.91,0,3.81h4.78A4.59,4.59,0,0,0,50,42.67a4.49,4.49,0,0,0-.62-2.29Z"/>
    </svg>
  );
}

export default SentryImportModal;
