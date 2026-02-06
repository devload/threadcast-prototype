import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useTimelineStore } from '../stores/timelineStore';
import { useTranslation } from '../hooks/useTranslation';
import { Spinner } from '../components/common/Loading';
import { TopBar } from '../components/layout';
import { ActivityChart, TodoStatusChart, WeeklyActivityChart } from '../components/dashboard';
import type { ActivityDataPoint, TodoStatusData, WeeklyActivityData } from '../components/dashboard';
import type { ProjectTodoSummary, ProjectLinkedMission } from '../types';

export const ProjectDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentWorkspace, currentProjectDashboard, fetchProjectDashboard, isLoading } = useWorkspaceStore();
  const { events, fetchEvents } = useTimelineStore();

  useEffect(() => {
    if (currentWorkspace?.id && projectId) {
      fetchProjectDashboard(currentWorkspace.id, projectId);
      fetchEvents({ workspaceId: currentWorkspace.id, size: 10 });
    }
  }, [currentWorkspace?.id, projectId, fetchProjectDashboard, fetchEvents]);

  const dashboard = currentProjectDashboard;

  // Default stats to prevent undefined errors in useMemo
  const defaultStats = {
    totalTodos: 0,
    threadingTodos: 0,
    wovenTodos: 0,
    tangledTodos: 0,
    pendingTodos: 0,
    linkedMissions: 0,
    commits: 0,
    aiActions: 0,
    progress: 0,
    linesAdded: 0,
    linesRemoved: 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'THREADING': return 'bg-amber-500';
      case 'WOVEN': return 'bg-green-500';
      case 'TANGLED': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getComplexityStyle = (complexity: string) => {
    switch (complexity) {
      case 'HIGH': case 'COMPLEX': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700';
      case 'LOW': case 'SIMPLE': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getComplexityLabel = (complexity: string) => {
    switch (complexity) {
      case 'HIGH': case 'COMPLEX': return 'High';
      case 'MEDIUM': return 'Med';
      case 'LOW': case 'SIMPLE': return 'Low';
      default: return complexity;
    }
  };

  const getLanguageIcon = (language?: string) => {
    switch (language?.toLowerCase()) {
      case 'java': case 'kotlin': return '☕';
      case 'typescript': case 'javascript': return '📜';
      case 'python': return '🐍';
      case 'rust': return '🦀';
      case 'go': return '🐹';
      default: return '📁';
    }
  };

  if (isLoading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="text-6xl mb-4">📂</div>
        <p className="text-lg">{t('project.notFound')}</p>
        <button
          onClick={() => currentWorkspace?.id ? navigate(`/workspaces/${currentWorkspace.id}`) : navigate('/workspaces')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {t('common.goBack')}
        </button>
      </div>
    );
  }

  // Safely extract and normalize all dashboard data
  const rawStats = dashboard.stats || defaultStats;
  const stats = {
    totalTodos: Number(rawStats.totalTodos) || 0,
    threadingTodos: Number(rawStats.threadingTodos) || 0,
    wovenTodos: Number(rawStats.wovenTodos) || 0,
    tangledTodos: Number(rawStats.tangledTodos) || 0,
    pendingTodos: Number(rawStats.pendingTodos) || 0,
    linkedMissions: Number(rawStats.linkedMissions) || 0,
    commits: Number(rawStats.commits) || 0,
    aiActions: Number(rawStats.aiActions) || 0,
    progress: Number(rawStats.progress) || 0,
    linesAdded: Number(rawStats.linesAdded) || 0,
    linesRemoved: Number(rawStats.linesRemoved) || 0,
  };
  const todos = Array.isArray(dashboard.todos) ? dashboard.todos : [];
  const missions = Array.isArray(dashboard.linkedMissions) ? dashboard.linkedMissions : [];
  const worktrees = Array.isArray(dashboard.activeWorktrees) ? dashboard.activeWorktrees : [];
  const gitStatus = dashboard.gitStatus && typeof dashboard.gitStatus === 'object' ? dashboard.gitStatus : null;

  // Filter recent activities for this project
  const projectActivities = events.slice(0, 5);

  // Generate daily activity data from real timeline events
  const dailyActivityData: ActivityDataPoint[] = (() => {
    const data: ActivityDataPoint[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Filter events for this date
      const dayEvents = events.filter(e => {
        const eventDate = new Date(e.createdAt).toISOString().split('T')[0];
        return eventDate === dateStr;
      });

      // Count by type
      const aiActions = dayEvents.filter(e => e.actorType === 'AI').length;
      const todosCompleted = dayEvents.filter(e =>
        e.eventType === 'TODO_COMPLETED' || e.eventType === 'STEP_COMPLETED'
      ).length;
      const commits = dayEvents.filter(e => e.actorType === 'USER').length;

      data.push({
        date: dateStr,
        commits,
        aiActions,
        todosCompleted,
      });
    }
    return data;
  })();

  const todoStatusData: TodoStatusData = {
    pending: stats.pendingTodos,
    threading: stats.threadingTodos,
    woven: stats.wovenTodos,
    tangled: stats.tangledTodos,
  };

  // Generate weekly activity data from real timeline events
  const weeklyActivityData: WeeklyActivityData[] = (() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Count events by day of week
    const dayCounts = days.map(() => ({ ai: 0, user: 0 }));

    events.forEach(e => {
      const dayOfWeek = new Date(e.createdAt).getDay();
      if (e.actorType === 'AI') {
        dayCounts[dayOfWeek].ai++;
      } else if (e.actorType === 'USER') {
        dayCounts[dayOfWeek].user++;
      }
    });

    // Return Monday-first order
    return [1, 2, 3, 4, 5, 6, 0].map(i => ({
      day: dayNames[i],
      ai: dayCounts[i].ai,
      user: dayCounts[i].user,
    }));
  })();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Bar */}
      <TopBar
        navigation="back"
        backLink={currentWorkspace?.id ? `/workspaces/${currentWorkspace.id}` : '/workspaces'}
        backLabel="Workspace"
        title={t('project.dashboard')}
        onRefresh={() => currentWorkspace?.id && projectId && fetchProjectDashboard(currentWorkspace.id, projectId)}
        isRefreshing={isLoading}
        actionLabel="+ Add Todo"
        onActionClick={() => {/* TODO: Open create todo modal */}}
      />

      {/* Main Content - scrollable */}
      <div className="flex-1 overflow-auto p-5">

      {/* Project Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-xl">
            {getLanguageIcon(String(dashboard.language || ''))}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{String(dashboard.name || 'Unknown Project')}</div>
            <div className="text-xs font-mono text-gray-400">{String(dashboard.path || '')}</div>
          </div>
        </div>
        <div className="flex gap-2">
          {dashboard.language && typeof dashboard.language === 'string' && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs font-semibold">
              {dashboard.language}
            </span>
          )}
          {dashboard.buildTool && typeof dashboard.buildTool === 'string' && (
            <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-semibold">
              {dashboard.buildTool}
            </span>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-6 gap-3 mb-4">
        <StatCard icon="📋" value={stats.totalTodos} label={t('project.totalTodos')} />
        <StatCard icon="🧵" value={stats.threadingTodos} label={t('project.threading')} subValue={stats.threadingTodos > 0 ? "Active" : undefined} />
        <StatCard icon="✅" value={stats.wovenTodos} label={t('project.woven')} />
        <StatCard icon="🎯" value={stats.linkedMissions} label="Missions" />
        <StatCard icon="⎇" value={stats.commits} label={t('project.commits')} />
        <StatCard icon="🤖" value={stats.aiActions} label={t('project.aiActions')} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-[1fr_1fr_320px] gap-4">
        {/* Todo List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <span>📋</span> {t('project.todoList')}
            </div>
            <span className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline">
              View All →
            </span>
          </div>
          <div className="p-3 space-y-2">
            {todos.length === 0 ? (
              <EmptyState icon="📋" message={t('project.noTodos')} />
            ) : (
              todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  getStatusColor={getStatusColor}
                  getComplexityStyle={getComplexityStyle}
                  getComplexityLabel={getComplexityLabel}
                />
              ))
            )}
          </div>
        </div>

        {/* Middle Column */}
        <div className="space-y-3">
          {/* Daily Activity Trend Chart */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>📈</span> {t('project.activityTrend')}
              </div>
            </div>
            <div className="p-3">
              <ActivityChart data={dailyActivityData} height={160} showLegend={true} />
            </div>
          </div>

          {/* Todo Status Distribution Chart */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>🎯</span> {t('project.todoStatusDistribution')}
              </div>
            </div>
            <div className="p-3 relative">
              <TodoStatusChart data={todoStatusData} height={160} showLegend={true} variant="donut" />
            </div>
          </div>

          {/* Linked Missions */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>🎯</span> {t('project.linkedMissions')}
              </div>
            </div>
            <div className="p-3 space-y-2">
              {missions.length === 0 ? (
                <EmptyState icon="🎯" message={t('project.noMissions')} />
              ) : (
                missions.map((mission) => (
                  <MissionItem
                    key={mission.id}
                    mission={mission}
                    getStatusColor={getStatusColor}
                    onClick={() => currentWorkspace?.id && navigate(`/workspaces/${currentWorkspace.id}/missions?selected=${mission.id}`)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Active Worktrees */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>🌿</span> {t('project.activeWorktrees')}
              </div>
            </div>
            <div className="p-3 space-y-2">
              {worktrees.length === 0 ? (
                <EmptyState icon="🌿" message={t('project.noWorktrees')} />
              ) : (
                worktrees.map((wt, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">{wt.todoId}</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">{wt.todoTitle}</div>
                    <div className="text-xs font-mono text-indigo-600">{wt.path}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          {/* Progress */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>📊</span> {t('project.progress')}
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-3">
                <div className="relative w-14 h-14">
                  <svg className="transform -rotate-90" width="56" height="56" viewBox="0 0 56 56">
                    <circle className="fill-none stroke-gray-200" cx="28" cy="28" r="23" strokeWidth="6" />
                    <circle
                      className="fill-none stroke-indigo-600"
                      cx="28" cy="28" r="23"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="144"
                      strokeDashoffset={144 - (144 * stats.progress) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo-600">
                    {stats.progress}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Overall Progress</div>
                  <div className="text-xs text-gray-500">{stats.wovenTodos} of {stats.totalTodos} todos completed</div>
                  {stats.threadingTodos > 0 && (
                    <div className="text-xs text-amber-600">{stats.threadingTodos} currently active</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600">+{stats.linesAdded}</div>
                  <div className="text-[9px] text-gray-400">Lines Added</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-red-500">-{stats.linesRemoved}</div>
                  <div className="text-[9px] text-gray-400">Lines Removed</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI vs User Activity Chart */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>🤖</span> AI vs User Activity
              </div>
            </div>
            <div className="p-3">
              <WeeklyActivityChart data={weeklyActivityData} height={140} showLegend={true} />
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg text-center">
                  <div className="text-base font-bold text-indigo-600">{stats.aiActions}</div>
                  <div className="text-[9px] text-gray-500">AI Actions</div>
                </div>
                <div className="p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg text-center">
                  <div className="text-base font-bold text-indigo-600">{stats.commits}</div>
                  <div className="text-[9px] text-gray-500">Commits</div>
                </div>
                <div className="p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg text-center">
                  <div className="text-base font-bold text-indigo-600">{stats.pendingTodos}</div>
                  <div className="text-[9px] text-gray-500">Pending</div>
                </div>
              </div>
            </div>
          </div>

          {/* Git Status */}
          {gitStatus && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                  <span>⎇</span> {t('project.gitStatus')}
                </div>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-indigo-600">{Number(gitStatus.commitCount) || 0}</div>
                    <div className="text-[9px] text-gray-400">Commits</div>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-indigo-600">{Number(gitStatus.branchCount) || 0}</div>
                    <div className="text-[9px] text-gray-400">Branches</div>
                  </div>
                </div>
                {gitStatus.currentBranch && typeof gitStatus.currentBranch === 'string' && (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <span>🌿</span>
                    <div>
                      <div className="text-xs font-mono font-semibold text-indigo-600">{gitStatus.currentBranch}</div>
                      <div className="text-[9px] text-gray-400">{t('project.currentBranch')}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Log */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>⏱️</span> {t('project.activityLog')}
              </div>
            </div>
            <div className="p-3 space-y-2">
              {projectActivities.length === 0 ? (
                <EmptyState icon="⏱️" message={t('project.noActivity')} />
              ) : (
                projectActivities.map((activity) => (
                  <ActivityItemComponent key={activity.id} activity={activity} />
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>⚡</span> {t('project.quickActions')}
              </div>
            </div>
            <div className="p-3 space-y-2">
              <QuickAction icon="➕" title={t('project.newTodo')} desc={t('project.newTodoDesc')} />
              <QuickAction icon="📊" title="Timeline" desc="View activity" onClick={() => currentWorkspace?.id && navigate(`/workspaces/${currentWorkspace.id}/timeline`)} />
              <QuickAction icon="⚙️" title="Settings" desc="Configure" />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, value, label, subValue }: { icon: string; value: number; label: string; subValue?: string }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
    <div className="text-xl mb-1">{icon}</div>
    <div className="text-2xl font-bold text-indigo-600">{Number(value) || 0}</div>
    <div className="text-xs text-gray-500">{String(label)}</div>
    {subValue && typeof subValue === 'string' && <div className="text-[10px] text-amber-600 font-medium mt-0.5">{subValue}</div>}
  </div>
);

const EmptyState = ({ icon, message }: { icon: string; message: string }) => (
  <div className="py-6 text-center text-gray-400">
    <div className="text-2xl mb-2 opacity-50">{icon}</div>
    <p className="text-xs">{message}</p>
  </div>
);

const TodoItem = ({
  todo,
  getStatusColor,
  getComplexityStyle,
  getComplexityLabel,
}: {
  todo: ProjectTodoSummary;
  getStatusColor: (s: string) => string;
  getComplexityStyle: (c: string) => string;
  getComplexityLabel: (c: string) => string;
}) => {
  const isThreading = todo.status === 'THREADING';
  const isWoven = todo.status === 'WOVEN';
  const [done, total] = (todo.stepProgress || '0/0').split('/').map(Number);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:translate-x-0.5 ${
        isThreading ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${getStatusColor(todo.status)} ${isThreading ? 'animate-pulse' : ''}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-900 truncate">{todo.title}</div>
        <div className="flex items-center gap-2 mt-1">
          {total > 0 && (
            <div className="flex gap-0.5">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-1 rounded-sm ${
                    i < done
                      ? 'bg-green-500'
                      : i === done && isThreading
                      ? 'bg-amber-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
          {todo.complexity && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${getComplexityStyle(todo.complexity)}`}>
              {getComplexityLabel(todo.complexity)}
            </span>
          )}
          {todo.missionTitle && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-indigo-100 text-indigo-600">
              {todo.missionTitle.slice(0, 10)}
            </span>
          )}
        </div>
      </div>
      <div className={`text-xs font-medium ${isWoven ? 'text-green-600' : isThreading ? 'text-amber-600' : 'text-gray-400'}`}>
        {isWoven ? '✓ Done' : isThreading ? todo.stepProgress : 'Pending'}
      </div>
    </div>
  );
};

const MissionItem = ({
  mission,
  getStatusColor,
  onClick,
}: {
  mission: ProjectLinkedMission;
  getStatusColor: (s: string) => string;
  onClick: () => void;
}) => {
  const isThreading = mission.status === 'THREADING';

  return (
    <div
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onClick}
    >
      <div className={`w-2 h-2 rounded-full ${getStatusColor(mission.status)} ${isThreading ? 'animate-pulse' : ''}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{mission.title}</div>
        <div className="text-xs text-gray-400">MISSION-{mission.id.slice(-4).toUpperCase()} • {mission.todoCount} todos</div>
      </div>
      <div className="text-sm font-semibold text-indigo-600">{mission.progress}%</div>
    </div>
  );
};

const ActivityItemComponent = ({ activity }: { activity: { id: string; eventType: string; actorType?: string; title: string; createdAt: string } }) => {
  const iconStyles: Record<string, string> = {
    AI: 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white',
    USER: 'bg-pink-500 text-white',
    SYSTEM: 'bg-gray-100 text-gray-600',
  };

  const icons: Record<string, string> = {
    AI: '🤖',
    USER: '👤',
    SYSTEM: '⚙️',
  };

  const actorType = activity.actorType || 'SYSTEM';
  const timeAgo = getTimeAgo(activity.createdAt);

  return (
    <div className="flex gap-3 items-start">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${iconStyles[actorType] || iconStyles.SYSTEM}`}>
        {icons[actorType] || icons.SYSTEM}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-900 truncate">{activity.title}</div>
        <div className="text-[10px] text-gray-400">{timeAgo}</div>
      </div>
    </div>
  );
};

const QuickAction = ({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick?: () => void }) => (
  <div
    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-white hover:border-indigo-300 border border-transparent transition-all"
    onClick={onClick}
  >
    <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center text-sm">
      {icon}
    </div>
    <div>
      <div className="text-xs font-medium text-gray-900">{title}</div>
      <div className="text-[10px] text-gray-400">{desc}</div>
    </div>
  </div>
);

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default ProjectDashboardPage;
