import { useState, useEffect } from 'react';
import { Search, ExternalLink, AlertCircle, Settings, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useJiraStore } from '../../stores/jiraStore';
import { useUIStore } from '../../stores/uiStore';
import type { JiraIssue } from '../../services/jiraService';

interface JiraTicketSelectorProps {
  onSelect: (issue: JiraIssue) => void;
  selectedIssueKey?: string;
}

export function JiraTicketSelector({ onSelect, selectedIssueKey }: JiraTicketSelectorProps) {
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
    searchIssues,
    getIssue,
  } = useJiraStore();

  const [searchMode, setSearchMode] = useState<'search' | 'url'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

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

  // Set default project
  useEffect(() => {
    if (integration?.defaultProjectKey && !selectedProject) {
      setSelectedProject(integration.defaultProjectKey);
    } else if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].key);
    }
  }, [integration?.defaultProjectKey, projects, selectedProject]);

  // Search issues when project changes or search query changes
  useEffect(() => {
    if (!currentWorkspaceId || !selectedProject || searchMode !== 'search') return;

    const jql = searchQuery
      ? `project = ${selectedProject} AND (summary ~ "${searchQuery}" OR key = "${searchQuery}") ORDER BY updated DESC`
      : `project = ${selectedProject} ORDER BY updated DESC`;

    const debounceTimer = setTimeout(() => {
      searchIssues(currentWorkspaceId, jql, 20);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [currentWorkspaceId, selectedProject, searchQuery, searchMode, searchIssues]);

  const handleUrlSubmit = async () => {
    if (!currentWorkspaceId || !urlInput.trim()) return;

    setUrlError('');
    setIsLoadingUrl(true);

    try {
      // Extract issue key from URL or use as-is
      let issueKey = urlInput.trim();

      // Handle full URL format: https://xxx.atlassian.net/browse/PROJ-123
      const urlMatch = urlInput.match(/\/browse\/([A-Z]+-\d+)/i);
      if (urlMatch) {
        issueKey = urlMatch[1].toUpperCase();
      }

      // Handle PROJ-123 format
      const keyMatch = issueKey.match(/^([A-Z]+-\d+)$/i);
      if (!keyMatch) {
        setUrlError('올바른 JIRA 티켓 형식이 아닙니다. (예: PROJ-123)');
        setIsLoadingUrl(false);
        return;
      }

      const issue = await getIssue(currentWorkspaceId, issueKey.toUpperCase());
      if (issue) {
        onSelect(issue);
        setUrlInput('');
      } else {
        setUrlError('티켓을 찾을 수 없습니다.');
      }
    } catch {
      setUrlError('티켓을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Not connected - show guide
  if (!isConnected) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <AlertCircle size={32} className="text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          JIRA 연동이 필요합니다
        </h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          JIRA를 연동하면 티켓을 검색하여 Mission으로 가져올 수 있습니다.
        </p>
        <button
          onClick={() => navigate('/settings?tab=integrations')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Settings size={16} />
          JIRA 연동하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          type="button"
          onClick={() => setSearchMode('search')}
          className={clsx(
            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            searchMode === 'search'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Search size={14} className="inline mr-1.5" />
          검색
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('url')}
          className={clsx(
            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            searchMode === 'url'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <ExternalLink size={14} className="inline mr-1.5" />
          URL/키 입력
        </button>
      </div>

      {searchMode === 'url' ? (
        // URL Input Mode
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              JIRA 티켓 URL 또는 키
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="PROJ-123 또는 https://xxx.atlassian.net/browse/PROJ-123"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim() || isLoadingUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoadingUrl ? <Loader2 size={16} className="animate-spin" /> : '가져오기'}
              </button>
            </div>
            {urlError && (
              <p className="mt-1.5 text-xs text-red-600">{urlError}</p>
            )}
          </div>
        </div>
      ) : (
        // Search Mode
        <div className="space-y-3">
          {/* Project Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              프로젝트
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.key}>
                  {project.key} - {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              티켓 검색
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목 또는 티켓 번호로 검색..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Issue List */}
          <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                {searchQuery ? '검색 결과가 없습니다' : '티켓을 검색해주세요'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {issues.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => onSelect(issue)}
                    className={clsx(
                      'w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-start gap-3',
                      selectedIssueKey === issue.key && 'bg-blue-50'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {issue.issueTypeIconUrl ? (
                        <img src={issue.issueTypeIconUrl} alt={issue.issueType} className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 bg-slate-300 rounded" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-blue-600">{issue.key}</span>
                        <span className={clsx(
                          'px-1.5 py-0.5 text-xs rounded',
                          issue.statusCategory === 'done' && 'bg-green-100 text-green-700',
                          issue.statusCategory === 'indeterminate' && 'bg-blue-100 text-blue-700',
                          issue.statusCategory === 'new' && 'bg-slate-100 text-slate-700'
                        )}>
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-900 mt-0.5 truncate">{issue.summary}</p>
                    </div>
                    {selectedIssueKey === issue.key && (
                      <Check size={16} className="text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default JiraTicketSelector;
