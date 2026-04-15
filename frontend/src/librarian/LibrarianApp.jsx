import { useState } from 'react'
import LibrarianLogin from './LibrarianLogin'
import LibrarianRegister from './LibrarianRegister'
import LibrarianDashboard from './LibrarianDashboard'
import LibrarianBookManager from './LibrarianBookManager'

function getStoredLibrarianSession() {
  const token = localStorage.getItem('librarianToken')
  const savedLibrarian = localStorage.getItem('librarianInfo')

  if (!token || !savedLibrarian) {
    return {
      isLoggedIn: false,
      librarian: null,
      activeView: 'dashboard',
    }
  }

  try {
    return {
      isLoggedIn: true,
      librarian: JSON.parse(savedLibrarian),
      activeView: 'dashboard',
    }
  } catch {
    localStorage.removeItem('librarianToken')
    localStorage.removeItem('librarianInfo')

    return {
      isLoggedIn: false,
      librarian: null,
      activeView: 'dashboard',
    }
  }
}

function LibrarianApp() {
  const [session, setSession] = useState(getStoredLibrarianSession)
  const [showRegister, setShowRegister] = useState(false)
  const { isLoggedIn, librarian, activeView } = session

  const handleLogin = (user, token) => {
    localStorage.setItem('librarianToken', token)
    localStorage.setItem('librarianInfo', JSON.stringify(user))
    setSession({
      isLoggedIn: true,
      librarian: user,
      activeView: 'dashboard',
    })
    setShowRegister(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('librarianToken')
    localStorage.removeItem('librarianInfo')
    setSession({
      isLoggedIn: false,
      librarian: null,
      activeView: 'dashboard',
    })
  }

  const handleRegisterSuccess = () => {
    setShowRegister(false)
  }

  const handleOpenBookManager = () => {
    setSession((current) => ({
      ...current,
      activeView: 'book-manager',
    }))
  }

  const handleBackToDashboard = () => {
    setSession((current) => ({
      ...current,
      activeView: 'dashboard',
    }))
  }

  if (isLoggedIn) {
    if (activeView === 'book-manager') {
      return (
        <LibrarianBookManager
          librarian={librarian}
          onBack={handleBackToDashboard}
          onLogout={handleLogout}
        />
      )
    }

    return (
      <LibrarianDashboard
        librarian={librarian}
        onLogout={handleLogout}
        onOpenBookManager={handleOpenBookManager}
      />
    )
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
