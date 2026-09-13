// Página de Ventas — Lista de clientes, ventas y servicios de taller
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../../components/layout/Header'
import { ventasApi } from '../../api/client'
import { Plus, Search, Car, Wrench, Users, ChevronRight, X, Phone, Mail, CreditCard, Wrench as WrenchIcon } from 'lucide-react'
import { ModalCliente } from '../../components/modals/ModalCliente'
import { ModalVenta } from '../../components/modals/ModalVenta'

const eur = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n ?? 0)

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

function TipoFinBadge({ tipo }: { tipo: string }) {
  const mapa: Record<string, { cls: string; label: string }> = {
    CONTADO:  { cls: 'badge-success', label: '💵 Contado' },
    CUOTAS:   { cls: 'badge-info',    label: '📅 Cuotas cliente' },
    BANCARIA: { cls: 'badge-primary', label: '🏦 Financiación bancaria' },
    PROPIA:   { cls: 'badge-warning', label: '🤝 Financiación propia' },
  }
  const { cls, label } = mapa[tipo] || { cls: 'badge-muted', label: tipo }
  return <span className={`badge ${cls}`}>{label}</span>
}

// ── Panel lateral: Ficha de cliente ──────────────────────────────────────────
function FichaCliente({ cliente, ventas, servicios, onClose }: {
  cliente: any
  ventas: any[]
  servicios: any[]
  onClose: () => void
}) {
  // Filtrar ventas y servicios de este cliente
  const ventasCliente = ventas.filter((v: any) => v.cliente === cliente.id || v.cliente_nombre?.includes(cliente.nombre))
  const serviciosCliente = servicios.filter((s: any) => s.cliente === cliente.id || s.cliente_nombre?.includes(cliente.nombre))

  const totalDeuda = ventasCliente.reduce((acc: number, v: any) => acc + (v.saldo_pendiente ?? 0), 0)
  const totalServicios = serviciosCliente.reduce((acc: number, s: any) => acc + (s.total_factura ?? 0), 0)
  const serviciosPendientes = serviciosCliente.filter((s: any) => !['TERMINADO', 'FACTURADO', 'CANCELADO'].includes(s.estado))

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 1000, backdropFilter: 'blur(2px)',
        }}
      />
      {/* Panel deslizante */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px',
        background: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
        zIndex: 1001, overflowY: 'auto', padding: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>{cliente.codigo}</span>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              {cliente.apellidos}, {cliente.nombre}
            </h2>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Datos de contacto */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {cliente.dni_nie && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <CreditCard size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)' }}>DNI/NIE:</span>
              <span style={{ fontWeight: 500 }}>{cliente.dni_nie}</span>
            </div>
          )}
          {cliente.telefono && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <Phone size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Teléfono:</span>
              <a href={`tel:${cliente.telefono}`} style={{ fontWeight: 500, color: 'var(--accent)' }}>{cliente.telefono}</a>
            </div>
          )}
          {cliente.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <Mail size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Email:</span>
              <a href={`mailto:${cliente.email}`} style={{ fontWeight: 500, color: 'var(--accent)' }}>{cliente.email}</a>
            </div>
          )}
        </div>

        {/* Resumen financiero */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>DEUDA PENDIENTE</div>
            <div style={{
              fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Space Grotesk',
              color: totalDeuda > 0 ? 'var(--danger)' : 'var(--success)',
            }}>
              {eur(totalDeuda)}
            </div>
          </div>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>SERVICIOS TALLER</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>
              {serviciosPendientes.length > 0
                ? <span style={{ color: 'var(--warning)' }}>{serviciosPendientes.length} en curso</span>
                : <span style={{ color: 'var(--success)' }}>{eur(totalServicios)}</span>
              }
            </div>
          </div>
        </div>

        {/* Ventas de unidades */}
        <div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Car size={14} /> Ventas de Unidades ({ventasCliente.length})
          </h3>
          {ventasCliente.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin ventas registradas</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {ventasCliente.map((v: any) => (
                <div key={v.id} className="card" style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{v.unidad_display}</span>
                    <EstadoBadge estado={v.estado_pago} />
                  </div>
                  <div style={{ marginBottom: '0.4rem' }}>
                    <TipoFinBadge tipo={v.tipo_financiacion || 'CUOTAS'} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Precio</div>
                      <div style={{ fontWeight: 600 }}>{eur(v.precio_acordado)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Anticipo</div>
                      <div style={{ fontWeight: 600, color: 'var(--success)' }}>{eur(v.anticipo ?? 0)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Saldo pendiente</div>
                      <div style={{ fontWeight: 700, color: (v.saldo_pendiente ?? 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {eur(v.saldo_pendiente ?? 0)}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    Fecha: {new Date(v.fecha_venta).toLocaleDateString('es-ES')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Servicios de taller */}
        <div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <WrenchIcon size={14} /> Servicios de Taller ({serviciosCliente.length})
          </h3>
          {serviciosCliente.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin servicios registrados</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {serviciosCliente.map((s: any) => (
                <div key={s.id} className="card" style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.descripcion_trabajo?.substring(0, 50)}{(s.descripcion_trabajo?.length > 50) ? '…' : ''}</span>
                    <EstadoBadge estado={s.estado} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {s.matricula_cliente && <span>Matrícula: <b style={{ color: 'var(--text-primary)' }}>{s.matricula_cliente}</b></span>}
                    <span>Total: <b style={{ color: 'var(--text-primary)' }}>{eur(s.total_factura ?? 0)}</b></span>
                    <span>{new Date(s.fecha_ingreso).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export function VentasPage() {
  const [tab, setTab] = useState<'clientes' | 'ventas' | 'taller'>('clientes')
  const [busqueda, setBusqueda] = useState('')
  const [modalCliente, setModalCliente] = useState(false)
  const [modalVenta, setModalVenta] = useState(false)
  const [fichaCliente, setFichaCliente] = useState<any>(null)

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
                  <th>Teléfono</th><th>Email</th><th>Deuda</th><th></th>
                </tr>
              </thead>
              <tbody>
                {loadClientes ? (
                  <tr><td colSpan={7}><div className="loading-overlay"><div className="spinner" /></div></td></tr>
                ) : filtrarClientes.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <div className="empty-state-title">Sin clientes registrados</div>
                      <div className="empty-state-desc">Creá el primer cliente con el botón "Nuevo Cliente"</div>
                    </div>
                  </td></tr>
                ) : filtrarClientes.map((c: any) => {
                  // Calcular deuda pendiente de este cliente
                  const deudaCliente = ventas
                    .filter((v: any) => v.cliente === c.id || v.cliente_nombre?.includes(c.nombre))
                    .reduce((acc: number, v: any) => acc + (v.saldo_pendiente ?? 0), 0)
                  return (
                    <tr
                      key={c.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setFichaCliente(c)}
                    >
                      <td><span className="badge badge-primary">{c.codigo}</span></td>
                      <td style={{ fontWeight: 500 }}>{c.apellidos}, {c.nombre}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{c.dni_nie || '—'}</td>
                      <td>{c.telefono || '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                      <td>
                        {deudaCliente > 0
                          ? <span style={{ fontWeight: 700, color: 'var(--danger)', fontFamily: 'Space Grotesk' }}>{eur(deudaCliente)}</span>
                          : <span style={{ color: 'var(--success)' }}>Al corriente</span>
                        }
                      </td>
                      <td><button className="btn btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); setFichaCliente(c) }}><ChevronRight size={15} /></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabla de Ventas */}
        {tab === 'ventas' && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Cliente</th><th>Unidad</th><th>Fecha</th><th>Precio</th><th>Anticipo</th><th>Saldo Pend.</th><th>Financiación</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {loadVentas ? (
                  <tr><td colSpan={9}><div className="loading-overlay"><div className="spinner" /></div></td></tr>
                ) : ventas.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🚗</div>
                      <div className="empty-state-title">Sin ventas registradas</div>
                      <div className="empty-state-desc">Las ventas aparecerán aquí una vez registradas</div>
                    </div>
                  </td></tr>
                ) : ventas.map((v: any) => (
                  <tr key={v.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const cli = clientes.find((c: any) => c.id === v.cliente)
                      if (cli) setFichaCliente(cli)
                    }}
                  >
                    <td style={{ color: 'var(--text-muted)' }}>#{v.id}</td>
                    <td style={{ fontWeight: 500 }}>{v.cliente_nombre}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{v.unidad_display}</td>
                    <td>{new Date(v.fecha_venta).toLocaleDateString('es-ES')}</td>
                    <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{eur(v.precio_acordado)}</td>
                    <td style={{ fontFamily: 'Space Grotesk', color: 'var(--success)' }}>{eur(v.anticipo ?? 0)}</td>
                    <td style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: (v.saldo_pendiente ?? 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {eur(v.saldo_pendiente ?? 0)}
                    </td>
                    <td><TipoFinBadge tipo={v.tipo_financiacion || 'CUOTAS'} /></td>
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
                  <tr key={s.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const cli = clientes.find((c: any) => c.id === s.cliente)
                      if (cli) setFichaCliente(cli)
                    }}
                  >
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

      {/* Panel ficha de cliente */}
      {fichaCliente && (
        <FichaCliente
          cliente={fichaCliente}
          ventas={ventas}
          servicios={servicios}
          onClose={() => setFichaCliente(null)}
        />
      )}

      {/* Modales ABM */}
      <ModalCliente open={modalCliente} onClose={() => setModalCliente(false)} />
      <ModalVenta   open={modalVenta}   onClose={() => setModalVenta(false)} />
    </div>
  )
}
