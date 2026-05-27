import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import sendEmail from '../utils/sendEmail.js'

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

/**
 * @desc    Forgot password - send 6-digit OTP email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    throw new ErrorResponse('Please provide an email address', 400)
  }

  const user = await User.findOne({ email })
  if (!user) {
    throw new ErrorResponse('There is no user registered with this email', 404)
  }

  // Generate 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  user.resetPasswordCode = code
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  await user.save()

  const message = `Hello,\n\nYou requested a password reset. Please use the following 6-digit verification code to reset your password:\n\n${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nLexiGrow Team`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #1a73e8; text-align: center;">LexiGrow Password Reset</h2>
      <p>Hello,</p>
      <p>You requested a password reset. Please use the following 6-digit verification code to reset your password:</p>
      <div style="background-color: #f8f9fa; border: 1px dashed #1a73e8; border-radius: 4px; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1a73e8; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} LexiGrow. All rights reserved.</p>
    </div>
  `

  try {
    await sendEmail({
      email: user.email,
      subject: 'LexiGrow - Password Reset Verification Code',
      message,
      html,
    })

    res.status(200).json({
      success: true,
      message: 'Verification code sent to email',
    })
  } catch (err) {
    user.resetPasswordCode = ''
    user.resetPasswordExpire = undefined
    await user.save()
    console.error('Email send error:', err)
    throw new ErrorResponse('Email could not be sent', 500)
  }
})

/**
 * @desc    Reset password using verification code
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body

  if (!email || !code || !newPassword) {
    throw new ErrorResponse('Please provide email, verification code, and new password', 400)
  }

  const user = await User.findOne({
    email,
    resetPasswordCode: code,
    resetPasswordExpire: { $gt: Date.now() },
  })

  if (!user) {
    throw new ErrorResponse('Invalid or expired verification code', 400)
  }

  // Set new password (will be hashed automatically on save)
  user.password = newPassword
  user.resetPasswordCode = ''
  user.resetPasswordExpire = undefined
  await user.save()

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now login with your new password.',
  })
})

