/**
 * Async handler to wrap async route handlers and pass errors to Express error middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

export default asyncHandler
