// Sidebar de navegación con control de acceso por rol
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Car, ShoppingCart, Package,
  Wallet, TrendingUp, Users, Shield,
  FileText, Settings, LogOut,
  Building2
} from 'lucide-react'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  requiere?: string[]
}

interface NavSection {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/ventas',     icon: Car,          label: 'Ventas',        requiere: ['GERENCIA','VENTAS','ADMIN'] },
      { to: '/compras',    icon: ShoppingCart,  label: 'Compras',       requiere: ['GERENCIA','COMPRAS','ADMIN'] },
      { to: '/inventario', icon: Package,       label: 'Inventario',    requiere: ['GERENCIA','VENTAS','COMPRAS','ADMIN'] },
      { to: '/taller',     icon: Settings,      label: 'Taller',        requiere: ['GERENCIA','VENTAS','ADMIN'] },
    ]
  },
  {
    label: 'Finanzas',
    items: [
      { to: '/caja',       icon: Wallet,        label: 'Caja',          requiere: ['GERENCIA','TESORERIA','CAJA'] },
      { to: '/financiero', icon: TrendingUp,    label: 'Proyección Fin.', requiere: ['GERENCIA','TESORERIA'] },
    ]
  },
  {
    label: 'Administración',
    items: [
      { to: '/rrhh',        icon: Users,       label: 'RRHH',          requiere: ['GERENCIA','RRHH','ADMIN'] },
      { to: '/proveedores', icon: Building2,   label: 'Proveedores',   requiere: ['GERENCIA','COMPRAS','ADMIN'] },
      { to: '/informes',    icon: FileText,    label: 'Informes',      requiere: ['GERENCIA','TESORERIA','ADMIN'] },
    ]
  },
  {
    label: 'Control',
    items: [
      { to: '/auditoria', icon: Shield, label: 'Auditoría', requiere: ['GERENCIA','AUDITORIA'] },
    ]
  },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const puedeVer = (requiere?: string[]) => {
    if (!requiere) return true
    if (!user) return false
    return requiere.includes(user.rol) || user.puede_ver_todo
  }

  const iniciales = user?.nombre_completo
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('') || '?'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🚗</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">AutoGest ERP</span>
          <span className="sidebar-logo-sub">Sistema de Gestión</span>
        </div>
      </div>

      {/* Navegación */}
      {navSections.map(section => {
        const visibles = section.items.filter(item => puedeVer(item.requiere))
        if (visibles.length === 0) return null
        return (
          <div key={section.label} className="sidebar-section">
            <div className="sidebar-section-label">{section.label}</div>
            <nav className="sidebar-nav">
              {visibles.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="nav-item-icon" size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )
      })}

      {/* Footer con usuario */}
      <div className="sidebar-footer">
        <div className="user-card" onClick={handleLogout} title="Cerrar sesión">
          <div className="user-avatar">{iniciales}</div>
          <div className="user-info">
            <div className="user-name">{user?.nombre_completo}</div>
            <div className="user-role">{user?.rol_display}</div>
          </div>
          <LogOut size={15} color="var(--text-muted)" />
        </div>
      </div>
    </aside>
  )
}
