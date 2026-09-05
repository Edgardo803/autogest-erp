// Página de Ventas — Lista de clientes, ventas y servicios de taller
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../../components/layout/Header'
import { ventasApi } from '../../api/client'
import { Plus, Search, Car, Wrench, Users, ChevronRight } from 'lucide-react'
import { ModalCliente } from '../../components/modals/ModalCliente'
import { ModalVenta } from '../../components/modals/ModalVenta'

const eur = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

function EstadoBadge({ estado }: { estado: string }) {
  const mapa: Record<string, string> = {
    PENDIENTE: 'badge-warning', PARCIAL: 'badge-info',
    COMPLETO: 'badge-success', FINANCIADO: 'badge-primary',
    EN_CURSO: 'badge-info', TERMINADO: 'badge-success',
    FACTURADO: 'badge-primary', PRESUPUESTADO: 'badge-muted',
    CANCELADO: 'badge-danger',
  }
  return <span className={`badge ${mapa[estado] || 'badge-muted'}`}>{estado}</span>
}

export function VentasPage() {
  const [tab, setTab] = useState<'clientes' | 'ventas' | 'taller'>('clientes')
  const [busqueda, setBusqueda] = useState('')
  const [modalCliente, setModalCliente] = useState(false)
  const [modalVenta, setModalVenta] = useState(false)

  const { data: clientes = [], isLoading: loadClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => ventasApi.clientes().then(r => r.data.results || r.data),
  })

  const { data: ventas = [], isLoading: loadVentas } = useQuery({
    queryKey: ['ventas-unidades'],
    queryFn: () => ventasApi.ventasUnidades().then(r => r.data.results || r.data),
  })

  const { data: servicios = [], isLoading: loadServicios } = useQuery({
    queryKey: ['servicios-taller'],
    queryFn: () => ventasApi.serviciosTaller().then(r => r.data.results || r.data),
  })

  const filtrarClientes = clientes.filter((c: any) =>
    `${c.nombre} ${c.apellidos} ${c.codigo}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <Header
        title="Ventas"
        subtitle="Clientes, ventas de unidades y servicios de taller"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {tab === 'clientes' && (
              <button className="btn btn-primary btn-sm" onClick={() => setModalCliente(true)}>
                <Plus size={15} /> Nuevo Cliente
              </button>
            )}
            {tab === 'ventas' && (
              <button className="btn btn-primary btn-sm" onClick={() => setModalVenta(true)}>
                <Plus size={15} /> Nueva Venta
              </button>
            )}
            {tab === 'taller' && (
              <button className="btn btn-primary btn-sm">
                <Plus size={15} /> Nuevo Servicio
              </button>
            )}
          </div>
        }
      />

      <div className="page-content fade-in">
        {/* Tabs */}
        <div className="tab-group">
          {[
            { key: 'clientes', label: 'Clientes', icon: Users },
            { key: 'ventas',   label: 'Ventas de Unidades', icon: Car },
            { key: 'taller',   label: 'Taller / Servicios', icon: Wrench },
          ].map(t => (
            <button
              key={t.key}
              className={`tab-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key as any)}
            >
              <t.icon size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder={`Buscar ${tab === 'clientes' ? 'clientes' : tab === 'ventas' ? 'ventas' : 'servicios'}...`}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {/* Tabla de Clientes */}
        {tab === 'clientes' && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th><th>Apellidos, Nombre</th><th>DNI/NIE</th>
                  <th>Teléfono</th><th>Email</th><th></th>
                </tr>
              </thead>
              <tbody>
                {loadClientes ? (
                  <tr><td colSpan={6}><div className="loading-overlay"><div className="spinner" /></div></td></tr>
                ) : filtrarClientes.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <div className="empty-state-title">Sin clientes registrados</div>
                      <div className="empty-state-desc">Creá el primer cliente con el botón "Nueva Operación"</div>
                    </div>
                  </td></tr>
                ) : filtrarClientes.map((c: any) => (
                  <tr key={c.id}>
                    <td><span className="badge badge-primary">{c.codigo}</span></td>
                    <td style={{ fontWeight: 500 }}>{c.apellidos}, {c.nombre}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.dni_nie || '—'}</td>
                    <td>{c.telefono || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                    <td><button className="btn btn-ghost btn-sm btn-icon"><ChevronRight size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabla de Ventas */}
        {tab === 'ventas' && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Cliente</th><th>Unidad</th><th>Fecha</th><th>Precio</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {loadVentas ? (
                  <tr><td colSpan={7}><div className="loading-overlay"><div className="spinner" /></div></td></tr>
                ) : ventas.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🚗</div>
                      <div className="empty-state-title">Sin ventas registradas</div>
                      <div className="empty-state-desc">Las ventas aparecerán aquí una vez registradas</div>
                    </div>
                  </td></tr>
                ) : ventas.map((v: any) => (
                  <tr key={v.id}>
                    <td style={{ color: 'var(--text-muted)' }}>#{v.id}</td>
                    <td style={{ fontWeight: 500 }}>{v.cliente_nombre}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{v.unidad_display}</td>
                    <td>{new Date(v.fecha_venta).toLocaleDateString('es-ES')}</td>
                    <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{eur(v.precio_acordado)}</td>
                    <td><EstadoBadge estado={v.estado_pago} /></td>
                    <td><button className="btn btn-ghost btn-sm btn-icon"><ChevronRight size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabla de Servicios de Taller */}
        {tab === 'taller' && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Cliente</th><th>Matrícula</th><th>Trabajo</th><th>Ingreso</th><th>Total</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {loadServicios ? (
                  <tr><td colSpan={8}><div className="loading-overlay"><div className="spinner" /></div></td></tr>
                ) : servicios.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🔧</div>
                      <div className="empty-state-title">Sin servicios registrados</div>
                      <div className="empty-state-desc">Los servicios de taller aparecerán aquí</div>
                    </div>
                  </td></tr>
                ) : servicios.map((s: any) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)' }}>#{s.id}</td>
                    <td style={{ fontWeight: 500 }}>{s.cliente_nombre}</td>
                    <td><span className="badge badge-muted">{s.matricula_cliente || '—'}</span></td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.descripcion_trabajo}</td>
                    <td>{new Date(s.fecha_ingreso).toLocaleDateString('es-ES')}</td>
                    <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{eur(s.total_factura || 0)}</td>
                    <td><EstadoBadge estado={s.estado} /></td>
                    <td><button className="btn btn-ghost btn-sm btn-icon"><ChevronRight size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales ABM */}
      <ModalCliente open={modalCliente} onClose={() => setModalCliente(false)} />
      <ModalVenta   open={modalVenta}   onClose={() => setModalVenta(false)} />
    </div>
  )
}
