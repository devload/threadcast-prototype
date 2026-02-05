import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { Modal } from '../feedback/Modal';
import { useJiraStore } from '../../stores/jiraStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useMissionStore } from '../../stores/missionStore';
import type { JiraIssue } from '../../services/jiraService';
import { JiraIssueBadge } from './JiraIssueBadge';

interface JiraImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

type ImportMode = 'single' | 'epic';
type TargetType = 'MISSION' | 'TODO';

export function JiraImportModal({ isOpen, onClose, onImportComplete }: JiraImportModalProps) {
  const { currentWorkspace } = useWorkspaceStore();
  const { missions, fetchMissions } = useMissionStore();
  const {
    isConnected,
    projects,
    issues,
    isSearching,
    isImporting,
    error,
    fetchProjects,
    searchIssues,
    importIssue,
    importEpic,
    clearError,
  } = useJiraStore();

  // Form state
  const [importMode, setImportMode] = useState<ImportMode>('single');
  const [selectedProject, setSelectedProject] = useState('');
  const [jqlQuery, setJqlQuery] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [targetType, setTargetType] = useState<TargetType>('MISSION');
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [includeChildren, setIncludeChildren] = useState(true);
  const [includeCompleted, setIncludeCompleted] = useState(false);

  // Load data on open
  useEffect(() => {
    if (isOpen && currentWorkspace?.id) {
      fetchProjects(currentWorkspace.id);
      if (missions.length === 0) {
        fetchMissions(currentWorkspace.id);
      }
    }
  }, [isOpen, currentWorkspace?.id, fetchProjects, fetchMissions, missions.length]);

  // Auto-generate JQL when project changes
  useEffect(() => {
    if (selectedProject) {
      const baseJql =
        importMode === 'epic'
          ? `project = ${selectedProject} AND issuetype = Epic AND statusCategory != Done`
          : `project = ${selectedProject} AND statusCategory != Done`;
      setJqlQuery(baseJql);
    }
  }, [selectedProject, importMode]);

  const handleSearch = useCallback(() => {
    if (!currentWorkspace?.id || !jqlQuery.trim()) return;
    clearError();
    searchIssues(currentWorkspace.id, jqlQuery);
  }, [currentWorkspace?.id, jqlQuery, searchIssues, clearError]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const toggleIssueSelection = (issueKey: string) => {
    setSelectedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(issueKey)) {
        next.delete(issueKey);
      } else {
        next.add(issueKey);
      }
      return next;
    });
  };

  const handleImport = async () => {
    if (!currentWorkspace?.id) return;

    clearError();

    if (importMode === 'epic') {
      // Import selected epics
      for (const epicKey of selectedIssues) {
        await importEpic(currentWorkspace.id, epicKey, {
          includeChildren,
          includeCompleted,
        });
      }
    } else {
      // Import selected issues
      for (const issueKey of selectedIssues) {
        await importIssue(
          currentWorkspace.id,
          issueKey,
          targetType,
          targetType === 'TODO' ? selectedMissionId : undefined
        );
      }
    }

    // Refresh missions list
    fetchMissions(currentWorkspace.id);

    // Clear selection
    setSelectedIssues(new Set());

    // Callback
    onImportComplete?.();
  };

  const getStatusColor = (statusCategory?: string) => {
    switch (statusCategory) {
      case 'new':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      case 'indeterminate':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'done':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  if (!isConnected) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="JIRA Import" size="md">
        <div className="text-center py-8">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            JIRA가 연결되지 않았습니다.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            설정에서 JIRA를 먼저 연결해주세요.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="JIRA Import" size="lg">
      <div className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Import Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setImportMode('single')}
            className={clsx(
              'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
              importMode === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            )}
          >
            개별 이슈
          </button>
          <button
            onClick={() => setImportMode('epic')}
            className={clsx(
              'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
              importMode === 'epic'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            )}
          >
            Epic Import
          </button>
        </div>

        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            프로젝트
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          >
            <option value="">프로젝트 선택...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.key}>
                {project.key} - {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* JQL Query */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            JQL 쿼리
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={jqlQuery}
              onChange={(e) => setJqlQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="project = PROJ AND status = Open"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !jqlQuery.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                '검색'
              )}
            </button>
          </div>
        </div>

        {/* Target Type (for single mode) */}
        {importMode === 'single' && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Import 대상:
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="MISSION"
                checked={targetType === 'MISSION'}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">Mission</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="TODO"
                checked={targetType === 'TODO'}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">Todo</span>
            </label>
          </div>
        )}

        {/* Mission Selection (for TODO import) */}
        {importMode === 'single' && targetType === 'TODO' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              대상 Mission
            </label>
            <select
              value={selectedMissionId}
              onChange={(e) => setSelectedMissionId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Mission 선택...</option>
              {missions.map((mission) => (
                <option key={mission.id} value={mission.id}>
                  {mission.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Epic Options */}
        {importMode === 'epic' && (
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeChildren}
                onChange={(e) => setIncludeChildren(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                하위 이슈 포함
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCompleted}
                onChange={(e) => setIncludeCompleted(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                완료된 이슈 포함
              </span>
            </label>
          </div>
        )}

        {/* Issues List */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              검색 결과 ({issues.length})
            </span>
            {selectedIssues.size > 0 && (
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {selectedIssues.size}개 선택됨
              </span>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {issues.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                {isSearching ? '검색 중...' : 'JQL 쿼리로 이슈를 검색하세요.'}
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {issues.map((issue: JiraIssue) => (
                  <li
                    key={issue.key}
                    onClick={() => !issue.imported && toggleIssueSelection(issue.key)}
                    className={clsx(
                      'px-4 py-3 flex items-center gap-3 transition-colors',
                      issue.imported
                        ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed'
                        : selectedIssues.has(issue.key)
                        ? 'bg-blue-50 dark:bg-blue-900/20 cursor-pointer'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIssues.has(issue.key)}
                      onChange={() => toggleIssueSelection(issue.key)}
                      disabled={issue.imported}
                      className="rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <JiraIssueBadge
                          issueKey={issue.key}
                          issueUrl={issue.webUrl}
                          issueType={issue.issueType}
                        />
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {issue.summary}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={clsx(
                            'text-xs px-1.5 py-0.5 rounded',
                            getStatusColor(issue.statusCategory)
                          )}
                        >
                          {issue.status}
                        </span>
                        {issue.assignee && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {issue.assignee}
                          </span>
                        )}
                        {issue.imported && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Imported
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            취소
          </button>
          <button
            onClick={handleImport}
            disabled={
              isImporting ||
              selectedIssues.size === 0 ||
              (importMode === 'single' && targetType === 'TODO' && !selectedMissionId)
            }
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Import 중...
              </>
            ) : (
              <>Import ({selectedIssues.size})</>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default JiraImportModal;
