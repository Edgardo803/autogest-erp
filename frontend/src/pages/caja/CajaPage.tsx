// Página completa de Caja — Movimientos, Resumen del Día, Bancos, Pagarés
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '../../components/layout/Header'
import { cajaApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import {
  Plus, TrendingUp, TrendingDown, Wallet, Building2, Lock
} from 'lucide-react'
import { ModalMovimientoCaja } from '../../components/modals/ModalMovimientoCaja'
import toast from 'react-hot-toast'

const eur = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

const fechaHoy = new Date().toISOString().split('T')[0]

// ─── Badge de tipo de movimiento ──────────────────────────────
function TipoBadge({ tipo }: { tipo: string }) {
  const cfg = tipo === 'INGRESO'
    ? { color: 'var(--accent-success)', bg: 'rgba(34,201,120,0.1)', label: '▲ Ingreso' }
    : { color: 'var(--accent-danger)',  bg: 'rgba(239,68,68,0.1)',   label: '▼ Egreso' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem',
      fontWeight: 600, color: cfg.color, background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  )
}

// ─── KPI Card compacta ────────────────────────────────────────
function KpiCaja({ label, value, color, icon: Icon, sub }: {
  label: string; value: string; color: string; icon: any; sub?: string
}) {
  const colors: Record<string, string> = {
    green: 'var(--accent-success)', red: 'var(--accent-danger)',
    blue: 'var(--accent-primary)', purple: '#7c5cf6',
  }
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value" style={{ color: colors[color] }}>{value}</div>
          {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${colors[color]}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={colors[color]} />
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export function CajaPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [tipoModal, setTipoModal] = useState<'INGRESO' | 'EGRESO'>('INGRESO')
  const [tab, setTab] = useState<'movimientos' | 'bancos' | 'pagares'>('movimientos')

  const puedeOperar = user?.rol === 'TESORERIA' || user?.rol === 'GERENCIA' || user?.puede_ver_todo === true
  const puedeVerBancos = user?.puede_ver_financiero === true || user?.rol === 'GERENCIA' || user?.puede_ver_todo === true

  // ── Queries
  const { data: resumen, isLoading: loadRes } = useQuery({
    queryKey: ['resumen-caja'],
    queryFn: () => cajaApi.resumenHoy().then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: movimientos = [], isLoading: loadMov } = useQuery({
    queryKey: ['movimientos-caja'],
    queryFn: () => cajaApi.movimientos().then(r => r.data.results || r.data),
    refetchInterval: 60000,
  })

  const { data: bancos = [] } = useQuery({
    queryKey: ['cuentas-bancarias'],
    queryFn: () => cajaApi.cuentasBancarias().then(r => r.data.results || r.data),
    enabled: puedeVerBancos,
  })

  const { data: pagares = [] } = useQuery({
    queryKey: ['pagares'],
    queryFn: () => cajaApi.pagares().then(r => r.data.results || r.data),
  })

  const { data: saldoBancos } = useQuery({
    queryKey: ['saldo-total-bancos'],
    queryFn: () => cajaApi.saldoTotalBancos().then(r => r.data),
    enabled: puedeVerBancos,
  })

  // ── Cierre de día
  const { mutate: cerrarDia, isPending: cerrando } = useMutation({
    mutationFn: () => cajaApi.cerrarDia({ fecha: fechaHoy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumen-caja'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos-caja'] })
      toast.success('✅ Cierre de día registrado correctamente')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Error al cerrar el día')
    },
  })

  const abrirModal = (tipo: 'INGRESO' | 'EGRESO') => {
    setTipoModal(tipo)
    setModalOpen(true)
  }

  const saldoActual = resumen ? resumen.total_ingresos - resumen.total_egresos : 0
  const esNegativo = saldoActual < 0

  // Filtrar movimientos del día de hoy
  const movHoy = movimientos.filter((m: any) => m.fecha === fechaHoy)
  const movHistorico = movimientos.filter((m: any) => m.fecha !== fechaHoy)

  return (
    <div className="page-container">
      <Header
        title="Caja"
        subtitle="Movimientos de efectivo, cuentas bancarias y pagarés"
        actions={
          puedeOperar ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-sm" onClick={() => abrirModal('EGRESO')}
                style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--accent-danger)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <TrendingDown size={14} /> Egreso
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => abrirModal('INGRESO')}>
                <Plus size={14} /> Ingreso
              </button>
            </div>
          ) : null
        }
      />

      {/* ── KPIs del día ── */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <KpiCaja
          label="Saldo de Caja Hoy"
          value={loadRes ? '...' : eur(saldoActual)}
          color={esNegativo ? 'red' : 'green'}
          icon={esNegativo ? TrendingDown : Wallet}
          sub={esNegativo ? '⚠ Saldo negativo' : 'Efectivo disponible'}
        />
        <KpiCaja
          label="Ingresos del Día"
          value={loadRes ? '...' : eur(resumen?.total_ingresos || 0)}
          color="green"
          icon={TrendingUp}
          sub={`${movHoy.filter((m: any) => m.tipo === 'INGRESO').length} operaciones`}
        />
        <KpiCaja
          label="Egresos del Día"
          value={loadRes ? '...' : eur(resumen?.total_egresos || 0)}
          color="red"
          icon={TrendingDown}
          sub={`${movHoy.filter((m: any) => m.tipo === 'EGRESO').length} operaciones`}
        />
        {puedeVerBancos && (
          <KpiCaja
            label="Total en Bancos"
            value={saldoBancos ? eur(saldoBancos.saldo_total_bancos) : '...'}
            color="blue"
            icon={Building2}
            sub={`${bancos.length} cuentas activas`}
          />
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0' }}>
        {[
          { key: 'movimientos', label: '💵 Movimientos' },
          { key: 'bancos',      label: '🏦 Cuentas Bancarias', hidden: !puedeVerBancos },
          { key: 'pagares',     label: '📄 Pagarés' },
        ].filter(t => !t.hidden).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            style={{
              padding: '0.6rem 1.1rem', border: 'none', cursor: 'pointer',
              background: 'transparent', fontSize: '0.85rem', fontWeight: 500,
              color: tab === t.key ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: MOVIMIENTOS ─── */}
      {tab === 'movimientos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Movimientos de hoy */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📅 Movimientos de Hoy</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>

            {loadMov ? (
              <div className="loading-state"><div className="spinner" /> Cargando...</div>
            ) : movHoy.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">💵</div>
                <div className="empty-state-title">Sin movimientos hoy</div>
                <div className="empty-state-desc">Registrá el primer movimiento del día con el botón de Ingreso o Egreso</div>
                {puedeOperar && (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => abrirModal('INGRESO')}>
                      <Plus size={14} /> Nuevo Ingreso
                    </button>
                    <button className="btn btn-sm" onClick={() => abrirModal('EGRESO')}
                      style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <TrendingDown size={14} /> Nuevo Egreso
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Concepto</th>
                      <th>Descripción</th>
                      <th>Documento</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movHoy.map((m: any) => (
                      <tr key={m.id}>
                        <td><TipoBadge tipo={m.tipo} /></td>
                        <td style={{ fontSize: '0.82rem' }}>{m.concepto_display || m.concepto}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 220 }}>{m.descripcion || '—'}</td>
                        <td style={{ fontSize: '0.78rem', fontFamily: 'Space Grotesk', color: 'var(--text-muted)' }}>{m.numero_documento || '—'}</td>
                        <td style={{
                          fontFamily: 'Space Grotesk', fontWeight: 700,
                          color: m.tipo === 'INGRESO' ? 'var(--accent-success)' : 'var(--accent-danger)',
                        }}>
                          {m.tipo === 'INGRESO' ? '+' : '-'}{eur(m.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Histórico */}
          {movHistorico.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">📋 Histórico de Movimientos</div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{movHistorico.length} registros</span>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Concepto</th>
                      <th>Descripción</th>
                      <th>Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movHistorico.slice(0, 30).map((m: any) => (
                      <tr key={m.id}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>
                          {new Date(m.fecha).toLocaleDateString('es-ES')}
                        </td>
                        <td><TipoBadge tipo={m.tipo} /></td>
                        <td style={{ fontSize: '0.82rem' }}>{m.concepto_display || m.concepto}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: 180 }}>{m.descripcion || '—'}</td>
                        <td style={{
                          fontFamily: 'Space Grotesk', fontWeight: 700,
                          color: m.tipo === 'INGRESO' ? 'var(--accent-success)' : 'var(--accent-danger)',
                        }}>
                          {m.tipo === 'INGRESO' ? '+' : '-'}{eur(m.monto)}
                        </td>
                        <td>
                          {m.cerrado_en_dia
                            ? <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>✓ Cerrado</span>
                            : <span style={{ color: 'var(--accent-warning)', fontSize: '0.72rem' }}>Abierto</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cierre del día */}
          {puedeOperar && (
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
              <div className="card-header">
                <div>
                  <div className="card-title">🔒 Cierre de Día</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Solo Tesorería y Gerencia — Acción irreversible
                  </div>
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => cerrarDia()}
                  disabled={cerrando || movHoy.length === 0}
                  style={{
                    background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)',
                    border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: '0.4rem',
                    opacity: movHoy.length === 0 ? 0.5 : 1,
                  }}
                >
                  <Lock size={14} />
                  {cerrando ? 'Cerrando...' : 'Cerrar Día'}
                </button>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem',
                padding: '0.75rem 0',
              }}>
                {[
                  { label: 'Ingresos del día', valor: resumen?.total_ingresos || 0, color: 'var(--accent-success)' },
                  { label: 'Egresos del día',  valor: resumen?.total_egresos || 0,  color: 'var(--accent-danger)' },
                  { label: 'Saldo neto',        valor: saldoActual,                  color: esNegativo ? 'var(--accent-danger)' : 'var(--accent-success)' },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{item.label}</div>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.1rem', color: item.color }}>
                      {eur(item.valor)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: BANCOS ─── */}
      {tab === 'bancos' && puedeVerBancos && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Resumen total */}
          {saldoBancos && (
            <div className="card" style={{ borderColor: 'rgba(79,142,247,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Saldo Total en Bancos
                  </div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {eur(saldoBancos.saldo_total_bancos)}
                  </div>
                </div>
                <Building2 size={40} color="rgba(79,142,247,0.3)" />
              </div>
            </div>
          )}

          {/* Lista de cuentas */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Cuentas Bancarias</div>
            </div>
            {bancos.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">🏦</div>
                <div className="empty-state-title">Sin cuentas registradas</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
                {bancos.map((cuenta: any) => (
                  <div key={cuenta.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.85rem 1rem', background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'rgba(79,142,247,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem',
                      }}>🏦</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cuenta.banco}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>
                          {cuenta.iban}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.05rem', color: cuenta.saldo_actual < 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                        {eur(cuenta.saldo_actual)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cuenta.moneda}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: PAGARÉS ─── */}
      {tab === 'pagares' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">📄 Pagarés en Cartera</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pagares.length} documentos</div>
          </div>
          {pagares.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-icon">📄</div>
              <div className="empty-state-title">Sin pagarés registrados</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Emisor</th>
                    <th>Monto</th>
                    <th>Emisión</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th>Días</th>
                  </tr>
                </thead>
                <tbody>
                  {pagares.map((p: any) => {
                    const venc = new Date(p.fecha_vencimiento)
                    const hoyDate = new Date()
                    const diasRestantes = Math.ceil((venc.getTime() - hoyDate.getTime()) / (1000 * 60 * 60 * 24))
                    const esVencido = diasRestantes < 0
                    const esProximo = diasRestantes >= 0 && diasRestantes <= 15

                    return (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'Space Grotesk', fontSize: '0.82rem' }}>{p.numero}</td>
                        <td style={{ fontWeight: 500 }}>{p.emisor}</td>
                        <td style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--accent-success)' }}>
                          {eur(p.monto)}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(p.fecha_emision).toLocaleDateString('es-ES')}
                        </td>
                        <td style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                          {new Date(p.fecha_vencimiento).toLocaleDateString('es-ES')}
                        </td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600,
                            background: p.estado === 'COBRADO' ? 'rgba(34,201,120,0.1)' : 'rgba(79,142,247,0.1)',
                            color: p.estado === 'COBRADO' ? 'var(--accent-success)' : 'var(--accent-primary)',
                          }}>
                            {p.estado_display || p.estado}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.82rem',
                            color: esVencido ? 'var(--accent-danger)' : esProximo ? 'var(--accent-warning)' : 'var(--accent-success)',
                          }}>
                            {esVencido ? `Vencido (${Math.abs(diasRestantes)}d)` : `${diasRestantes}d`}
                          </span>
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

      {/* ─── MODAL ─── */}
      <ModalMovimientoCaja
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tipoInicial={tipoModal}
      />
    </div>
  )
}
