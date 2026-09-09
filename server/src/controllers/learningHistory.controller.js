import asyncHandler from '../utils/asyncHandler.js'
import LearningSession from '../models/LearningSession.js'
import Vocabulary from '../models/Vocabulary.js'
import PracticeAttempt from '../models/PracticeAttempt.js'
import { publicLearning } from '../utils/learning.js'

/**
 * Get learning history for AI recommendation
 * Returns: completed sessions, words learned, mastery stats
 */
export const getLearningHistory = asyncHandler(async (req, res) => {
  const studentId = req.user._id

  // Get completed sessions
  const sessions = await LearningSession.find({
    student: studentId,
    status: 'completed',
  })
    .sort({ completedAt: -1 })
    .limit(50)
    .lean()

  // Get vocabulary stats
  const vocabStats = await Vocabulary.aggregate([
    { $match: { student: studentId } },
    {
      $group: {
        _id: '$masteryLevel',
        count: { $sum: 1 },
      },
    },
  ])

  const masteryStats = {
    new: 0,
    learning: 0,
    mastered: 0,
  }
  vocabStats.forEach((stat) => {
    if (stat._id === 'new') masteryStats.new = stat.count
    else if (stat._id === 'learning') masteryStats.learning = stat.count
    else if (stat._id === 'mastered') masteryStats.mastered = stat.count
  })

  // Get recent practice attempts (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentPractice = await PracticeAttempt.find({
    student: studentId,
    createdAt: { $gte: thirtyDaysAgo },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  const practiceStats = {
    total: recentPractice.length,
    correct: recentPractice.filter((p) => p.isCorrect).length,
    accuracy: recentPractice.length > 0
      ? Math.round((recentPractice.filter((p) => p.isCorrect).length / recentPractice.length) * 100)
      : 0,
  }

  // Get daily activity (count sessions per day)
  const dailyActivity = []
  const sessionMap = {}
  sessions.forEach((s) => {
    const date = s.completedAt ? s.completedAt.toISOString().split('T')[0] : null
    if (date) {
      sessionMap[date] = (sessionMap[date] || 0) + 1
    }
  })
  Object.keys(sessionMap)
    .sort()
    .forEach((date) => {
      dailyActivity.push({ date, sessions: sessionMap[date] })
    })

  // Extract topics from sessions
  const topics = {}
  sessions.forEach((s) => {
    if (s.theme) {
      topics[s.theme] = (topics[s.theme] || 0) + 1
    }
  })
  const topTopics = Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }))

  res.json({
    success: true,
    data: {
      totalSessions: sessions.length,
      totalWords: masteryStats.new + masteryStats.learning + masteryStats.mastered,
      masteryStats,
      practiceStats,
      dailyActivity: dailyActivity.slice(-30),
      topTopics,
      recentSessions: sessions.slice(0, 10).map(publicLearning),
      hasHistory: sessions.length > 0,
    },
  })
})

export default {
  getLearningHistory,
}