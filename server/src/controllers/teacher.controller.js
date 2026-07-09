import Class from '../models/Class.js'
import User from '../models/User.js'
import Essay from '../models/Essay.js'
import AIAnalysis from '../models/AIAnalysis.js'
import Vocabulary from '../models/Vocabulary.js'
import Alert from '../models/Alert.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import { classifyStudents, classifyStudentStatus } from '../services/studentStatus.service.js'

/**
 * @desc    Get teacher dashboard stats
 * @route   GET /api/teacher/dashboard
 * @access  Private (teacher)
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const classes = await Class.find({ teacher: req.user._id })
  // De-duplicate students who may be in multiple classes
  const allStudentIds = [...new Set(classes.flatMap(c => c.students.map(s => s.toString())))]

  const totalClasses  = classes.length
  const totalStudents = allStudentIds.length

  // ── Classify students using the canonical studentStatus service ──────
  // All signals (vocab stagnation 4w + grammar decline 3 essays) are
  // evaluated in parallel for performance.
  let growing = 0, stagnating = 0, declining = 0

  if (allStudentIds.length > 0) {
    const statusMap = await classifyStudents(allStudentIds)
    for (const { status } of statusMap.values()) {
      if (status === 'growing')    growing++
      else if (status === 'declining') declining++
      else                         stagnating++
    }
  }

  // ── Recent alerts (only students in this teacher's classes) ─────────
  const studentIdSet = allStudentIds
  const recentAlerts = await Alert.find({
    teacher: req.user._id,
    student: { $in: studentIdSet },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('student', 'name')

  // ── Class summary ────────────────────────────────────────────────────
  const classSummary = await Promise.all(classes.map(async (cls) => {
    const studentIds = cls.students.map(s => s.toString())
    const essayIds   = await Essay
      .find({ student: { $in: studentIds }, status: { $ne: 'draft' } })
      .distinct('_id')
    const analyses = await AIAnalysis.find({ essay: { $in: essayIds } })
    const avgTTR = analyses.length > 0
      ? Math.round((analyses.reduce((sum, a) => sum + (a.scores?.vocabularyDiversity || 0), 0) / analyses.length) * 100) / 100
      : 0

    return {
      _id:      cls._id,
      name:     cls.name,
      students: cls.students.length,
      avgTTR,
      status:   cls.status,
    }
  }))

  res.status(200).json({
    success: true,
    data: {
      totalClasses,
      totalStudents,
      growing,
      stagnating,
      declining,
      recentAlerts,
      classes: classSummary,
    },
  })
})

/**
 * @desc    Get detailed analytics for a student
 * @route   GET /api/teacher/students/:id
 * @access  Private (teacher)
 */
export const getStudentAnalytics = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id).select('-password')
  if (!student) throw new ErrorResponse('Student not found', 404)

  // Verify teacher has this student in one of their classes
  const teacherClasses = await Class.find({ teacher: req.user._id, students: student._id })
  if (teacherClasses.length === 0) {
    throw new ErrorResponse('Student not in any of your classes', 403)
  }

  const essays = await Essay.find({ student: student._id, status: { $ne: 'draft' } }).sort({ createdAt: -1 })
  const essayIds = essays.map(e => e._id)
  const analyses = await AIAnalysis.find({ essay: { $in: essayIds } })

  // Vocabulary stats
  const totalVocab    = await Vocabulary.countDocuments({ student: student._id })
  const masteredVocab = await Vocabulary.countDocuments({ student: student._id, masteryLevel: 'mastered' })
  const masteryRate   = totalVocab > 0 ? Math.round((masteredVocab / totalVocab) * 100) : 0

  const avgTTR = analyses.length > 0
    ? Math.round((analyses.reduce((sum, a) => sum + (a.scores?.vocabularyDiversity || 0), 0) / analyses.length) * 100) / 100
    : 0

  // Growth
  let growth = '0%'
  if (analyses.length >= 2) {
    const sorted = [...analyses].sort((a, b) => b.createdAt - a.createdAt)
    const diff = (sorted[0].scores?.vocabularyDiversity || 0) - (sorted[sorted.length - 1].scores?.vocabularyDiversity || 0)
    growth = `${diff >= 0 ? '+' : ''}${Math.round(diff * 100)}%`
  }

  // Essay history with scores
  const essayHistory = await Promise.all(essays.slice(0, 10).map(async (essay) => {
    const analysis = analyses.find(a => a.essay.toString() === essay._id.toString())
    return {
      _id: essay._id,
      date: essay.createdAt,
      title: essay.title,
      words: essay.wordCount,
      ttr: analysis?.scores?.vocabularyDiversity || 0,
      score: analysis?.overallScore || 0,
    }
  }))

  // Canonical status — same logic used on Dashboard and Class Detail
  const { status: learningStatus, signals } = await classifyStudentStatus(student._id)

  res.status(200).json({
    success: true,
    data: {
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        englishLevel: student.englishLevel,
        createdAt: student.createdAt,
      },
      class: teacherClasses[0]?.name || 'N/A',
      learningStatus,
      signals,
      metrics: {
        totalEssays: essays.length,
        vocabularySize: totalVocab,
        masteredVocab,
        masteryRate,
        avgTTR,
        growth,
      },
      essayHistory,
    },
  })
})


/**
 * @desc    Get student essays (for teacher viewing)
 * @route   GET /api/teacher/students/:id/essays
 * @access  Private (teacher)
 */
export const getStudentEssays = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query

  const essays = await Essay.find({ student: req.params.id, status: { $ne: 'draft' } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))

  const total = await Essay.countDocuments({ student: req.params.id, status: { $ne: 'draft' } })

  res.status(200).json({
    success: true,
    count: essays.length,
    total,
    page: Number(page),
    data: essays,
  })
})

/**
 * @desc    Get vocabulary details of a student (for teacher)
 * @route   GET /api/teacher/students/:id/vocabulary
 * @access  Private (teacher)
 * @query   page, limit, category, mastery, sort (createdAt|word|masteryLevel)
 */
export const getStudentVocabulary = asyncHandler(async (req, res) => {
  const studentId = req.params.id
  const { page = 1, limit = 20, category, mastery, sort = 'createdAt' } = req.query

  // Verify teacher has this student in one of their classes
  const teacherClasses = await Class.find({ teacher: req.user._id, students: studentId })
  if (teacherClasses.length === 0) {
    throw new ErrorResponse('Student not in any of your classes', 403)
  }

  // Build query
  const query = { student: studentId }
  if (category && category !== 'all') query.category = category
  if (mastery && mastery !== 'all') query.masteryLevel = mastery

  // Sort mapping
  const sortMap = {
    createdAt: { createdAt: -1 },
    word: { word: 1 },
    masteryLevel: { masteryLevel: 1 },
  }
  const sortObj = sortMap[sort] || { createdAt: -1 }

  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.min(50, Math.max(1, Number(limit)))

  const [words, total] = await Promise.all([
    Vocabulary.find(query)
      .sort(sortObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Vocabulary.countDocuments(query),
  ])

  // ── Stats (always on full student collection, not filtered) ──
  const allWords = await Vocabulary.find({ student: studentId }).lean()

  const masteryDistribution = { new: 0, learning: 0, mastered: 0 }
  const categoryMap = {}

  allWords.forEach(w => {
    // mastery tally
    masteryDistribution[w.masteryLevel] = (masteryDistribution[w.masteryLevel] || 0) + 1

    // category tally
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
    data: {
      words,
      masteryDistribution,
      categoryStats,
      totalVocabulary,
      masteredCount,
      masteryRate,
    },
    total,
    pages: Math.ceil(total / limitNum),
    page: pageNum,
    count: words.length,
  })
})

/**
 * @desc    Get classroom aggregated analytics and performance trends
 * @route   GET /api/classes/:id/analytics
 * @access  Private (teacher)
 */
export const getClassAnalytics = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id)
  if (!cls) throw new ErrorResponse('Class not found', 404)

  if (cls.teacher.toString() !== req.user._id.toString()) {
    throw new ErrorResponse('Not authorized', 403)
  }

  const studentIds = cls.students.map(s => s.toString())
  
  if (studentIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        summary: {
          overallAvgTTR: 0,
          overallAvgGrammar: 0,
          totalEssaysAnalyzed: 0
        },
        trend: []
      }
    })
  }

  // Get all submitted essays
  const essays = await Essay.find({
    student: { $in: studentIds },
    status: { $ne: 'draft' }
  })
  
  const essayIds = essays.map(e => e._id)
  const analyses = await AIAnalysis.find({
    essay: { $in: essayIds }
  })

  // Summary Metrics
  const totalEssaysAnalyzed = analyses.length
  const overallAvgTTR = totalEssaysAnalyzed > 0
    ? Math.round((analyses.reduce((sum, a) => sum + (a.scores?.vocabularyDiversity || 0), 0) / totalEssaysAnalyzed) * 100) / 100
    : 0
  const overallAvgGrammar = totalEssaysAnalyzed > 0
    ? Math.round((analyses.reduce((sum, a) => sum + (a.scores?.grammarAccuracy || 0), 0) / totalEssaysAnalyzed) * 10) / 10
    : 0

  // Trend Breakdown (6 intervals of 7 days leading up to today)
  const intervals = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    const label = `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
    intervals.push({ start, end, label })
  }

  const trend = intervals.map(interval => {
    const intervalAnalyses = analyses.filter(a => {
      const date = new Date(a.createdAt)
      return date >= interval.start && date <= interval.end
    })

    if (intervalAnalyses.length === 0) {
      return {
        label: interval.label,
        avgTTR: 0,
        avgGrammar: 0,
        essayCount: 0
      }
    }

    const totalTTR = intervalAnalyses.reduce((sum, a) => sum + (a.scores?.vocabularyDiversity || 0), 0)
    const totalGrammar = intervalAnalyses.reduce((sum, a) => sum + (a.scores?.grammarAccuracy || 0), 0)

    return {
      label: interval.label,
      avgTTR: Math.round((totalTTR / intervalAnalyses.length) * 100) / 100,
      avgGrammar: Math.round((totalGrammar / intervalAnalyses.length) * 10) / 10,
      essayCount: intervalAnalyses.length
    }
  })

  res.status(200).json({
    success: true,
    data: {
      summary: {
        overallAvgTTR,
        overallAvgGrammar,
        totalEssaysAnalyzed
      },
      trend
    }
  })
})

