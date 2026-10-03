import WeeklyGoal from '../models/WeeklyGoal.js'
import Essay from '../models/Essay.js'
import Vocabulary from '../models/Vocabulary.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import LearningSession from '../models/LearningSession.js'
import { completeThroughRelay } from '../services/aiRelayClient.service.js'

/**
 * Get the start of current week (Monday)
 */
function getWeekBounds() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + diffToMonday)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return { weekStart, weekEnd }
}

/**
 * @desc    Get current week goals
 * @route   GET /api/goals
 * @access  Private (student)
 */
export const getCurrentGoals = asyncHandler(async (req, res) => {
  const { weekStart, weekEnd } = getWeekBounds()
  let goal = await WeeklyGoal.findOne({ student: req.user._id, weekStart })

  if (!goal) {
    // Auto-create default goals for this week
    goal = await WeeklyGoal.create({
      student: req.user._id,
      weekStart,
      weekEnd,
      goals: [
        { label: 'New Words', target: 20, current: 0, icon: 'dictionary', color: 'primary' },
        { label: 'Essays Written', target: 3, current: 0, icon: 'edit_note', color: 'secondary' },
        { label: 'Writing Length (words)', target: 5000, current: 0, icon: 'text_fields', color: 'tertiary' },
        { label: 'Complexity Score', target: 8, current: 0, icon: 'equalizer', color: 'primary' },
      ],
    })
  }

  // Calculate current progress from real data
  const newWordsThisWeek = await Vocabulary.countDocuments({
    student: req.user._id,
    createdAt: { $gte: weekStart, $lte: weekEnd },
  })

  const essaysThisWeek = await Essay.find({
    student: req.user._id,
    status: { $ne: 'draft' },
    submittedAt: { $gte: weekStart, $lte: weekEnd },
  })

  const totalWordsWritten = essaysThisWeek.reduce((sum, e) => sum + e.wordCount, 0)

  // Update current progress
  goal.goals = goal.goals.map(g => {
    if (g.label === 'New Words') return { ...g.toObject(), current: newWordsThisWeek }
    if (g.label === 'Essays Written') return { ...g.toObject(), current: essaysThisWeek.length }
    if (g.label.includes('Writing Length')) return { ...g.toObject(), current: totalWordsWritten }
    return g
  })
  await goal.save()

  res.status(200).json({ success: true, data: goal })
})

/**
 * @desc    Create goals for the current week
 * @route   POST /api/goals
 * @access  Private (student)
 */
export const createGoals = asyncHandler(async (req, res) => {
  const { weekStart, weekEnd } = getWeekBounds()
  const { goals } = req.body

  const existing = await WeeklyGoal.findOne({ student: req.user._id, weekStart })
  if (existing) {
    throw new ErrorResponse('Goals already exist for this week. Use PUT to update.', 400)
  }

  const goal = await WeeklyGoal.create({
    student: req.user._id,
    weekStart,
    weekEnd,
    goals,
  })

  res.status(201).json({ success: true, data: goal })
})

/**
 * @desc    Update goal targets
 * @route   PUT /api/goals/:id
 * @access  Private (student)
 */
export const updateGoals = asyncHandler(async (req, res) => {
  const goal = await WeeklyGoal.findOne({ _id: req.params.id, student: req.user._id })

  if (!goal) {
    throw new ErrorResponse('Goals not found', 404)
  }

  if (req.body.goals) {
    if (!Array.isArray(req.body.goals) || req.body.goals.length > 10) {
      throw new ErrorResponse('Invalid goals', 400)
    }
    for (const item of req.body.goals) {
      if (!item || typeof item.label !== 'string' || !Number.isFinite(Number(item.target)) || Number(item.target) < 0 || Number(item.target) > 100000) {
        throw new ErrorResponse('Invalid goal target', 400)
      }
    }
    goal.goals = req.body.goals
  }
  if (req.body.recommendation) {
    const recommendation = req.body.recommendation
    goal.recommendation = {
      source: ['deterministic', 'ai', 'offline_fallback'].includes(recommendation.source) ? recommendation.source : 'deterministic',
      isAccepted: Boolean(recommendation.isAccepted ?? true),
      rationale: typeof recommendation.rationale === 'string' ? recommendation.rationale.slice(0, 1000) : '',
      metrics: recommendation.metrics || {},
      generatedAt: recommendation.generatedAt || new Date(),
    }
  }
  await goal.save()

  res.status(200).json({ success: true, data: goal })
})

/**
 * Build bounded goal targets from deterministic progress metrics. The model may
 * explain these targets, but it never gets to choose unbounded values.
 */
export async function buildGoalRecommendation(studentId) {
  const { weekStart, weekEnd } = getWeekBounds()
  const previousStart = new Date(weekStart)
  previousStart.setDate(previousStart.getDate() - 7)
  const [totalVocab, totalEssays, overdueWords, completedSessions, essaysThisWeek, wordsThisWeek] = await Promise.all([
    Vocabulary.countDocuments({ student: studentId }),
    Essay.countDocuments({ student: studentId, status: { $ne: 'draft' } }),
    Vocabulary.countDocuments({ student: studentId, $or: [{ nextReviewDate: null }, { nextReviewDate: { $lte: new Date() } }] }),
    LearningSession.countDocuments({ student: studentId, status: 'completed' }),
    Essay.countDocuments({ student: studentId, status: { $ne: 'draft' }, submittedAt: { $gte: weekStart, $lte: weekEnd } }),
    Essay.aggregate([
      { $match: { student: studentId, status: { $ne: 'draft' }, submittedAt: { $gte: weekStart, $lte: weekEnd } } },
      { $group: { _id: null, total: { $sum: '$wordCount' } } },
    ]),
  ])
  const totalWordsThisWeek = wordsThisWeek[0]?.total || 0
  const targets = [
    { label: 'New Words', target: Math.min(50, Math.max(10, Math.ceil(Math.max(totalVocab, 10) / 10))), current: 0, icon: 'dictionary', color: 'primary' },
    { label: 'Essays Written', target: Math.min(5, Math.max(1, totalEssays >= 5 ? 3 : 2)), current: essaysThisWeek, icon: 'edit_note', color: 'secondary' },
    { label: 'Writing Length (words)', target: Math.min(5000, Math.max(500, totalWordsThisWeek || 1000)), current: totalWordsThisWeek, icon: 'text_fields', color: 'tertiary' },
    { label: 'Complexity Score', target: Math.min(10, Math.max(5, 6 + Math.min(3, Math.floor(completedSessions / 5)))), current: 0, icon: 'equalizer', color: 'primary' },
  ]
  const metrics = { totalVocab, totalEssays, overdueWords, completedSessions, essaysThisWeek, wordsThisWeek: totalWordsThisWeek, previousWeekStart: previousStart }
  let rationale = `You have ${overdueWords} words due for review and wrote ${totalWordsThisWeek} words this week. This plan balances review, writing, and vocabulary growth.`
  let source = 'deterministic'
  try {
    const completion = await completeThroughRelay({
      route: 'goal_recommendation',
      providerPreference: 'groq',
      model: process.env.DEFAULT_AI_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: `Write one short Vietnamese or English rationale for these fixed student metrics. Do not change numbers. Metrics: ${JSON.stringify(metrics)}. Return JSON {"rationale":"..."}.` }],
      responseFormat: { type: 'json_object' },
      maxTokens: 300,
      temperature: 0.2,
      maxAttempts: 2,
    })
    const parsed = JSON.parse(completion.text)
    if (typeof parsed.rationale === 'string' && parsed.rationale.trim().length <= 1000) {
      rationale = parsed.rationale.trim()
      source = 'ai'
    }
  } catch (error) {
    console.warn('AI goal rationale unavailable:', error.message)
    source = 'offline_fallback'
  }
  return { goals: targets, rationale, metrics, source, generatedAt: new Date() }
}

/**
 * @desc    Get AI recommendations for goals
 * @route   GET /api/goals/recommendations
 * @access  Private (student)
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  const recommendation = await buildGoalRecommendation(req.user._id)
  res.status(200).json({
    success: true,
    data: [{
      icon: 'trending_up',
      color: 'primary',
      text: recommendation.rationale,
      goals: recommendation.goals,
      metrics: recommendation.metrics,
      source: recommendation.source,
      isFallback: recommendation.source === 'offline_fallback',
      recommendation,
    }],
    _meta: { source: recommendation.source, isFallback: recommendation.source === 'offline_fallback' },
  })
})
