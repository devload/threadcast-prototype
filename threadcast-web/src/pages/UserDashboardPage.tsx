import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DashboardGrid,
  DashboardGridItem,
  DashboardStatCard,
  DashboardWidget,
  DashboardWidgetListItem,
  DashboardSection,
  DashboardPageHeader,
  DashboardAlertBanner,
  NotificationBadge,
  TodoStatusChart,
  WeeklyActivityChart,
} from '../components/dashboard';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { useMissionStore, useTimelineStore, useUIStore, useAuthStore, useAIQuestionStore } from '../stores';
import { useTranslation } from '../hooks/useTranslation';
import { Target, CheckSquare, Clock, Zap, MessageCircle } from 'lucide-react';
import type { Mission } from '../types';

export function UserDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceId: urlWorkspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuthStore();
  const { currentWorkspaceId, setCurrentWorkspaceId } = useUIStore();
  const { missions, isLoading: missionsLoading, fetchMissions } = useMissionStore();
  const { events, isLoading: timelineLoading, fetchEvents } = useTimelineStore();
  const { questions: aiQuestions, fetchQuestions } = useAIQuestionStore();

  // Sync URL workspaceId with store
  useEffect(() => {
    if (urlWorkspaceId && urlWorkspaceId !== currentWorkspaceId) {
      setCurrentWorkspaceId(urlWorkspaceId);
    }
  }, [urlWorkspaceId, currentWorkspaceId, setCurrentWorkspaceId]);

  // Use URL workspaceId or fallback to store
  const workspaceId = urlWorkspaceId || currentWorkspaceId;

  // Fetch data on mount
  useEffect(() => {
    if (workspaceId) {
      fetchMissions(workspaceId);
      fetchEvents({ workspaceId, size: 10 });
      fetchQuestions(workspaceId);
    }
  }, [workspaceId, fetchMissions, fetchEvents, fetchQuestions]);

  // Calculate dashboard stats
  const stats = useMemo(() => {
    const activeMissions = missions.filter(
      (m) => m.status === 'THREADING' || m.status === 'IN_PROGRESS'
    );
    const completedMissions = missions.filter(
      (m) => m.status === 'WOVEN' || m.status === 'COMPLETED'
    );
    const totalTodos = missions.reduce((acc, m) => acc + m.todoStats.total, 0);
    const completedTodos = missions.reduce((acc, m) => acc + m.todoStats.woven, 0);
    const threadingTodos = missions.reduce((acc, m) => acc + m.todoStats.threading, 0);
    const tangledTodos = missions.reduce((acc, m) => acc + m.todoStats.tangled, 0);
    const pendingTodos = missions.reduce((acc, m) => acc + m.todoStats.pending, 0);
    const pendingQuestions = aiQuestions.filter((q) => q.status === 'PENDING').length;

    return {
      totalMissions: missions.length,
      activeMissions: activeMissions.length,
      completedMissions: completedMissions.length,
      totalTodos,
      completedTodos,
      threadingTodos,
      tangledTodos,
      pendingTodos,
      pendingQuestions,
      overallProgress: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0,
    };
  }, [missions, aiQuestions]);

  // Todo status data for chart
  const todoStatusData = useMemo(() => ({
    pending: stats.pendingTodos,
    threading: stats.threadingTodos,
    woven: stats.completedTodos,
    tangled: stats.tangledTodos,
  }), [stats]);

  // Weekly activity mock data (TODO: Replace with API data)
  const weeklyActivityData = useMemo(() => [
    { day: 'Monday', ai: 12, user: 8 },
    { day: 'Tuesday', ai: 15, user: 10 },
    { day: 'Wednesday', ai: 8, user: 12 },
    { day: 'Thursday', ai: 20, user: 6 },
    { day: 'Friday', ai: 18, user: 14 },
    { day: 'Saturday', ai: 5, user: 3 },
    { day: 'Sunday', ai: 2, user: 1 },
  ], []);

  // Get active missions for display
  const activeMissions = useMemo(
    () =>
      missions
        .filter((m) => m.status === 'THREADING' || m.status === 'IN_PROGRESS')
        .slice(0, 5),
    [missions]
  );

  // Get pending AI questions
  const pendingQuestions = useMemo(
    () => aiQuestions.filter((q) => q.status === 'PENDING').slice(0, 5),
    [aiQuestions]
  );

  // Get recent timeline events
  const recentEvents = useMemo(() => events.slice(0, 8), [events]);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get event icon
  const getEventIcon = (eventType: string) => {
    if (eventType.includes('MISSION')) return '🎯';
    if (eventType.includes('TODO')) return '📋';
    if (eventType.includes('AI')) return '🤖';
    if (eventType.includes('STEP')) return '✅';
    return '📝';
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="p-6 pb-0">
        <DashboardPageHeader
          icon="👋"
          title={t('home.welcome', { name: user?.name || 'User' })}
          description={`You have ${stats.activeMissions} active missions and ${stats.threadingTodos} todos in progress`}
          actions={
            <button
              onClick={() => currentWorkspaceId && navigate(`/workspaces/${currentWorkspaceId}/missions`)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + New Mission
            </button>
          }
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-6 pt-4">
        {/* AI Alert Banner */}
        {stats.pendingQuestions > 0 && (
          <div className="mb-6">
            <DashboardAlertBanner
              type="ai"
              title={t('ai.aiWaitingQuestions', { count: stats.pendingQuestions })}
              description={`${stats.pendingQuestions} tasks are blocked waiting for your input`}
              badge={<NotificationBadge count={stats.pendingQuestions} />}
              action={{
                label: `Answer Now (${stats.pendingQuestions})`,
                onClick: () => {/* TODO: Open AI question panel */},
              }}
              dismissible
            />
          </div>
        )}

        {/* Stats Grid */}
        <DashboardSection spacing="md">
          <DashboardGrid cols={{ default: 2, md: 3, lg: 5 }} gap="md">
            <DashboardStatCard
              icon={<Target size={20} />}
              iconBg="indigo"
              value={stats.totalMissions}
              label={t('home.totalMissions')}
              subValue={`${stats.activeMissions} active`}
              onClick={() => currentWorkspaceId && navigate(`/workspaces/${currentWorkspaceId}/missions`)}
            />
            <DashboardStatCard
              icon={<Zap size={20} />}
              iconBg="amber"
              value={stats.threadingTodos}
              label="Threading"
              subValue="In progress now"
              highlight={stats.threadingTodos > 0}
            />
            <DashboardStatCard
              icon={<CheckSquare size={20} />}
              iconBg="green"
              value={`${stats.completedTodos}/${stats.totalTodos}`}
              label={t('home.totalTodos')}
              subValue={`${stats.overallProgress}% complete`}
            />
            <DashboardStatCard
              icon={<Clock size={20} />}
              iconBg="purple"
              value={`${stats.overallProgress}%`}
              label="Overall Progress"
              change={
                stats.overallProgress > 50
                  ? { value: 12, type: 'increase', label: 'this week' }
                  : undefined
              }
            />
            <DashboardStatCard
              icon={<MessageCircle size={20} />}
              iconBg="pink"
              value={stats.pendingQuestions}
              label={t('home.pendingQuestions')}
              subValue="Needs your input"
              highlight={stats.pendingQuestions > 0}
            />
          </DashboardGrid>
        </DashboardSection>

        {/* Main Content Grid - Row 1: Missions & Todo Status */}
        <DashboardSection spacing="lg">
          <DashboardGrid cols={{ default: 1, lg: 3 }} gap="lg">
            {/* Active Missions - 2 columns */}
            <DashboardGridItem colSpan={2}>
              <DashboardWidget
                icon="🎯"
                title="Active Missions"
                subtitle={`${activeMissions.length} missions in progress`}
                viewAllLink={{
                  label: 'View All',
                  onClick: () => currentWorkspaceId && navigate(`/workspaces/${currentWorkspaceId}/missions`),
                }}
                loading={missionsLoading}
                empty={
                  activeMissions.length === 0
                    ? {
                        icon: '🎯',
                        title: 'No active missions',
                        description: 'Start a new mission to begin working',
                        action: {
                          label: 'Create Mission',
                          onClick: () => currentWorkspaceId && navigate(`/workspaces/${currentWorkspaceId}/missions`),
                        },
                      }
                    : undefined
                }
                contentPadding="none"
                maxHeight="320px"
              >
                <div className="divide-y divide-slate-100">
                  {activeMissions.map((mission) => (
                    <MissionListItem
                      key={mission.id}
                      mission={mission}
                      onClick={() => currentWorkspaceId && navigate(`/workspaces/${currentWorkspaceId}/missions/${mission.id}/todos`)}
                    />
                  ))}
                </div>
              </DashboardWidget>
            </DashboardGridItem>

            {/* Todo Status Chart - 1 column */}
            <DashboardGridItem>
              <DashboardWidget
                icon="📊"
                title="Todo Status"
                subtitle={`${stats.totalTodos} total todos`}
                contentPadding="sm"
              >
                <div className="relative h-[200px]">
                  <TodoStatusChart
                    data={todoStatusData}
                    height={200}
                    variant="donut"
                    showLegend
                  />
                </div>
              </DashboardWidget>
            </DashboardGridItem>
          </DashboardGrid>
        </DashboardSection>

        {/* Main Content Grid - Row 2: Activity Chart & AI Questions */}
        <DashboardSection spacing="lg">
          <DashboardGrid cols={{ default: 1, lg: 3 }} gap="lg">
            {/* Weekly Activity Chart - 2 columns */}
            <DashboardGridItem colSpan={2}>
              <DashboardWidget
                icon="📈"
                title="Weekly Activity"
                subtitle="AI vs User actions this week"
                contentPadding="md"
              >
                <WeeklyActivityChart
                  data={weeklyActivityData}
                  height={200}
                  showLegend
                />
              </DashboardWidget>
            </DashboardGridItem>

            {/* AI Questions - 1 column */}
            <DashboardGridItem>
              <DashboardWidget
                icon="🤔"
                title="AI Questions"
                subtitle={pendingQuestions.length > 0 ? 'Needs your attention' : 'No pending questions'}
                accentColor={pendingQuestions.length > 0 ? 'pink' : undefined}
                contentPadding="sm"
                maxHeight="240px"
                empty={
                  pendingQuestions.length === 0
                    ? {
                        icon: '🤖',
                        title: 'All caught up!',
                        description: 'No AI questions waiting for your input',
                      }
                    : undefined
                }
              >
                {pendingQuestions.map((question) => (
                  <DashboardWidgetListItem
                    key={question.id}
                    left={<span className="text-xl">❓</span>}
                    title={question.question}
                    subtitle={formatRelativeTime(question.createdAt)}
                    right={
                      <button className="text-xs text-pink-600 font-medium hover:underline">
                        Answer
                      </button>
                    }
                    highlight
                  />
                ))}
              </DashboardWidget>
            </DashboardGridItem>
          </DashboardGrid>
        </DashboardSection>

        {/* Recent Activity Section */}
        <DashboardSection spacing="md">
          <DashboardWidget
            icon="⏱️"
            title={t('home.recentActivity')}
            subtitle={`${recentEvents.length} recent events`}
            viewAllLink={{
              label: 'View All',
              onClick: () => currentWorkspaceId && navigate(`/workspaces/${currentWorkspaceId}/timeline`),
            }}
            loading={timelineLoading}
            empty={
              recentEvents.length === 0
                ? {
                    icon: '📊',
                    title: 'No recent activity',
                    description: 'Activity will appear here as you work',
                  }
                : undefined
            }
            contentPadding="none"
            maxHeight="280px"
          >
            <div className="divide-y divide-slate-100">
              {recentEvents.map((event) => (
                <div key={event.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm flex-shrink-0">
                    {getEventIcon(event.eventType)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{event.title}</p>
                    <p className="text-xs text-slate-400">{formatRelativeTime(event.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </DashboardWidget>
        </DashboardSection>

        {/* Quick Actions */}
        <DashboardSection title="Quick Actions" icon="⚡" spacing="md">
          <DashboardGrid cols={{ default: 2, md: 4 }} gap="md">
            <QuickActionCard
              icon="➕"
              iconBg="bg-indigo-100"
              title="New Mission"
              description="Start a new task"
              onClick={() => currentWorkspaceId && navigate(`/workspaces/${currentWorkspaceId}/missions`)}
            />
            <QuickActionCard
              icon="📊"
              iconBg="bg-purple-100"
              title="Timeline"
              description="View activity history"
              onClick={() => currentWorkspaceId && navigate(`/workspaces/${currentWorkspaceId}/timeline`)}
            />
            <QuickActionCard
              icon="🤖"
              iconBg="bg-pink-100"
              title="AI Questions"
              description={`${stats.pendingQuestions} pending`}
              onClick={() => {/* TODO: Open AI panel */}}
              highlight={stats.pendingQuestions > 0}
            />
            <QuickActionCard
              icon="⚙️"
              iconBg="bg-slate-100"
              title="Settings"
              description="Configure workspace"
              onClick={() => navigate('/settings')}
            />
          </DashboardGrid>
        </DashboardSection>
      </div>
    </div>
  );
}

// Helper Components

interface MissionListItemProps {
  mission: Mission;
  onClick: () => void;
}

function MissionListItem({ mission, onClick }: MissionListItemProps) {
  return (
    <div
      className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 mr-3">
          <h4 className="font-medium text-slate-900 truncate">{mission.title}</h4>
          <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
            {mission.description || 'No description'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={mission.priority} />
          <StatusBadge status={mission.status} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar value={mission.progress} size="sm" className="flex-1" />
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {mission.todoStats.woven}/{mission.todoStats.total} todos
        </span>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  icon: string;
  iconBg: string;
  title: string;
  description: string;
  onClick: () => void;
  highlight?: boolean;
}

function QuickActionCard({
  icon,
  iconBg,
  title,
  description,
  onClick,
  highlight,
}: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 bg-white rounded-xl border text-left transition-all group ${
        highlight
          ? 'border-pink-200 hover:border-pink-300 hover:shadow-sm hover:shadow-pink-100'
          : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center text-xl group-hover:scale-105 transition-transform`}
        >
          {icon}
        </div>
        <div>
          <div className="font-medium text-slate-900">{title}</div>
          <div className="text-xs text-slate-500">{description}</div>
        </div>
      </div>
    </button>
  );
}

export default UserDashboardPage;
