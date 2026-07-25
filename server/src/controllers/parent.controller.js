import { createHash, randomInt } from 'crypto'
import User from '../models/User.js'
import Essay from '../models/Essay.js'
import AIAnalysis from '../models/AIAnalysis.js'
import Vocabulary from '../models/Vocabulary.js'
import Alert from '../models/Alert.js'
import ChildLinkCode from '../models/ChildLinkCode.js'
import ParentStudentLink from '../models/ParentStudentLink.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'

const LINK_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const LINK_CODE_LENGTH = 8
const LINK_CODE_TTL_MS = 15 * 60 * 1000
const VALID_RELATIONSHIPS = ['father', 'mother', 'guardian', 'other']

const hashLinkCode = code => createHash('sha256').update(code).digest('hex')

const generateLinkCode = () => Array.from(
  { length: LINK_CODE_LENGTH },
  () => LINK_CODE_ALPHABET[randomInt(LINK_CODE_ALPHABET.length)]
).join('')

/**
 * @desc    Generate a one-time code that a parent can use to link this student
 * @route   POST /api/parent/link-code
 * @access  Private (student)
 */
export const createChildLinkCode = asyncHandler(async (req, res) => {
  await ChildLinkCode.deleteMany({ student: req.user._id, usedAt: null })

  const code = generateLinkCode()
  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS)

  await ChildLinkCode.create({
    student: req.user._id,
    codeHash: hashLinkCode(code),
    expiresAt,
  })

  res.status(201).json({
    success: true,
    data: { code, expiresAt },
  })
})

/**
 * @desc    Link parent account to a student with a one-time code
 * @route   POST /api/parent/link
 * @access  Private (parent)
 */
export const linkChild = asyncHandler(async (req, res) => {
  const { linkCode, relationship = 'guardian' } = req.body
  const normalizedCode = String(linkCode || '').replace(/[\s-]/g, '').toUpperCase()

  if (normalizedCode.length !== LINK_CODE_LENGTH) {
    throw new ErrorResponse('Invalid or expired link code', 400)
  }

  if (!VALID_RELATIONSHIPS.includes(relationship)) {
    throw new ErrorResponse('Invalid relationship type', 400)
  }

  const claimedCode = await ChildLinkCode.findOneAndUpdate(
    {
      codeHash: hashLinkCode(normalizedCode),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        usedAt: new Date(),
        usedBy: req.user._id,
      },
    },
    { new: true }
  )

  if (!claimedCode) {
    throw new ErrorResponse('Invalid or expired link code', 400)
  }

  try {
    const child = await User.findOne({ _id: claimedCode.student, role: 'student' })
    if (!child) {
      throw new ErrorResponse('Invalid or expired link code', 400)
    }

    let link = await ParentStudentLink.findOne({
      parent: req.user._id,
      student: child._id,
    })

    if (link) {
      link.relationship = relationship
      link.status = 'active'
      link.linkedAt = new Date()
      link.revokedAt = null
      link.revokedBy = null
      await link.save()
    } else {
      link = await ParentStudentLink.create({
        parent: req.user._id,
        student: child._id,
        relationship,
      })
    }

    await Promise.all([
      User.updateOne({ _id: req.user._id }, { $addToSet: { children: child._id } }),
      User.updateOne({ _id: child._id }, { $addToSet: { parents: req.user._id } }),
    ])

    res.status(200).json({
      success: true,
      message: `Successfully linked with student ${child.name}`,
      data: {
        linkId: link._id,
        student: {
          _id: child._id,
          name: child.name,
          avatar: child.avatar,
          englishLevel: child.englishLevel,
        },
        relationship: link.relationship,
      },
    })
  } catch (error) {
    await ChildLinkCode.updateOne(
      { _id: claimedCode._id, usedBy: req.user._id },
      { $set: { usedAt: null, usedBy: null } }
    )
    throw error
  }
})

/**
 * @desc    Revoke one parent-student relationship
 * @route   DELETE /api/parent/children/:id/link
 * @access  Private (parent)
 */
export const unlinkChild = asyncHandler(async (req, res) => {
  const link = await ParentStudentLink.findOne({
    parent: req.user._id,
    student: req.params.id,
    status: 'active',
  })

  if (!link) {
    throw new ErrorResponse('Active child link not found', 404)
  }

  link.status = 'revoked'
  link.revokedAt = new Date()
  link.revokedBy = req.user._id
  await link.save()

  await Promise.all([
    User.updateOne({ _id: req.user._id }, { $pull: { children: req.params.id } }),
    User.updateOne({ _id: req.params.id }, { $pull: { parents: req.user._id } }),
  ])

  res.status(200).json({
    success: true,
    message: 'Child link revoked successfully',
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

  const now = new Date()
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000
  const weeklyVocabulary = await Promise.all(
    Array.from({ length: 6 }, async (_, index) => {
      const weeksAgo = 5 - index
      const start = new Date(now.getTime() - (weeksAgo + 1) * oneWeekMs)
      const end = new Date(now.getTime() - weeksAgo * oneWeekMs)
      const count = await Vocabulary.countDocuments({
        student: childId,
        createdAt: { $gte: start, $lt: end },
      })
      return { start: start.toISOString(), end: end.toISOString(), count }
    })
  )

  const essays = await Essay.find({ student: childId }).distinct('_id')
  const analyses = await AIAnalysis.find({ essay: { $in: essays } })

  const avgTTR = analyses.length > 0
    ? Math.round((analyses.reduce((sum, a) => sum + (a.scores?.vocabularyDiversity || 0), 0) / analyses.length) * 100) / 100
    : 0

  const child = await User.findById(childId)

  res.status(200).json({
    success: true,
    data: {
      totalVocab,
      totalEssays,
      avgTTR,
      englishLevel: child.englishLevel || '',
      weeklyVocabulary,
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

  const essays = await Essay.find({ student: childId }).sort({ submittedAt: -1, createdAt: -1 }).lean()
  const analyses = essays.length > 0
    ? await AIAnalysis.find({ essay: { $in: essays.map(essay => essay._id) } })
      .select('essay overallScore scores learningPatterns')
      .lean()
    : []
  const analysisByEssay = new Map(analyses.map(analysis => [analysis.essay.toString(), analysis]))
  const essaySummaries = essays.map(essay => ({
    ...essay,
    analysis: analysisByEssay.get(essay._id.toString()) || null,
  }))

  res.status(200).json({
    success: true,
    data: essaySummaries
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
