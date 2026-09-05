// Página de login
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Car, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username || !password) { toast.error('Ingresá usuario y contraseña'); return }
    setLoading(true)
    try {
      await login(username, password)
      toast.success('¡Bienvenido a AutoGest ERP!')
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Credenciales incorrectas'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Orbs de fondo */}
      <div className="login-bg-orb orb-1" />
      <div className="login-bg-orb orb-2" />

      {/* Partículas decorativas */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            background: 'var(--accent-primary)',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.3,
          }} />
        ))}
      </div>

      <div className="login-card slide-up">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Car size={32} color="#fff" />
          </div>
          <div className="login-logo-name">AutoGest ERP</div>
          <div className="login-logo-sub">Sistema de Gestión Empresarial</div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              className="form-input"
              type="text"
              placeholder="tu.usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="spin" style={{ animation: 'spin 0.7s linear infinite' }} /> : null}
            {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>

        {/* Ayuda */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Accesos de prueba
          </div>
          {[
            { user: 'gerencia', pwd: 'AutoGest2026!', rol: 'Gerencia General' },
            { user: 'auditoria', pwd: 'Audit2026!', rol: 'Auditoría' },
            { user: 'ventas01', pwd: 'Ventas2026!', rol: 'Ventas' },
            { user: 'tesoreria', pwd: 'Tesor2026!', rol: 'Tesorería' },
          ].map(acc => (
            <div
              key={acc.user}
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.2rem 0', cursor: 'pointer', color: 'var(--text-secondary)' }}
              onClick={() => { setUsername(acc.user); setPassword(acc.pwd) }}
            >
              <span style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{acc.user}</span>
              <span>{acc.rol}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          AutoGest ERP v1.0 — TFM Máster Desarrollo Full Stack
        </div>
      </div>
    </div>
  )
}
