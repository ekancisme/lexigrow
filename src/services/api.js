const API_BASE = '/api'

/**
 * Normalized API error. Every failed request (HTTP error, malformed JSON,
 * network failure) throws an ApiError so callers can rely on a single shape:
 *   { status, code, message, data }
 * Network failures use status 0 and code NETWORK_ERROR.
 */
export class ApiError extends Error {
  constructor({ status = 0, code, message, data } = {}) {
    super(message || 'Something went wrong')
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.data = data
  }
}

const STATUS_FALLBACK = {
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Resource not found',
  408: 'Request timed out',
  429: 'Too many requests, please try again later',
  500: 'Server error, please try again later',
  502: 'Server is temporarily unavailable',
  503: 'Server is temporarily unavailable',
  504: 'Server did not respond in time',
}

/**
 * API client with JWT token handling
 */
class ApiClient {
  constructor() {
    this.baseUrl = API_BASE
  }

  getToken() {
    return null
  }

  setToken() {
    // Auth token is managed exclusively via HttpOnly cookie for XSS protection
    localStorage.removeItem('lexigrow_token')
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
    } catch {
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

    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }
    const body = config.body
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      config.body = JSON.stringify(body)
    } else if (body instanceof FormData) {
      // Let the browser set the multipart boundary itself.
      delete config.headers['Content-Type']
    } else if (typeof body === 'string' && config.headers['Content-Type']?.includes('application/json')) {
      try {
        JSON.parse(body)
      } catch {
        config.body = JSON.stringify(body)
      }
    }

    const timeoutMs = Number(config.timeoutMs)
    delete config.timeoutMs
    const callerSignal = config.signal
    const controller = new AbortController()
    config.signal = controller.signal
    let timedOut = false
    const onAbort = () => controller.abort(callerSignal.reason)
    if (callerSignal?.aborted) onAbort()
    else callerSignal?.addEventListener('abort', onAbort, { once: true })
    const timeoutId = Number.isFinite(timeoutMs) && timeoutMs > 0
      ? setTimeout(() => {
        if (!controller.signal.aborted) {
          timedOut = true
          controller.abort()
        }
      }, timeoutMs)
      : undefined

    try {
      const response = await fetch(url, config)
      const contentType = response.headers.get('content-type') || ''
      let data = null

      if (response.status !== 204) {
        if (contentType.includes('application/json')) {
          const raw = await response.text()
          if (raw) {
            try {
              data = JSON.parse(raw)
            } catch {
              throw new ApiError({
                status: response.status,
                code: 'INVALID_JSON',
                message: 'Received a malformed response from the server',
              })
            }
          }
        } else {
          data = await response.text()
        }
      }

      if (!response.ok) {
        let message
        let code
        let payload

        if (data && typeof data === 'object') {
          message = data.error || data.message
          code = data.code
          payload = data
        } else if (typeof data === 'string' && data.trim()) {
          // Plain-text or HTML error bodies (e.g. proxy error pages).
          // Never dump a whole HTML page to the user — cap plain text and
          // fall back to a per-status message for markup.
          const trimmed = data.trim()
          if (trimmed.startsWith('<')) {
            message = STATUS_FALLBACK[response.status] || 'Server error'
            code = 'HTML_ERROR'
          } else {
            message = trimmed.length > 200 ? trimmed.slice(0, 200) + '…' : trimmed
          }
        }

        if (!message) message = STATUS_FALLBACK[response.status] || `Request failed with status ${response.status}`

        if (
          response.status === 401 &&
          !endpoint.includes('/auth/') &&
          typeof window !== 'undefined' &&
          window.location.pathname !== '/login'
        ) {
          this.removeToken()
          window.location.href = '/login'
        }

        throw new ApiError({ status: response.status, code, message, data: payload })
      }

      return data
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw new ApiError({
        status: timedOut ? 408 : 0,
        code: timedOut ? 'TIMEOUT' : (controller.signal.aborted ? 'ABORTED' : 'NETWORK_ERROR'),
        message: timedOut ? 'Request timed out' : (controller.signal.aborted ? 'Request was cancelled' : 'Unable to reach the server'),
      })
    } finally {
      clearTimeout(timeoutId)
      callerSignal?.removeEventListener('abort', onAbort)
    }
  }

  get(endpoint, options) {
    return this.request(endpoint, options)
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body })
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
