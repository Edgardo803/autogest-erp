// Página de Proyección Financiera — La joya de la corona
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Header } from '../../components/layout/Header'
import { financieroApi } from '../../api/client'
import { TrendingUp, TrendingDown, RefreshCw, Save, Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import toast from 'react-hot-toast'

const eur = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export function FinancieroPage() {
  const [horizonte, setHorizonte] = useState<30 | 60 | 90>(30)

  const { data: calc, isLoading, refetch } = useQuery({
    queryKey: ['proyeccion-calcular'],
    queryFn: () => financieroApi.calcular().then(r => r.data),
    refetchInterval: 120000,
  })

  const { mutate: guardarSnapshot, isPending: guardando } = useMutation({
    mutationFn: () => financieroApi.guardarSnapshot(horizonte),
    onSuccess: () => toast.success('Snapshot guardado correctamente'),
    onError: () => toast.error('Error al guardar el snapshot'),
  })

  const proy = calc ? calc[`${horizonte}_dias`] : null
  const pos = Number(proy?.posicion_neta || 0)
  const esPos = pos >= 0

  // Datos para gráfico comparativo 30/60/90
  const comparativoData = calc ? [
    { name: '30 días', activos: Number(calc['30_dias']?.total_activos || 0), pasivos: Number(calc['30_dias']?.total_pasivos || 0), posicion: Number(calc['30_dias']?.posicion_neta || 0) },
    { name: '60 días', activos: Number(calc['60_dias']?.total_activos || 0), pasivos: Number(calc['60_dias']?.total_pasivos || 0), posicion: Number(calc['60_dias']?.posicion_neta || 0) },
    { name: '90 días', activos: Number(calc['90_dias']?.total_activos || 0), pasivos: Number(calc['90_dias']?.total_pasivos || 0), posicion: Number(calc['90_dias']?.posicion_neta || 0) },
  ] : []

  return (
    <div>
      <Header
        title="Proyección Financiera"
        subtitle="Estado financiero en tiempo real — Fórmula: Activos - Pasivos = Posición Neta"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>
              <RefreshCw size={14} /> Recalcular
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => guardarSnapshot()} disabled={guardando}>
              <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar Snapshot'}
            </button>
          </div>
        }
      />

      <div className="page-content fade-in">
        {/* Selector de horizonte */}
        <div className="tab-group" style={{ marginBottom: '1.5rem' }}>
          {([30, 60, 90] as const).map(h => (
            <button
              key={h}
              className={`tab-btn ${horizonte === h ? 'active' : ''}`}
              onClick={() => setHorizonte(h)}
            >
              <Calculator size={13} style={{ display: 'inline', marginRight: '0.3rem' }} />
              {h} días
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="loading-overlay"><div className="spinner" /><span>Calculando proyección...</span></div>
        ) : (
          <>
            {/* Posición Neta destacada */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '2rem', background: 'var(--bg-card)', border: `1px solid ${esPos ? 'rgba(34,201,120,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 'var(--radius-xl)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Posición Neta al {proy ? new Date(proy.fecha_horizonte + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              </div>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: esPos ? 'var(--accent-success)' : 'var(--accent-danger)', lineHeight: 1 }}>
                {esPos ? '+' : ''}{eur(pos)}
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <span className={`badge ${esPos ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                  {esPos ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  {esPos ? '✓ Posición Saludable' : '⚠ Posición Negativa — Acción Requerida'}
                </span>
              </div>
            </div>

            {/* Fórmula visual */}
            {proy && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Activos</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.4rem', color: 'var(--accent-success)' }}>{eur(Number(proy.total_activos))}</div>
                </div>
                <div style={{ fontSize: '2rem', color: 'var(--text-muted)', fontWeight: 300 }}>−</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pasivos</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.4rem', color: 'var(--accent-danger)' }}>{eur(Number(proy.total_pasivos))}</div>
                </div>
                <div style={{ fontSize: '2rem', color: 'var(--text-muted)', fontWeight: 300 }}>=</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posición Neta</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.4rem', color: esPos ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{eur(pos)}</div>
                </div>
              </div>
            )}

            {/* Detalle Activos / Pasivos */}
            {proy && (
              <div className="proyeccion-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="proyeccion-section">
                  <div className="proyeccion-section-title"><TrendingUp size={14} color="var(--accent-success)" /> Activos Proyectados</div>
                  {[
                    ['Saldo de Caja Actual', proy.saldo_caja_actual],
                    ['Pagarés en Cartera', proy.pagares_en_cartera],
                    ['Saldo Total en Bancos', proy.saldo_bancos],
                    ['Cobros Previstos (Cuotas Clientes)', proy.cobros_previstos],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="proyeccion-item">
                      <span className="proyeccion-label">{label}</span>
                      <span className="proyeccion-value positive">{eur(Number(val))}</span>
                    </div>
                  ))}
                </div>
                <div className="proyeccion-section">
                  <div className="proyeccion-section-title"><TrendingDown size={14} color="var(--accent-danger)" /> Pasivos Proyectados</div>
                  {[
                    ['Cuotas Unidades a Pagar', proy.pagos_proveedores_unidades],
                    ['Pagos Proveedores (Insumos)', proy.pagos_proveedores_insumos],
                    ['Sueldos Previstos', proy.sueldos_previstos],
                    ['Servicios (Luz, Gas, etc.)', proy.servicios_previstos],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="proyeccion-item">
                      <span className="proyeccion-label">{label}</span>
                      <span className="proyeccion-value negative">{eur(Number(val))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gráfico comparativo 30/60/90 días */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Comparativo: Activos vs Pasivos (30 / 60 / 90 días)</div>
                {/* Leyenda de colores */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {[
                    { color: '#4f8ef7', label: 'Total Activos' },
                    { color: '#ef4444', label: 'Total Pasivos' },
                    { color: '#22c978', label: 'Posición Neta' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={comparativoData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: any) => eur(Number(v))}
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-primary)' }}
                    labelStyle={{ color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                  <Bar dataKey="activos" name="Total Activos" fill="#4f8ef7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pasivos" name="Total Pasivos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="posicion" name="Posición Neta" fill="#22c978" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
