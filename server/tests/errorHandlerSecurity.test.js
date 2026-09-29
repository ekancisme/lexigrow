import { describe, expect, it, vi } from 'vitest'
import errorHandler from '../src/middleware/error.middleware.js'
import ErrorResponse from '../src/utils/ErrorResponse.js'

describe('Error Handler Security & Information Leakage Prevention', () => {
  const createMockRes = () => {
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        this.body = payload
        return this
      },
    }
    return res
  }

  it('masks standard unhandled Error with sensitive DB message to "Server Error"', () => {
    const res = createMockRes()
    const error = new Error('Connection failed to mongodb://root:supersecret@10.0.0.1:27017/lexigrow_prod')

    errorHandler(error, {}, res, () => {})

    expect(res.statusCode).toBe(500)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('Server Error')
    expect(JSON.stringify(res.body)).not.toContain('supersecret')
    expect(JSON.stringify(res.body)).not.toContain('mongodb://')
  })

  it('masks ErrorResponse with explicit statusCode 500 and sensitive query message to "Server Error"', () => {
    const res = createMockRes()
    const error = new ErrorResponse('Internal query error on users collection with params { creditCard: "1234" }', 500)

    errorHandler(error, {}, res, () => {})

    expect(res.statusCode).toBe(500)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('Server Error')
    expect(JSON.stringify(res.body)).not.toContain('creditCard')
  })

  it('masks 502 Bad Gateway / upstream error message from leaking to client', () => {
    const res = createMockRes()
    const error = new ErrorResponse('Upstream Groq connection failed with internal bearer token header leak', 502)

    errorHandler(error, {}, res, () => {})

    expect(res.statusCode).toBe(502)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('Server Error')
    expect(JSON.stringify(res.body)).not.toContain('bearer')
  })

  it('preserves user-facing validation error messages on 400 Bad Request', () => {
    const res = createMockRes()
    const error = new ErrorResponse('Please provide a valid email address', 400)

    errorHandler(error, {}, res, () => {})

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('Please provide a valid email address')
  })

  it('normalizes CastError to 404 Resource not found and does not log it as a 5xx Server Error', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = createMockRes()
    const castError = { name: 'CastError', message: 'Cast to ObjectId failed for value "invalid-id"' }

    errorHandler(castError, {}, res, () => {})

    expect(res.statusCode).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('Resource not found')
    // CastError is 404, so console.error should NEVER be called
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('in production, logs controlled diagnostic summary for 5xx errors instead of raw error object', () => {
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = createMockRes()
    const rawDbError = new Error('Database password leak: secret123')
    rawDbError.name = 'MongoServerError'

    errorHandler(rawDbError, { method: 'POST', originalUrl: '/api/essays' }, res, () => {})

    expect(res.statusCode).toBe(500)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    const loggedMessage = consoleErrorSpy.mock.calls[0][0]
    expect(loggedMessage).toContain('[SERVER ERROR] POST /api/essays - Status: 500 - MongoServerError')
    expect(loggedMessage).not.toContain('secret123')

    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = origEnv
  })
})
