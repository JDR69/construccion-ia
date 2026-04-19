import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'dpap.auth'

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      setIsAuthenticated(raw === '1')
    } catch {
      setIsAuthenticated(false)
    }
  }, [])

  const value = useMemo(() => {
    return {
      isAuthenticated,
      login() {
        setIsAuthenticated(true)
        try {
          localStorage.setItem(STORAGE_KEY, '1')
        } catch {
          // ignore
        }
      },
      logout() {
        setIsAuthenticated(false)
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore
        }
      },
    }
  }, [isAuthenticated])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
