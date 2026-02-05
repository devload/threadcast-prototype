import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ThemeProvider } from './components/providers/ThemeProvider';
import {
  LoginPage,
  AuthCallbackPage,
  MissionsPage,
  TodosPage,
  TimelinePage,
  HomePage,
  ProjectDashboardPage,
  UserDashboardPage,
  SettingsPage,
} from './pages';
import { WorkspaceDashboardPage } from './pages/WorkspaceDashboardPage';
import { InteractiveTour } from './components/onboarding';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* Interactive Tour - renders globally for onboarding */}
        <InteractiveTour />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Main dashboard - user overview */}
          <Route path="/dashboard" element={<UserDashboardPage />} />

          {/* Workspaces */}
          <Route path="/workspaces" element={<HomePage />} />

          {/* Settings - 독립 페이지 (HomePage와 같은 레벨) */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* Protected routes with layout */}
          <Route element={<AppLayout />}>
            {/* Workspace routes */}
            <Route path="/workspaces/:workspaceId" element={<WorkspaceDashboardPage />} />
            <Route path="/workspaces/:workspaceId/missions" element={<MissionsPage />} />
            <Route path="/workspaces/:workspaceId/missions/:missionId" element={<MissionsPage />} />
            <Route path="/workspaces/:workspaceId/missions/:missionId/todos" element={<TodosPage />} />
            <Route path="/workspaces/:workspaceId/timeline" element={<TimelinePage />} />

            {/* Project routes */}
            <Route path="/projects/:projectId" element={<ProjectDashboardPage />} />

            {/* Analytics & Help */}
            <Route path="/analytics" element={<div className="p-6">Analytics (Coming Soon)</div>} />
            <Route path="/help" element={<div className="p-6">Help (Coming Soon)</div>} />
          </Route>

          {/* Redirects for old URLs */}
          <Route path="/" element={<Navigate to="/workspaces" replace />} />
          <Route path="/missions" element={<Navigate to="/workspaces" replace />} />
          <Route path="/timeline" element={<Navigate to="/workspaces" replace />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/workspaces" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
