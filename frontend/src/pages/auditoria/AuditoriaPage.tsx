// Página de Auditoría — Solo Gerencia y Auditoría General
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../../components/layout/Header'
import { auditoriaApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import {
  Shield, AlertTriangle, AlertOctagon, Info,
  Clock, FileText, Search, X, Eye, Plus
} from 'lucide-react'
import { ModalNuevoPrograma } from '../../components/modals/ModalNuevoPrograma'
import { ModalNuevoInforme } from '../../components/modals/ModalNuevoInforme'

const NIVEL_CFG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  INFO:    { color: 'var(--accent-primary)',  bg: 'rgba(79,142,247,0.1)',  border: 'rgba(79,142,247,0.25)',  icon: Info,         label: 'Info' },
  ALERTA:  { color: 'var(--accent-warning)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: AlertTriangle, label: 'Alerta' },
  CRITICO: { color: 'var(--accent-danger)',   bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   icon: AlertOctagon,  label: 'Crítico' },
}

const RIESGO_CFG: Record<string, { color: string; bg: string }> = {
  BAJO:    { color: 'var(--accent-success)', bg: 'rgba(34,201,120,0.1)' },
  MEDIO:   { color: 'var(--accent-warning)', bg: 'rgba(245,158,11,0.1)' },
  ALTO:    { color: 'var(--accent-danger)',   bg: 'rgba(239,68,68,0.1)' },
  CRITICO: { color: '#ff2d55',               bg: 'rgba(255,45,85,0.12)' },
}

const ESTADO_PROG_CFG: Record<string, { color: string; bg: string; label: string }> = {
  PROGRAMADA:  { color: 'var(--accent-primary)', bg: 'rgba(79,142,247,0.1)',  label: '🗓 Programada' },
  EN_PROCESO:  { color: 'var(--accent-warning)', bg: 'rgba(245,158,11,0.1)', label: '⚙️ En proceso' },
  COMPLETADA:  { color: 'var(--accent-success)', bg: 'rgba(34,201,120,0.1)', label: '✓ Completada' },
  CANCELADA:   { color: 'var(--text-muted)',      bg: 'rgba(100,116,139,0.1)', label: '✗ Cancelada' },
}

const MODULO_EMOJI: Record<string, string> = {
  VENTAS: '🚗', COMPRAS: '📦', CAJA: '💰', FINANCIERO: '📊',
  RRHH: '👥', INVENTARIO: '🔧', ACCOUNTS: '🔐', SISTEMA: '⚙️',
}

function NivelBadge({ nivel }: { nivel: string }) {
  const cfg = NIVEL_CFG[nivel] || NIVEL_CFG.INFO
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem',
      fontWeight: 700, color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap',
    }}>
      <Icon size={10} /> {cfg.label}
    </span>
  )
}

// ─── Modal de detalle de un evento ────────────────────────────
function ModalDetalleEvento({ evento, onClose }: { evento: any; onClose: () => void }) {
  const cfg = NIVEL_CFG[evento.nivel] || NIVEL_CFG.INFO
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: `1px solid ${cfg.border}`, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <cfg.icon size={18} color={cfg.color} />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Evento de Auditoría #{evento.id}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(evento.timestamp).toLocaleString('es-ES')}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <NivelBadge nivel={evento.nivel} />

          <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Detalle del evento</div>
            {[
              ['Módulo', `${MODULO_EMOJI[evento.modulo] || '📋'} ${evento.modulo_display || evento.modulo}`],
              ['Acción', evento.accion],
              ['Usuario', evento.usuario?.username || evento.usuario || '—'],
              ['IP de origen', evento.ip_origen || '—'],
              ['Descripción', evento.descripcion],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', gap: '0.75rem', padding: '0.3rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.83rem' }}>
                <span style={{ color: 'var(--text-muted)', minWidth: 110, flexShrink: 0 }}>{l}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>

          {(evento.datos_previos || evento.datos_nuevos) && (
            <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Datos registrados</div>
              {evento.datos_previos && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-danger)', marginBottom: '0.25rem' }}>Antes:</div>
                  <pre style={{ fontSize: '0.75rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: 6, overflow: 'auto', color: 'var(--text-secondary)' }}>
                    {JSON.stringify(evento.datos_previos, null, 2)}
                  </pre>
                </div>
              )}
              {evento.datos_nuevos && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-success)', marginBottom: '0.25rem' }}>Después:</div>
                  <pre style={{ fontSize: '0.75rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: 6, overflow: 'auto', color: 'var(--text-secondary)' }}>
                    {JSON.stringify(evento.datos_nuevos, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export function AuditoriaPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'eventos' | 'programas' | 'informes'>('eventos')
  const [busqueda, setBusqueda] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('')
  const [filtroModulo, setFiltroModulo] = useState('')
  const [eventoDetalle, setEventoDetalle] = useState<any>(null)
  const [modalPrograma, setModalPrograma] = useState(false)
  const [modalInforme, setModalInforme] = useState(false)
  const [programaParaInforme, setProgramaParaInforme] = useState<number | undefined>(undefined)

  const esAuditor  = user?.rol === 'AUDITORIA'
  const esGerencia = user?.rol === 'GERENCIA' || user?.puede_ver_todo === true

  // ── Queries
  const { data: eventosData, isLoading: loadEv } = useQuery({
    queryKey: ['eventos-auditoria'],
    queryFn: () => auditoriaApi.eventos().then(r => r.data),
  })

  const { data: programasData, isLoading: loadProg } = useQuery({
    queryKey: ['programas-auditoria'],
    queryFn: () => auditoriaApi.programas().then(r => r.data),
  })

  const { data: informesData, isLoading: loadInf } = useQuery({
    queryKey: ['informes-auditoria'],
    queryFn: () => auditoriaApi.informes().then(r => r.data),
    enabled: tab === 'informes' && (esAuditor || esGerencia),
  })

  const eventos: any[]   = eventosData?.results   || eventosData   || []
  const programas: any[] = programasData?.results || programasData || []
  const informes: any[]  = informesData?.results  || informesData  || []

  // Filtros en cliente
  const eventosFiltrados = eventos.filter(e => {
    const q = busqueda.toLowerCase()
    const matchQ = !q || e.descripcion?.toLowerCase().includes(q) ||
      e.accion?.toLowerCase().includes(q) ||
      (typeof e.usuario === 'object' ? e.usuario?.username : e.usuario)?.toLowerCase().includes(q)
    const matchNivel  = !filtroNivel  || e.nivel  === filtroNivel
    const matchModulo = !filtroModulo || e.modulo === filtroModulo
    return matchQ && matchNivel && matchModulo
  })

  // KPIs
  const criticos = eventos.filter(e => e.nivel === 'CRITICO').length
  const alertas  = eventos.filter(e => e.nivel === 'ALERTA').length
  const progPendientes = programas.filter(p => p.estado === 'PROGRAMADA' || p.estado === 'EN_PROCESO').length

  return (
    <div className="page-container">
      <Header
        title="Auditoría"
        subtitle="Trazabilidad, control interno e informes formales"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {tab === 'programas' && (esAuditor || esGerencia) && (
              <button className="btn btn-primary btn-sm" onClick={() => setModalPrograma(true)}>
                <Plus size={14} /> Nuevo Programa
              </button>
            )}
            {tab === 'informes' && (esAuditor || esGerencia) && (
              <button className="btn btn-primary btn-sm" onClick={() => { setProgramaParaInforme(undefined); setModalInforme(true) }}>
                <FileText size={14} /> Emitir Informe
              </button>
            )}
            {tab === 'eventos' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={15} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Solo lectura — generado por el sistema</span>
              </div>
            )}
          </div>
        }
      />

      {/* ── KPIs ── */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          {
            label: 'Total Eventos',
            value: eventos.length,
            sub: 'registros de trazabilidad',
            color: 'var(--accent-primary)',
            bg: 'rgba(79,142,247,0.1)',
            icon: Shield,
          },
          {
            label: 'Eventos Críticos',
            value: criticos,
            sub: criticos > 0 ? '⚠ Requieren atención' : '✓ Sin críticos',
            color: criticos > 0 ? 'var(--accent-danger)' : 'var(--accent-success)',
            bg: criticos > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,201,120,0.1)',
            icon: AlertOctagon,
          },
          {
            label: 'Alertas',
            value: alertas,
            sub: 'eventos de nivel alerta',
            color: alertas > 0 ? 'var(--accent-warning)' : 'var(--accent-success)',
            bg: alertas > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(34,201,120,0.1)',
            icon: AlertTriangle,
          },
          {
            label: 'Auditorías Pendientes',
            value: progPendientes,
            sub: `${programas.length} programas totales`,
            color: progPendientes > 0 ? 'var(--accent-warning)' : 'var(--accent-success)',
            bg: progPendientes > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(34,201,120,0.1)',
            icon: Clock,
          },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{k.sub}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={20} color={k.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Alerta si hay críticos ── */}
      {criticos > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.85rem 1rem', marginBottom: '1rem',
          background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(239,68,68,0.3)',
        }}>
          <AlertOctagon size={18} color="var(--accent-danger)" />
          <div>
            <span style={{ fontWeight: 700, color: 'var(--accent-danger)', fontSize: '0.88rem' }}>
              {criticos} evento{criticos !== 1 ? 's' : ''} crítico{criticos !== 1 ? 's' : ''} detectado{criticos !== 1 ? 's' : ''}.
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
              Revisá el log de eventos para más detalle.
            </span>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        {[
          { key: 'eventos',   label: '📋 Log de Eventos' },
          { key: 'programas', label: '🗓 Programas de Auditoría' },
          { key: 'informes',  label: '📄 Informes', hidden: !esAuditor && !esGerencia },
        ].filter(t => !t.hidden).map(t => (
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

      {/* ─── TAB: LOG DE EVENTOS ─── */}
      {tab === 'eventos' && (
        <div className="card">
          {/* Filtros */}
          <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: 32, margin: 0 }}
                placeholder="Buscar en descripción, acción, usuario..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <select className="form-input" style={{ margin: 0, minWidth: 140 }}
              value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}>
              <option value="">Todos los niveles</option>
              <option value="CRITICO">🔴 Crítico</option>
              <option value="ALERTA">🟡 Alerta</option>
              <option value="INFO">🔵 Info</option>
            </select>
            <select className="form-input" style={{ margin: 0, minWidth: 160 }}
              value={filtroModulo} onChange={e => setFiltroModulo(e.target.value)}>
              <option value="">Todos los módulos</option>
              {Object.entries(MODULO_EMOJI).map(([val, emoji]) => (
                <option key={val} value={val}>{emoji} {val}</option>
              ))}
            </select>
            {(busqueda || filtroNivel || filtroModulo) && (
              <button className="btn btn-ghost btn-sm"
                onClick={() => { setBusqueda(''); setFiltroNivel(''); setFiltroModulo('') }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <X size={12} /> Limpiar
              </button>
            )}
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {eventosFiltrados.length} de {eventos.length} eventos
            </span>
          </div>

          {loadEv ? (
            <div className="loading-state"><div className="spinner" /> Cargando eventos...</div>
          ) : eventosFiltrados.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">Sin eventos con esos filtros</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Nivel</th>
                    <th>Módulo</th>
                    <th>Acción</th>
                    <th>Descripción</th>
                    <th>Usuario</th>
                    <th>IP</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {eventosFiltrados.map((ev: any) => {
                    const cfg = NIVEL_CFG[ev.nivel] || NIVEL_CFG.INFO
                    return (
                      <tr key={ev.id} style={{ borderLeft: `3px solid ${cfg.border}` }}>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk', whiteSpace: 'nowrap' }}>
                          {new Date(ev.timestamp).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td><NivelBadge nivel={ev.nivel} /></td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {MODULO_EMOJI[ev.modulo] || '📋'} {ev.modulo_display || ev.modulo}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'Space Grotesk' }}>{ev.accion}</td>
                        <td style={{ fontSize: '0.8rem', maxWidth: 260, color: 'var(--text-secondary)' }}>{ev.descripcion}</td>
                        <td style={{ fontSize: '0.78rem', fontFamily: 'Space Grotesk' }}>
                          {typeof ev.usuario === 'object' ? ev.usuario?.username : ev.usuario}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>{ev.ip_origen}</td>
                        <td>
                          <button
                            onClick={() => setEventoDetalle(ev)}
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '0.25rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}
                          >
                            <Eye size={11} /> Ver
                          </button>
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

      {/* ─── TAB: PROGRAMAS ─── */}
      {tab === 'programas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loadProg ? (
            <div className="loading-state"><div className="spinner" /> Cargando programas...</div>
          ) : programas.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '3rem' }}>
                <div className="empty-state-icon">🗓</div>
                <div className="empty-state-title">Sin programas de auditoría</div>
                <div className="empty-state-desc">Cargá programas desde el panel de administración</div>
              </div>
            </div>
          ) : programas.map((prog: any) => {
            const estadoCfg = ESTADO_PROG_CFG[prog.estado] || ESTADO_PROG_CFG.PROGRAMADA
            const diasHasta = prog.fecha_programada
              ? Math.ceil((new Date(prog.fecha_programada + 'T12:00:00').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null

            return (
              <div key={prog.id} className="card" style={{ borderLeft: `4px solid ${estadoCfg.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{prog.titulo}</span>
                      <span style={{ padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, color: estadoCfg.color, background: estadoCfg.bg }}>
                        {estadoCfg.label}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {MODULO_EMOJI[prog.modulo_objetivo] || '📋'} {prog.modulo_objetivo}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      {[
                        ['Responsable', prog.responsable?.username || prog.responsable || '—'],
                        ['Fecha programada', prog.fecha_programada ? new Date(prog.fecha_programada + 'T12:00:00').toLocaleDateString('es-ES') : '—'],
                        ['Realización', prog.fecha_realizacion ? new Date(prog.fecha_realizacion + 'T12:00:00').toLocaleDateString('es-ES') : '—'],
                        ['Informe generado', prog.informe_generado ? '✓ Sí' : 'No'],
                      ].map(([l, v]) => (
                        <div key={l} style={{ fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{l}: </span>
                          <span style={{ fontWeight: 500 }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {prog.objetivos && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '0.6rem 0.85rem', borderRadius: 8, marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Objetivos: </span>{prog.objetivos}
                      </div>
                    )}
                    {prog.hallazgos && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--accent-warning)', background: 'rgba(245,158,11,0.06)', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>⚠ Hallazgos: </span>{prog.hallazgos}
                      </div>
                    )}
                    {prog.recomendaciones && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', background: 'rgba(79,142,247,0.06)', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1px solid rgba(79,142,247,0.15)' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>💡 Recomendaciones: </span>{prog.recomendaciones}
                      </div>
                    )}
                  </div>

                  {/* Contador días / botón Emitir Informe */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    {diasHasta !== null && prog.estado === 'PROGRAMADA' && (
                      <div style={{ textAlign: 'center', padding: '0.75rem 1rem', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)', minWidth: 90 }}>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.6rem', color: diasHasta <= 3 ? 'var(--accent-danger)' : diasHasta <= 10 ? 'var(--accent-warning)' : 'var(--accent-primary)' }}>
                          {diasHasta > 0 ? diasHasta : 0}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {diasHasta > 1 ? 'días' : 'día'}
                        </div>
                      </div>
                    )}
                    {/* Botón emitir informe — para programas sin informe aún */}
                    {!prog.informe_generado && prog.estado !== 'CANCELADA' && (esAuditor || esGerencia) && (
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(79,142,247,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(79,142,247,0.25)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        onClick={() => { setProgramaParaInforme(prog.id); setModalInforme(true) }}
                      >
                        <FileText size={12} /> Emitir Informe
                      </button>
                    )}
                    {prog.informe_generado && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        ✓ Informe emitido
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── TAB: INFORMES ─── */}
      {tab === 'informes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loadInf ? (
            <div className="loading-state"><div className="spinner" /> Cargando informes...</div>
          ) : informes.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '3rem' }}>
                <div className="empty-state-icon">📄</div>
                <div className="empty-state-title">Sin informes de auditoría</div>
                <div className="empty-state-desc">Los informes se generan al completar un programa de auditoría</div>
              </div>
            </div>
          ) : informes.map((inf: any) => {
            const riesgoCfg = RIESGO_CFG[inf.nivel_riesgo] || RIESGO_CFG.BAJO
            return (
              <div key={inf.id} className="card" style={{ border: `1px solid ${riesgoCfg.bg}`, borderLeft: `4px solid ${riesgoCfg.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <FileText size={16} color={riesgoCfg.color} />
                      <span style={{ fontWeight: 700 }}>Informe #{inf.id}</span>
                      <span style={{ padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, color: riesgoCfg.color, background: riesgoCfg.bg }}>
                        Riesgo: {inf.nivel_riesgo_display || inf.nivel_riesgo}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      Emitido: {inf.fecha_informe ? new Date(inf.fecha_informe + 'T12:00:00').toLocaleDateString('es-ES') : '—'} · Por: {inf.creado_por?.username || '—'}
                    </div>
                  </div>
                  {inf.fecha_seguimiento && (
                    <div style={{ textAlign: 'right', fontSize: '0.78rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Seguimiento:</div>
                      <div style={{ fontWeight: 600, color: 'var(--accent-warning)' }}>
                        {new Date(inf.fecha_seguimiento + 'T12:00:00').toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  )}
                </div>

                {inf.resumen_ejecutivo && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem', padding: '0.85rem', background: 'var(--bg-surface)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Resumen Ejecutivo</div>
                    {inf.resumen_ejecutivo}
                  </div>
                )}
                {inf.acciones_requeridas && (
                  <div style={{ fontSize: '0.83rem', color: 'var(--accent-danger)', lineHeight: 1.6, padding: '0.75rem 0.85rem', background: 'rgba(239,68,68,0.05)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.3rem' }}>🚨 Acciones requeridas</div>
                    {inf.acciones_requeridas}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal detalle evento */}
      {eventoDetalle && (
        <ModalDetalleEvento evento={eventoDetalle} onClose={() => setEventoDetalle(null)} />
      )}

      {/* Modal nuevo programa */}
      <ModalNuevoPrograma
        open={modalPrograma}
        onClose={() => setModalPrograma(false)}
      />

      {/* Modal emitir informe */}
      <ModalNuevoInforme
        open={modalInforme}
        onClose={() => { setModalInforme(false); setProgramaParaInforme(undefined) }}
        programas={programas}
        programaPreseleccionado={programaParaInforme}
      />
    </div>
  )
}
