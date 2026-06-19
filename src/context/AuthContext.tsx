import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import api from '@/lib/api'
import type { PublicUser, UserRole } from '@/lib/types'

interface RegisterPayload {
  name: string
  password: string
  role: UserRole
  phone?: string
  email?: string
}

interface AuthContextValue {
  user: PublicUser | null
  loading: boolean
  login: (account: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get<{ data: PublicUser }>('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const persist = (token: string, u: PublicUser) => {
    localStorage.setItem('token', token)
    setUser(u)
  }

  const login = useCallback(async (account: string, password: string) => {
    const res = await api.post<{ data: { token: string; user: PublicUser } }>(
      '/auth/login',
      { account, password },
    )
    persist(res.data.data.token, res.data.data.user)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await api.post<{ data: { token: string; user: PublicUser } }>(
      '/auth/register',
      payload,
    )
    persist(res.data.data.token, res.data.data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
