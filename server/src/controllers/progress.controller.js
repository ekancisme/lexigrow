import Vocabulary from '../models/Vocabulary.js'
import Essay from '../models/Essay.js'
import AIAnalysis from '../models/AIAnalysis.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * @desc    Get progress overview stats
 * @route   GET /api/progress/overview
 * @access  Private (student)
 */
export const getOverview = asyncHandler(async (req, res) => {
  const studentId = req.user._id

  // Total vocabulary
  const totalVocab = await Vocabulary.countDocuments({ student: studentId })

  // This month's new words
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const thisMonthWords = await Vocabulary.countDocuments({
    student: studentId,
    createdAt: { $gte: startOfMonth },
  })

  // Last month's words for growth rate
  const startOfLastMonth = new Date(startOfMonth)
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1)
  const lastMonthWords = await Vocabulary.countDocuments({
    student: studentId,
    createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
  })
  const growthRate = lastMonthWords > 0 ? Math.round(((thisMonthWords - lastMonthWords) / lastMonthWords) * 100) : thisMonthWords > 0 ? 100 : 0

  // Average TTR from analyses
  const analyses = await AIAnalysis.find({
    essay: { $in: await Essay.find({ student: studentId }).distinct('_id') },
  })
  const avgTTR = analyses.length > 0
    ? Math.round((analyses.reduce((sum, a) => sum + (a.scores?.vocabularyDiversity || 0), 0) / analyses.length) * 100) / 100
    : 0

  // Determine current rank based on vocab + TTR
  let rank = 'A1'
  if (totalVocab >= 800 && avgTTR >= 0.7) rank = 'C2'
  else if (totalVocab >= 600 && avgTTR >= 0.65) rank = 'C1'
  else if (totalVocab >= 400 && avgTTR >= 0.6) rank = 'B2'
  else if (totalVocab >= 200 && avgTTR >= 0.5) rank = 'B1'
  else if (totalVocab >= 100) rank = 'A2'

  // Total essays
  const totalEssays = await Essay.countDocuments({ student: studentId })

  res.status(200).json({
    success: true,
    data: {
      totalVocab,
      thisMonthWords,
      growthRate,
      avgTTR,
      rank,
      totalEssays,
    },
  })
})

/**
 * @desc    Get growth chart data
 * @route   GET /api/progress/growth-chart
 * @access  Private (student)
 */
export const getGrowthChart = asyncHandler(async (req, res) => {
  const { months = 6 } = req.query
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - Number(months))

  // Cumulative vocab over time
  const vocabByMonth = await Vocabulary.aggregate([
    { $match: { student: req.user._id } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        newWords: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])

  // Convert to cumulative
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  let cumulative = 0
  const data = vocabByMonth.map(m => {
    cumulative += m.newWords
    return {
      label: `${monthNames[m._id.month - 1]}`,
      newWords: m.newWords,
      cumulative,
    }
  })

  res.status(200).json({ success: true, data })
})

/**
 * @desc    Get milestones
 * @route   GET /api/progress/milestones
 * @access  Private (student)
 */
export const getMilestones = asyncHandler(async (req, res) => {
  const studentId = req.user._id
  const totalVocab = await Vocabulary.countDocuments({ student: studentId })
  const totalEssays = await Essay.countDocuments({ student: studentId, status: { $ne: 'draft' } })

  // Check TTR
  const analyses = await AIAnalysis.find({
    essay: { $in: await Essay.find({ student: studentId }).distinct('_id') },
  })
  const avgTTR = analyses.length > 0
    ? analyses.reduce((sum, a) => sum + (a.scores?.vocabularyDiversity || 0), 0) / analyses.length
    : 0

  const milestones = [
    { title: 'First Essay Submitted', achieved: totalEssays >= 1, target: '1 essay' },
    { title: '100 Words Milestone', achieved: totalVocab >= 100, target: '100 words' },
    { title: '500 Words Milestone', achieved: totalVocab >= 500, target: '500 words' },
    { title: '1000 Words Milestone', achieved: totalVocab >= 1000, target: '1000 words' },
    { title: 'TTR > 0.6', achieved: avgTTR >= 0.6, target: 'TTR score above 0.6' },
    { title: 'TTR > 0.7', achieved: avgTTR >= 0.7, target: 'TTR score above 0.7' },
    { title: '10 Essays Written', achieved: totalEssays >= 10, target: '10 essays' },
    { title: 'First C1 Essay', achieved: analyses.some(a => (a.scores?.complexityIndex || 0) >= 7), target: 'C1 level complexity' },
  ]

  res.status(200).json({ success: true, data: milestones })
})
