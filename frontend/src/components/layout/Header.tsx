// Header con título de página, acciones contextuales y alertas
import { Bell } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const fecha = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <header className="header">
      <div className="header-title">
        <div style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
            {subtitle}
          </div>
        )}
      </div>

      <div className="header-actions">
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{hora}</div>
          <div style={{ textTransform: 'capitalize' }}>{fecha}</div>
        </div>

        <button className="btn btn-ghost btn-icon" title="Notificaciones">
          <Bell size={18} />
        </button>

        {actions}
      </div>
    </header>
  )
}

// Layout principal — envuelve todas las páginas protegidas
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
