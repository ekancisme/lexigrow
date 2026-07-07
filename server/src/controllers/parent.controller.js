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

/**
 * @desc    Get vocabulary details of a child
 * @route   GET /api/parent/children/:id/vocabulary
 * @access  Private (parent)
 * @query   page, limit, category, mastery, sort
 */
export const getChildVocabulary = asyncHandler(async (req, res) => {
  const childId = req.params.id
  const parent = await User.findById(req.user._id)

  const isMyChild = parent.children.some(id => id.toString() === childId)
  if (!isMyChild) {
    throw new ErrorResponse('Not authorized to view this child\'s vocabulary', 403)
  }

  const { page = 1, limit = 20, category, mastery, sort = 'createdAt' } = req.query

  const query = { student: childId }
  if (category && category !== 'all') query.category = category
  if (mastery && mastery !== 'all') query.masteryLevel = mastery

  const sortMap = {
    createdAt: { createdAt: -1 },
    word: { word: 1 },
    masteryLevel: { masteryLevel: 1 },
  }
  const sortObj = sortMap[sort] || { createdAt: -1 }

  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.min(50, Math.max(1, Number(limit)))

  const [words, total] = await Promise.all([
    Vocabulary.find(query).sort(sortObj).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Vocabulary.countDocuments(query),
  ])

  const allWords = await Vocabulary.find({ student: childId }).lean()

  const masteryDistribution = { new: 0, learning: 0, mastered: 0 }
  const categoryMap = {}

  allWords.forEach(w => {
    masteryDistribution[w.masteryLevel] = (masteryDistribution[w.masteryLevel] || 0) + 1
    if (!categoryMap[w.category]) categoryMap[w.category] = { total: 0, mastered: 0 }
    categoryMap[w.category].total++
    if (w.masteryLevel === 'mastered') categoryMap[w.category].mastered++
  })

  const categoryStats = Object.entries(categoryMap).map(([name, stats]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    key: name,
    total: stats.total,
    mastered: stats.mastered,
    progress: stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0,
  }))

  const totalVocabulary = allWords.length
  const masteredCount = masteryDistribution.mastered
  const masteryRate = totalVocabulary > 0 ? Math.round((masteredCount / totalVocabulary) * 100) : 0

  res.status(200).json({
    success: true,
    data: { words, masteryDistribution, categoryStats, totalVocabulary, masteredCount, masteryRate },
    total,
    pages: Math.ceil(total / limitNum),
    page: pageNum,
    count: words.length,
  })
})
/* 
import Vocabulary from '../models/Vocabulary.js'
import User from '../models/User.js'
import Class from '../models/Class.js'
import Alert from '../models/Alert.js'
import Essay from '../models/Essay.js'
import AIAnalysis from '../models/AIAnalysis.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'
*/
