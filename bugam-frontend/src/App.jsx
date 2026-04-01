import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Mesero from './pages/Mesero'
import Cocina from './pages/Cocina'
import Caja from './pages/Caja'
import Admin from './pages/Admin'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('bugam_user')
    if (savedUser) setUser(JSON.parse(savedUser))
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('bugam_user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('bugam_user')
  }

  return (
    <BrowserRouter>
      <div className="background-image">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/mesero" element={user ? <Mesero user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/cocina" element={user ? <Cocina user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/caja" element={user && ['CAJERO', 'ADMIN'].includes(user.rol) ? <Caja user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && user.rol === 'ADMIN' ? <Admin user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
