import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Announcements from './pages/Announcements';
import AdminAnnouncements from './pages/AdminAnnouncements';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/announcements" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/announcements" replace /> : <Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/announcements" replace />} />
        <Route path="announcements" element={<Announcements />} />
        <Route
          path="admin/announcements"
          element={
            <ProtectedRoute adminOnly>
              <AdminAnnouncements />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/announcements" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
