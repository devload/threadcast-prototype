import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore, useUIStore, useMissionStore } from '../stores';
import { useWebSocket } from '../hooks/useWebSocket';
import { Sidebar } from '../components/layout/Sidebar';
import { ToastContainer } from '../components/feedback/Toast';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, fetchUser } = useAuthStore();
  const { currentWorkspaceId, toasts, removeToast } = useUIStore();
  const { missions } = useMissionStore();

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('accessToken')) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

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
    const nav = navId as 'all' | 'active' | 'completed' | 'archived';
    setActiveNav(nav);
    // Navigate to appropriate route
    switch (nav) {
      case 'all':
        navigate('/missions');
        break;
      case 'active':
        navigate('/missions?filter=active');
        break;
      case 'completed':
        navigate('/missions?filter=completed');
        break;
      case 'archived':
        navigate('/missions?filter=archived');
        break;
    }
  };

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
            currentWorkspaceId
              ? { id: currentWorkspaceId, name: user?.name ? `${user.name}의 Workspace` : 'My Workspace' }
              : undefined
          }
          stats={stats}
        />
      )}

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
