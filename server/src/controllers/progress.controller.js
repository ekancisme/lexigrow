import mongoose from 'mongoose'
import Vocabulary from '../models/Vocabulary.js'
import Essay from '../models/Essay.js'
import AIAnalysis from '../models/AIAnalysis.js'
import User from '../models/User.js'
import Class from '../models/Class.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'

/**
 * Resolve studentId based on caller's role and authorization
 */
const resolveStudentId = async (req) => {
  if (req.user.role === 'student') {
    return req.user._id
  }

  const studentId = req.query.studentId
  if (!studentId) {
    throw new ErrorResponse('Student ID is required in query parameters', 400)
  }

  if (req.user.role === 'parent') {
    const parent = await User.findById(req.user._id)
    const isMyChild = parent.children.some(id => id.toString() === studentId)
    if (!isMyChild) {
      throw new ErrorResponse('Not authorized to view this student\'s progress', 403)
    }
  } else if (req.user.role === 'teacher') {
    // Teachers can view students in their classes
    const teacherClasses = await Class.find({ teacher: req.user._id })
    const isMyStudent = teacherClasses.some(c => c.students.some(s => s.toString() === studentId))
    if (!isMyStudent) {
      throw new ErrorResponse('Not authorized to view this student\'s progress', 403)
    }
  }

  return studentId
}

/**
 * @desc    Get progress overview stats
 * @route   GET /api/progress/overview
 * @access  Private (student, teacher, parent)
 */
export const getOverview = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req)

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
 * @access  Private (student, teacher, parent)
 */
export const getGrowthChart = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req)
  const months = Number(req.query.months) || 6
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()
  
  // 1. Generate the last N months timeline
  const periodMonths = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    periodMonths.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1, // 1-based month for MongoDB $month
      label: monthNames[d.getMonth()]
    })
  }

  // Calculate start date of the first month in the timeline
  const firstMonthStart = new Date(periodMonths[0].year, periodMonths[0].month - 1, 1)

  // 2. Count all vocabulary words created prior to this timeline start
  const initialCumulative = await Vocabulary.countDocuments({
    student: new mongoose.Types.ObjectId(studentId),
    createdAt: { $lt: firstMonthStart }
  })

  // 3. Aggregate vocab counts by month within the student's history
  const vocabByMonth = await Vocabulary.aggregate([
    { $match: { student: new mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        newWords: { $sum: 1 },
      },
    }
  ])

  // 4. Map the aggregated data to our timeline with cumulative tracking
  let cumulative = initialCumulative
  const data = periodMonths.map(pm => {
    const found = vocabByMonth.find(v => v._id.year === pm.year && v._id.month === pm.month)
    const newWords = found ? found.newWords : 0
    cumulative += newWords
    return {
      label: pm.label,
      newWords,
      cumulative
    }
  })

  res.status(200).json({ success: true, data })
})

/**
 * @desc    Get milestones
 * @route   GET /api/progress/milestones
 * @access  Private (student, teacher, parent)
 */
export const getMilestones = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req)
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

/**
 * @desc    Get weekly comparison (this week vs last week)
 * @route   GET /api/progress/weekly-comparison
 * @access  Private (student, teacher, parent)
 */
export const getWeeklyComparison = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req)

  const now = new Date()
  const oneDay = 24 * 60 * 60 * 1000

  const week1End = now
  const week1Start = new Date(now.getTime() - 7 * oneDay)

  const week2End = week1Start
  const week2Start = new Date(now.getTime() - 14 * oneDay)

  // 1. Vocabulary count
  const thisWeekVocabCount = await Vocabulary.countDocuments({
    student: studentId,
    createdAt: { $gte: week1Start, $lte: week1End }
  })

  const lastWeekVocabCount = await Vocabulary.countDocuments({
    student: studentId,
    createdAt: { $gte: week2Start, $lt: week2End }
  })

  // 2. Essays & AI Analysis
  const thisWeekEssays = await Essay.find({
    student: studentId,
    status: 'reviewed',
    createdAt: { $gte: week1Start, $lte: week1End }
  }).distinct('_id')

  const lastWeekEssays = await Essay.find({
    student: studentId,
    status: 'reviewed',
    createdAt: { $gte: week2Start, $lt: week2End }
  }).distinct('_id')

  const thisWeekAnalyses = await AIAnalysis.find({ essay: { $in: thisWeekEssays } })
  const lastWeekAnalyses = await AIAnalysis.find({ essay: { $in: lastWeekEssays } })

  const thisWeekTTRs = thisWeekAnalyses.map(a => a.scores?.vocabularyDiversity || 0)
  const thisWeekComplexities = thisWeekAnalyses.map(a => a.scores?.complexityIndex || 0)

  const thisWeekAvgTTR = thisWeekTTRs.length > 0
    ? thisWeekTTRs.reduce((sum, v) => sum + v, 0) / thisWeekTTRs.length
    : 0

  const thisWeekAvgComplexity = thisWeekComplexities.length > 0
    ? thisWeekComplexities.reduce((sum, v) => sum + v, 0) / thisWeekComplexities.length
    : 0

  const lastWeekTTRs = lastWeekAnalyses.map(a => a.scores?.vocabularyDiversity || 0)
  const lastWeekComplexities = lastWeekAnalyses.map(a => a.scores?.complexityIndex || 0)

  const lastWeekAvgTTR = lastWeekTTRs.length > 0
    ? lastWeekTTRs.reduce((sum, v) => sum + v, 0) / lastWeekTTRs.length
    : 0

  const lastWeekAvgComplexity = lastWeekComplexities.length > 0
    ? lastWeekComplexities.reduce((sum, v) => sum + v, 0) / lastWeekComplexities.length
    : 0

  const calculateChange = (thisVal, lastVal) => {
    if (lastVal === 0) {
      return thisVal > 0 ? 100 : 0
    }
    return Math.round(((thisVal - lastVal) / lastVal) * 100)
  }

  const ttrChange = calculateChange(thisWeekAvgTTR, lastWeekAvgTTR)
  const vocabChange = calculateChange(thisWeekVocabCount, lastWeekVocabCount)
  const complexityChange = calculateChange(thisWeekAvgComplexity, lastWeekAvgComplexity)

  res.status(200).json({
    success: true,
    data: {
      ttr: {
        thisWeek: Math.round(thisWeekAvgTTR * 100) / 100,
        lastWeek: Math.round(lastWeekAvgTTR * 100) / 100,
        change: ttrChange
      },
      newWords: {
        thisWeek: thisWeekVocabCount,
        lastWeek: lastWeekVocabCount,
        change: vocabChange
      },
      complexity: {
        thisWeek: Math.round(thisWeekAvgComplexity * 100) / 100,
        lastWeek: Math.round(lastWeekAvgComplexity * 100) / 100,
        change: complexityChange
      }
    }
  })
})

/**
 * @desc    Get student's streak (consecutive days with ReviewEvent)
 * @route   GET /api/progress/streak
 * @access  Private (student, teacher, parent)
 */
export const getStreak = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req)

  // Get all review events for this student, sorted by date
  const events = await ReviewEvent.find({ student: studentId })
    .sort({ reviewedAt: 1 })
    .lean()

  if (events.length === 0) {
    return res.status(200).json({ success: true, data: { streakDays: 0, hasActivityToday: false } })
  }

  // Get unique dates (YYYY-MM-DD) in UTC
  const uniqueDates = new Set()
  for (const ev of events) {
    const d = new Date(ev.reviewedAt)
    const dateStr = d.toISOString().split('T')[0]
    uniqueDates.add(dateStr)
  }

  const sortedDates = Array.from(uniqueDates).sort()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Check if there's activity today
  const hasActivityToday = sortedDates.includes(todayStr)

  // Calculate consecutive days from the most recent activity
  let streak = 0
  const lastDateStr = sortedDates[sortedDates.length - 1]

  // If last activity is not today, and not yesterday, streak is 0
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (lastDateStr !== todayStr && lastDateStr !== yesterdayStr) {
    return res.status(200).json({ success: true, data: { streakDays: 0, hasActivityToday } })
  }

  // Count consecutive days backwards from the most recent date
  let currentDate = new Date(lastDateStr)
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0]
    if (sortedDates.includes(dateStr)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  res.status(200).json({ success: true, data: { streakDays: streak, hasActivityToday } })
})
