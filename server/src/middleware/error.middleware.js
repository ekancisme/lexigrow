import ErrorResponse from '../utils/ErrorResponse.js'

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log for dev
  if (process.env.NODE_ENV === 'development') {
    const statusCode = err.statusCode || error.statusCode || 500
    if (statusCode < 500) {
      console.warn(`⚠️ Client Error (${statusCode}): ${err.message}`)
    } else {
      console.error('❌ Server Error:', err)
    }
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = new ErrorResponse(message, 404)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `Duplicate value for field: ${field}`
    error = new ErrorResponse(message, 400)
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ')
    error = new ErrorResponse(message, 400)
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Invalid token', 401)
  }

  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token expired', 401)
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  })
}

export default errorHandler
