import User from '../models/User.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * @desc    Get current user profile
 * @route   GET /api/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.status(200).json({ success: true, data: user })
})

/**
 * @desc    Update profile info
 * @route   PUT /api/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, institution, englishLevel } = req.body
  const user = await User.findById(req.user._id)

  if (name) user.name = name
  if (email) user.email = email
  if (institution !== undefined) user.institution = institution
  if (englishLevel) user.englishLevel = englishLevel

  await user.save()
  res.status(200).json({ success: true, data: user })
})

/**
 * @desc    Change password
 * @route   PUT /api/profile/password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    throw new ErrorResponse('Please provide current and new password', 400)
  }

  const user = await User.findById(req.user._id).select('+password')
  const isMatch = await user.matchPassword(currentPassword)

  if (!isMatch) {
    throw new ErrorResponse('Current password is incorrect', 401)
  }

  user.password = newPassword
  await user.save()

  res.status(200).json({ success: true, message: 'Password updated' })
})

/**
 * @desc    Update notification preferences
 * @route   PUT /api/profile/notifications
 * @access  Private
 */
export const updateNotifications = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  user.notifications = { ...user.notifications, ...req.body }
  await user.save()

  res.status(200).json({ success: true, data: user.notifications })
})
