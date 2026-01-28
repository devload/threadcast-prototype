import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useTranslation } from '../hooks/useTranslation';
import { Workspace } from '../types';

interface GlobalStats {
  totalWorkspaces: number;
  totalMissions: number;
  activeMissions: number;
  totalTodos: number;
  threadingTodos: number;
  aiActions: number;
  pendingQuestions: number;
}

interface WorkspaceWithQuestions extends Workspace {
  pendingQuestionCount?: number;
  threadingCount?: number;
  progress?: number;
}

export const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaces, fetchWorkspaces, setCurrentWorkspace, isLoading } = useWorkspaceStore();
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalWorkspaces: 0,
    totalMissions: 0,
    activeMissions: 0,
    totalTodos: 0,
    threadingTodos: 0,
    aiActions: 0,
    pendingQuestions: 0,
  });

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (workspaces.length > 0) {
      const stats = workspaces.reduce(
        (acc, ws) => ({
          totalWorkspaces: acc.totalWorkspaces + 1,
          totalMissions: acc.totalMissions + (ws.stats?.missionCount || 0),
          activeMissions: acc.activeMissions + (ws.stats?.activeMissionCount || 0),
          totalTodos: acc.totalTodos + (ws.stats?.totalTodoCount || 0),
          threadingTodos: acc.threadingTodos + (ws.stats?.activeTodoCount || 0),
          aiActions: acc.aiActions,
          pendingQuestions: acc.pendingQuestions,
        }),
        { totalWorkspaces: 0, totalMissions: 0, activeMissions: 0, totalTodos: 0, threadingTodos: 0, aiActions: 324, pendingQuestions: 5 }
      );
      setGlobalStats(stats);
    }
  }, [workspaces]);

  const handleWorkspaceClick = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    navigate('/dashboard');
  };

  const workspacesWithExtras: WorkspaceWithQuestions[] = workspaces.map((ws, index) => ({
    ...ws,
    pendingQuestionCount: index === 0 ? 3 : index === 1 ? 2 : 0,
    threadingCount: ws.stats?.activeTodoCount || 0,
    progress: ws.stats?.missionCount
      ? Math.round(((ws.stats?.completedMissionCount || 0) / ws.stats.missionCount) * 100)
      : 0,
  }));

  const workspacesWithQuestions = workspacesWithExtras.filter(ws => (ws.pendingQuestionCount || 0) > 0);
  const totalPendingQuestions = workspacesWithQuestions.reduce((sum, ws) => sum + (ws.pendingQuestionCount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-xl">
              <span role="img" aria-label="thread">🧵</span>
            </div>
            <span className="text-xl font-bold text-indigo-600">ThreadCast</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-2">
              <span role="img" aria-label="analytics">📊</span> Analytics
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-2">
              <span role="img" aria-label="settings">⚙️</span> Settings
            </button>
            <button className="px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-purple-600 transition-colors flex items-center gap-2">
              + New Workspace
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer">
              DL
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('home.welcome', { name: 'devload' })} <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="text-gray-500">
            You have {globalStats.totalWorkspaces} workspaces with {globalStats.activeMissions} active missions
          </p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <StatCard
            icon="🏠"
            iconBg="bg-indigo-100"
            value={globalStats.totalWorkspaces}
            label={t('home.totalWorkspaces')}
          />
          <StatCard
            icon="🎯"
            iconBg="bg-amber-100"
            value={globalStats.totalMissions}
            label={t('home.totalMissions')}
            subValue={`${globalStats.activeMissions} active`}
          />
          <StatCard
            icon="📋"
            iconBg="bg-green-100"
            value={globalStats.totalTodos}
            label={t('home.totalTodos')}
            subValue={`${globalStats.threadingTodos} threading`}
          />
          <StatCard
            icon="🤖"
            iconBg="bg-purple-100"
            value={globalStats.aiActions}
            label={t('home.aiActions')}
          />
          <StatCard
            icon="🤔"
            iconBg="bg-pink-100"
            value={totalPendingQuestions}
            label={t('home.pendingQuestions')}
            subValue="Needs your input"
            highlight
          />
        </div>

        {/* AI Alert Banner */}
        {totalPendingQuestions > 0 && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-5 mb-8 flex items-center gap-5 cursor-pointer hover:border-pink-400 transition-colors">
            <div className="relative text-3xl">
              <span role="img" aria-label="thinking">🤔</span>
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center animate-pulse">
                {totalPendingQuestions}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-pink-600 mb-1">
                {t('ai.aiWaitingQuestions', { count: totalPendingQuestions })}
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {t('home.pendingAlert', { count: workspacesWithQuestions.length })} • {totalPendingQuestions} tasks blocked
              </div>
              <div className="flex gap-2">
                {workspacesWithQuestions.map(ws => (
                  <span key={ws.id} className="px-2.5 py-1 bg-pink-100 text-pink-600 rounded-md text-xs font-medium">
                    {ws.name} ({ws.pendingQuestionCount})
                  </span>
                ))}
              </div>
            </div>
            <button className="px-6 py-3 bg-pink-500 text-white rounded-lg text-sm font-semibold hover:bg-pink-600 transition-colors whitespace-nowrap">
              {t('ai.answerNow', { count: totalPendingQuestions })}
            </button>
          </div>
        )}

        {/* Workspaces Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span role="img" aria-label="home">🏠</span> {t('home.workspaceList')}
          </h2>
          <span className="text-sm text-indigo-600 font-medium cursor-pointer hover:underline">
            Manage Workspaces →
          </span>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-10">
          {workspacesWithExtras.map(workspace => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onClick={() => handleWorkspaceClick(workspace)}
            />
          ))}

          {/* Add New Workspace Card */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-2xl p-6 min-h-[280px] flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all"
            onClick={() => {/* TODO: Open create workspace modal */}}
          >
            <div className="w-16 h-16 border-2 border-dashed border-current rounded-2xl flex items-center justify-center text-3xl mb-3">
              +
            </div>
            <div className="text-base font-medium">{t('home.addWorkspace')}</div>
            <div className="text-sm mt-1">{t('home.addWorkspaceDesc')}</div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span role="img" aria-label="clock">⏱️</span> {t('home.recentActivity')}
            </h3>
            <span className="text-sm text-indigo-600 font-medium cursor-pointer hover:underline">
              View All →
            </span>
          </div>
          <div className="px-6 py-4">
            <ActivityItem
              icon="🤖"
              iconType="ai"
              text={<><strong>AI</strong>가 TODO-42-3의 Implementation 단계를 진행 중입니다</>}
              workspace="whatap-server"
              time="5분 전"
            />
            <ActivityItem
              icon="✓"
              iconType="woven"
              text={<><strong>MISSION-55</strong>의 TODO-55-2가 완료되었습니다</>}
              workspace="threadcast"
              time="30분 전"
            />
            <ActivityItem
              icon="👤"
              iconType="user"
              text={<><strong>devload</strong>님이 새 Mission을 생성했습니다: "대시보드 UI 개선"</>}
              workspace="threadcast"
              time="1시간 전"
            />
            <ActivityItem
              icon="🤖"
              iconType="ai"
              text={<><strong>AI</strong>가 코드 리뷰를 완료하고 커밋을 생성했습니다</>}
              workspace="whatap-server"
              time="2시간 전"
              isLast
            />
          </div>
        </div>
      </main>

      {isLoading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
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
  iconBg,
  value,
  label,
  subValue,
  highlight,
}: {
  icon: string;
  iconBg: string;
  value: number;
  label: string;
  subValue?: string;
  highlight?: boolean;
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
    <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center text-2xl`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-indigo-600">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {subValue && (
        <div className={`text-xs mt-0.5 ${highlight ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
          {subValue}
        </div>
      )}
    </div>
  </div>
);

const WorkspaceCard = ({
  workspace,
  onClick,
}: {
  workspace: WorkspaceWithQuestions;
  onClick: () => void;
}) => {
  const hasAlert = (workspace.pendingQuestionCount || 0) > 0;
  const stats = workspace.stats;

  const getWorkspaceIcon = (name: string) => {
    if (name.includes('server') || name.includes('whatap')) return '☕';
    if (name.includes('thread')) return '🧵';
    if (name.includes('mobile')) return '📱';
    return '📁';
  };

  return (
    <div
      className={`bg-white border rounded-2xl p-6 cursor-pointer transition-all relative overflow-hidden hover:border-indigo-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-100 ${
        hasAlert ? 'border-pink-300' : 'border-gray-200'
      }`}
      onClick={onClick}
    >
      {hasAlert && (
        <>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500" />
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full text-xs font-semibold text-pink-600">
            <span role="img" aria-label="thinking">🤔</span>
            {workspace.pendingQuestionCount} questions
          </div>
        </>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
          {getWorkspaceIcon(workspace.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold text-gray-900 truncate mb-1">
            {workspace.name}
          </div>
          <div className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded inline-block">
            {workspace.path}
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
        {workspace.description || 'No description'}
      </div>

      <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-xl font-bold text-indigo-600">{stats?.projectCount || 0}</div>
          <div className="text-[10px] text-gray-400">Projects</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-indigo-600">{stats?.missionCount || 0}</div>
          <div className="text-[10px] text-gray-400">Missions</div>
          {stats?.activeMissionCount ? (
            <div className="text-[10px] text-amber-500 font-medium">{stats.activeMissionCount} active</div>
          ) : null}
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-indigo-600">{stats?.totalTodoCount || 0}</div>
          <div className="text-[10px] text-gray-400">Todos</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-indigo-600">{workspace.progress || 0}%</div>
          <div className="text-[10px] text-gray-400">Progress</div>
        </div>
      </div>

      {(workspace.threadingCount || 0) > 0 && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="flex-1 text-xs text-gray-500">Currently threading...</span>
          <span className="text-xs font-semibold text-amber-600">{workspace.threadingCount} todos</span>
        </div>
      )}
    </div>
  );
};

const ActivityItem = ({
  icon,
  iconType,
  text,
  workspace,
  time,
  isLast,
}: {
  icon: string;
  iconType: 'ai' | 'woven' | 'user' | 'system';
  text: React.ReactNode;
  workspace: string;
  time: string;
  isLast?: boolean;
}) => {
  const iconBgClass = {
    ai: 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white',
    woven: 'bg-green-500 text-white',
    user: 'bg-pink-500 text-white',
    system: 'bg-gray-100 text-gray-600',
  }[iconType];

  return (
    <div className={`flex gap-4 py-3.5 ${isLast ? '' : 'border-b border-gray-100'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${iconBgClass}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-900 mb-1">{text}</div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="px-2 py-0.5 bg-gray-100 rounded font-medium">{workspace}</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
