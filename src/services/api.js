const API_BASE = '/api'

/**
 * API client with JWT token handling
 */
class ApiClient {
  constructor() {
    this.baseUrl = API_BASE
  }

  getToken() {
    return localStorage.getItem('lexigrow_token')
  }

  setToken(token) {
    localStorage.setItem('lexigrow_token', token)
  }

  removeToken() {
    localStorage.removeItem('lexigrow_token')
    localStorage.removeItem('lexigrow_user')
  }

  getUser() {
    const user = localStorage.getItem('lexigrow_user')
    if (!user || user === 'undefined') return null
    try {
      return JSON.parse(user)
    } catch (e) {
      localStorage.removeItem('lexigrow_user')
      return null
    }
  }

  setUser(user) {
    if (user === undefined || user === null) {
      localStorage.removeItem('lexigrow_user')
    } else {
      localStorage.setItem('lexigrow_user', JSON.stringify(user))
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const token = this.getToken()

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body)
    }

    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      if (
        response.status === 401 &&
        !endpoint.includes('/auth/') &&
        typeof window !== 'undefined' &&
        window.location.pathname !== '/login'
      ) {
        this.removeToken()
        window.location.href = '/login'
      }
      throw new Error(data.error || 'Something went wrong')
    }

    return data
  }

  get(endpoint) {
    return this.request(endpoint)
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body })
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body })
  }

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body })
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

const api = new ApiClient()
export default api
