import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import PendingUser from '../models/PendingUser.js'
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
const sendTokenResponse = async (user, statusCode, res) => {
  const token = generateToken(user._id)

  if (user.role === 'parent') {
    await user.populate('children', 'name email avatar englishLevel')
  }

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
  const { name, email, password, role, englishLevel, institution, childEmail } = req.body

  // Check if user exists in final DB
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new ErrorResponse('Email already registered', 400)
  }

  // If registering as parent, validate child exists first
  if (role === 'parent') {
    if (!childEmail) {
      throw new ErrorResponse('Please provide your child\'s email address', 400)
    }
    const child = await User.findOne({ email: childEmail.toLowerCase(), role: 'student' })
    if (!child) {
      throw new ErrorResponse('No student found with the provided email address', 404)
    }
  }

  // Clear any existing pending registrations for this email
  await PendingUser.findOneAndDelete({ email })

  // Generate verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
  const verificationCodeExpire = Date.now() + 15 * 60 * 1000 // 15 mins

  // Create pending registration user
  const pendingUser = await PendingUser.create({
    name,
    email,
    password, // Store plain temporary password; User schema pre-save hook will hash it on activation
    role: role || 'student',
    englishLevel: role === 'student' ? englishLevel : '',
    institution: role === 'teacher' ? institution : '',
    childEmail: role === 'parent' ? childEmail.toLowerCase() : '',
    verificationCode,
    verificationCodeExpire,
  })

  console.log(`[EMAIL VERIFICATION] User: ${pendingUser.email} | Code: ${verificationCode}`)

  // Send email
  try {
    const message = `Chào mừng bạn đến với LexiGrow! Mã xác thực tài khoản của bạn là: ${verificationCode}. Mã này có hiệu lực trong vòng 15 phút.`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e1e4e6; border-radius: 8px;">
        <h2 style="color: #005bbf; text-align: center;">Xác thực tài khoản LexiGrow</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại LexiGrow. Dưới đây là mã xác thực tài khoản của bạn:</p>
        <div style="background-color: #f5f7f8; border: 1px dashed #005bbf; padding: 15px; border-radius: 6px; font-size: 24px; font-weight: bold; text-align: center; color: #005bbf; letter-spacing: 4px; margin: 20px 0;">
          ${verificationCode}
        </div>
        <p style="color: #666; font-size: 13px;">Mã xác thực này sẽ hết hạn trong vòng 15 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #999; font-size: 12px;">LexiGrow © 2026 - Measured Writing Growth</p>
      </div>
    `
    await sendEmail({
      email: pendingUser.email,
      subject: 'Xác thực tài khoản LexiGrow',
      message,
      html,
    })

    res.status(201).json({
      success: true,
      message: 'Mã xác thực đã được gửi tới email của bạn.',
      email: pendingUser.email,
    })
  } catch (err) {
    console.error('Lỗi gửi email xác thực:', err.message)
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Lỗi gửi email, sử dụng mã xác thực kiểm thử.',
      email: pendingUser.email,
      devCode: verificationCode, // Fallback for local testing
    })
  }
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

  // Check if verified
  if (user.isVerified === false) {
    throw new ErrorResponse('Email chưa được xác thực. Vui lòng xác thực trước.', 401)
  }

  // Check account status
  if (user.accountStatus === 'pending_approval') {
    throw new ErrorResponse('Tài khoản đang chờ Admin phê duyệt. Vui lòng chờ thông báo qua email.', 403)
  }
  if (user.accountStatus === 'suspended') {
    throw new ErrorResponse('Tài khoản đã bị khoá. Vui lòng liên hệ Admin để được hỗ trợ.', 403)
  }
  if (user.accountStatus === 'rejected') {
    throw new ErrorResponse('Đơn đăng ký của bạn đã bị từ chối. Vui lòng liên hệ Admin để biết thêm thông tin.', 403)
  }

  await sendTokenResponse(user, 200, res)
})

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (user && user.role === 'parent') {
    await user.populate('children', 'name email avatar englishLevel')
  }

  res.status(200).json({
    success: true,
    user,
  })
})

/**
 * @desc    Google OAuth login/register (real Google OAuth code exchange)
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { code, role, childEmail } = req.body

  if (!code) {
    throw new ErrorResponse('Google authorization code is required', 400)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new ErrorResponse('Google OAuth is not configured on the server', 500)
  }

  const oAuth2Client = new OAuth2Client(clientId, clientSecret, 'postmessage')

  // Exchange authorization code for tokens
  let tokens
  try {
    const tokenResponse = await oAuth2Client.getToken(code)
    tokens = tokenResponse.tokens
  } catch (err) {
    console.error('Google token exchange error:', err.message)
    throw new ErrorResponse('Failed to exchange Google authorization code', 400)
  }

  // Verify the id_token to get user info
  let payload
  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    })
    payload = ticket.getPayload()
  } catch (err) {
    console.error('Google token verification error:', err.message)
    throw new ErrorResponse('Invalid Google token', 400)
  }

  const { sub: googleId, email, name, picture } = payload

  if (!email) {
    throw new ErrorResponse('Google account does not have an email', 400)
  }

  // Find existing user by googleId or email
  let user = await User.findOne({ $or: [{ googleId }, { email }] })

  if (user) {
    // Link Google account if not already linked
    if (!user.googleId) {
      user.googleId = googleId
      if (picture) user.avatar = picture
      await user.save()
    }
  } else {
    // Validate role
    const userRole = role && ['student', 'teacher', 'parent'].includes(role) ? role : 'student'

    // If registering as parent, validate child exists first
    let child = null
    if (userRole === 'parent') {
      if (!childEmail) {
        throw new ErrorResponse('Please provide your child\'s email address', 400)
      }
      child = await User.findOne({ email: childEmail.toLowerCase(), role: 'student' })
      if (!child) {
        throw new ErrorResponse('No student found with the provided email address', 404)
      }
    }

    // Create new user with Google profile
    const userFields = {
      name: name || email.split('@')[0],
      email,
      googleId,
      avatar: picture || '',
      role: userRole,
      englishLevel: '',
      institution: '',
      password: googleId + process.env.JWT_SECRET, // Placeholder password
      isVerified: true,
    }

    if (userRole === 'parent' && child) {
      userFields.children = [child._id]
    }

    user = await User.create(userFields)

    // Link child back to parent
    if (userRole === 'parent' && child) {
      child.parents = child.parents || []
      if (!child.parents.includes(user._id)) {
        child.parents.push(user._id)
        await child.save()
      }
    }
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

/**
 * @desc    Get auth configuration (e.g., Google Client ID)
 * @route   GET /api/auth/config
 * @access  Public
 */
export const getAuthConfig = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  })
})

/**
 * @desc    Check if email exists
 * @route   POST /api/auth/check-email
 * @access  Public
 */
export const checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    throw new ErrorResponse('Please provide an email', 400)
  }

  const user = await User.findOne({ email })

  res.status(200).json({
    success: true,
    exists: !!user,
  })
})

/**
 * @desc    Verify email with 6-digit code
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body

  if (!email || !code) {
    throw new ErrorResponse('Vui lòng cung cấp email và mã xác thực', 400)
  }

  // Check if user is already verified and in final collection
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return res.status(200).json({
      success: true,
      message: 'Email đã được xác thực trước đó.'
    })
  }

  // Find pending user
  const pending = await PendingUser.findOne({ email, verificationCode: code })
  if (!pending) {
    throw new ErrorResponse('Mã xác thực không chính xác', 400)
  }

  if (pending.verificationCodeExpire < new Date()) {
    throw new ErrorResponse('Mã xác thực đã hết hạn', 400)
  }

  // Set accountStatus based on role:
  // - student → active immediately
  // - teacher/parent → pending_approval (requires Admin review)
  const requiresApproval = ['teacher', 'parent'].includes(pending.role)
  const userFields = {
    name: pending.name,
    email: pending.email,
    password: pending.password, // Plain text; hashed by pre-save hook
    role: pending.role,
    englishLevel: pending.englishLevel,
    institution: pending.institution,
    isVerified: true,
    accountStatus: requiresApproval ? 'pending_approval' : 'active',
  }

  let child = null
  if (pending.role === 'parent') {
    child = await User.findOne({ email: pending.childEmail, role: 'student' })
    if (child) {
      userFields.children = [child._id]
    }
  }

  const user = await User.create(userFields)

  // Link child back to parent
  if (pending.role === 'parent' && child) {
    child.parents = child.parents || []
    if (!child.parents.includes(user._id)) {
      child.parents.push(user._id)
      await child.save()
    }
  }

  // Delete pending document
  await PendingUser.deleteOne({ _id: pending._id })

  if (requiresApproval) {
    // Teacher/Parent must wait for Admin approval — do NOT issue a token
    return res.status(202).json({
      success: true,
      pendingApproval: true,
      message: 'Email đã được xác thực thành công. Tài khoản của bạn đang chờ Admin phê duyệt. Bạn sẽ nhận được thông báo qua email khi được duyệt.',
    })
  }

  await sendTokenResponse(user, 200, res)
})

/**
 * @desc    Resend verification code
 * @route   POST /api/auth/resend-verify
 * @access  Public
 */
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    throw new ErrorResponse('Vui lòng cung cấp email', 400)
  }

  // Check if verified in final DB
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new ErrorResponse('Email đã được xác thực', 400)
  }

  // Find in pending users
  const pending = await PendingUser.findOne({ email })
  if (!pending) {
    throw new ErrorResponse('Không tìm thấy thông tin đăng ký tạm cho email này', 404)
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
  pending.verificationCode = verificationCode
  pending.verificationCodeExpire = Date.now() + 15 * 60 * 1000
  await pending.save()

  console.log(`[EMAIL VERIFICATION RESEND] User: ${pending.email} | Code: ${verificationCode}`)

  try {
    const message = `Mã xác thực mới của bạn là: ${verificationCode}. Mã này có hiệu lực trong vòng 15 phút.`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e1e4e6; border-radius: 8px;">
        <h2 style="color: #005bbf; text-align: center;">Xác thực tài khoản LexiGrow</h2>
        <p>Xin chào <strong>${pending.name}</strong>,</p>
        <p>Dưới đây là mã xác thực tài khoản mới của bạn:</p>
        <div style="background-color: #f5f7f8; border: 1px dashed #005bbf; padding: 15px; border-radius: 6px; font-size: 24px; font-weight: bold; text-align: center; color: #005bbf; letter-spacing: 4px; margin: 20px 0;">
          ${verificationCode}
        </div>
        <p style="color: #666; font-size: 13px;">Mã xác thực này sẽ hết hạn trong vòng 15 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #999; font-size: 12px;">LexiGrow © 2026 - Measured Writing Growth</p>
      </div>
    `
    await sendEmail({
      email: pending.email,
      subject: 'Xác thực tài khoản LexiGrow (Gửi lại)',
      message,
      html,
    })

    res.status(200).json({
      success: true,
      message: 'Mã xác thực đã được gửi lại tới email của bạn.'
    })
  } catch (err) {
    console.error('Lỗi gửi lại email xác thực:', err.message)
    res.status(200).json({
      success: true,
      message: 'Gửi lại mã thành công. Sử dụng mã xác thực kiểm thử.',
      devCode: verificationCode
    })
  }
})



