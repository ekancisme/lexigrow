const API_BASE = '/api'

/**
 * API client tích hợp tự động xử lý token JWT và localStorage
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
    return user ? JSON.parse(user) : null
  }

  setUser(user) {
    localStorage.setItem('lexigrow_user', JSON.stringify(user))
  }

  // Hàm core thực thi HTTP request dùng fetch API
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const token = this.getToken()

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // Đính kèm JWT token
        ...options.headers,
      },
      ...options,
    }

    // Tự động convert body sang JSON string nếu body là object thông thường
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body)
    }

    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      // Nếu token hết hạn hoặc không hợp lệ -> logout và đá về trang login
      if (response.status === 401) {
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
