/**
 * Custom error response class for API errors
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

export default ErrorResponse
