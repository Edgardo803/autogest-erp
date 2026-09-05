// Página de Inventario — Unidades vehiculares y repuestos
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../../components/layout/Header'
import { inventarioApi } from '../../api/client'
import { ModalUnidad } from '../../components/modals/ModalUnidad'
import {
  Plus, Search, Car, TrendingUp, AlertTriangle, X, Tag
} from 'lucide-react'

const eur = (n: number | string) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n))

// ─── Badge de estado ──────────────────────────────────────────
const ESTADO_CFG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  NUEVA:        { color: 'var(--accent-success)', bg: 'rgba(34,201,120,0.12)',  label: 'Nueva',          emoji: '🟢' },
  USADA:        { color: 'var(--accent-warning)', bg: 'rgba(245,158,11,0.12)', label: 'Usada',          emoji: '🟡' },
  CONSIGNACION: { color: 'var(--accent-primary)', bg: 'rgba(79,142,247,0.12)', label: 'Consignación',   emoji: '🔵' },
  RESERVADA:    { color: '#a855f7',               bg: 'rgba(168,85,247,0.12)', label: 'Reservada',      emoji: '🟣' },
  VENDIDA:      { color: 'var(--text-muted)',      bg: 'rgba(100,116,139,0.1)', label: 'Vendida',        emoji: '⚪' },
  BAJA:         { color: 'var(--accent-danger)',   bg: 'rgba(239,68,68,0.1)',   label: 'Baja',           emoji: '🔴' },
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CFG[estado] || { color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.1)', label: estado, emoji: '⚪' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem',
      fontWeight: 600, color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap',
    }}>
      {cfg.emoji} {cfg.label}
    </span>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: any
}) {
  const colors: Record<string, string> = {
    green: 'var(--accent-success)', blue: 'var(--accent-primary)',
    purple: '#a855f7', orange: 'var(--accent-warning)', red: 'var(--accent-danger)',
  }
  const c = colors[color] || colors.blue
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value" style={{ color: c }}>{value}</div>
          {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={c} />
        </div>
      </div>
    </div>
  )
}

// ─── Panel de detalle lateral de una unidad ───────────────────
function DetalleUnidad({ unidad, onClose }: { unidad: any; onClose: () => void }) {
  const margen = unidad.precio_costo && unidad.precio_venta
    ? (((Number(unidad.precio_venta) - Number(unidad.precio_costo)) / Number(unidad.precio_costo)) * 100).toFixed(1)
    : null

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
      background: 'var(--bg-card)', borderLeft: '1px solid var(--border-medium)',
      boxShadow: '-20px 0 60px rgba(0,0,0,0.4)', zIndex: 500,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{unidad.modelo_display}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk', marginTop: '0.2rem' }}>
            {unidad.numero_serie}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Estado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <EstadoBadge estado={unidad.estado} />
          {unidad.matricula && (
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.9rem', padding: '0.2rem 0.7rem', background: 'var(--bg-surface)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              {unidad.matricula}
            </span>
          )}
        </div>

        {/* Precio */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Precios</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Costo</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem' }}>
                {unidad.precio_costo ? eur(unidad.precio_costo) : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PVP</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem', color: 'var(--accent-success)' }}>
                {eur(unidad.precio_venta)}
              </div>
            </div>
          </div>
          {margen && (
            <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Margen bruto</span>
              <span style={{ fontWeight: 700, color: Number(margen) > 15 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                {margen}% · {eur(Number(unidad.precio_venta) - Number(unidad.precio_costo))}
              </span>
            </div>
          )}
        </div>

        {/* Detalles técnicos */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Datos técnicos</div>
          {[
            ['Kilómetros', unidad.kilometros !== undefined ? `${Number(unidad.kilometros).toLocaleString('es-ES')} km` : '—'],
            ['Color', unidad.color || '—'],
            ['Combustible', unidad.combustible_display || unidad.combustible || '—'],
            ['Transmisión', unidad.transmision_display || unidad.transmision || '—'],
            ['Fecha ingreso', unidad.fecha_ingreso ? new Date(unidad.fecha_ingreso + 'T12:00:00').toLocaleDateString('es-ES') : '—'],
            ['Proveedor', unidad.proveedor || '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 500, textAlign: 'right', maxWidth: 180 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Notas */}
        {unidad.notas && (
          <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Observaciones</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{unidad.notas}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export function InventarioPage() {
  const [tab, setTab] = useState<'unidades' | 'repuestos'>('unidades')
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMarca, setFiltroMarca] = useState('')
  const [unidadDetalle, setUnidadDetalle] = useState<any>(null)
  const [modalUnidad, setModalUnidad] = useState(false)

  // ── Queries
  const { data: unidadesData, isLoading: loadUnidades, refetch } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => inventarioApi.unidades().then(r => r.data),
  })

  const { data: marcas = [] } = useQuery({
    queryKey: ['marcas'],
    queryFn: () => inventarioApi.marcas().then(r => r.data.results || r.data),
  })

  const { data: repuestos = [], isLoading: loadRepuestos } = useQuery({
    queryKey: ['repuestos'],
    queryFn: () => inventarioApi.repuestos().then(r => r.data.results || r.data),
    enabled: tab === 'repuestos',
  })

  const todasUnidades: any[] = unidadesData?.results || unidadesData || []

  // ── Filtros en cliente
  const unidades = todasUnidades.filter(u => {
    const q = busqueda.toLowerCase()
    const matchBusqueda = !q ||
      u.modelo_display?.toLowerCase().includes(q) ||
      u.numero_serie?.toLowerCase().includes(q) ||
      u.matricula?.toLowerCase().includes(q) ||
      u.color?.toLowerCase().includes(q)
    const matchEstado = !filtroEstado || u.estado === filtroEstado
    const matchMarca  = !filtroMarca  || u.modelo_display?.toLowerCase().includes(filtroMarca.toLowerCase())
    return matchBusqueda && matchEstado && matchMarca
  })

  // ── KPIs calculados del stock
  const disponibles  = todasUnidades.filter(u => ['NUEVA','USADA','CONSIGNACION'].includes(u.estado))
  const vendidas     = todasUnidades.filter(u => u.estado === 'VENDIDA')
  const reservadas   = todasUnidades.filter(u => u.estado === 'RESERVADA')
  const valorStock   = disponibles.reduce((sum, u) => sum + Number(u.precio_venta || 0), 0)
  const valorCosto   = disponibles.reduce((sum, u) => sum + Number(u.precio_costo || 0), 0)
  const margenTotal  = valorCosto > 0 ? (((valorStock - valorCosto) / valorCosto) * 100).toFixed(1) : '—'

  return (
    <div className="page-container">
      <Header
        title="Inventario"
        subtitle="Stock de vehículos y repuestos"
        actions={
          tab === 'unidades' ? (
            <button className="btn btn-primary btn-sm" onClick={() => setModalUnidad(true)}>
              <Plus size={14} /> Nueva Unidad
            </button>
          ) : (
            <button className="btn btn-primary btn-sm">
              <Plus size={14} /> Nuevo Repuesto
            </button>
          )
        }
      />

      {/* ── KPIs ── */}
      {tab === 'unidades' && (
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          <KpiCard label="En Stock" value={disponibles.length} sub={`de ${todasUnidades.length} totales`} color="blue" icon={Car} />
          <KpiCard label="Valor de Stock (PVP)" value={eur(valorStock)} sub={`Margen promedio: ${margenTotal}%`} color="green" icon={TrendingUp} />
          <KpiCard label="Vendidas (total)" value={vendidas.length} sub="en el período" color="purple" icon={Tag} />
          <KpiCard label="Reservadas" value={reservadas.length} sub="pendientes de entrega" color="orange" icon={AlertTriangle} />
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        {[
          { key: 'unidades',  label: '🚗 Unidades vehiculares' },
          { key: 'repuestos', label: '🔧 Repuestos y piezas' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding: '0.6rem 1.1rem', border: 'none', cursor: 'pointer',
            background: 'transparent', fontSize: '0.85rem', fontWeight: 500,
            color: tab === t.key ? 'var(--accent-primary)' : 'var(--text-muted)',
            borderBottom: tab === t.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB UNIDADES ─── */}
      {tab === 'unidades' && (
        <div className="card">
          {/* Barra de filtros */}
          <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
            {/* Búsqueda */}
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 32, margin: 0 }}
                placeholder="Buscar por modelo, serie, matrícula, color..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>

            {/* Filtro estado */}
            <select
              className="form-input"
              style={{ margin: 0, minWidth: 150 }}
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_CFG).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.emoji} {cfg.label}</option>
              ))}
            </select>

            {/* Filtro marca */}
            <select
              className="form-input"
              style={{ margin: 0, minWidth: 130 }}
              value={filtroMarca}
              onChange={e => setFiltroMarca(e.target.value)}
            >
              <option value="">Todas las marcas</option>
              {marcas.map((m: any) => (
                <option key={m.id} value={m.nombre}>{m.nombre}</option>
              ))}
            </select>

            {/* Limpiar filtros */}
            {(busqueda || filtroEstado || filtroMarca) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setBusqueda(''); setFiltroEstado(''); setFiltroMarca('') }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <X size={12} /> Limpiar
              </button>
            )}

            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {unidades.length} de {todasUnidades.length} unidades
            </span>
          </div>

          {/* Tabla */}
          {loadUnidades ? (
            <div className="loading-state"><div className="spinner" /> Cargando inventario...</div>
          ) : unidades.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon">🚗</div>
              <div className="empty-state-title">No hay unidades con esos filtros</div>
              <div className="empty-state-desc">Probá con otros criterios de búsqueda</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vehículo</th>
                    <th>Serie / Matrícula</th>
                    <th>Estado</th>
                    <th>Km</th>
                    <th>PVP</th>
                    <th>Margen</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {unidades.map((u: any) => {
                    const margen = u.precio_costo && u.precio_venta
                      ? (((Number(u.precio_venta) - Number(u.precio_costo)) / Number(u.precio_costo)) * 100).toFixed(1)
                      : null
                    const esSeleccionada = unidadDetalle?.id === u.id

                    return (
                      <tr
                        key={u.id}
                        style={{ cursor: 'pointer', background: esSeleccionada ? 'rgba(79,142,247,0.06)' : undefined }}
                        onClick={() => setUnidadDetalle(esSeleccionada ? null : u)}
                      >
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.modelo_display}</div>
                          {u.color && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.color}</div>}
                        </td>
                        <td style={{ fontFamily: 'Space Grotesk', fontSize: '0.8rem' }}>
                          <div>{u.numero_serie}</div>
                          {u.matricula && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{u.matricula}</div>}
                        </td>
                        <td><EstadoBadge estado={u.estado} /></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {Number(u.kilometros).toLocaleString('es-ES')} km
                        </td>
                        <td style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--accent-success)' }}>
                          {eur(u.precio_venta)}
                        </td>
                        <td>
                          {margen ? (
                            <span style={{
                              fontSize: '0.78rem', fontWeight: 700, fontFamily: 'Space Grotesk',
                              color: Number(margen) >= 20 ? 'var(--accent-success)' : Number(margen) >= 10 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                            }}>
                              {margen}%
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.72rem', color: esSeleccionada ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                            {esSeleccionada ? '← Ver' : 'Detalle →'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Resumen de valor al pie */}
          {!loadUnidades && unidades.length > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: '2rem',
              padding: '0.75rem 0', borderTop: '1px solid var(--border-subtle)',
              marginTop: '0.5rem', fontSize: '0.82rem',
            }}>
              <div style={{ color: 'var(--text-muted)' }}>
                Valor costo total: <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>
                  {eur(unidades.filter(u => ['NUEVA','USADA','CONSIGNACION'].includes(u.estado)).reduce((s, u) => s + Number(u.precio_costo || 0), 0))}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Valor venta total: <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--accent-success)' }}>
                  {eur(unidades.filter(u => ['NUEVA','USADA','CONSIGNACION'].includes(u.estado)).reduce((s, u) => s + Number(u.precio_venta || 0), 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB REPUESTOS ─── */}
      {tab === 'repuestos' && (
        <div className="card">
          {loadRepuestos ? (
            <div className="loading-state"><div className="spinner" /> Cargando repuestos...</div>
          ) : repuestos.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon">🔧</div>
              <div className="empty-state-title">Sin repuestos cargados</div>
              <div className="empty-state-desc">Registrá el primer repuesto con el botón "Nuevo Repuesto"</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Stock mín.</th>
                    <th>PVP</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {repuestos.map((r: any) => {
                    const bajo = Number(r.stock_actual) <= Number(r.stock_minimo)
                    return (
                      <tr key={r.id}>
                        <td style={{ fontFamily: 'Space Grotesk', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.codigo}</td>
                        <td style={{ fontWeight: 500 }}>{r.descripcion}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.categoria_display || r.categoria}</td>
                        <td style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: bajo ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                          {r.stock_actual} {r.unidad_medida}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.stock_minimo}</td>
                        <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{eur(r.precio_venta)}</td>
                        <td>
                          {bajo ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--accent-danger)', fontWeight: 600 }}>
                              <AlertTriangle size={11} /> Stock bajo
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--accent-success)' }}>✓ OK</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Panel lateral de detalle ─── */}
      {unidadDetalle && (
        <DetalleUnidad unidad={unidadDetalle} onClose={() => setUnidadDetalle(null)} />
      )}

      {/* ─── Modal Alta ─── */}
      <ModalUnidad
        open={modalUnidad}
        onClose={() => { setModalUnidad(false); refetch() }}
      />
    </div>
  )
}
