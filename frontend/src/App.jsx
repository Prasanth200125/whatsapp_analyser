// ============================================================
// App.jsx — Root Router
// ============================================================
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import OfflineBanner from './components/OfflineBanner';

import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SessionPage  from './pages/SessionPage';
import SettingsPage from './pages/SettingsPage';

// ── Protected Route Wrapper ───────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="page-center">
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

// ── Public Route: redirect to dashboard if already logged in ──
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <OfflineBanner />
      <Routes>
        <Route path="/"         element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/session/:id" element={
          <ProtectedRoute><SessionPage /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><SettingsPage /></ProtectedRoute>
        } />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
