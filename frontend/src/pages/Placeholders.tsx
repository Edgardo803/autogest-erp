// Páginas placeholder para módulos adicionales
import { Header } from '../components/layout/Header'
import { ShoppingCart, Package, Wallet, Users, Building2, Shield, FileText } from 'lucide-react'

function PlaceholderPage({ title, subtitle, icon: Icon, color }: any) {
  return (
    <div>
      <Header title={title} subtitle={subtitle} />
      <div className="page-content fade-in">
        <div className="empty-state" style={{ padding: '6rem 2rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: `rgba(${color}, 0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Icon size={36} color={`rgb(${color})`} />
          </div>
          <div className="empty-state-title" style={{ fontSize: '1.2rem' }}>{title}</div>
          <div className="empty-state-desc" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Módulo en construcción — disponible en la próxima iteración
          </div>
        </div>
      </div>
    </div>
  )
}

export const ComprasPage = () => <PlaceholderPage title="Compras" subtitle="Proveedores, compra de unidades e insumos" icon={ShoppingCart} color="124,92,246" />
export const InventarioPage = () => <PlaceholderPage title="Inventario" subtitle="Unidades y repuestos en stock" icon={Package} color="79,142,247" />
export const TallerPage = () => <PlaceholderPage title="Taller" subtitle="Servicios de taller y reparaciones" icon={Package} color="34,201,120" />
export const CajaPage = () => <PlaceholderPage title="Caja / Tesorería" subtitle="Movimientos de caja, pagarés y cuentas bancarias" icon={Wallet} color="245,158,11" />
export const RrhhPage = () => <PlaceholderPage title="RRHH" subtitle="Empleados y liquidaciones de sueldos" icon={Users} color="6,182,212" />
export const ProveedoresPage = () => <PlaceholderPage title="Proveedores" subtitle="Grandes proveedores y proveedores de insumos" icon={Building2} color="79,142,247" />
export const InformesPage = () => <PlaceholderPage title="Informes" subtitle="Reportes gerenciales y estadísticas" icon={FileText} color="34,201,120" />
export const AuditoriaPage = () => <PlaceholderPage title="Auditoría General" subtitle="Registro de eventos, programa y cronograma de auditorías" icon={Shield} color="239,68,68" />
