import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(api.getUser())
  const [token, setToken] = useState(api.getToken())
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const data = await api.post('/auth/login', { email, password })
      api.setToken(data.token)
      api.setUser(data.user)
      setToken(data.token)
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  const register = async (formData) => {
    setLoading(true)
    try {
      const data = await api.post('/auth/register', formData)
      api.setToken(data.token)
      api.setUser(data.user)
      setToken(data.token)
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    api.removeToken()
    setToken(null)
    setUser(null)
  }

  const loginWithGoogle = async (googlePayload) => {
    setLoading(true)
    try {
      const data = await api.post('/auth/google', googlePayload)
      api.setToken(data.token)
      api.setUser(data.user)
      setToken(data.token)
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, loginWithGoogle, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
