import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * Protect routes — verify JWT token
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    throw new ErrorResponse('Not authorized to access this route', 401)
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  req.user = await User.findById(decoded.id)

  if (!req.user) {
    throw new ErrorResponse('User not found', 401)
  }

  next()
})

/**
 * Authorize by role
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ErrorResponse(`Role '${req.user.role}' is not authorized to access this route`, 403)
    }
    next()
  }
}
