import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  })
}

/**
 * Send token response with user data
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id)

  // Remove password from output
  const userData = user.toObject()
  delete userData.password

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  })
}

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, englishLevel, institution } = req.body

  // Check if user exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new ErrorResponse('Email already registered', 400)
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'student',
    englishLevel: role === 'student' ? englishLevel : '',
    institution: role === 'teacher' ? institution : '',
  })

  sendTokenResponse(user, 201, res)
})

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Validate
  if (!email || !password) {
    throw new ErrorResponse('Please provide email and password', 400)
  }

  // Check user (include password for comparison)
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw new ErrorResponse('Invalid credentials', 401)
  }

  // Check password
  const isMatch = await user.matchPassword(password)
  if (!isMatch) {
    throw new ErrorResponse('Invalid credentials', 401)
  }

  sendTokenResponse(user, 200, res)
})

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  res.status(200).json({
    success: true,
    user,
  })
})

/**
 * @desc    Google OAuth login/register
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { googleId, email, name, avatar, role } = req.body

  if (!googleId || !email) {
    throw new ErrorResponse('Google authentication data required', 400)
  }

  // Find existing user by googleId or email
  let user = await User.findOne({ $or: [{ googleId }, { email }] })

  if (user) {
    // Update googleId if not set
    if (!user.googleId) {
      user.googleId = googleId
      if (avatar) user.avatar = avatar
      await user.save()
    }
  } else {
    // Create new user (no password for Google users)
    user = await User.create({
      name,
      email,
      googleId,
      avatar: avatar || '',
      role: role || 'student',
      password: googleId + process.env.JWT_SECRET, // Placeholder password
    })
  }

  sendTokenResponse(user, 200, res)
})
