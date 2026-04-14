import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Announcements from './pages/Announcements'
import AdminAnnouncements from './pages/AdminAnnouncements'
import Layout from './components/Layout'

function PrivateRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, user } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requireAdmin && user?.role !== 'ADMIN' && user?.role !== 'LIBRARIAN') {
    return <Navigate to="/announcements" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/announcements" element={
        <Layout>
          <Announcements />
        </Layout>
      } />
      <Route path="/admin/announcements" element={
        <PrivateRoute requireAdmin>
          <Layout>
            <AdminAnnouncements />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/" element={<Navigate to="/announcements" replace />} />
    </Routes>
  )
}

export default App
