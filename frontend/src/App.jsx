import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Books from './pages/Books'
import Announcements from './pages/Announcements'
import AdminAnnouncements from './pages/AdminAnnouncements'
import Layout from './components/Layout'
import LibrarianApp from './librarian/LibrarianApp'
import BookDetail from './pages/BookDetail';
import BorrowBook from './pages/BorrowBook';
import ReturnBook from './pages/ReturnBook';
import BorrowRecords from './pages/BorrowRecords';
import AdminRenewals from './pages/AdminRenewals';
import ManageLoans from './pages/ManageLoans';
import ManageBooks from './pages/ManageBooks';

function PrivateRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, user } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requireAdmin && user?.role !== 'ADMIN' && user?.role !== 'LIBRARIAN') {
    return <Navigate to="/books" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/librarian/*" element={<LibrarianApp />} />
      <Route path="/books" element={
        <PrivateRoute>
          <Layout>
            <Books />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/announcements" element={
        <PrivateRoute>
          <Layout>
            <Announcements />
          </Layout>
        </PrivateRoute>
      } />
        <Route path="/books/:id" element={
            <PrivateRoute>
                <Layout>
                    <BookDetail />
                </Layout>
            </PrivateRoute>
        } />
        <Route path="/borrow" element={
                <Layout>
                    <BorrowBook />
                </Layout>
        } />
        <Route path="/return" element={
                <Layout>
                    <ReturnBook />
                </Layout>
        } />
        <Route path="/borrow-records" element={
            <PrivateRoute>
                <Layout>
                    <BorrowRecords />
                </Layout>
            </PrivateRoute>
        } />
        <Route path="/borrow-records" element={
            <PrivateRoute>
                <Layout>
                    <AdminRenewals />
                </Layout>
            </PrivateRoute>
        } />
        <Route path="/admin/manage-loans" element={
            <PrivateRoute requireAdmin>
                <Layout>
                    <ManageLoans />
                </Layout>
            </PrivateRoute>
        } />
        <Route path="/admin/manage-books" element={
            <PrivateRoute requireAdmin>
                <Layout>
                    <ManageBooks />
                </Layout>
            </PrivateRoute>
        } />
      <Route path="/admin/announcements" element={
        <PrivateRoute requireAdmin>
          <Layout>
            <AdminAnnouncements />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/" element={<Navigate to="/books" replace />} />
    </Routes>
  )
}

export default App
