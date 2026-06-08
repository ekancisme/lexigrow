import WeeklyGoal from '../models/WeeklyGoal.js'
import Essay from '../models/Essay.js'
import Vocabulary from '../models/Vocabulary.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'

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
    goal.goals = req.body.goals
  }
  await goal.save()

  res.status(200).json({ success: true, data: goal })
})

/**
 * @desc    Get AI recommendations for goals
 * @route   GET /api/goals/recommendations
 * @access  Private (student)
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  const totalVocab = await Vocabulary.countDocuments({ student: req.user._id })
  const totalEssays = await Essay.countDocuments({ student: req.user._id, status: { $ne: 'draft' } })

  // Simple recommendation logic based on history
  const recommendations = []

  if (totalVocab > 100) {
    recommendations.push({
      icon: 'trending_up',
      color: 'primary',
      text: `You've learned ${totalVocab} words total. Consider increasing your weekly target to ${Math.min(50, Math.ceil(totalVocab / 10))} words.`,
    })
  }

  if (totalEssays >= 5) {
    recommendations.push({
      icon: 'schedule',
      color: 'secondary',
      text: 'Try writing essays on different topics each week to diversify your vocabulary.',
    })
  }

  recommendations.push({
    icon: 'category',
    color: 'tertiary',
    text: 'Focus on academic vocabulary this week to improve your complexity score.',
  })

  res.status(200).json({ success: true, data: recommendations })
})
