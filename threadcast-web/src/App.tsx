import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  MissionsPage,
  TodosPage,
  TimelinePage,
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
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
  );
}

export default App;
