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

/**
 * @desc    Get classroom analytics insights (repeated words, grammar error categories, warnings)
 * @route   GET /api/classes/:id/insights
 * @access  Private (teacher)
 */
export const getClassInsights = asyncHandler(async (req, res) => {
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
        repeatedWords: [],
        grammarErrors: [],
        warnings: []
      }
    })
  }

  // Find all non-draft essays of students
  const essays = await Essay.find({
    student: { $in: studentIds },
    status: { $ne: 'draft' }
  })
  
  const essayIds = essays.map(e => e._id)
  const analyses = await AIAnalysis.find({
    essay: { $in: essayIds }
  })

  // 1. Accumulate repeated words
  const repeatedWordsMap = {} // word -> { word, count, students: Set }
  
  analyses.forEach(analysis => {
    const essayDoc = essays.find(e => e._id.toString() === analysis.essay.toString())
    const studentId = essayDoc?.student?.toString()
    
    if (analysis.nlpStats?.repeatedWords) {
      analysis.nlpStats.repeatedWords.forEach(rw => {
        const word = rw.word.toLowerCase().trim()
        if (!repeatedWordsMap[word]) {
          repeatedWordsMap[word] = {
            word,
            count: 0,
            students: new Set()
          }
        }
        repeatedWordsMap[word].count += rw.count
        if (studentId) {
          repeatedWordsMap[word].students.add(studentId)
        }
      })
    }
  })

  const repeatedWords = Object.values(repeatedWordsMap).map(item => ({
    word: item.word,
    count: item.count,
    studentCount: item.students.size
  })).sort((a, b) => b.count - a.count).slice(0, 8)

  // 2. Classify improvements into categories
  const categoriesConfig = [
    { key: 'Verb Tenses/Forms', keywords: ['tense', 'past', 'present', 'future', 'conjugation', 'verb form', 'infinitive', 'gerund', 'participle'] },
    { key: 'Subject-Verb Agreement', keywords: ['subject-verb', 'agreement', 'singular', 'plural', 'verbs agreement'] },
    { key: 'Preposition Usage', keywords: ['preposition', 'in', 'on', 'at', 'with', 'of', 'for', 'to', 'about'] },
    { key: 'Articles (A/An/The)', keywords: ['article', 'definite article', 'indefinite article', 'a', 'an', 'the'] },
    { key: 'Punctuation', keywords: ['comma', 'punctuation', 'semi-colon', 'colon', 'apostrophe', 'period', 'question mark'] },
    { key: 'Spelling', keywords: ['spelling', 'misspell', 'typo', 'spell check'] },
    { key: 'Passive Voice Overuse', keywords: ['passive voice', 'passive form'] },
    { key: 'Vocabulary Selection', keywords: ['vocabulary', 'word choice', 'synonym', 'repetitive word', 'redundant', 'word selection'] },
    { key: 'Coherence & Transitions', keywords: ['coherence', 'transition', 'connective', 'cohesive', 'linking word'] }
  ]

  const grammarErrorsMap = {} // categoryName -> { category, count, examples: Set }
  categoriesConfig.forEach(cat => {
    grammarErrorsMap[cat.key] = {
      category: cat.key,
      count: 0,
      examples: new Set()
    }
  })
  
  const defaultCategory = 'Sentence Structure & Style'
  grammarErrorsMap[defaultCategory] = {
    category: defaultCategory,
    count: 0,
    examples: new Set()
  }

  analyses.forEach(analysis => {
    if (analysis.suggestions) {
      analysis.suggestions.forEach(sug => {
        if (sug.type === 'improvement') {
          const text = sug.text
          const textLower = text.toLowerCase()
          let matched = false

          for (const cat of categoriesConfig) {
            const hasKeyword = cat.keywords.some(kw => textLower.includes(kw))
            if (hasKeyword) {
              grammarErrorsMap[cat.key].count++
              grammarErrorsMap[cat.key].examples.add(text)
              matched = true
              break
            }
          }

          if (!matched) {
            grammarErrorsMap[defaultCategory].count++
            grammarErrorsMap[defaultCategory].examples.add(text)
          }
        }
      })
    }
  })

  const grammarErrors = Object.values(grammarErrorsMap)
    .filter(item => item.count > 0)
    .map(item => ({
      category: item.category,
      count: item.count,
      examples: Array.from(item.examples).slice(0, 3)
    }))
    .sort((a, b) => b.count - a.count)

  // 3. Generate warnings/alerts
  const warnings = []
  
  grammarErrors.forEach(err => {
    if (err.count >= 3) {
      warnings.push(`High frequency of "${err.category}" issues detected in the class (occurred ${err.count} times). Consider doing a brief classroom review session on this topic.`)
    }
  })

  repeatedWords.forEach(rw => {
    if (rw.studentCount >= 3) {
      warnings.push(`The word "${rw.word}" is frequently overused, affecting ${rw.studentCount} students in this class (repeated ${rw.count} times total). Encourage them to use academic synonyms to expand their vocabulary.`)
    }
  })

  res.status(200).json({
    success: true,
    data: {
      repeatedWords,
      grammarErrors,
      warnings
    }
  })
})

/**
 * @desc    Get anonymous class leaderboard for weekly vocabulary and essay counts
 * @route   GET /api/classes/:id/leaderboard
 * @access  Private (teacher, student)
 */
export const getClassLeaderboard = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id).populate('students', 'name email englishLevel anonymousNickname')
  if (!cls) {
    throw new ErrorResponse('Class not found', 404)
  }

  // Authorize: teacher of class, or student in class
  const isTeacher = cls.teacher.toString() === req.user._id.toString()
  const isStudent = cls.students.some(s => s._id.toString() === req.user._id.toString())
  if (!isTeacher && !isStudent) {
    throw new ErrorResponse('Not authorized to view this class leaderboard', 403)
  }

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Adjectives & Animals list for anonymous nicknames
  const adjectives = ['Clever', 'Silent', 'Joyful', 'Bright', 'Golden', 'Swift', 'Wise', 'Sleek', 'Happy', 'Brave', 'Gentle', 'Quick', 'Calm', 'Noble', 'Mighty']
  const animals = ['Panda', 'Eagle', 'Fox', 'Owl', 'Dolphin', 'Tiger', 'Koala', 'Lion', 'Falcon', 'Cheetah', 'Wolf', 'Panther', 'Deer', 'Otter', 'Jaguar']

  const generateUniqueNickname = async (studentUser) => {
    let nickname = studentUser.anonymousNickname
    if (nickname) return nickname

    let attempts = 0
    let isUnique = false
    while (!isUnique && attempts < 100) {
      attempts++
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
      const anim = animals[Math.floor(Math.random() * animals.length)]
      const num = Math.floor(Math.random() * 90 + 10)
      const testName = `${adj} ${anim} ${num}`

      // Check database uniqueness
      const existing = await User.findOne({ anonymousNickname: testName })
      if (!existing) {
        nickname = testName
        isUnique = true
      }
    }

    if (!nickname) {
      nickname = `User ${studentUser._id.toString().substring(18)}`
    }

    studentUser.anonymousNickname = nickname
    await studentUser.save()
    return nickname
  }

  const leaderboard = await Promise.all(cls.students.map(async (student) => {
    // 1. Generate nickname
    const anonName = await generateUniqueNickname(student)

    // 2. Count essays completed in last 7 days
    const essayCount = await Essay.countDocuments({
      student: student._id,
      status: { $ne: 'draft' },
      createdAt: { $gte: oneWeekAgo }
    })

    // 3. Count unique vocabulary words added in last 7 days
    const vocabCount = await Vocabulary.countDocuments({
      student: student._id,
      createdAt: { $gte: oneWeekAgo }
    })

    return {
      studentId: student._id,
      anonymousNickname: anonName,
      essaysCompleted: essayCount,
      vocabAccumulated: vocabCount,
      isCurrentUser: student._id.toString() === req.user._id.toString()
    }
  }))

  // Sort: vocab count desc, essays completed desc
  leaderboard.sort((a, b) => {
    if (b.vocabAccumulated !== a.vocabAccumulated) {
      return b.vocabAccumulated - a.vocabAccumulated
    }
    return b.essaysCompleted - a.essaysCompleted
  })

  // Add rank numbers
  const rankedLeaderboard = leaderboard.map((item, idx) => ({
    rank: idx + 1,
    ...item
  }))

  res.status(200).json({
    success: true,
    data: rankedLeaderboard
  })
})
