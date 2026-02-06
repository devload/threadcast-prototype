import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useMissionStore } from '../stores/missionStore';
import { useUIStore } from '../stores/uiStore';
import { useAIQuestionStore } from '../stores/aiQuestionStore';
import { useTranslation } from '../hooks/useTranslation';
import { TopBar } from '../components/layout';

export const WorkspaceDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceId: urlWorkspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace, fetchWorkspaceDashboard, isLoading } = useWorkspaceStore();
  const { fetchMissions } = useMissionStore();
  const { fetchQuestions } = useAIQuestionStore();
  const { currentWorkspaceId, setCurrentWorkspaceId } = useUIStore();

  // Use URL workspaceId or fallback to store
  const workspaceId = urlWorkspaceId || currentWorkspaceId;

  // Sync URL workspaceId to store
  useEffect(() => {
    if (urlWorkspaceId && urlWorkspaceId !== currentWorkspaceId) {
      setCurrentWorkspaceId(urlWorkspaceId);
    }
  }, [urlWorkspaceId, currentWorkspaceId, setCurrentWorkspaceId]);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceDashboard(currentWorkspace.id);
      fetchMissions(currentWorkspace.id);
      fetchQuestions(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchWorkspaceDashboard, fetchMissions, fetchQuestions]);

  if (!currentWorkspace) {
    return (
      <div className="p-8 text-center text-gray-500">
        {t('workspace.selectWorkspace')}
      </div>
    );
  }

  const stats = currentWorkspace.stats;
  const projects = currentWorkspace.projects || [];
  const recentMissions = currentWorkspace.recentMissions || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'THREADING':
        return 'bg-amber-500';
      case 'WOVEN':
        return 'bg-green-500';
      case 'TANGLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'THREADING':
        return 'bg-amber-50 border-amber-200';
      case 'WOVEN':
        return 'bg-green-50 border-green-200';
      case 'TANGLED':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TopBar
        navigation="home"
        homeLink="/workspaces"
        title={currentWorkspace.name}
        tabs={[
          { id: 'dashboard', label: 'Dashboard', icon: '🏠', path: `/workspaces/${workspaceId}` },
          { id: 'missions', label: t('nav.missions'), icon: '🎯', path: `/workspaces/${workspaceId}/missions` },
          { id: 'timeline', label: t('nav.timeline'), icon: '📊', path: `/workspaces/${workspaceId}/timeline` },
        ]}
        activeTab="dashboard"
        onRefresh={() => currentWorkspace?.id && fetchWorkspaceDashboard(currentWorkspace.id)}
        isRefreshing={isLoading}
        actionLabel={`+ ${t('workspace.newMission')}`}
        onActionClick={() => workspaceId && navigate(`/workspaces/${workspaceId}/missions`)}
        actionDataTour="dashboard-new-mission"
      />

      {/* Main Content - scrollable */}
      <div className="flex-1 overflow-auto p-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" data-tour="dashboard-stats">
        <StatCard
          icon="📁"
          label={t('workspace.projects')}
          value={stats?.projectCount ?? 0}
          subValue={null}
        />
        <StatCard
          icon="🎯"
          label={t('workspace.missions')}
          value={stats?.missionCount ?? 0}
          subValue={`${stats?.activeMissionCount ?? 0} ${t('workspace.active')}`}
          highlight={(stats?.activeMissionCount ?? 0) > 0}
        />
        <StatCard
          icon="✅"
          label={t('workspace.completed')}
          value={stats?.completedMissionCount ?? 0}
          subValue={null}
        />
        <StatCard
          icon="📋"
          label={t('workspace.todos')}
          value={stats?.totalTodoCount ?? 0}
          subValue={`${stats?.activeTodoCount ?? 0} ${t('workspace.inProgress')}`}
          highlight={(stats?.activeTodoCount ?? 0) > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>📁</span> {t('workspace.projects')}
              </h2>
              <button
                onClick={() => {/* TODO: Open create project modal */}}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                + {t('common.add')}
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {projects.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">📂</div>
                  <p className="text-gray-500 text-sm">{t('workspace.noProjects')}</p>
                  <button className="mt-3 text-indigo-600 text-sm font-medium hover:underline">
                    {t('workspace.addFirstProject')}
                  </button>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 hover:bg-gray-50 active:bg-gray-100 active:scale-[0.99] cursor-pointer transition-all"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {getLanguageIcon(project.language)}
                          </span>
                          <span className="font-medium text-gray-900 truncate">
                            {project.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-1 truncate">
                          {project.path}
                        </p>
                      </div>
                      {project.todoCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                          {project.todoCount} todos
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Missions Section */}
        <div className="lg:col-span-2" data-tour="recent-missions">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>🎯</span> {t('workspace.recentMissions')}
              </h2>
              <button
                onClick={() => workspaceId && navigate(`/workspaces/${workspaceId}/missions`)}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                {t('common.viewAll')} →
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {recentMissions.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-gray-500 text-sm">{t('workspace.noMissions')}</p>
                  <button
                    onClick={() => workspaceId && navigate(`/workspaces/${workspaceId}/missions`)}
                    className="mt-3 text-indigo-600 text-sm font-medium hover:underline"
                  >
                    {t('workspace.createFirstMission')}
                  </button>
                </div>
              ) : (
                recentMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className={`p-4 hover:bg-gray-50 active:bg-gray-100 active:scale-[0.99] cursor-pointer transition-all border-l-4 ${getStatusBgColor(mission.status)}`}
                    onClick={() => workspaceId && navigate(`/workspaces/${workspaceId}/missions?selected=${mission.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${getStatusColor(mission.status)}`}
                          />
                          <span className="font-medium text-gray-900">
                            {mission.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(mission.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex-1 max-w-32">
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getStatusColor(mission.status)}`}
                                style={{ width: `${mission.progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {mission.progress}%
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={mission.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              onClick={() => workspaceId && navigate(`/workspaces/${workspaceId}/missions`)}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <span className="text-xl">➕</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{t('workspace.newMission')}</div>
                  <div className="text-xs text-gray-500">{t('workspace.newMissionDesc')}</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => workspaceId && navigate(`/workspaces/${workspaceId}/timeline`)}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{t('workspace.viewTimeline')}</div>
                  <div className="text-xs text-gray-500">{t('workspace.viewTimelineDesc')}</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({
  icon,
  label,
  value,
  subValue,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: number;
  subValue: string | null;
  highlight?: boolean;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="flex items-center gap-3">
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
    {subValue && (
      <div
        className={`mt-2 text-xs ${highlight ? 'text-amber-600 font-medium' : 'text-gray-400'}`}
      >
        {subValue}
      </div>
    )}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'THREADING':
        return 'bg-amber-100 text-amber-700';
      case 'WOVEN':
        return 'bg-green-100 text-green-700';
      case 'TANGLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'THREADING':
        return 'Threading';
      case 'WOVEN':
        return 'Woven';
      case 'TANGLED':
        return 'Tangled';
      case 'BACKLOG':
        return 'Backlog';
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle()}`}>
      {getStatusLabel()}
    </span>
  );
};

const getLanguageIcon = (language?: string) => {
  switch (language?.toLowerCase()) {
    case 'java':
    case 'kotlin':
      return '☕';
    case 'typescript':
    case 'javascript':
      return '📜';
    case 'python':
      return '🐍';
    case 'rust':
      return '🦀';
    case 'go':
      return '🐹';
    case 'swift':
      return '🍎';
    default:
      return '📁';
  }
};

export default WorkspaceDashboardPage;
