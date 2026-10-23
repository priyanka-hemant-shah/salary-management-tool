import React, { createContext, useContext, useState, useEffect } from 'react'

export interface User {
  name: string
  role: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (asRole?: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const DEFAULT_DEMO_USER: User = {
  name: 'Jane Doe',
  role: 'HR Manager',
  email: 'jane.doe@acme-corp.example.com',
}

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_DEMO_USER,
  login: () => {},
  logout: () => {},
  isAuthenticated: true,
})

const AUTH_STORAGE_KEY = 'acme_salary_demo_user'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return DEFAULT_DEMO_USER
      }
    }
    // Default to logged-in demo user for seamless UX, or can be set to null if preferred
    return DEFAULT_DEMO_USER
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [user])

  const login = (role = 'HR Manager') => {
    const demoUser = {
      ...DEFAULT_DEMO_USER,
      role,
    }
    setUser(demoUser)
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

