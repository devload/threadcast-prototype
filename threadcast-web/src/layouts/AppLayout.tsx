import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore, useUIStore, useMissionStore, useWorkspaceStore } from '../stores';
import { useAIQuestionStore } from '../stores/aiQuestionStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { Sidebar } from '../components/layout/Sidebar';
import { ToastContainer } from '../components/feedback/Toast';
import { SearchModal } from '../components/search';
import { AIQuestionPanel } from '../components/ai/AIQuestionPanel';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId: urlWorkspaceId } = useParams<{ workspaceId: string }>();
  const { isAuthenticated, isLoading: authLoading, user, fetchUser, logout } = useAuthStore();
  const { currentWorkspaceId, setCurrentWorkspaceId, toasts, removeToast } = useUIStore();

  // Use URL workspaceId or fallback to store
  const workspaceId = urlWorkspaceId || currentWorkspaceId;

  // Sync URL workspaceId to store
  useEffect(() => {
    if (urlWorkspaceId && urlWorkspaceId !== currentWorkspaceId) {
      setCurrentWorkspaceId(urlWorkspaceId);
    }
  }, [urlWorkspaceId, currentWorkspaceId, setCurrentWorkspaceId]);
  const { missions } = useMissionStore();
  const { workspaces, fetchWorkspaces } = useWorkspaceStore();
  const { questions, openPanel } = useAIQuestionStore();

  // Get current workspace from workspaces list
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);

  // Calculate real stats from missions
  const stats = {
    total: missions.length,
    active: missions.filter(m => m.status === 'THREADING' || m.status === 'IN_PROGRESS').length,
    successRate: missions.length > 0
      ? Math.round((missions.filter(m => m.status === 'WOVEN' || m.status === 'COMPLETED').length / missions.length) * 100)
      : 0,
    remainingTime: `~${missions.filter(m => m.status === 'THREADING' || m.status === 'IN_PROGRESS').length * 2}h`,
  };

  // Initialize WebSocket connection
  useWebSocket(currentWorkspaceId);

  // Local state for sidebar
  const [activeNav, setActiveNav] = useState<'all' | 'active' | 'completed' | 'archived'>('all');

  // Check if current page has its own sidebar (like Timeline, Todos)
  const hasOwnSidebar = location.pathname.includes('/timeline') || location.pathname.includes('/todos');

  // Check auth on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Fetch workspaces when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    }
  }, [isAuthenticated, fetchWorkspaces]);

  // Redirect to login if not authenticated (after auth check completes)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Clear any stale tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Sync activeNav with current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('active')) {
      setActiveNav('active');
    } else if (path.includes('completed')) {
      setActiveNav('completed');
    } else if (path.includes('archived')) {
      setActiveNav('archived');
    } else {
      setActiveNav('all');
    }
  }, [location.pathname]);

  const handleNavChange = (navId: string) => {
    if (!workspaceId) return;
    const nav = navId as 'all' | 'active' | 'completed' | 'archived';
    setActiveNav(nav);
    // Navigate to appropriate route
    switch (nav) {
      case 'all':
        navigate(`/workspaces/${workspaceId}/missions`);
        break;
      case 'active':
        navigate(`/workspaces/${workspaceId}/missions?filter=active`);
        break;
      case 'completed':
        navigate(`/workspaces/${workspaceId}/missions?filter=completed`);
        break;
      case 'archived':
        navigate(`/workspaces/${workspaceId}/missions?filter=archived`);
        break;
    }
  };

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleCreateMission = useCallback(() => {
    if (workspaceId) {
      navigate(`/workspaces/${workspaceId}/missions?create=true`);
    }
  }, [navigate, workspaceId]);

  const handleAIQuestionsClick = useCallback(() => {
    openPanel();
  }, [openPanel]);

  if (!isAuthenticated) {
    return null; // Or loading spinner
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Only show global Sidebar if page doesn't have its own */}
      {!hasOwnSidebar && (
        <Sidebar
          activeNav={activeNav}
          onNavChange={handleNavChange}
          workspace={
            currentWorkspace
              ? { id: currentWorkspace.id, name: currentWorkspace.name }
              : currentWorkspaceId
                ? { id: currentWorkspaceId, name: 'Loading...' }
                : undefined
          }
          workspaces={workspaces.map(w => ({ id: w.id, name: w.name }))}
          stats={stats}
          user={user ? { name: user.name, email: user.email } : undefined}
          onLogout={handleLogout}
          pendingQuestions={questions.length}
          onAIQuestionsClick={handleAIQuestionsClick}
          onCreateMission={handleCreateMission}
        />
      )}

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Global Search Modal */}
      <SearchModal />

      {/* AI Question Panel */}
      <AIQuestionPanel />
    </div>
  );
}
