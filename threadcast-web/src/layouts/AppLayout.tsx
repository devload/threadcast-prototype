import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '../stores';
import { useWebSocket } from '../hooks/useWebSocket';
import { Sidebar } from '../components/layout/Sidebar';
import { ToastContainer } from '../components/feedback/Toast';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, fetchUser } = useAuthStore();
  const { currentWorkspaceId, toasts, removeToast } = useUIStore();

  // Initialize WebSocket connection
  useWebSocket(currentWorkspaceId);

  // Local state for sidebar
  const [activeNav, setActiveNav] = useState<'all' | 'active' | 'completed' | 'archived'>('all');

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

  const handleCreateMission = () => {
    // Navigate to mission creation or open modal
    navigate('/missions/new');
  };

  if (!isAuthenticated) {
    return null; // Or loading spinner
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        workspace={
          currentWorkspaceId
            ? { id: currentWorkspaceId, name: user?.name ? `${user.name}'s Workspace` : 'My Workspace' }
            : undefined
        }
        stats={{
          total: 12,
          active: 5,
          successRate: 65,
          remainingTime: '~24h',
        }}
        onCreateMission={handleCreateMission}
      />

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
