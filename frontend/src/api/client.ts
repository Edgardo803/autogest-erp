// API client con interceptores JWT automáticos
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor: añade el token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor: refresca el token si expira (401)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post('/api/auth/refresh/', { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Endpoints tipados ─────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/accounts/login/', { username, password }),
  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),
  me: () => api.get('/accounts/me/'),
}

export const inventarioApi = {
  unidades: () => api.get('/inventario/unidades/'),
  unidadesDisponibles: () => api.get('/inventario/unidades/disponibles/'),
  repuestos: () => api.get('/inventario/repuestos/'),
  marcas: () => api.get('/inventario/marcas/'),
  createUnidad: (data: unknown) => api.post('/inventario/unidades/', data),
}

export const ventasApi = {
  clientes: () => api.get('/ventas/clientes/'),
  ventasUnidades: () => api.get('/ventas/ventas-unidades/'),
  serviciosTaller: () => api.get('/ventas/servicios-taller/'),
  serviciosEnCurso: () => api.get('/ventas/servicios-taller/en-curso/'),
  pagosPendientes: () => api.get('/ventas/pagos-venta/proximos-vencimientos/'),
  ventasPendientesCobro: () => api.get('/ventas/ventas-unidades/pendientes-cobro/'),
  historialCliente: (id: number) => api.get(`/ventas/clientes/${id}/historial/`),
  createCliente: (data: unknown) => api.post('/ventas/clientes/', data),
  updateCliente: (id: number, data: unknown) => api.patch(`/ventas/clientes/${id}/`, data),
  createVenta: (data: unknown) => api.post('/ventas/ventas-unidades/', data),
  createServicio: (data: unknown) => api.post('/ventas/servicios-taller/', data),
}

export const comprasApi = {
  proveedores: () => api.get('/compras/proveedores/'),
  grandesProveedores: () => api.get('/compras/proveedores/grandes-proveedores/'),
  comprasUnidades: () => api.get('/compras/compras-unidades/'),
  saldosPendientes: () => api.get('/compras/compras-unidades/saldos-pendientes/'),
  ordenesInsumos: () => api.get('/compras/ordenes-insumos/'),
  pagosPorVencer: () => api.get('/compras/pagos-compra/proximos-vencimientos/'),
}

export const tallerApi = {
  servicios: () => api.get('/ventas/servicios-taller/'),
}

export const cajaApi = {
  movimientos: () => api.get('/caja/movimientos/'),
  resumenHoy: () => api.get('/caja/movimientos/resumen-hoy/'),
  pendientesCierre: () => api.get('/caja/movimientos/pendientes-cierre/'),
  pagares: () => api.get('/caja/pagares/'),
  pagaresEnCartera: () => api.get('/caja/pagares/en-cartera/'),
  cuentasBancarias: () => api.get('/caja/cuentas-bancarias/'),
  saldoTotalBancos: () => api.get('/caja/cuentas-bancarias/saldo-total/'),
  createMovimiento: (data: unknown) => api.post('/caja/movimientos/', data),
  cerrarDia: (data: unknown) => api.post('/caja/cierres-dia/', data),
}

export const financieroApi = {
  dashboard: () => api.get('/financiero/proyecciones/dashboard/'),
  calcular: () => api.get('/financiero/proyecciones/calcular/'),
  guardarSnapshot: (horizonte: number) =>
    api.post('/financiero/proyecciones/guardar-snapshot/', { horizonte_dias: horizonte }),
  obligaciones: () => api.get('/financiero/obligaciones/'),
}

export const auditoriaApi = {
  eventos: () => api.get('/auditoria/eventos/'),
  eventosCriticos: () => api.get('/auditoria/eventos/criticos/'),
  programas: () => api.get('/auditoria/programas/'),
  programasPendientes: () => api.get('/auditoria/programas/pendientes/'),
  createPrograma: (data: unknown) => api.post('/auditoria/programas/', data),
  updatePrograma: (id: number, data: unknown) => api.patch(`/auditoria/programas/${id}/`, data),
  informes: () => api.get('/auditoria/informes/'),
  createInforme: (data: unknown) => api.post('/auditoria/informes/', data),
}

export const rrhhApi = {
  empleados: () => api.get('/rrhh/empleados/'),
  liquidaciones: () => api.get('/rrhh/liquidaciones/'),
  marcarPagado: (id: number) => api.patch(`/rrhh/liquidaciones/${id}/`, { pagado: true, fecha_pago: new Date().toISOString().split('T')[0] }),
  createEmpleado: (data: unknown) => api.post('/rrhh/empleados/', data),
  updateEmpleado: (id: number, data: unknown) => api.patch(`/rrhh/empleados/${id}/`, data),
}
