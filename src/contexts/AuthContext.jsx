import { createContext, useContext, useState } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Lấy dữ liệu lưu trữ từ localStorage trước khi render để giữ trạng thái F5
  const [user, setUser] = useState(api.getUser())
  const [token, setToken] = useState(api.getToken())
  const [loading, setLoading] = useState(false)

  // 1. Hàm Đăng Nhập
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

  // 2. Hàm Đăng Ký
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

  // 3. Hàm Đăng Xuất
  const logout = () => {
    api.removeToken()
    setToken(null)
    setUser(null)
  }

  // 4. Đăng nhập Google
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

  // 5. Kiểm tra email tồn tại
  const checkEmail = async (email) => {
    try {
      const data = await api.post('/auth/check-email', { email })
      return data.exists
    } catch (err) {
      return false
    }
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      logout, 
      loginWithGoogle, 
      checkEmail, 
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook Custom giúp gọi dữ liệu nhanh ở mọi Component: const { user, logout } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
