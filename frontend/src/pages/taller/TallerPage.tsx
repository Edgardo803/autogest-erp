// Página de Taller — OT (clientes externos) + ORI (uso interno, nunca facturable)
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../../components/layout/Header'
import { tallerApi } from '../../api/client'
import {
  Wrench, Clock, CheckCircle2, AlertTriangle,
  Search, X, ChevronDown, ChevronUp, Lock, Ban
} from 'lucide-react'

const eur = (n: number | string) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n))

// ── Estado config ───────────────────────────────────────────
const ESTADO_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  PRESUPUESTADO: { color: 'var(--accent-primary)',  bg: 'rgba(79,142,247,0.1)',   border: 'rgba(79,142,247,0.25)',  label: 'Presupuestado' },
  EN_CURSO:      { color: 'var(--accent-warning)',  bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', label: 'En Curso' },
  TERMINADO:     { color: 'var(--accent-success)',  bg: 'rgba(34,201,120,0.1)',  border: 'rgba(34,201,120,0.25)', label: 'Terminado' },
  FACTURADO:     { color: '#a855f7',                bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.25)', label: 'Facturado' },
  CANCELADO:     { color: 'var(--text-muted)',      bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', label: 'Cancelado' },
}

// ── Fila expandible de orden ────────────────────────────────
function FilaOrden({ srv }: { srv: any }) {
  const [exp, setExp] = useState(false)
  const esORI = srv.tipo === 'ORI'
  const estadoCfg = ESTADO_CFG[srv.estado] || ESTADO_CFG.PRESUPUESTADO
  const diasRestantes = srv.fecha_entrega_estimada
    ? Math.ceil((new Date(srv.fecha_entrega_estimada + 'T12:00:00').getTime() - new Date().getTime()) / 86400000)
    : null

  return (
    <>
      <tr
        style={{ cursor: 'pointer', background: exp ? 'rgba(79,142,247,0.03)' : undefined }}
        onClick={() => setExp(e => !e)}
      >
        {/* Tipo OT / ORI */}
        <td>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.22rem 0.55rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700,
            color: esORI ? 'var(--accent-warning)' : 'var(--accent-primary)',
            background: esORI ? 'rgba(245,158,11,0.1)' : 'rgba(79,142,247,0.1)',
            border: `1px solid ${esORI ? 'rgba(245,158,11,0.25)' : 'rgba(79,142,247,0.2)'}`,
          }}>
            {esORI ? <Lock size={10} /> : <Wrench size={10} />}
            {srv.tipo}
          </div>
        </td>

        {/* Cliente / Unidad */}
        <td>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
            {esORI ? (
              <span style={{ color: 'var(--accent-warning)', fontSize: '0.78rem' }}>🔧 {srv.unidad_display}</span>
            ) : (
              srv.cliente_nombre
            )}
          </div>
          {!esORI && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {srv.unidad_display !== '—' ? srv.unidad_display : srv.matricula_cliente}
            </div>
          )}
        </td>

        {/* Descripción resumida */}
        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 280 }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {srv.descripcion_trabajo}
          </div>
        </td>

        {/* Estado */}
        <td>
          <span style={{
            padding: '0.2rem 0.55rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
            color: estadoCfg.color, background: estadoCfg.bg,
          }}>
            {estadoCfg.label}
          </span>
        </td>

        {/* Fecha entrega */}
        <td style={{ fontSize: '0.78rem' }}>
          {srv.fecha_entrega_estimada ? (
            <div>
              <div>{new Date(srv.fecha_entrega_estimada + 'T12:00:00').toLocaleDateString('es-ES')}</div>
              {diasRestantes !== null && srv.estado === 'EN_CURSO' && (
                <div style={{
                  fontSize: '0.7rem', fontWeight: 600,
                  color: diasRestantes < 0 ? 'var(--accent-danger)' : diasRestantes <= 1 ? 'var(--accent-warning)' : 'var(--text-muted)',
                }}>
                  {diasRestantes < 0 ? `${Math.abs(diasRestantes)}d vencido` : diasRestantes === 0 ? 'Hoy' : `${diasRestantes}d restante${diasRestantes !== 1 ? 's' : ''}`}
                </div>
              )}
            </div>
          ) : '—'}
        </td>

        {/* Total */}
        <td>
          {esORI ? (
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.88rem' }}>{eur(srv.total_factura)}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--accent-warning)', fontWeight: 600 }}>
                {srv.costo_imputado_a_unidad ? '✓ Imputado' : 'Costo interno'}
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>{eur(srv.total_factura)}</div>
          )}
        </td>

        <td><span style={{ color: 'var(--text-muted)' }}>{exp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span></td>
      </tr>

      {/* Detalle expandido */}
      {exp && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <div style={{
              background: 'var(--bg-surface)', padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem',
            }}>
              {/* Columna izquierda: detalles de trabajo */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                  Descripción del trabajo
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.85rem' }}>
                  {srv.descripcion_trabajo}
                </div>

                {/* Aviso ORI */}
                {esORI && (
                  <div style={{
                    display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                    padding: '0.6rem 0.75rem', borderRadius: 8,
                    background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)',
                    fontSize: '0.78rem',
                  }}>
                    <Ban size={14} color="var(--accent-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong style={{ color: 'var(--accent-warning)' }}>Orden Interna — No facturable</strong>
                      <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Este trabajo no genera movimiento de Caja. El costo
                        {srv.costo_imputado_a_unidad
                          ? ' ya fue imputado al precio de costo de la unidad.'
                          : ' debe imputarse al precio de costo de la unidad al finalizar.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna derecha: costos */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                  {esORI ? 'Costo interno' : 'Facturación'}
                </div>
                {[
                  ['Mano de obra', `${srv.horas_mano_obra}h × ${eur(srv.precio_hora)}/h`, ''],
                  ['Subtotal M.O.', eur(srv.subtotal_mano_obra), 'var(--accent-primary)'],
                  ['Repuestos', eur(srv.subtotal_repuestos), ''],
                  [esORI ? 'COSTO TOTAL INTERNO' : 'TOTAL FACTURA', eur(srv.total_factura), esORI ? 'var(--accent-warning)' : 'var(--accent-success)'],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.28rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: (c as string) || 'inherit' }}>{v}</span>
                  </div>
                ))}

                {/* Repuestos usados */}
                {srv.repuestos_usados?.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Repuestos utilizados:</div>
                    {srv.repuestos_usados.map((r: any) => (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.2rem 0' }}>
                        <span>{r.repuesto_codigo || 'Repuesto'} ×{r.cantidad}</span>
                        <span style={{ fontFamily: 'Space Grotesk' }}>{eur(r.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fechas */}
                <div style={{ marginTop: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    ['Ingreso', srv.fecha_ingreso],
                    ['Entrega est.', srv.fecha_entrega_estimada],
                  ].map(([l, v]) => (
                    <div key={l} style={{ fontSize: '0.78rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>{l}</div>
                      <div style={{ fontWeight: 600 }}>
                        {v ? new Date(v + 'T12:00:00').toLocaleDateString('es-ES') : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Página principal ────────────────────────────────────────
export function TallerPage() {
  const [tab, setTab]               = useState<'todas' | 'ot' | 'ori'>('todas')
  const [busqueda, setBusqueda]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['servicios-taller'],
    queryFn:  () => tallerApi.servicios().then(r => r.data),
  })

  const servicios: any[] = rawData?.results || rawData || []

  // Separar OT y ORI
  const listaOT  = servicios.filter(s => s.tipo === 'OT')
  const listaORI = servicios.filter(s => s.tipo === 'ORI')
  const listaBase = tab === 'ot' ? listaOT : tab === 'ori' ? listaORI : servicios

  const listaFiltrada = listaBase.filter(s => {
    const q = busqueda.toLowerCase()
    const matchQ = !q ||
      s.cliente_nombre?.toLowerCase().includes(q) ||
      s.unidad_display?.toLowerCase().includes(q) ||
      s.descripcion_trabajo?.toLowerCase().includes(q) ||
      s.matricula_cliente?.toLowerCase().includes(q)
    const matchE = !filtroEstado || s.estado === filtroEstado
    return matchQ && matchE
  })

  // KPIs
  const enCurso      = servicios.filter(s => s.estado === 'EN_CURSO').length
  const vencidas     = servicios.filter(s => s.estado === 'EN_CURSO' && s.fecha_entrega_estimada &&
    new Date(s.fecha_entrega_estimada + 'T12:00:00') < new Date())
  const costoORI     = listaORI.reduce((s, o) => s + Number(o.total_factura), 0)
  const oriSinImputa = listaORI.filter(o => o.estado === 'TERMINADO' && !o.costo_imputado_a_unidad)
  const totalOT      = listaOT.filter(s => s.estado === 'FACTURADO').reduce((s, o) => s + Number(o.total_factura), 0)

  return (
    <div className="page-container">
      <Header
        title="Taller"
        subtitle="Órdenes de Trabajo (OT) y Órdenes de Reparación Interna (ORI)"
      />

      {/* ── KPIs ── */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'En Curso', value: enCurso, sub: `${listaOT.filter(s=>s.estado==='EN_CURSO').length} OT · ${listaORI.filter(s=>s.estado==='EN_CURSO').length} ORI`, color: 'var(--accent-warning)', icon: Clock },
          { label: 'Entregas Vencidas', value: vencidas.length, sub: vencidas.length > 0 ? '⚠ Supera la fecha estimada' : '✓ Sin vencimientos', color: vencidas.length > 0 ? 'var(--accent-danger)' : 'var(--accent-success)', icon: AlertTriangle },
          { label: 'Costo ORI acumulado', value: eur(costoORI), sub: `${oriSinImputa.length} sin imputar a unidad`, color: 'var(--accent-warning)', icon: Lock },
          { label: 'Facturación OT', value: eur(totalOT), sub: `${listaOT.filter(s=>s.estado==='FACTURADO').length} OT facturadas`, color: 'var(--accent-success)', icon: CheckCircle2 },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{k.sub}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${k.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={20} color={k.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerta ORI sin imputar */}
      {oriSinImputa.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem',
          padding: '0.85rem 1rem', background: 'rgba(245,158,11,0.07)',
          borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245,158,11,0.3)',
        }}>
          <Lock size={18} color="var(--accent-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent-warning)', fontSize: '0.88rem' }}>
              {oriSinImputa.length} ORI terminada{oriSinImputa.length !== 1 ? 's' : ''} con costo pendiente de imputar.
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              El costo de reparación interna debe sumarse al precio de costo de la unidad antes de ponerla en venta.
              Si no se imputa, la rentabilidad de venta quedará distorsionada.
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs OT / ORI / Todas ── */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        {[
          { key: 'todas', label: `📋 Todas (${servicios.length})` },
          { key: 'ot',    label: `🔧 OT — Clientes externos (${listaOT.length})` },
          { key: 'ori',   label: `🔒 ORI — Uso interno (${listaORI.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding: '0.6rem 1.1rem', border: 'none', cursor: 'pointer', background: 'transparent',
            fontSize: '0.85rem', fontWeight: 500,
            color: tab === t.key ? 'var(--accent-primary)' : 'var(--text-muted)',
            borderBottom: tab === t.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Info ORI visible cuando el filtro está en ORI */}
      {tab === 'ori' && (
        <div style={{
          display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '0.85rem',
          padding: '0.7rem 0.85rem', background: 'rgba(245,158,11,0.06)', borderRadius: 8,
          border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)',
        }}>
          <Ban size={14} color="var(--accent-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Las <strong>ORI</strong> son trabajos de uso propio: puesta a punto de usados, acondicionamiento de unidades recibidas en parte de pago, etc.
            <strong> Nunca generan movimiento de Caja ni pueden facturarse.</strong> El costo debe imputarse al precio de costo de la unidad.
          </span>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="card">
        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 32, margin: 0 }}
              placeholder="Buscar por cliente, unidad, matrícula, descripción..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <select className="form-input" style={{ margin: 0, minWidth: 160 }}
            value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_CFG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {(busqueda || filtroEstado) && (
            <button className="btn btn-ghost btn-sm"
              onClick={() => { setBusqueda(''); setFiltroEstado('') }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <X size={12} /> Limpiar
            </button>
          )}
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {listaFiltrada.length} de {listaBase.length} órdenes
          </span>
        </div>

        {isLoading ? (
          <div className="loading-state"><div className="spinner" /> Cargando órdenes...</div>
        ) : listaFiltrada.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <div className="empty-state-icon">🔧</div>
            <div className="empty-state-title">Sin órdenes con esos filtros</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Cliente / Unidad</th>
                  <th>Trabajo</th>
                  <th>Estado</th>
                  <th>Entrega</th>
                  <th>Importe</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map(s => <FilaOrden key={s.id} srv={s} />)}
              </tbody>
            </table>
          </div>
        )}

        {/* Totales pie */}
        {!isLoading && listaFiltrada.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', padding: '0.75rem 0', borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem', fontSize: '0.82rem', flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--text-muted)' }}>
              OT facturación: <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--accent-success)' }}>
                {eur(listaFiltrada.filter(s => s.tipo === 'OT').reduce((a, s) => a + Number(s.total_factura), 0))}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              ORI costo interno: <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--accent-warning)' }}>
                {eur(listaFiltrada.filter(s => s.tipo === 'ORI').reduce((a, s) => a + Number(s.total_factura), 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
