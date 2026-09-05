import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppLayout } from './components/layout/Header'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { VentasPage } from './pages/ventas/VentasPage'
import { FinancieroPage } from './pages/financiero/FinancieroPage'
import { CajaPage } from './pages/caja/CajaPage'
import { InventarioPage } from './pages/inventario/InventarioPage'
import { RrhhPage } from './pages/rrhh/RrhhPage'
import { AuditoriaPage } from './pages/auditoria/AuditoriaPage'
import { ComprasPage } from './pages/compras/ComprasPage'
import { TallerPage } from './pages/taller/TallerPage'
import { InformesPage } from './pages/informes/InformesPage'
import { ProveedoresPage } from './pages/proveedores/ProveedoresPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 }
  }
})

// Ruta protegida — redirige a login si no está autenticado
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cargando AutoGest ERP...</div>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard"   element={<DashboardPage />} />
        <Route path="/ventas"      element={<VentasPage />} />
        <Route path="/compras"     element={<ComprasPage />} />
        <Route path="/inventario"  element={<InventarioPage />} />
        <Route path="/taller"      element={<TallerPage />} />
        <Route path="/caja"        element={<CajaPage />} />
        <Route path="/financiero"  element={<FinancieroPage />} />
        <Route path="/rrhh"        element={<RrhhPage />} />
        <Route path="/proveedores" element={<ProveedoresPage />} />
        <Route path="/informes"    element={<InformesPage />} />
        <Route path="/auditoria"   element={<AuditoriaPage />} />
      </Route>

      {/* Redirect raíz */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '10px',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#22c978', secondary: '#0a0d14' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0d14' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
