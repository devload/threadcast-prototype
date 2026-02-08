import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, HelpCircle, Settings, Trash2 } from 'lucide-react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../hooks/useTranslation';
import { Workspace } from '../types';
import { Logo } from '../components/common/Logo';
import { WelcomeModal, SetupChecklist, EmptyStateGuide, useOnboardingStore } from '../components/onboarding';
import { Modal, ConfirmDialog } from '../components/feedback/Modal';
import { Input, TextArea } from '../components/form/Input';
import { Button } from '../components/common/Button';

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
  const { workspaces, fetchWorkspaces, setCurrentWorkspace, createWorkspace, deleteWorkspace, isLoading } = useWorkspaceStore();
  const { isAuthenticated, isLoading: authLoading, fetchUser, user, logout } = useAuthStore();
  const { startTour, completeSetupStep, resetOnboarding, setHasSeenWelcome, isTourActive, setTourContext } = useOnboardingStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);

  // Workspace 생성 모달
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '', path: '' });
  const [isCreating, setIsCreating] = useState(false);

  // Workspace 삭제
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const helpMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalWorkspaces: 0,
    totalMissions: 0,
    activeMissions: 0,
    totalTodos: 0,
    threadingTodos: 0,
    aiActions: 0,
    pendingQuestions: 0,
  });

  // Check auth on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (helpMenuRef.current && !helpMenuRef.current.contains(e.target as Node)) {
        setShowHelpMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch workspaces only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    }
  }, [isAuthenticated, fetchWorkspaces]);

  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
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
        { totalWorkspaces: 0, totalMissions: 0, activeMissions: 0, totalTodos: 0, threadingTodos: 0, aiActions: 0, pendingQuestions: 0 }
      );
      setGlobalStats(stats);
    }
  }, [workspaces]);

  const handleWorkspaceClick = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    navigate(`/workspaces/${workspace.id}`);
  };

  const workspacesWithExtras: WorkspaceWithQuestions[] = (workspaces || []).map((ws) => ({
    ...ws,
    pendingQuestionCount: ws.stats?.pendingQuestionCount || 0,
    threadingCount: ws.stats?.activeTodoCount || 0,
    progress: ws.stats?.missionCount
      ? Math.round(((ws.stats?.completedMissionCount || 0) / ws.stats.missionCount) * 100)
      : 0,
  }));

  const workspacesWithQuestions = workspacesWithExtras.filter(ws => (ws.pendingQuestionCount || 0) > 0);
  const totalPendingQuestions = workspacesWithQuestions.reduce((sum, ws) => sum + (ws.pendingQuestionCount || 0), 0);

  // Mark workspace created when workspaces exist
  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      completeSetupStep('workspaceCreated');
    }
  }, [workspaces, completeSetupStep]);

  // Register tour context
  useEffect(() => {
    if (isTourActive) {
      setTourContext({
        openCreateWorkspaceModal: () => setShowCreateModal(true),
        closeCreateWorkspaceModal: () => setShowCreateModal(false),
      });
    }
  }, [isTourActive, setTourContext]);

  // Onboarding handlers
  const handleCreateWorkspace = () => {
    setShowCreateModal(true);
  };

  const handleSubmitWorkspace = async () => {
    if (!newWorkspace.name.trim()) return;

    setIsCreating(true);
    try {
      const created = await createWorkspace(
        newWorkspace.name,
        newWorkspace.description || '',
        newWorkspace.path || '~/projects/' + newWorkspace.name.toLowerCase().replace(/\s+/g, '-')
      );
      if (created) {
        completeSetupStep('workspaceCreated');
        setShowCreateModal(false);
        setNewWorkspace({ name: '', description: '', path: '' });
        await fetchWorkspaces();
      }
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartTour = () => {
    startTour();
    // Navigate to workspace dashboard for tour if there's a workspace
    if (workspaces && workspaces.length > 0) {
      setCurrentWorkspace(workspaces[0]);
      navigate(`/workspaces/${workspaces[0].id}`);
    }
  };

  const handleCreateDemo = async () => {
    // Create a demo workspace with sample data
    try {
      const demoWorkspace = await createWorkspace(
        'Demo Workspace',
        'AI 작업 관리의 모든 기능을 체험해보세요',
        '~/demo-project'
      );
      if (demoWorkspace) {
        completeSetupStep('workspaceCreated');
        setCurrentWorkspace(demoWorkspace);
        navigate(`/workspaces/${demoWorkspace.id}`);
      }
    } catch (error) {
      console.error('Failed to create demo workspace:', error);
    }
  };

  const handleDeleteWorkspace = (e: React.MouseEvent, workspace: Workspace) => {
    e.stopPropagation();
    setWorkspaceToDelete(workspace);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!workspaceToDelete) return;
    setIsDeleteLoading(true);
    try {
      await deleteWorkspace(workspaceToDelete.id);
      setShowDeleteConfirm(false);
      setWorkspaceToDelete(null);
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // Show loading or redirect to login
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Modal for first-time users */}
      <WelcomeModal
        onCreateWorkspace={handleCreateWorkspace}
        onStartTour={handleStartTour}
        onCreateDemo={handleCreateDemo}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-2">
              <span role="img" aria-label="analytics">📊</span> Analytics
            </button>
            <button
              data-tour="new-workspace-btn"
              onClick={handleCreateWorkspace}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              + New Workspace
            </button>

            {/* Help Menu */}
            <div className="relative" ref={helpMenuRef}>
              <button
                onClick={() => setShowHelpMenu(!showHelpMenu)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                title="도움말"
              >
                <HelpCircle size={20} />
              </button>

              {showHelpMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">도움말</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowHelpMenu(false);
                      handleStartTour();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span>🎯</span> UI 투어 다시 보기
                  </button>
                  <button
                    onClick={() => {
                      setShowHelpMenu(false);
                      setHasSeenWelcome(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span>👋</span> 환영 화면 다시 보기
                  </button>
                  <button
                    onClick={() => {
                      setShowHelpMenu(false);
                      resetOnboarding();
                      window.location.reload();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span>🔄</span> 전체 가이드 초기화
                  </button>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              title="설정"
            >
              <Settings size={20} />
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.name || 'User'}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('home.welcome', { name: user?.name || 'User' })} <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="text-gray-500">
            You have {globalStats.totalWorkspaces} workspaces with {globalStats.activeMissions} active missions
          </p>
        </div>

        {/* Setup Checklist for new users */}
        <div className="mb-8">
          <SetupChecklist
            onStartTour={handleStartTour}
            onOpenSettings={() => navigate('/settings')}
          />
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8" data-tour="global-stats">
          {!workspaces || workspaces.length === 0 ? (
            <>
              <StatCard icon="🏠" iconBg="bg-indigo-100" value={0} label={t('home.totalWorkspaces')} />
              <StatCard icon="🎯" iconBg="bg-amber-100" value={0} label={t('home.totalMissions')} />
              <StatCard icon="📋" iconBg="bg-green-100" value={0} label={t('home.totalTodos')} />
              <StatCard icon="🤖" iconBg="bg-purple-100" value={0} label={t('home.aiActions')} />
              <StatCard icon="🤔" iconBg="bg-pink-100" value={0} label={t('home.pendingQuestions')} />
            </>
          ) : (
            <>
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
            </>
          )}
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

        <div className="grid grid-cols-3 gap-5 mb-10" data-tour="workspace-list">
          {workspacesWithExtras.length === 0 ? (
            <div className="col-span-3">
              <EmptyStateGuide
                type="workspace"
                onAction={handleCreateWorkspace}
                onSecondaryAction={handleCreateDemo}
              />
            </div>
          ) : (
            <>
              {workspacesWithExtras.map(workspace => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  onClick={() => handleWorkspaceClick(workspace)}
                  onDelete={(e) => handleDeleteWorkspace(e, workspace)}
                />
              ))}

              {/* Add New Workspace Card */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-2xl p-6 min-h-[280px] flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all"
                onClick={handleCreateWorkspace}
              >
                <div className="w-16 h-16 border-2 border-dashed border-current rounded-2xl flex items-center justify-center text-3xl mb-3">
                  +
                </div>
                <div className="text-base font-medium">{t('home.addWorkspace')}</div>
                <div className="text-sm mt-1">{t('home.addWorkspaceDesc')}</div>
              </div>
            </>
          )}
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
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm">{t('home.noRecentActivity') || '아직 활동이 없습니다'}</p>
            <p className="text-xs text-gray-400 mt-1">Mission을 생성하면 여기에 활동이 표시됩니다</p>
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

      {/* Create Workspace Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="새 Workspace 만들기"
        data-tour="create-workspace-modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              취소
            </Button>
            <Button onClick={handleSubmitWorkspace} isLoading={isCreating} disabled={!newWorkspace.name.trim()}>
              생성하기
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Workspace 이름"
            value={newWorkspace.name}
            onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
            placeholder="예: My Project"
            fullWidth
            data-tour="workspace-name-input"
          />
          <TextArea
            label="설명 (선택)"
            value={newWorkspace.description}
            onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
            placeholder="프로젝트에 대한 간단한 설명"
            fullWidth
          />
          <Input
            label="프로젝트 경로"
            value={newWorkspace.path}
            onChange={(e) => setNewWorkspace({ ...newWorkspace, path: e.target.value })}
            placeholder="~/projects/my-project"
            fullWidth
          />
        </div>
      </Modal>

      {/* Delete Workspace Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setWorkspaceToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Workspace"
        message={`"${workspaceToDelete?.name}" 워크스페이스를 삭제하시겠습니까? 모든 미션, Todo, 데이터가 영구 삭제됩니다.`}
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        isLoading={isDeleteLoading}
      />

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
  onDelete,
}: {
  workspace: WorkspaceWithQuestions;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) => {
  const hasAlert = (workspace.pendingQuestionCount || 0) > 0;
  const stats = workspace.stats;

  const getWorkspaceIcon = (name: string) => {
    if (name.includes('server') || name.includes('whatap')) return '☕';
    if (name.includes('thread')) return '🎯';
    if (name.includes('mobile')) return '📱';
    return '📁';
  };

  return (
    <div
      className={`bg-white border rounded-2xl p-6 cursor-pointer transition-all relative overflow-hidden group hover:border-indigo-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-100 ${
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

      {/* Delete button - visible on hover */}
      {!hasAlert && (
        <button
          onClick={onDelete}
          className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all"
          title="Delete workspace"
        >
          <Trash2 size={16} className="text-red-400 hover:text-red-600" />
        </button>
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

export default HomePage;
