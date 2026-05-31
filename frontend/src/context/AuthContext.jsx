import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore auth state on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('crm_token')
    const storedUser = localStorage.getItem('crm_user')
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(userData)
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        localStorage.removeItem('crm_token')
        localStorage.removeItem('crm_user')
      }
    }
    
    setLoading(false)
  }, [])

  const login = (authData) => {
    const userData = {
      id: authData.id,
      name: authData.name,
      email: authData.email,
      role: authData.role
    }
    
    setToken(authData.token)
    setUser(userData)
    
    localStorage.setItem('crm_token', authData.token)
    localStorage.setItem('crm_user', JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_user')
  }

  const isAdmin = user?.role === 'ADMIN'
  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      loading,
      isAuthenticated,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
