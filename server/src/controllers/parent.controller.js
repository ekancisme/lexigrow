import User from '../models/User.js'
import Essay from '../models/Essay.js'
import AIAnalysis from '../models/AIAnalysis.js'
import Vocabulary from '../models/Vocabulary.js'
import Alert from '../models/Alert.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'

/**
 * @desc    Link parent account to a student by student email
 * @route   POST /api/parent/link
 * @access  Private (parent)
 */
export const linkChild = asyncHandler(async (req, res) => {
  const { childEmail } = req.body

  if (!childEmail) {
    throw new ErrorResponse('Please provide student email address', 400)
  }

  const child = await User.findOne({ email: childEmail.toLowerCase(), role: 'student' })
  if (!child) {
    throw new ErrorResponse('No student found with the provided email address', 404)
  }

  const parent = await User.findById(req.user._id)

  // Avoid duplicate linkage
  if (parent.children.includes(child._id)) {
    throw new ErrorResponse('This student is already linked to your account', 400)
  }

  parent.children.push(child._id)
  await parent.save()

  child.parents = child.parents || []
  if (!child.parents.includes(parent._id)) {
    child.parents.push(parent._id)
    await child.save()
  }

  res.status(200).json({
    success: true,
    message: `Successfully linked with student ${child.name}`
  })
})

/**
 * @desc    Get linked children list
 * @route   GET /api/parent/children
 * @access  Private (parent)
 */
export const getChildren = asyncHandler(async (req, res) => {
  const parent = await User.findById(req.user._id).populate('children', 'name email avatar englishLevel')

  res.status(200).json({
    success: true,
    data: parent.children || []
  })
})

/**
 * @desc    Get linked child progress overview
 * @route   GET /api/parent/children/:id/progress
 * @access  Private (parent)
 */
export const getChildProgress = asyncHandler(async (req, res) => {
  const childId = req.params.id
  const parent = await User.findById(req.user._id)

  const isMyChild = parent.children.some(id => id.toString() === childId)
  if (!isMyChild) {
    throw new ErrorResponse('Not authorized to view this child\'s progress', 403)
  }

  const totalVocab = await Vocabulary.countDocuments({ student: childId })
  const totalEssays = await Essay.countDocuments({ student: childId })

  const essays = await Essay.find({ student: childId }).distinct('_id')
  const analyses = await AIAnalysis.find({ essay: { $in: essays } })

  const avgTTR = analyses.length > 0
    ? Math.round((analyses.reduce((sum, a) => sum + (a.scores?.vocabularyDiversity || 0), 0) / analyses.length) * 100) / 100
    : 0

  const child = await User.findById(childId)
  let rank = child.englishLevel || 'A1'
  if (totalVocab >= 800 && avgTTR >= 0.7) rank = 'C2'
  else if (totalVocab >= 600 && avgTTR >= 0.65) rank = 'C1'
  else if (totalVocab >= 400 && avgTTR >= 0.6) rank = 'B2'
  else if (totalVocab >= 200 && avgTTR >= 0.5) rank = 'B1'
  else if (totalVocab >= 100) rank = 'A2'

  res.status(200).json({
    success: true,
    data: {
      totalVocab,
      totalEssays,
      avgTTR,
      rank,
      name: child.name,
      email: child.email,
      avatar: child.avatar,
    }
  })
})

/**
 * @desc    Get linked child alerts
 * @route   GET /api/parent/children/:id/alerts
 * @access  Private (parent)
 */
export const getChildAlerts = asyncHandler(async (req, res) => {
  const childId = req.params.id
  const parent = await User.findById(req.user._id)

  const isMyChild = parent.children.some(id => id.toString() === childId)
  if (!isMyChild) {
    throw new ErrorResponse('Not authorized to view this child\'s alerts', 403)
  }

  const alerts = await Alert.find({ student: childId }).sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: alerts
  })
})

/**
 * @desc    Get linked child essay list
 * @route   GET /api/parent/children/:id/essays
 * @access  Private (parent)
 */
export const getChildEssays = asyncHandler(async (req, res) => {
  const childId = req.params.id
  const parent = await User.findById(req.user._id)

  const isMyChild = parent.children.some(id => id.toString() === childId)
  if (!isMyChild) {
    throw new ErrorResponse('Not authorized to view this child\'s essays', 403)
  }

  const essays = await Essay.find({ student: childId }).sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: essays
  })
})
