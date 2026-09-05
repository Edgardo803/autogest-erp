// Página de Proveedores — Ficha completa + historial de compras + control de crédito
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../../components/layout/Header'
import { comprasApi } from '../../api/client'
import {
  Building2, TrendingDown, CreditCard, AlertTriangle,
  Search, X, ChevronDown, ChevronUp, Phone, Mail, MapPin
} from 'lucide-react'

const eur = (n: number | string) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0)

const pct = (v: number, t: number) => t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0

// ── Config visual por tipo de proveedor ─────────────────────
const TIPO_CFG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  GRAN:      { emoji: '🏭', label: 'Marca Oficial',     color: 'var(--accent-primary)',  bg: 'rgba(79,142,247,0.1)' },
  REP:       { emoji: '🔩', label: 'Repuestos/Insumos', color: 'var(--accent-warning)',  bg: 'rgba(245,158,11,0.1)' },
  SRV:       { emoji: '🛠', label: 'Servicios',         color: 'var(--accent-success)',  bg: 'rgba(34,201,120,0.1)' },
  OTR:       { emoji: '📦', label: 'Otro',              color: 'var(--text-muted)',      bg: 'rgba(100,116,139,0.1)' },
  // Legacy
  PROVEEDOR: { emoji: '🔩', label: 'Proveedor',         color: 'var(--accent-warning)',  bg: 'rgba(245,158,11,0.1)' },
}

// ── Barra de uso de crédito ───────────────────────────────────
function BarraCredito({ usado, limite }: { usado: number; limite: number }) {
  const p = pct(usado, limite)
  const color = p >= 90 ? 'var(--accent-danger)' : p >= 70 ? 'var(--accent-warning)' : 'var(--accent-success)'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
        <span>Crédito utilizado: <strong style={{ color }}>{eur(usado)}</strong></span>
        <span>Límite: <strong>{eur(limite)}</strong></span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, width: `${p}%`, background: color, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ fontSize: '0.7rem', color, fontWeight: 600, marginTop: '0.25rem', textAlign: 'right' }}>
        {p}% utilizado
      </div>
    </div>
  )
}

// ── Tarjeta expandible de proveedor ─────────────────────────
function TarjetaProveedor({ prov, compras }: { prov: any; compras: any[] }) {
  const [exp, setExp] = useState(false)
  const cfg = TIPO_CFG[prov.tipo] || TIPO_CFG.OTR

  const comprasProv  = compras.filter(c => c.proveedor === prov.id)
  const totalComprado = comprasProv.reduce((s, c) => s + Number(c.precio_compra), 0)
  const deudaViva     = comprasProv.reduce((s, c) => s + Number(c.saldo_pendiente), 0)
  const limite        = Number(prov.limite_credito) || 0
  const usoCreditoPct = pct(deudaViva, limite)
  const alertaCredito = limite > 0 && usoCreditoPct >= 70

  // Cuotas vencidas de este proveedor
  const cuotasVencidas = comprasProv
    .flatMap(c => c.pagos || [])
    .filter((p: any) => !p.pagado && p.fecha_vencimiento &&
      new Date(p.fecha_vencimiento + 'T12:00:00') < new Date())

  return (
    <div className="card" style={{
      borderLeft: `4px solid ${cfg.color}`,
      borderTop: alertaCredito ? '1px solid rgba(239,68,68,0.3)' : undefined,
    }}>
      {/* Cabecera siempre visible */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', gap: '0.75rem' }}
        onClick={() => setExp(e => !e)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Nombre + tipo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{cfg.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{prov.razon_social}</div>
              {prov.nombre_comercial && prov.nombre_comercial !== prov.razon_social && (
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{prov.nombre_comercial}</div>
              )}
            </div>
            <span style={{ padding: '0.18rem 0.5rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap' }}>
              {cfg.label}
            </span>
            {alertaCredito && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.18rem 0.5rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-danger)', background: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle size={10} /> Crédito al {usoCreditoPct}%
              </span>
            )}
          </div>

          {/* Código + CIF */}
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Cód: <strong>{prov.codigo}</strong></span>
            <span>CIF: <strong>{prov.cif_nif || '—'}</strong></span>
            <span>Cond. pago: <strong>{prov.condiciones_pago || '—'}</strong></span>
          </div>
        </div>

        {/* Resumen numérico + toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Compras</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-primary)' }}>{comprasProv.length}</div>
          </div>
          {deudaViva > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Deuda</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-warning)' }}>{eur(deudaViva)}</div>
            </div>
          )}
          <span style={{ color: 'var(--text-muted)' }}>{exp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
        </div>
      </div>

      {/* Barra de crédito siempre visible si hay límite */}
      {limite > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <BarraCredito usado={deudaViva} limite={limite} />
        </div>
      )}

      {/* Detalle expandido */}
      {exp && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

            {/* Columna izquierda: datos de contacto */}
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                Datos de contacto
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { icon: Phone, label: 'Teléfono', val: prov.telefono },
                  { icon: Mail,  label: 'Email',    val: prov.email },
                  { icon: MapPin, label: 'Dirección', val: prov.direccion },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.8rem' }}>
                    <Icon size={13} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
                      <span style={{ fontWeight: 500 }}>{val || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Condiciones */}
              <div style={{ marginTop: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Condiciones comerciales
                </div>
                {[
                  ['Condiciones pago', prov.condiciones_pago || '—'],
                  ['Límite de crédito', limite > 0 ? eur(limite) : 'Sin límite definido'],
                  ['Disponible', limite > 0 ? eur(Math.max(0, limite - deudaViva)) : '—'],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna derecha: historial de compras */}
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                Historial de operaciones
              </div>

              {comprasProv.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin operaciones registradas</div>
              ) : (
                <>
                  {/* Resumen financiero */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    {[
                      ['Total comprado', eur(totalComprado), 'var(--accent-primary)'],
                      ['Deuda viva', eur(deudaViva), deudaViva > 0 ? 'var(--accent-warning)' : 'var(--accent-success)'],
                      ['N° operaciones', String(comprasProv.length), ''],
                      ['Cuotas vencidas', String(cuotasVencidas.length), cuotasVencidas.length > 0 ? 'var(--accent-danger)' : 'var(--accent-success)'],
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ padding: '0.5rem 0.65rem', background: 'var(--bg-surface)', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{l}</div>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.9rem', color: (c as string) || 'inherit' }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Lista de compras */}
                  <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {comprasProv.map((c: any) => {
                      const saldo = Number(c.saldo_pendiente)
                      return (
                        <div key={c.id} style={{
                          padding: '0.4rem 0.65rem', borderRadius: 7, fontSize: '0.78rem',
                          background: saldo > 0 ? 'rgba(245,158,11,0.05)' : 'rgba(34,201,120,0.05)',
                          border: `1px solid ${saldo > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(34,201,120,0.2)'}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.unidad_display?.split('|')[0]?.trim() || `Compra #${c.id}`}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                              {c.fecha_compra ? new Date(c.fecha_compra + 'T12:00:00').toLocaleDateString('es-ES') : '—'}
                              {c.numero_factura_proveedor ? ` · ${c.numero_factura_proveedor}` : ''}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>{eur(c.precio_compra)}</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: saldo > 0 ? 'var(--accent-warning)' : 'var(--accent-success)' }}>
                              {saldo > 0 ? `pdte. ${eur(saldo)}` : '✓ Cancelado'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export function ProveedoresPage() {
  const [busqueda, setBusqueda]   = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [vista, setVista]         = useState<'cards' | 'tabla'>('cards')

  const { data: provData, isLoading: loadProv } = useQuery({
    queryKey: ['proveedores-page'],
    queryFn: () => comprasApi.proveedores().then(r => r.data),
  })

  const { data: comprasData } = useQuery({
    queryKey: ['compras-prov'],
    queryFn:  () => comprasApi.comprasUnidades().then(r => r.data),
  })

  const proveedores: any[] = provData?.results  || provData  || []
  const compras: any[]     = comprasData?.results || comprasData || []

  // Filtros
  const filtrados = proveedores.filter(p => {
    const q = busqueda.toLowerCase()
    const matchQ = !q ||
      p.razon_social?.toLowerCase().includes(q) ||
      p.nombre_comercial?.toLowerCase().includes(q) ||
      p.cif_nif?.toLowerCase().includes(q) ||
      p.codigo?.toLowerCase().includes(q)
    const matchT = !filtroTipo || p.tipo === filtroTipo
    return matchQ && matchT
  })

  // KPIs
  const totalProveedores  = proveedores.length
  const deudaTotal        = compras.reduce((s, c) => s + Number(c.saldo_pendiente), 0)
  const limiteTotalCredito = proveedores.reduce((s, p) => s + Number(p.limite_credito || 0), 0)
  const conAlerta          = proveedores.filter(p => {
    const deuda  = compras.filter(c => c.proveedor === p.id).reduce((s, c) => s + Number(c.saldo_pendiente), 0)
    const limite = Number(p.limite_credito) || 0
    return limite > 0 && deuda / limite >= 0.7
  }).length

  // Tipos únicos en los datos
  const tiposEnDatos = [...new Set(proveedores.map(p => p.tipo))]

  return (
    <div className="page-container">
      <Header
        title="Proveedores"
        subtitle="Directorio, historial comercial y control de crédito"
        actions={
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {(['cards', 'tabla'] as const).map(v => (
              <button key={v} onClick={() => setVista(v)}
                className="btn btn-sm"
                style={{
                  background: vista === v ? 'var(--accent-primary)' : 'transparent',
                  color: vista === v ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${vista === v ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  fontSize: '0.75rem', padding: '0.3rem 0.75rem',
                }}>
                {v === 'cards' ? '⊞ Fichas' : '☰ Tabla'}
              </button>
            ))}
          </div>
        }
      />

      {/* ── KPIs ── */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Proveedores', value: totalProveedores, sub: `${proveedores.filter(p=>p.activo).length} activos`, color: 'var(--accent-primary)', icon: Building2 },
          { label: 'Deuda Total', value: eur(deudaTotal), sub: `${compras.filter(c=>Number(c.saldo_pendiente)>0).length} compras con saldo`, color: deudaTotal > 0 ? 'var(--accent-warning)' : 'var(--accent-success)', icon: TrendingDown },
          { label: 'Crédito disponible', value: eur(limiteTotalCredito - deudaTotal), sub: `de ${eur(limiteTotalCredito)} límite total`, color: 'var(--accent-success)', icon: CreditCard },
          { label: 'Alertas crédito', value: conAlerta, sub: conAlerta > 0 ? '⚠ Cerca del límite' : '✓ Sin alertas', color: conAlerta > 0 ? 'var(--accent-danger)' : 'var(--accent-success)', icon: AlertTriangle },
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

      {/* Alerta crédito */}
      {conAlerta > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem',
          padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.07)',
          borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.25)',
        }}>
          <AlertTriangle size={16} color="var(--accent-danger)" />
          <span style={{ fontSize: '0.85rem' }}>
            <strong style={{ color: 'var(--accent-danger)' }}>{conAlerta} proveedor{conAlerta !== 1 ? 'es' : ''}</strong> con uso de crédito ≥ 70% del límite. Revisá antes de generar nuevas órdenes de compra.
          </span>
        </div>
      )}

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 32, margin: 0 }}
            placeholder="Buscar por nombre, CIF, código..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <select className="form-input" style={{ margin: 0, minWidth: 180 }}
          value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {tiposEnDatos.map(t => (
            <option key={t} value={t}>{TIPO_CFG[t]?.label || t}</option>
          ))}
        </select>
        {(busqueda || filtroTipo) && (
          <button className="btn btn-ghost btn-sm"
            onClick={() => { setBusqueda(''); setFiltroTipo('') }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <X size={12} /> Limpiar
          </button>
        )}
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {filtrados.length} de {proveedores.length} proveedores
        </span>
      </div>

      {/* ── Vista FICHAS ── */}
      {vista === 'cards' && (
        <>
          {loadProv ? (
            <div className="loading-state"><div className="spinner" /> Cargando proveedores...</div>
          ) : filtrados.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '3rem' }}>
                <div className="empty-state-icon">🏭</div>
                <div className="empty-state-title">Sin proveedores con esos filtros</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtrados.map(p => (
                <TarjetaProveedor key={p.id} prov={p} compras={compras} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Vista TABLA ── */}
      {vista === 'tabla' && (
        <div className="card">
          {loadProv ? (
            <div className="loading-state"><div className="spinner" /> Cargando...</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Razón Social</th>
                    <th>Tipo</th>
                    <th>CIF/NIF</th>
                    <th>Cond. Pago</th>
                    <th>Límite Crédito</th>
                    <th>Deuda viva</th>
                    <th>% Crédito</th>
                    <th>Compras</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(p => {
                    const cfg     = TIPO_CFG[p.tipo] || TIPO_CFG.OTR
                    const deuda   = compras.filter(c => c.proveedor === p.id).reduce((s, c) => s + Number(c.saldo_pendiente), 0)
                    const limite  = Number(p.limite_credito) || 0
                    const usoPct  = pct(deuda, limite)
                    const nComp   = compras.filter(c => c.proveedor === p.id).length
                    return (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.8rem' }}>{p.codigo}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.razon_social}</div>
                          {p.nombre_comercial && p.nombre_comercial !== p.razon_social && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.nombre_comercial}</div>
                          )}
                        </td>
                        <td>
                          <span style={{ padding: '0.18rem 0.5rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, color: cfg.color, background: cfg.bg }}>
                            {cfg.emoji} {cfg.label}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.cif_nif || '—'}</td>
                        <td style={{ fontSize: '0.82rem' }}>{p.condiciones_pago || '—'}</td>
                        <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.85rem' }}>
                          {limite > 0 ? eur(limite) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: deuda > 0 ? 'var(--accent-warning)' : 'var(--accent-success)', fontSize: '0.85rem' }}>
                          {deuda > 0 ? eur(deuda) : '✓'}
                        </td>
                        <td>
                          {limite > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden', minWidth: 60 }}>
                                <div style={{ height: '100%', width: `${usoPct}%`, borderRadius: 3, background: usoPct >= 90 ? 'var(--accent-danger)' : usoPct >= 70 ? 'var(--accent-warning)' : 'var(--accent-success)' }} />
                              </div>
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, minWidth: 28 }}>{usoPct}%</span>
                            </div>
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'Space Grotesk', fontWeight: 700 }}>{nComp}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
