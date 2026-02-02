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
} from './pages';
import { WorkspaceDashboardPage } from './pages/WorkspaceDashboardPage';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Home page - workspace selection */}
          <Route path="/" element={<HomePage />} />

          {/* Protected routes with layout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<WorkspaceDashboardPage />} />
            <Route path="/my-dashboard" element={<UserDashboardPage />} />
            <Route path="/projects/:projectId" element={<ProjectDashboardPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/missions/:missionId/todos" element={<TodosPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/settings" element={<div className="p-6">Settings (Coming Soon)</div>} />
            <Route path="/help" element={<div className="p-6">Help (Coming Soon)</div>} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
