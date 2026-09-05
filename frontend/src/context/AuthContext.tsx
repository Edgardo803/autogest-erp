// Contexto de autenticación global
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/client'

interface Usuario {
  id: number
  username: string
  nombre_completo: string
  rol: string
  rol_display: string
  email: string
  es_gerencia: boolean
  es_auditor: boolean
  puede_ver_financiero: boolean
  puede_ver_todo: boolean
}

interface AuthContextType {
  user: Usuario | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restaurar sesión desde localStorage
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('access_token')
    if (stored && token) {
      setUser(JSON.parse(stored))
      // Verificar que el token sigue siendo válido
      authApi.me().then(({ data }) => {
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
      }).catch(() => {
        logout()
      }).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const { data } = await authApi.login(username, password)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.usuario))
    setUser(data.usuario)
  }

  const logout = () => {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) authApi.logout(refresh).catch(() => {})
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
