import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LibrarianLogin from './LibrarianLogin'
import LibrarianRegister from './LibrarianRegister'
import LibrarianDashboard from './LibrarianDashboard'

function LibrarianApp() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const navigate = useNavigate()
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    const savedLibrarian = localStorage.getItem('librarianInfo')
    const savedToken = localStorage.getItem('librarianToken')
    
    if (savedLibrarian && savedToken) {
      try {
        const librarian = JSON.parse(savedLibrarian)
        if (librarian.role === 'LIBRARIAN' || librarian.role === 'ADMIN') {
          login({ employeeId: librarian.employeeId, password: '' }).catch(() => {})
        }
      } catch (e) {}
    }
  }, [])

  const handleLogin = async (user, token) => {
    localStorage.setItem('librarianToken', token)
    localStorage.setItem('librarianInfo', JSON.stringify(user))
    setShowRegister(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('librarianToken')
    localStorage.removeItem('librarianInfo')
    logout()
    navigate('/login')
  }

  const handleRegisterSuccess = () => {
    setShowRegister(false)
  }

  if (isAuthenticated && (user?.role === 'LIBRARIAN' || user?.role === 'ADMIN')) {
    return <LibrarianDashboard librarian={user} onLogout={handleLogout} />
  }

  if (showRegister) {
    return (
      <LibrarianRegister 
        onRegister={handleRegisterSuccess} 
        onSwitchToLogin={() => setShowRegister(false)} 
      />
    )
  }

  return (
    <LibrarianLogin 
      onLogin={handleLogin} 
      onSwitchToRegister={() => setShowRegister(true)} 
    />
  )
}

export default LibrarianApp
