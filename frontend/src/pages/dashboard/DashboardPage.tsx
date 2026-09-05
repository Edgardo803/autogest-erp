// Dashboard principal — KPIs en tiempo real + Proyección Financiera + Gráficos
import { useQuery } from '@tanstack/react-query'
import { Header } from '../../components/layout/Header'
import { financieroApi, cajaApi, ventasApi, comprasApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import {
  TrendingUp, TrendingDown, Wallet, Car, ShoppingCart,
  AlertTriangle, RefreshCw, CheckCircle2
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

// Formateador de moneda
const eur = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

function KpiCard({ label, value, sub, color, icon: Icon, badge }: any) {
  return (
    <div className={`kpi-card ${color}`}>
      <div className={`kpi-icon ${color}`}><Icon size={22} /></div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      {badge && (
        <div className={`kpi-badge ${badge.type}`}>
          {badge.type === 'positive' ? <TrendingUp size={10} /> : badge.type === 'negative' ? <TrendingDown size={10} /> : null}
          {badge.label}
        </div>
      )}
    </div>
  )
}

// Tooltip personalizado para los gráficos
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {eur(p.value)}
        </div>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()

  const { data: financiero, isLoading: loadFin, refetch: refetchFin } = useQuery({
    queryKey: ['dashboard-financiero'],
    queryFn: () => financieroApi.dashboard().then(r => r.data),
    refetchInterval: 60000, // Actualiza cada minuto
    enabled: user?.puede_ver_financiero,
  })

  const { data: resumenCaja } = useQuery({
    queryKey: ['resumen-caja'],
    queryFn: () => cajaApi.resumenHoy().then(r => r.data),
    refetchInterval: 30000,
    enabled: user?.puede_ver_financiero || user?.rol === 'CAJA',
  })

  const { data: pagaresCartera } = useQuery({
    queryKey: ['pagares-cartera'],
    queryFn: () => cajaApi.pagaresEnCartera().then(r => r.data),
    enabled: user?.puede_ver_financiero,
  })

  const { data: vencimientosCobros } = useQuery({
    queryKey: ['vencimientos-cobros'],
    queryFn: () => ventasApi.pagosPendientes().then(r => r.data),
    enabled: user?.puede_ver_financiero || user?.rol === 'VENTAS',
  })

  const { data: vencimientosPagos } = useQuery({
    queryKey: ['vencimientos-pagos'],
    queryFn: () => comprasApi.pagosPorVencer().then(r => r.data),
    enabled: user?.puede_ver_financiero || user?.rol === 'COMPRAS',
  })

  const proy = financiero?.proyeccion_actual
  const resumen = financiero?.resumen

  // Datos para gráfico de barras (activos vs pasivos)
  const chartData = proy ? [
    { name: 'Caja', activo: Number(proy.saldo_caja_actual), pasivo: 0 },
    { name: 'Bancos', activo: Number(proy.saldo_bancos), pasivo: 0 },
    { name: 'Pagarés', activo: Number(proy.pagares_en_cartera), pasivo: 0 },
    { name: 'Cobros prev.', activo: Number(proy.cobros_previstos), pasivo: 0 },
    { name: 'Proveed. Uni.', activo: 0, pasivo: Number(proy.pagos_proveedores_unidades) },
    { name: 'Sueldos', activo: 0, pasivo: Number(proy.sueldos_previstos) },
    { name: 'Servicios', activo: 0, pasivo: Number(proy.servicios_previstos) },
  ] : []

  // Datos para gráfico pie
  const pieData = proy ? [
    { name: 'Caja', value: Number(proy.saldo_caja_actual), color: '#4f8ef7' },
    { name: 'Bancos', value: Number(proy.saldo_bancos), color: '#7c5cf6' },
    { name: 'Pagarés', value: Number(proy.pagares_en_cartera), color: '#22c978' },
    { name: 'Cobros previstos', value: Number(proy.cobros_previstos), color: '#06b6d4' },
  ].filter(d => d.value > 0) : []

  const posicionNeta = Number(resumen?.posicion_neta || 0)
  const esPositiva = posicionNeta >= 0

  return (
    <div>
      <Header
        title={`Buenas ${new Date().getHours() < 12 ? 'mañanas' : new Date().getHours() < 20 ? 'tardes' : 'noches'}, ${user?.nombre_completo?.split(' ')[0]}`}
        subtitle={`${user?.rol_display} — AutoGest ERP`}
        actions={
          <button className="btn btn-secondary btn-sm" onClick={() => refetchFin()}>
            <RefreshCw size={14} /> Actualizar
          </button>
        }
      />

      <div className="page-content fade-in">

        {/* Alerta financiera si la proyección es negativa */}
        {proy?.alerta_activa && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle size={20} />
            <div>
              <strong>⚠ Alerta Financiera:</strong> La proyección a 30 días es negativa ({eur(posicionNeta)}).
              Se recomienda revisión inmediata de la posición financiera.
            </div>
          </div>
        )}

        {/* KPIs principales */}
        <div className="kpi-grid">
          {user?.puede_ver_financiero && (
            <>
              <KpiCard
                label="Posición Neta (30 días)"
                value={loadFin ? '...' : eur(posicionNeta)}
                sub="Activos - Pasivos proyectados"
                color={esPositiva ? 'green' : 'red'}
                icon={esPositiva ? TrendingUp : TrendingDown}
                badge={{ type: esPositiva ? 'positive' : 'negative', label: esPositiva ? 'Saludable' : '¡Atención!' }}
              />
              <KpiCard
                label="Saldo en Caja"
                value={loadFin ? '...' : eur(Number(proy?.saldo_caja_actual || 0))}
                sub="Efectivo disponible hoy"
                color="blue"
                icon={Wallet}
              />
              <KpiCard
                label="Saldo en Bancos"
                value={loadFin ? '...' : eur(Number(proy?.saldo_bancos || 0))}
                sub="Total de todas las cuentas"
                color="purple"
                icon={TrendingUp}
              />
              <KpiCard
                label="Pagarés en Cartera"
                value={loadFin ? '...' : eur(Number(pagaresCartera?.total_en_cartera || 0))}
                sub={`${pagaresCartera?.cantidad || 0} documentos vigentes`}
                color="green"
                icon={CheckCircle2}
              />
            </>
          )}

          {(user?.rol === 'VENTAS' || user?.puede_ver_todo) && (
            <KpiCard
              label="Cobros Pendientes"
              value={vencimientosCobros ? `${vencimientosCobros.length}` : '...'}
              sub="Cuotas por vencer en 30 días"
              color="orange"
              icon={Car}
            />
          )}

          {(user?.rol === 'COMPRAS' || user?.puede_ver_todo) && (
            <KpiCard
              label="Pagos a Proveedores"
              value={vencimientosPagos ? `${vencimientosPagos.length}` : '...'}
              sub="Cuotas por pagar en 30 días"
              color="orange"
              icon={ShoppingCart}
            />
          )}
        </div>

        {/* Gráficos — solo para Gerencia/Tesorería */}
        {user?.puede_ver_financiero && proy && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

            {/* Gráfico de área: activos vs pasivos */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Composición Financiera a 30 Días</div>
                {/* Leyenda de colores */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {[
                    { color: '#4f8ef7', label: 'Activos' },
                    { color: '#ef4444', label: 'Pasivos' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div style={{ width: 28, height: 3, borderRadius: 2, background: item.color }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="gradActivo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPasivo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="activo" name="Activo (€)" stroke="#4f8ef7" fill="url(#gradActivo)" strokeWidth={2} />
                  <Area type="monotone" dataKey="pasivo" name="Pasivo (€)" stroke="#ef4444" fill="url(#gradPasivo)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico pie: composición de activos */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Composición de Activos</div>
              </div>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ''}
                        labelLine={false}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any) => eur(Number(v))}
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Leyenda personalizada debajo del gráfico */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0 0.5rem 0.5rem' }}>
                    {pieData.map(item => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                        </div>
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, color: item.color }}>
                          {eur(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div className="empty-state-icon">📊</div>
                  <div className="empty-state-title">Sin datos aún</div>
                  <div className="empty-state-desc">Cargá movimientos de caja para ver el gráfico</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Proyección Financiera detallada */}
        {user?.puede_ver_financiero && proy && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title">📊 Proyección Financiera — Horizonte 30 Días</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Al {new Date(proy.fecha_horizonte + 'T12:00:00').toLocaleDateString('es-ES')}
              </span>
            </div>

            <div className="proyeccion-grid">
              {/* Activos */}
              <div className="proyeccion-section">
                <div className="proyeccion-section-title">
                  <TrendingUp size={14} color="var(--accent-success)" /> Activos Proyectados
                </div>
                {[
                  { label: 'Saldo de Caja Actual', value: proy.saldo_caja_actual },
                  { label: 'Pagarés en Cartera', value: proy.pagares_en_cartera },
                  { label: 'Saldo Total en Bancos', value: proy.saldo_bancos },
                  { label: 'Cobros Previstos (Cuotas)', value: proy.cobros_previstos },
                ].map(item => (
                  <div key={item.label} className="proyeccion-item">
                    <span className="proyeccion-label">{item.label}</span>
                    <span className="proyeccion-value positive">{eur(Number(item.value))}</span>
                  </div>
                ))}
                <div className="proyeccion-item" style={{ marginTop: '0.5rem', borderTop: '2px solid var(--border-medium)', paddingTop: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>TOTAL ACTIVOS</span>
                  <span className="proyeccion-value positive" style={{ fontSize: '1rem' }}>{eur(Number(proy.total_activos))}</span>
                </div>
              </div>

              {/* Pasivos */}
              <div className="proyeccion-section">
                <div className="proyeccion-section-title">
                  <TrendingDown size={14} color="var(--accent-danger)" /> Pasivos Proyectados
                </div>
                {[
                  { label: 'Cuotas Unidades a Pagar', value: proy.pagos_proveedores_unidades },
                  { label: 'Pagos a Proveedores (Insumos)', value: proy.pagos_proveedores_insumos },
                  { label: 'Sueldos Previstos', value: proy.sueldos_previstos },
                  { label: 'Servicios (Luz, Gas, etc.)', value: proy.servicios_previstos },
                ].map(item => (
                  <div key={item.label} className="proyeccion-item">
                    <span className="proyeccion-label">{item.label}</span>
                    <span className="proyeccion-value negative">{eur(Number(item.value))}</span>
                  </div>
                ))}
                <div className="proyeccion-item" style={{ marginTop: '0.5rem', borderTop: '2px solid var(--border-medium)', paddingTop: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>TOTAL PASIVOS</span>
                  <span className="proyeccion-value negative" style={{ fontSize: '1rem' }}>{eur(Number(proy.total_pasivos))}</span>
                </div>
              </div>
            </div>

            {/* Posición Neta */}
            <div className="proyeccion-total">
              <div className="posicion-neta-label">POSICIÓN NETA AL {new Date(proy.fecha_horizonte + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</div>
              <div className={`posicion-neta-value ${esPositiva ? 'positiva' : 'negativa'}`}>
                {esPositiva ? '+' : ''}{eur(posicionNeta)}
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <span className={`badge ${esPositiva ? 'badge-success' : 'badge-danger'}`}>
                  {esPositiva ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {esPositiva ? 'Posición Financiera Saludable' : '¡Posición Financiera Negativa! Acción requerida'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Resumen del día actual (Caja) */}
        {resumenCaja && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">💰 Caja — Resumen de Hoy</div>
              {resumenCaja.sin_cerrar > 0 && (
                <span className="badge badge-warning">
                  <AlertTriangle size={11} />
                  {resumenCaja.sin_cerrar} sin cerrar
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {[
                { label: 'Ingresos del Día', value: eur(resumenCaja.total_ingresos), color: 'var(--accent-success)' },
                { label: 'Egresos del Día', value: eur(resumenCaja.total_egresos), color: 'var(--accent-danger)' },
                { label: 'Saldo del Día', value: eur(resumenCaja.saldo_dia), color: resumenCaja.saldo_dia >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' },
                { label: 'Movimientos', value: resumenCaja.cantidad_movimientos, color: 'var(--text-primary)' },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'Space Grotesk', color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
