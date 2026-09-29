import ErrorResponse from '../utils/ErrorResponse.js'

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  void next
  let error = { ...err }
  error.message = err.message

  // Mongoose bad ObjectId -> 404 Client Error
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = new ErrorResponse(message, 404)
  }

  // Mongoose duplicate key -> 400 Client Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'resource'
    const message = `Duplicate value for field: ${field}`
    error = new ErrorResponse(message, 400)
  }

  // Mongoose validation error -> 400 Client Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ')
    error = new ErrorResponse(message, 400)
  }

  // JWT errors -> 401 Client Error
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Invalid token', 401)
  }

  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token expired', 401)
  }

  // Version error -> 409 Client Conflict
  if (err.name === 'VersionError') {
    error = new ErrorResponse('Resource changed; reload and retry', 409)
  }

  const statusCode = error.statusCode || err.statusCode || 500

  // Controlled error logging based on normalized status code
  if (statusCode >= 500) {
    if (process.env.NODE_ENV === 'production') {
      // In production, log controlled diagnostic info without leaking raw err object or stack trace
      console.error(`[SERVER ERROR] ${req?.method || ''} ${req?.originalUrl || ''} - Status: ${statusCode} - ${err?.name || 'Error'}`)
    } else {
      console.error('❌ Server Error:', err.message || err)
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.warn(`⚠️ Client Error (${statusCode}): ${error.message}`)
  }

  // Standardize all 5xx responses: never leak internal error message, database errors, or stack traces
  if (statusCode >= 500) {
    return res.status(statusCode).json({
      success: false,
      error: 'Server Error',
    })
  }

  res.status(statusCode).json({
    success: false,
    error: error.message || 'Client Error',
  })
}

export default errorHandler
