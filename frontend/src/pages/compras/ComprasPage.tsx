// Página de Compras — Proveedores, compras de unidades y órdenes de insumos
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../../components/layout/Header'
import { comprasApi } from '../../api/client'
import {
  Package, TrendingDown, CheckCircle2,
  Search, X, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react'

const eur = (n: number | string) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n))

const TIPO_PROV_CFG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  GRAN:  { color: 'var(--accent-primary)',  bg: 'rgba(79,142,247,0.1)',  label: 'Marca Oficial',   emoji: '🏭' },
  REP:   { color: 'var(--accent-warning)',  bg: 'rgba(245,158,11,0.1)', label: 'Repuestos',        emoji: '🔩' },
  SRV:   { color: 'var(--accent-success)',  bg: 'rgba(34,201,120,0.1)', label: 'Servicios',        emoji: '🛠' },
  OTR:   { color: 'var(--text-muted)',      bg: 'rgba(100,116,139,0.1)', label: 'Otro',            emoji: '📦' },
}

const TIPO_COMPRA_CFG: Record<string, { color: string; bg: string; label: string }> = {
  NUEVA:  { color: 'var(--accent-success)',  bg: 'rgba(34,201,120,0.1)', label: 'Unidad Nueva' },
  USADA:  { color: 'var(--accent-warning)',  bg: 'rgba(245,158,11,0.1)', label: 'Unidad Usada' },
  CONSIG: { color: 'var(--accent-primary)',  bg: 'rgba(79,142,247,0.1)', label: 'Consignación' },
}

// ─── KPI Card ─────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: any
}) {
  const colors: Record<string, string> = {
    blue: 'var(--accent-primary)', green: 'var(--accent-success)',
    orange: 'var(--accent-warning)', red: 'var(--accent-danger)', purple: '#a855f7',
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

// ─── Fila expandible de compra de unidad ─────────────────────
function FilaCompra({ compra }: { compra: any }) {
  const [expandido, setExpandido] = useState(false)
  const cfg = TIPO_COMPRA_CFG[compra.tipo_compra] || TIPO_COMPRA_CFG.NUEVA
  const saldoPendiente = Number(compra.saldo_pendiente)
  const pagosRealizados = (compra.pagos || []).filter((p: any) => p.pagado)
  const pagosPendientes = (compra.pagos || []).filter((p: any) => !p.pagado)
  const hayVencidos = pagosPendientes.some((p: any) =>
    p.fecha_vencimiento && new Date(p.fecha_vencimiento + 'T12:00:00') < new Date()
  )

  return (
    <>
      <tr
        style={{ cursor: 'pointer', background: expandido ? 'rgba(79,142,247,0.04)' : undefined }}
        onClick={() => setExpandido(e => !e)}
      >
        <td>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{compra.unidad_display.split('|')[0].trim()}</div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>
            {compra.numero_factura_proveedor || '—'}
          </div>
        </td>
        <td style={{ fontSize: '0.83rem' }}>{compra.proveedor_nombre}</td>
        <td>
          <span style={{ padding: '0.2rem 0.55rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, color: cfg.color, background: cfg.bg }}>
            {cfg.label}
          </span>
        </td>
        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {compra.fecha_compra ? new Date(compra.fecha_compra + 'T12:00:00').toLocaleDateString('es-ES') : '—'}
        </td>
        <td style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>{eur(compra.precio_compra)}</td>
        <td>
          {saldoPendiente > 0 ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Space Grotesk', fontWeight: 700, color: hayVencidos ? 'var(--accent-danger)' : 'var(--accent-warning)', fontSize: '0.85rem' }}>
              {hayVencidos && <AlertTriangle size={12} />}
              {eur(saldoPendiente)}
            </span>
          ) : (
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={12} /> Cancelado
            </span>
          )}
        </td>
        <td>
          <span style={{ color: 'var(--text-muted)' }}>
            {expandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
        </td>
      </tr>

      {/* Detalle expandido */}
      {expandido && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <div style={{
              background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)', padding: '1rem 1.5rem',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem',
            }}>
              {/* Info financiera */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Estructura financiera</div>
                {[
                  ['Precio de compra', eur(compra.precio_compra), ''],
                  ['Anticipo pagado',  eur(compra.anticipo_pagado), 'var(--accent-success)'],
                  ['Saldo financiado', eur(compra.saldo_financiado), ''],
                  ['Saldo pendiente',  eur(compra.saldo_pendiente), saldoPendiente > 0 ? 'var(--accent-warning)' : 'var(--accent-success)'],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.28rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: (c as string) || 'inherit' }}>{v}</span>
                  </div>
                ))}
                {compra.notas && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.6rem', fontStyle: 'italic' }}>
                    {compra.notas}
                  </div>
                )}
              </div>

              {/* Cuotas / pagos */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Cuotas — {pagosRealizados.length}/{(compra.pagos || []).length} pagadas
                </div>
                {(compra.pagos || []).length === 0 ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin cuotas registradas</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 180, overflowY: 'auto' }}>
                    {(compra.pagos || []).map((pago: any) => {
                      const vencido = !pago.pagado && pago.fecha_vencimiento &&
                        new Date(pago.fecha_vencimiento + 'T12:00:00') < new Date()
                      return (
                        <div key={pago.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.8rem',
                          background: pago.pagado ? 'rgba(34,201,120,0.07)' : vencido ? 'rgba(239,68,68,0.07)' : 'var(--bg-card)',
                          border: `1px solid ${pago.pagado ? 'rgba(34,201,120,0.2)' : vencido ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)'}`,
                        }}>
                          <span style={{ color: 'var(--text-muted)' }}>Cuota {pago.numero_cuota}</span>
                          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{eur(pago.monto)}</span>
                          <span style={{ fontSize: '0.75rem' }}>
                            {pago.fecha_vencimiento ? new Date(pago.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-ES') : '—'}
                          </span>
                          <span style={{ color: pago.pagado ? 'var(--accent-success)' : vencido ? 'var(--accent-danger)' : 'var(--accent-warning)', fontWeight: 600, fontSize: '0.72rem' }}>
                            {pago.pagado ? '✓ Pagado' : vencido ? '⚠ Vencido' : '⏳ Pdte.'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Tarjeta de proveedor ─────────────────────────────────────
function TarjetaProveedor({ prov, compras }: { prov: any; compras: any[] }) {
  const cfg = TIPO_PROV_CFG[prov.tipo] || TIPO_PROV_CFG.OTR
  const comprasProv = compras.filter(c => c.proveedor === prov.id)
  const totalComprado = comprasProv.reduce((s, c) => s + Number(c.precio_compra), 0)
  const saldoDeuda = comprasProv.reduce((s, c) => s + Number(c.saldo_pendiente), 0)

  return (
    <div className="card" style={{ borderTop: `3px solid ${cfg.color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.3rem' }}>{cfg.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{prov.razon_social}</div>
              {prov.nombre_comercial && prov.nombre_comercial !== prov.razon_social && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prov.nombre_comercial}</div>
              )}
            </div>
          </div>
        </div>
        <span style={{ padding: '0.2rem 0.55rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap' }}>
          {cfg.label}
        </span>
      </div>

      {/* Datos de contacto */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.85rem' }}>
        {[
          ['CIF/NIF', prov.cif_nif],
          ['Código', prov.codigo],
          ['Condiciones', prov.condiciones_pago || '—'],
          ['Límite crédito', prov.limite_credito ? eur(prov.limite_credito) : '—'],
          ['Email', prov.email || '—'],
          ['Teléfono', prov.telefono || '—'],
        ].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)', minWidth: 90 }}>{l}:</span>
            <span style={{ fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Resumen operativo */}
      {comprasProv.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div style={{ textAlign: 'center', padding: '0.4rem', background: 'var(--bg-surface)', borderRadius: 7 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Compras</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.95rem' }}>{comprasProv.length}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.4rem', background: 'var(--bg-surface)', borderRadius: 7 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total comprado</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.82rem', color: 'var(--accent-primary)' }}>{eur(totalComprado)}</div>
          </div>
          {saldoDeuda > 0 && (
            <div style={{ textAlign: 'center', padding: '0.4rem', background: 'rgba(239,68,68,0.06)', borderRadius: 7, border: '1px solid rgba(239,68,68,0.15)', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--accent-danger)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Saldo pendiente</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--accent-danger)' }}>{eur(saldoDeuda)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export function ComprasPage() {
  const [tab, setTab] = useState<'compras' | 'proveedores'>('compras')
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  const { data: comprasData, isLoading: loadComp } = useQuery({
    queryKey: ['compras-unidades'],
    queryFn: () => comprasApi.comprasUnidades().then(r => r.data),
  })

  const { data: proveedoresData, isLoading: loadProv } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => comprasApi.proveedores().then(r => r.data),
  })

  const compras: any[]    = comprasData?.results    || comprasData    || []
  const proveedores: any[] = proveedoresData?.results || proveedoresData || []

  // Filtros
  const comprasFiltradas = compras.filter(c => {
    const q = busqueda.toLowerCase()
    const matchQ = !q ||
      c.unidad_display?.toLowerCase().includes(q) ||
      c.proveedor_nombre?.toLowerCase().includes(q) ||
      c.numero_factura_proveedor?.toLowerCase().includes(q)
    const matchTipo = !filtroTipo || c.tipo_compra === filtroTipo
    return matchQ && matchTipo
  })

  const proveedoresFiltrados = proveedores.filter(p => {
    const q = busqueda.toLowerCase()
    return !q ||
      p.razon_social?.toLowerCase().includes(q) ||
      p.nombre_comercial?.toLowerCase().includes(q) ||
      p.cif_nif?.toLowerCase().includes(q) ||
      p.codigo?.toLowerCase().includes(q)
  })

  // KPIs
  const totalInvertido    = compras.reduce((s, c) => s + Number(c.precio_compra), 0)
  const totalDeuda        = compras.reduce((s, c) => s + Number(c.saldo_pendiente), 0)
  const cuotasVencidas    = compras.flatMap(c => c.pagos || [])
    .filter((p: any) => !p.pagado && p.fecha_vencimiento && new Date(p.fecha_vencimiento + 'T12:00:00') < new Date())
  const comprasCanceladas = compras.filter(c => Number(c.saldo_pendiente) === 0).length

  return (
    <div className="page-container">
      <Header
        title="Compras"
        subtitle="Adquisición de unidades y gestión de proveedores"
      />

      {/* ── KPIs ── */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <KpiCard
          label="Total Invertido"
          value={eur(totalInvertido)}
          sub={`${compras.length} operaciones de compra`}
          color="blue" icon={Package}
        />
        <KpiCard
          label="Deuda con Proveedores"
          value={eur(totalDeuda)}
          sub={totalDeuda > 0 ? `${compras.filter(c => Number(c.saldo_pendiente) > 0).length} compras con saldo` : '✓ Sin deuda pendiente'}
          color={totalDeuda > 0 ? 'orange' : 'green'} icon={TrendingDown}
        />
        <KpiCard
          label="Cuotas Vencidas"
          value={cuotasVencidas.length}
          sub={cuotasVencidas.length > 0 ? `${eur(cuotasVencidas.reduce((s, p: any) => s + Number(p.monto), 0))} por cobrar` : '✓ Sin vencimientos'}
          color={cuotasVencidas.length > 0 ? 'red' : 'green'} icon={AlertTriangle}
        />
        <KpiCard
          label="Compras Canceladas"
          value={comprasCanceladas}
          sub={`de ${compras.length} totales`}
          color="green" icon={CheckCircle2}
        />
      </div>

      {/* Alerta cuotas vencidas */}
      {cuotasVencidas.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.85rem 1rem', marginBottom: '1rem',
          background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(239,68,68,0.3)',
        }}>
          <AlertTriangle size={18} color="var(--accent-danger)" />
          <div>
            <span style={{ fontWeight: 700, color: 'var(--accent-danger)', fontSize: '0.88rem' }}>
              {cuotasVencidas.length} cuota{cuotasVencidas.length !== 1 ? 's' : ''} vencida{cuotasVencidas.length !== 1 ? 's' : ''} sin pagar.
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
              Importe total: {eur(cuotasVencidas.reduce((s, p: any) => s + Number(p.monto), 0))}. Revisá el detalle de cada compra.
            </span>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        {[
          { key: 'compras',      label: '📋 Compras de Unidades' },
          { key: 'proveedores',  label: '🏭 Proveedores' },
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

      {/* ─── TAB COMPRAS ─── */}
      {tab === 'compras' && (
        <div className="card">
          {/* Filtros */}
          <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: 32, margin: 0 }}
                placeholder="Buscar por unidad, proveedor, factura..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <select className="form-input" style={{ margin: 0, minWidth: 170 }}
              value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              <option value="NUEVA">🟢 Unidad Nueva</option>
              <option value="USADA">🟡 Unidad Usada</option>
              <option value="CONSIG">🔵 Consignación</option>
            </select>
            {(busqueda || filtroTipo) && (
              <button className="btn btn-ghost btn-sm"
                onClick={() => { setBusqueda(''); setFiltroTipo('') }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <X size={12} /> Limpiar
              </button>
            )}
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {comprasFiltradas.length} de {compras.length} operaciones
            </span>
          </div>

          {loadComp ? (
            <div className="loading-state"><div className="spinner" /> Cargando compras...</div>
          ) : comprasFiltradas.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Sin compras con esos filtros</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Unidad / Factura</th>
                    <th>Proveedor</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Precio compra</th>
                    <th>Saldo pendiente</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {comprasFiltradas.map((c: any) => (
                    <FilaCompra key={c.id} compra={c} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totales pie */}
          {!loadComp && comprasFiltradas.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', padding: '0.75rem 0', borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem', fontSize: '0.82rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>
                Total invertido (filtro): <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {eur(comprasFiltradas.reduce((s, c) => s + Number(c.precio_compra), 0))}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Saldo pendiente (filtro): <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--accent-warning)' }}>
                  {eur(comprasFiltradas.reduce((s, c) => s + Number(c.saldo_pendiente), 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB PROVEEDORES ─── */}
      {tab === 'proveedores' && (
        <>
          {/* Búsqueda */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative', maxWidth: 360 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: 32, margin: 0 }}
                placeholder="Buscar proveedor por nombre, CIF, código..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
          </div>

          {loadProv ? (
            <div className="loading-state"><div className="spinner" /> Cargando proveedores...</div>
          ) : (
            <>
              {/* Resumen por tipo */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {Object.entries(TIPO_PROV_CFG).map(([tipo, cfg]) => {
                  const count = proveedores.filter(p => p.tipo === tipo).length
                  if (!count) return null
                  return (
                    <div key={tipo} style={{
                      padding: '0.4rem 0.85rem', borderRadius: 20, fontSize: '0.78rem',
                      fontWeight: 600, color: cfg.color, background: cfg.bg,
                      border: `1px solid ${cfg.color}25`,
                    }}>
                      {cfg.emoji} {cfg.label}: {count}
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
                {proveedoresFiltrados.map((p: any) => (
                  <TarjetaProveedor key={p.id} prov={p} compras={compras} />
                ))}
                {proveedoresFiltrados.length === 0 && (
                  <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <div className="empty-state-icon">🏭</div>
                      <div className="empty-state-title">Sin proveedores con esos filtros</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
