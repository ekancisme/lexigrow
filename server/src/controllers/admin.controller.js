import AuditLog from '../models/AuditLog.js'
import User from '../models/User.js'
import Essay from '../models/Essay.js'
import Class from '../models/Class.js'
import AIAnalysis from '../models/AIAnalysis.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'

/**
 * @desc    Get paginated audit logs with filters
 * @route   GET /api/admin/logs
 * @access  Private (Admin)
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 10
  const skip = (page - 1) * limit

  const { action, role, startDate, endDate, search } = req.query
  const query = {}

  // 1. Filter by role
  if (role) {
    const usersWithRole = await User.find({ role }).select('_id')
    query.user = { $in: usersWithRole.map(u => u._id) }
  }

  // 2. Filter by search (user name or email)
  if (search) {
    const matchedUsers = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id')

    const matchedIds = matchedUsers.map(u => u._id)
    if (query.user) {
      const existingIds = query.user.$in.map(id => id.toString())
      query.user = { $in: matchedIds.filter(id => existingIds.includes(id.toString())) }
    } else {
      query.user = { $in: matchedIds }
    }
  }

  // 3. Filter by action
  if (action) {
    query.action = action
  }

  // 4. Filter by date range
  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate)
    if (endDate) query.createdAt.$lte = new Date(endDate)
  }

  const total = await AuditLog.countDocuments(query)
  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email role avatar')

  res.status(200).json({
    success: true,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: logs
  })
})

/**
 * @desc    Get system analytics counts and chart data
 * @route   GET /api/admin/analytics
 * @access  Private (Admin)
 */
export const getSystemAnalytics = asyncHandler(async (req, res) => {
  // 1. Simple Counts
  const totalUsers = await User.countDocuments()
  const totalEssays = await Essay.countDocuments({ status: { $ne: 'draft' } })
  const totalClasses = await Class.countDocuments()

  // 2. Active role counts
  const studentsCount = await User.countDocuments({ role: 'student' })
  const teachersCount = await User.countDocuments({ role: 'teacher' })
  const parentsCount = await User.countDocuments({ role: 'parent' })

  // 3. Overall average essay grade
  const analyses = await AIAnalysis.find().select('overallScore')
  const avgScore = analyses.length > 0
    ? Math.round((analyses.reduce((sum, a) => sum + (a.overallScore || 0), 0) / analyses.length) * 10) / 10
    : 0

  // 4. User Registration Growth over time (grouped by week)
  const userGrowth = await User.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" }
        },
        count: { $sum: 1 },
        date: { $min: "$createdAt" }
      }
    },
    { $sort: { "_id.year": 1, "_id.week": 1 } },
    { $limit: 10 }
  ])

  // Format week registrations
  const userGrowthData = userGrowth.map(item => ({
    label: `W${item._id.week}, ${item._id.year}`,
    count: item.count
  }))

  // 5. Essay submissions trend (grouped by date)
  const essaySubmissions = await Essay.aggregate([
    { $match: { status: { $ne: 'draft' } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: { $ifNull: ["$submittedAt", "$createdAt"] }
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 15 }
  ])

  const essaySubmissionData = essaySubmissions.map(item => ({
    label: item._id,
    count: item.count
  }))

  // 6. Score distribution (0-2, 2-4, 4-6, 6-8, 8-10)
  const scoreBuckets = await AIAnalysis.aggregate([
    {
      $bucket: {
        groupBy: "$overallScore",
        boundaries: [0, 2, 4, 6, 8, 10.1],
        default: 10,
        output: {
          count: { $sum: 1 }
        }
      }
    }
  ])

  const scoreMap = { 0: '0-2', 2: '2-4', 4: '4-6', 6: '6-8', 8: '8-10' }
  const scoreDistributionData = Object.keys(scoreMap).map(boundary => {
    const bucket = scoreBuckets.find(b => b._id === Number(boundary))
    return {
      range: scoreMap[boundary],
      count: bucket ? bucket.count : 0
    }
  })

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalUsers,
        totalEssays,
        totalClasses,
        avgScore,
        roles: {
          student: studentsCount,
          teacher: teachersCount,
          parent: parentsCount
        }
      },
      charts: {
        userGrowth: userGrowthData,
        essaySubmissions: essaySubmissionData,
        scoreDistribution: scoreDistributionData
      }
    }
  })
})

/**
 * @desc    Seed mock data for audit logs and system analytics charts
 * @route   POST /api/admin/logs/seed
 * @access  Private (Admin)
 */
export const seedMockData = asyncHandler(async (req, res) => {
  // Ensure we have some users, classes, essays, analysis, and logs to show
  const adminUser = req.user

  // 1. Create a mock teacher
  let teacher = await User.findOne({ role: 'teacher' })
  if (!teacher) {
    teacher = await User.create({
      name: 'Nguyễn Văn Dạy',
      email: 'teacher.mock@lexigrow.edu.vn',
      password: 'password123',
      role: 'teacher',
      institution: 'Hanoi University'
    })
  }

  // 2. Create a mock student
  let student = await User.findOne({ role: 'student' })
  if (!student) {
    student = await User.create({
      name: 'Trần Văn Học',
      email: 'student.mock@lexigrow.edu.vn',
      password: 'password123',
      role: 'student',
      englishLevel: 'B1'
    })
  }

  // 3. Create mock classes
  let cls = await Class.findOne()
  if (!cls) {
    cls = await Class.create({
      name: 'IELTS Advanced 2026',
      description: 'Lớp luyện thi IELTS cấp tốc',
      schedule: 'T2/T4/T6 19:30',
      teacher: teacher._id,
      students: [student._id]
    })
  }

  // 4. Create historical essays & AI analysis records
  const essayCount = await Essay.countDocuments()
  if (essayCount < 10) {
    const titles = [
      'The Impact of Fast Food on Health',
      'Should Education be Free for Everyone?',
      'Online Learning vs Traditional Classrooms',
      'Renewable Energy is the Future',
      'The Influence of Social Media on Teenagers',
      'Should Animals be Kept in Zoos?',
      'The Role of Technology in Modern Agriculture',
      'Public Transport and City Air Quality',
      'Benefits of Learning a Foreign Language',
      'Artificial Intelligence in Healthcare'
    ]

    const baseDate = new Date()
    for (let i = 0; i < titles.length; i++) {
      const submittedDate = new Date(baseDate)
      submittedDate.setDate(baseDate.getDate() - (10 - i))

      const essay = await Essay.create({
        title: titles[i],
        content: `Writing about ${titles[i]} has become a major subject of research and study. There are various viewpoints concerning this matter. Firstly, some people argue that the benefits are undeniable. However, others suggest that negative consequences outweigh these advantages. In this essay, I will discuss both sides and present my own perspective.`,
        status: 'reviewed',
        student: student._id,
        class: cls._id,
        wordCount: 150 + (i * 12),
        paragraphCount: 4,
        sentenceCount: 12 + i,
        readingTime: 1,
        submittedAt: submittedDate,
        createdAt: submittedDate
      })

      // Create AI Analysis
      const score = 4.5 + (i * 0.5) // scores from 4.5 to 9.0
      await AIAnalysis.create({
        essay: essay._id,
        overallScore: score,
        scores: {
          vocabularyDiversity: 0.45 + (i * 0.03),
          grammarAccuracy: Math.min(10, Math.floor(score)),
          coherence: Math.min(10, Math.floor(score - 0.5)),
          complexityIndex: Math.min(10, Math.floor(score + 0.5)),
          lexicalDiversityHdd: 0.55 + (i * 0.02),
          lexicalDiversityMtld: 45 + (i * 3)
        },
        writingStats: {
          avgSentenceLength: 15,
          uniqueWords: 80 + (i * 5)
        }
      })
    }
  }

  // 5. Create historical audit logs
  const logCount = await AuditLog.countDocuments()
  if (logCount < 15) {
    const actions = [
      { action: 'CREATE_CLASS', targetType: 'Class', details: { name: 'IELTS Advanced 2026' } },
      { action: 'ADD_STUDENT', targetType: 'Class', details: { studentEmail: 'student.mock@lexigrow.edu.vn', className: 'IELTS Advanced 2026' } },
      { action: 'CREATE_PROMPT', targetType: 'SystemPrompt', details: { name: 'IELTS Band Scoring System' } },
      { action: 'UPDATE_PROMPT', targetType: 'SystemPrompt', details: { name: 'IELTS Band Scoring System', field: 'template' } },
      { action: 'RESOLVE_ALERT', targetType: 'Alert', details: { alertType: 'Stagnating Vocabulary', studentName: 'Trần Văn Học' } },
      { action: 'LOCK_USER', targetType: 'User', details: { targetUserEmail: 'spammer@lexigrow.com', reason: 'Spam comments' } },
      { action: 'APPROVE_USER', targetType: 'User', details: { targetUserEmail: 'teacher.new@lexigrow.edu.vn', role: 'teacher' } }
    ]

    const baseDate = new Date()
    for (let i = 0; i < 20; i++) {
      const logDate = new Date(baseDate)
      logDate.setHours(baseDate.getHours() - (i * 4)) // logs spread over a few days

      const act = actions[i % actions.length]
      await AuditLog.create({
        user: adminUser._id,
        action: act.action,
        targetType: act.targetType,
        details: act.details,
        createdAt: logDate
      })
    }
  }

  res.status(200).json({
    success: true,
    message: 'Mock analytical and audit data successfully seeded!'
  })
})
