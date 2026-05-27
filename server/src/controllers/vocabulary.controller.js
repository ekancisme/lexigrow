import Vocabulary from '../models/Vocabulary.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * @desc    Get student's vocabulary library
 * @route   GET /api/vocabulary
 * @access  Private (student)
 */
export const getVocabulary = asyncHandler(async (req, res) => {
  const { category, mastery, page = 1, limit = 50 } = req.query
  const query = { student: req.user._id }

  if (category) query.category = category
  if (mastery) query.masteryLevel = mastery

  const words = await Vocabulary.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))

  const total = await Vocabulary.countDocuments(query)

  res.status(200).json({
    success: true,
    count: words.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: words,
  })
})

/**
 * @desc    Get vocabulary stats by category
 * @route   GET /api/vocabulary/stats
 * @access  Private (student)
 */
export const getVocabStats = asyncHandler(async (req, res) => {
  const stats = await Vocabulary.aggregate([
    { $match: { student: req.user._id } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        mastered: { $sum: { $cond: [{ $eq: ['$masteryLevel', 'mastered'] }, 1, 0] } },
      },
    },
  ])

  const total = await Vocabulary.countDocuments({ student: req.user._id })

  // Format as category objects
  const categories = ['academic', 'business', 'scientific', 'daily'].map(cat => {
    const found = stats.find(s => s._id === cat)
    return {
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      category: cat,
      count: found ? found.count : 0,
      mastered: found ? found.mastered : 0,
      progress: total > 0 && found ? Math.round((found.count / total) * 100) : 0,
    }
  })

  res.status(200).json({ success: true, total, data: categories })
})

/**
 * @desc    Get vocabulary growth data over time
 * @route   GET /api/vocabulary/growth
 * @access  Private (student)
 */
export const getVocabGrowth = asyncHandler(async (req, res) => {
  const { months = 6 } = req.query
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - Number(months))

  const growth = await Vocabulary.aggregate([
    {
      $match: {
        student: req.user._id,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])

  // Format for chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const data = growth.map(g => ({
    label: `${monthNames[g._id.month - 1]} ${g._id.year}`,
    count: g.count,
  }))

  res.status(200).json({ success: true, data })
})

/**
 * @desc    Update vocabulary mastery level
 * @route   PATCH /api/vocabulary/:id
 * @access  Private (student)
 */
export const updateMastery = asyncHandler(async (req, res) => {
  const word = await Vocabulary.findOne({ _id: req.params.id, student: req.user._id })

  if (!word) {
    throw new (await import('../utils/ErrorResponse.js')).default('Word not found', 404)
  }

  word.masteryLevel = req.body.masteryLevel || word.masteryLevel
  await word.save()

  res.status(200).json({ success: true, data: word })
})
