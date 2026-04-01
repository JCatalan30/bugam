import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = '/api'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }

      onLogin(data.user)
      
      if (data.user.rol === 'MESERO') navigate('/mesero')
      else if (data.user.rol === 'COCINA') navigate('/cocina')
      else if (data.user.rol === 'CAJERO') navigate('/caja')
      else navigate('/admin')
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/logo.png" alt="Las Bugambilias" style={{width: '100%', maxHeight: 120, objectFit: 'contain', marginBottom: '1rem'}} />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Usuario</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-danger" style={{color: 'var(--danger)', marginBottom: '1rem'}}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={loading}>
            {loading ? 'Iniciando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
