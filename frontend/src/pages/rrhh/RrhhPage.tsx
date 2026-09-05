// Página de RRHH — Empleados y liquidaciones de nómina
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '../../components/layout/Header'
import { rrhhApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import {
  Users, Wallet, CheckCircle2, Clock,
  Search, X, ChevronDown, ChevronUp, BadgeCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

const eur = (n: number | string) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n))

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const DEPTO_CFG: Record<string, { color: string; bg: string; emoji: string }> = {
  GER: { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', emoji: '👔' },
  VEN: { color: 'var(--accent-primary)', bg: 'rgba(79,142,247,0.12)', emoji: '🚗' },
  COM: { color: 'var(--accent-warning)', bg: 'rgba(245,158,11,0.12)', emoji: '📦' },
  ADM: { color: 'var(--text-secondary)', bg: 'rgba(100,116,139,0.12)', emoji: '📋' },
  TAL: { color: 'var(--accent-success)', bg: 'rgba(34,201,120,0.12)', emoji: '🔧' },
  CAJ: { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', emoji: '💰' },
  RRH: { color: '#ec4899', bg: 'rgba(236,72,153,0.12)', emoji: '👥' },
  OTR: { color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.1)', emoji: '🏢' },
}

function DeptoBadge({ depto, label }: { depto: string; label: string }) {
  const cfg = DEPTO_CFG[depto] || DEPTO_CFG.OTR
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem',
      fontWeight: 600, color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap',
    }}>
      {cfg.emoji} {label}
    </span>
  )
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

// ─── Fila de empleado expandible ──────────────────────────────
function FilaEmpleado({ emp, liquidaciones, puedePagar }: {
  emp: any; liquidaciones: any[]; puedePagar: boolean
}) {
  const [expandido, setExpandido] = useState(false)
  const queryClient = useQueryClient()
  const cfg = DEPTO_CFG[emp.departamento] || DEPTO_CFG.OTR

  const liquiEmp = liquidaciones.filter(l => l.empleado === emp.id)
  const pendiente = liquiEmp.find(l => !l.pagado)
  const masReciente = liquiEmp[0]

  const { mutate: marcarPagado, isPending } = useMutation({
    mutationFn: (liquidacionId: number) =>
      rrhhApi.marcarPagado(liquidacionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liquidaciones'] })
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      toast.success(`✅ Liquidación pagada — ${eur(pendiente?.neto_a_pagar || 0)}`)
    },
    onError: () => toast.error('Error al registrar el pago'),
  })

  const antigüedadAnios = Math.floor(
    (new Date().getTime() - new Date(emp.fecha_ingreso + 'T12:00:00').getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  )

  return (
    <>
      <tr
        style={{ cursor: 'pointer', background: expandido ? 'rgba(79,142,247,0.04)' : undefined }}
        onClick={() => setExpandido(e => !e)}
      >
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Avatar con iniciales */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.82rem', fontWeight: 700, color: cfg.color,
            }}>
              {emp.nombre[0]}{emp.apellidos[0]}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{emp.apellidos}, {emp.nombre}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{emp.cargo}</div>
            </div>
          </div>
        </td>
        <td style={{ fontFamily: 'Space Grotesk', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.legajo}</td>
        <td><DeptoBadge depto={emp.departamento} label={emp.departamento_display} /></td>
        <td style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>{eur(emp.salario_bruto)}</td>
        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {antigüedadAnios > 0 ? `${antigüedadAnios} año${antigüedadAnios !== 1 ? 's' : ''}` : '< 1 año'}
        </td>
        <td>
          {pendiente ? (
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={11} /> Pendiente
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={11} /> Al día
            </span>
          )}
        </td>
        <td>
          <span style={{ color: 'var(--text-muted)' }}>
            {expandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
        </td>
      </tr>

      {/* Fila de detalle expandida */}
      {expandido && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <div style={{
              background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)', padding: '1rem 1.5rem',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem',
            }}>
              {/* Info personal */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Datos del empleado</div>
                {[
                  ['DNI/NIE', emp.dni_nie || '—'],
                  ['Email', emp.email || '—'],
                  ['Teléfono', emp.telefono || '—'],
                  ['Ingresó', emp.fecha_ingreso ? new Date(emp.fecha_ingreso + 'T12:00:00').toLocaleDateString('es-ES') : '—'],
                  ['Antigüedad', antigüedadAnios > 0 ? `${antigüedadAnios} año${antigüedadAnios !== 1 ? 's' : ''}` : 'Menos de 1 año'],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem 0', fontSize: '0.82rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)', minWidth: 90 }}>{l}:</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Liquidación más reciente */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Último recibo de sueldo
                </div>
                {masReciente ? (
                  <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border-subtle)', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {MESES[masReciente.periodo_mes]} {masReciente.periodo_año}
                      </span>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 20,
                        background: masReciente.pagado ? 'rgba(34,201,120,0.1)' : 'rgba(245,158,11,0.1)',
                        color: masReciente.pagado ? 'var(--accent-success)' : 'var(--accent-warning)',
                      }}>
                        {masReciente.pagado ? '✓ Pagado' : '⏳ Pendiente'}
                      </span>
                    </div>
                    {[
                      ['Salario bruto', eur(masReciente.salario_bruto), ''],
                      ['Deducciones',   `- ${eur(masReciente.deducciones)}`, 'var(--accent-danger)'],
                      ['Adicionales',   `+ ${eur(masReciente.adicionales)}`, masReciente.adicionales > 0 ? 'var(--accent-success)' : 'var(--text-muted)'],
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, color: c as string || 'inherit' }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0 0', marginTop: '0.3rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontWeight: 700 }}>Neto a pagar</span>
                      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1rem', color: 'var(--accent-success)' }}>
                        {eur(masReciente.neto_a_pagar)}
                      </span>
                    </div>

                    {/* Botón pagar */}
                    {!masReciente.pagado && puedePagar && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}
                        onClick={e => { e.stopPropagation(); marcarPagado(masReciente.id) }}
                        disabled={isPending}
                      >
                        <BadgeCheck size={14} />
                        {isPending ? 'Registrando...' : `Registrar pago ${eur(masReciente.neto_a_pagar)}`}
                      </button>
                    )}
                    {masReciente.fecha_pago && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                        Pagado el {new Date(masReciente.fecha_pago + 'T12:00:00').toLocaleDateString('es-ES')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin liquidaciones registradas</div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────
export function RrhhPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'empleados' | 'nomina'>('empleados')
  const [busqueda, setBusqueda] = useState('')
  const [filtroDepto, setFiltroDepto] = useState('')

  const puedePagar = user?.rol === 'TESORERIA' || user?.rol === 'GERENCIA' || user?.puede_ver_todo === true

  const { data: empleadosData, isLoading: loadEmp } = useQuery({
    queryKey: ['empleados'],
    queryFn: () => rrhhApi.empleados().then(r => r.data),
  })

  const { data: liquidacionesData, isLoading: loadLiq } = useQuery({
    queryKey: ['liquidaciones'],
    queryFn: () => rrhhApi.liquidaciones().then(r => r.data),
  })

  const empleados: any[] = empleadosData?.results || empleadosData || []
  const liquidaciones: any[] = liquidacionesData?.results || liquidacionesData || []

  // Filtros
  const empFiltrados = empleados.filter(e => {
    const q = busqueda.toLowerCase()
    const match = !q || `${e.nombre} ${e.apellidos} ${e.cargo} ${e.legajo}`.toLowerCase().includes(q)
    const matchDepto = !filtroDepto || e.departamento === filtroDepto
    return match && matchDepto
  })

  // KPIs
  const activos       = empleados.filter(e => e.activo)
  const masaNominal   = activos.reduce((s, e) => s + Number(e.salario_bruto), 0)
  const pendientesPago = liquidaciones.filter(l => !l.pagado)
  const totalPendiente = pendientesPago.reduce((s, l) => s + Number(l.neto_a_pagar), 0)
  const mesActual     = new Date().getMonth() + 1
  const añoActual     = new Date().getFullYear()
  const liqMesActual  = liquidaciones.filter(l => l.periodo_mes === mesActual && l.periodo_año === añoActual)
  const pagadasMes    = liqMesActual.filter(l => l.pagado).length

  // Deptos únicos
  const deptos = [...new Set(empleados.map(e => e.departamento))]
    .map(d => ({ value: d, label: DEPTO_CFG[d]?.emoji + ' ' + (empleados.find(e => e.departamento === d)?.departamento_display || d) }))

  return (
    <div className="page-container">
      <Header
        title="Recursos Humanos"
        subtitle="Personal, nómina y liquidaciones"
      />

      {/* ── KPIs ── */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <KpiCard label="Empleados Activos" value={activos.length} sub={`${empleados.length} en total`} color="blue" icon={Users} />
        <KpiCard label="Masa Salarial Bruta" value={eur(masaNominal)} sub="por mes" color="purple" icon={Wallet} />
        <KpiCard
          label={`Pagos ${MESES[mesActual]}`}
          value={`${pagadasMes} / ${liqMesActual.length}`}
          sub={liqMesActual.length > 0 ? (pagadasMes === liqMesActual.length ? '✓ Todos pagados' : `${liqMesActual.length - pagadasMes} pendientes`) : 'Sin liquidar'}
          color={pagadasMes === liqMesActual.length && liqMesActual.length > 0 ? 'green' : 'orange'}
          icon={CheckCircle2}
        />
        <KpiCard
          label="Total Pendiente Pago"
          value={eur(totalPendiente)}
          sub={`${pendientesPago.length} liquidación${pendientesPago.length !== 1 ? 'es' : ''}`}
          color={totalPendiente > 0 ? 'orange' : 'green'}
          icon={Clock}
        />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        {[
          { key: 'empleados', label: '👥 Empleados' },
          { key: 'nomina',    label: '📋 Nómina del Mes' },
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

      {/* ─── TAB EMPLEADOS ─── */}
      {tab === 'empleados' && (
        <div className="card">
          {/* Filtros */}
          <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: 32, margin: 0 }}
                placeholder="Buscar por nombre, cargo, legajo..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <select className="form-input" style={{ margin: 0, minWidth: 170 }}
              value={filtroDepto} onChange={e => setFiltroDepto(e.target.value)}>
              <option value="">Todos los departamentos</option>
              {deptos.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            {(busqueda || filtroDepto) && (
              <button className="btn btn-ghost btn-sm"
                onClick={() => { setBusqueda(''); setFiltroDepto('') }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <X size={12} /> Limpiar
              </button>
            )}
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {empFiltrados.length} empleado{empFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Tabla */}
          {loadEmp ? (
            <div className="loading-state"><div className="spinner" /> Cargando personal...</div>
          ) : empFiltrados.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">Sin empleados con esos filtros</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Legajo</th>
                    <th>Departamento</th>
                    <th>Salario Bruto</th>
                    <th>Antigüedad</th>
                    <th>Nómina</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {empFiltrados.map(emp => (
                    <FilaEmpleado
                      key={emp.id}
                      emp={emp}
                      liquidaciones={liquidaciones}
                      puedePagar={puedePagar}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totales al pie */}
          {!loadEmp && empFiltrados.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', padding: '0.75rem 0', borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem', fontSize: '0.82rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>
                Masa salarial filtrada: <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {eur(empFiltrados.filter(e => e.activo).reduce((s, e) => s + Number(e.salario_bruto), 0))} / mes
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB NÓMINA DEL MES ─── */}
      {tab === 'nomina' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📋 Nómina — {MESES[mesActual]} {añoActual}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {pagadasMes} de {liqMesActual.length} liquidaciones abonadas
              </div>
            </div>
            {/* Barra de progreso */}
            {liqMesActual.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 120, height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--accent-success)', borderRadius: 3, width: `${(pagadasMes / liqMesActual.length) * 100}%`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {Math.round((pagadasMes / liqMesActual.length) * 100)}%
                </span>
              </div>
            )}
          </div>

          {loadLiq ? (
            <div className="loading-state"><div className="spinner" /> Cargando nómina...</div>
          ) : liqMesActual.length === 0 ? (
            <div className="empty-state" style={{ padding: '2.5rem' }}>
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Sin liquidaciones para {MESES[mesActual]}</div>
              <div className="empty-state-desc">Las liquidaciones se generan automáticamente cada mes</div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Departamento</th>
                      <th>Bruto</th>
                      <th>Deducciones</th>
                      <th>Adicionales</th>
                      <th>Neto a pagar</th>
                      <th>Estado</th>
                      {puedePagar && <th>Acción</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {liqMesActual.map((liq: any) => {
                      const emp = empleados.find(e => e.id === liq.empleado)
                      return (
                        <tr key={liq.id}>
                          <td>
                            <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{liq.empleado_nombre}</div>
                          </td>
                          <td>
                            {emp && <DeptoBadge depto={emp.departamento} label={emp.departamento_display} />}
                          </td>
                          <td style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{eur(liq.salario_bruto)}</td>
                          <td style={{ fontFamily: 'Space Grotesk', color: 'var(--accent-danger)' }}>- {eur(liq.deducciones)}</td>
                          <td style={{ fontFamily: 'Space Grotesk', color: Number(liq.adicionales) > 0 ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                            {Number(liq.adicionales) > 0 ? `+ ${eur(liq.adicionales)}` : '—'}
                          </td>
                          <td style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-success)' }}>
                            {eur(liq.neto_a_pagar)}
                          </td>
                          <td>
                            {liq.pagado ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                                <CheckCircle2 size={13} />
                                {liq.fecha_pago ? new Date(liq.fecha_pago + 'T12:00:00').toLocaleDateString('es-ES') : 'Pagado'}
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-warning)', fontWeight: 600 }}>
                                <Clock size={13} /> Pendiente
                              </span>
                            )}
                          </td>
                          {puedePagar && (
                            <td>
                              {!liq.pagado && (
                                <PagarButton liquidacionId={liq.id} neto={liq.neto_a_pagar} />
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totales de nómina */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1rem 0', borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem' }}>
                {[
                  { label: 'Total Bruto', valor: liqMesActual.reduce((s: number, l: any) => s + Number(l.salario_bruto), 0), color: '' },
                  { label: 'Total Deducciones', valor: liqMesActual.reduce((s: number, l: any) => s + Number(l.deducciones), 0), color: 'var(--accent-danger)' },
                  { label: 'Total Adicionales', valor: liqMesActual.reduce((s: number, l: any) => s + Number(l.adicionales), 0), color: 'var(--accent-success)' },
                  { label: 'Total Neto a Pagar', valor: liqMesActual.reduce((s: number, l: any) => s + Number(l.neto_a_pagar), 0), color: 'var(--accent-success)' },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-surface)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{item.label}</div>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: item.color || 'var(--text-primary)' }}>
                      {eur(item.valor)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Botón pagar inline en tabla ──────────────────────────────
function PagarButton({ liquidacionId, neto }: { liquidacionId: number; neto: string }) {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: () => rrhhApi.marcarPagado(liquidacionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liquidaciones'] })
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      toast.success(`✅ Pago registrado — ${eur(neto)}`)
    },
    onError: () => toast.error('Error al registrar el pago'),
  })
  return (
    <button
      className="btn btn-sm"
      style={{ background: 'rgba(34,201,120,0.1)', color: 'var(--accent-success)', border: '1px solid rgba(34,201,120,0.25)', fontSize: '0.75rem' }}
      onClick={() => mutate()}
      disabled={isPending}
    >
      <BadgeCheck size={12} /> {isPending ? '...' : 'Pagar'}
    </button>
  )
}
