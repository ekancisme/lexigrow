/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api.js'
import { connectSocket, disconnectSocket } from '../services/socket.js'

const AuthContext = createContext(null)

function getStoredParentChildId(user) {
  if (!user?._id || user.role !== 'parent') return ''
  return localStorage.getItem(`lexigrow_parent_child_${user._id}`) || ''
}

export function AuthProvider({ children }) {
  // Retrieve stored data from localStorage before render to maintain state on page reload
  const [user, setUser] = useState(api.getUser())
  const [loading, setLoading] = useState(false)
  const [selectedParentChildId, setSelectedParentChildId] = useState(() => getStoredParentChildId(api.getUser()))
  const parentChildStorageKey = user?._id && user.role === 'parent' ? `lexigrow_parent_child_${user._id}` : ''

  // Manage Socket.io connection lifecycle based on authenticated user session
  useEffect(() => {
    if (user) {
      connectSocket()
    } else {
      disconnectSocket()
    }
    return () => {
      disconnectSocket()
    }
  }, [user])

  // Verify server session / HttpOnly cookie validity on initial mount
  useEffect(() => {
    let active = true
    if (user) {
      api.get('/auth/me')
        .then((res) => {
          if (active && res?.user) {
            setUser(res.user)
            api.setUser(res.user)
          }
        })
        .catch(() => {
          if (active) {
            setUser(null)
            api.removeToken()
          }
        })
    }
    return () => {
      active = false
    }
  }, [])

  // 1. Login function
  const login = async (email, password) => {
    setLoading(true)
    try {
      const data = await api.post('/auth/login', { email, password })
      api.setUser(data.user)
      setUser(data.user)
      setSelectedParentChildId(getStoredParentChildId(data.user) || data.user.children?.[0]?._id || '')
      return data.user
    } finally {
      setLoading(false)
    }
  }

  // 2. Register function
  const register = async (formData) => {
    setLoading(true)
    try {
      const data = await api.post('/auth/register', formData)
      return data
    } finally {
      setLoading(false)
    }
  }

  // Email Verification function
  const verifyEmail = async (email, code) => {
    setLoading(true)
    try {
      const data = await api.post('/auth/verify-email', { email, code })
      if (data.pendingApproval) {
        return { pendingApproval: true, message: data.message }
      }
      api.setUser(data.user)
      setUser(data.user)
      setSelectedParentChildId(getStoredParentChildId(data.user) || data.user.children?.[0]?._id || '')
      return data.user
    } finally {
      setLoading(false)
    }
  }

  // 3. Logout function
  const logout = () => {
    api.post('/auth/logout').catch(() => {})
    api.removeToken()
    setUser(null)
    setSelectedParentChildId('')
  }

  const updateUser = useCallback((updates) => {
    setUser(currentUser => {
      if (!currentUser) return currentUser
      const updatedUser = { ...currentUser, ...updates }
      api.setUser(updatedUser)
      return updatedUser
    })
  }, [])

  const selectParentChild = useCallback((childId) => {
    setSelectedParentChildId(childId || '')
    if (parentChildStorageKey && childId) {
      localStorage.setItem(parentChildStorageKey, childId)
    }
  }, [parentChildStorageKey])

  // 4. Google Login
  const loginWithGoogle = async (googlePayload) => {
    setLoading(true)
    try {
      const payload = typeof googlePayload === 'string' ? { code: googlePayload } : googlePayload
      const data = await api.post('/auth/google', payload)
      api.setUser(data.user)
      setUser(data.user)
      setSelectedParentChildId(getStoredParentChildId(data.user) || data.user.children?.[0]?._id || '')
      return data.user
    } finally {
      setLoading(false)
    }
  }

  // 5. Check if email exists
  const checkEmail = async (email) => {
    try {
      const data = await api.post('/auth/check-email', { email })
      return data.exists
    } catch {
      return false
    }
  }

  const isAuthenticated = Boolean(user)

  return (
    <AuthContext.Provider value={{ 
      user, 
      token: null, 
      loading, 
      login, 
      register, 
      verifyEmail,
      logout, 
      loginWithGoogle, 
      checkEmail, 
      updateUser,
      selectedParentChildId,
      selectParentChild,
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to access auth context: const { user, logout } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
