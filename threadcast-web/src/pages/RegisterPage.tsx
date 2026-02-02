import { Navigate } from 'react-router-dom';

// OAuth-only authentication - redirect to login page
export function RegisterPage() {
  return <Navigate to="/login" replace />;
}
