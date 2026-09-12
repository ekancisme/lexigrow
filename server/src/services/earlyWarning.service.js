import User from '../models/User.js'
import Essay from '../models/Essay.js'
import AIAnalysis from '../models/AIAnalysis.js'
import Vocabulary from '../models/Vocabulary.js'
import Alert from '../models/Alert.js'
import Class from '../models/Class.js'
import Assignment from '../models/Assignment.js'
import sendEmail from '../utils/sendEmail.js'
import { createManyNotifications } from './notification.service.js'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const SCAN_BATCH_SIZE = 10
const MIN_GRAMMAR_TOTAL_DROP = 0.5
const MIN_OVERALL_SCORE_TOTAL_DROP = 1
/**
 * Apply `.limit()` + `.lean()` when the query builder supports it, otherwise
 * return the query/promise unchanged (keeps unit-test doubles working).
 */
const finalizeQuery = (query, limit) => {
  if (query && typeof query.lean === 'function') {
    const bounded = typeof query.limit === 'function' ? query.limit(limit) : query
    return bounded.lean()
  }
  return query
}


const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

async function sendEmailWithRetry(options, attempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await sendEmail(options)
      return
    } catch (error) {
      lastError = error
      if (attempt < attempts) await wait(250 * 2 ** (attempt - 1))
    }
  }
  throw lastError
}

/**
 * Check if the student has stagnated in vocabulary growth (0 new words for 4 consecutive weeks)
 */
export const checkVocabularyStagnation = async (studentId, now = new Date(), trackingStartedAt = null) => {
  const fourWeeksAgo = new Date(now.getTime() - 4 * 7 * ONE_DAY_MS)
  if (trackingStartedAt && new Date(trackingStartedAt) > fourWeeksAgo) {
    return {
      isStagnant: false,
      counts: [],
    }
  }

  const counts = await Promise.all(
    Array.from({ length: 4 }, (_, index) => {
      const end = new Date(now.getTime() - index * 7 * ONE_DAY_MS)
      const start = new Date(now.getTime() - (index + 1) * 7 * ONE_DAY_MS)
      return Vocabulary.countDocuments({
        student: studentId,
        createdAt: { $gte: start, $lt: end },
      })
    })
  )

  return {
    isStagnant: counts.every(count => count === 0),
    counts,
  }
}

/**
 * Check if the student has a steady decline in grammar accuracy over the last 3 essays
 */
export const checkGrammarDecline = async (studentId) => {
  const essays = await Essay.find({ student: studentId, status: 'reviewed' })
    .sort({ submittedAt: -1, createdAt: -1 })
    .limit(3)

  if (essays.length < 3) {
    return {
      isDeclining: false,
      scores: []
    }
  }

  const essayIds = essays.map(e => e._id)
  const analyses = await finalizeQuery(AIAnalysis.find({ essay: { $in: essayIds } }), 50)

  // Keep the sorted order of essays (index 0 is most recent, index 2 is oldest of the three)
  const sortedAnalyses = essays.map(essay =>
    analyses.find(a => a.essay.toString() === essay._id.toString())
  ).filter(Boolean)

  if (sortedAnalyses.length < 3) {
    return {
      isDeclining: false,
      scores: []
    }
  }

  const scores = sortedAnalyses.map(a => a.scores?.grammarAccuracy || 0)

  const [newestScore, middleScore, oldestScore] = scores
  const isDeclining = oldestScore > middleScore
    && middleScore > newestScore
    && oldestScore - newestScore >= MIN_GRAMMAR_TOTAL_DROP

  return {
    isDeclining,
    scores
  }
}

/**
 * Check if the overall score has steadily declined over the last 3 reviewed essays.
 */
export const checkOverallScoreDecline = async (studentId) => {
  const essays = await Essay.find({ student: studentId, status: 'reviewed' })
    .sort({ submittedAt: -1, createdAt: -1 })
    .limit(3)

  if (essays.length < 3) {
    return { isDeclining: false, scores: [] }
  }

  const analyses = await finalizeQuery(AIAnalysis.find({ essay: { $in: essays.map(essay => essay._id) } }), 50)
  const sortedAnalyses = essays.map(essay =>
    analyses.find(analysis => analysis.essay.toString() === essay._id.toString())
  ).filter(Boolean)

  if (sortedAnalyses.length < 3) {
    return { isDeclining: false, scores: [] }
  }

  const scores = sortedAnalyses.map(analysis => analysis.overallScore ?? 0)
  const [newestScore, middleScore, oldestScore] = scores
  const isDeclining = oldestScore > middleScore
    && middleScore > newestScore
    && oldestScore - newestScore >= MIN_OVERALL_SCORE_TOTAL_DROP

  return { isDeclining, scores }
}

/**
 * Find assignments whose deadline has passed without a submitted essay.
 */
export const checkMissedAssignmentDeadlines = async (studentId, now = new Date()) => {
  const scanWindowStart = new Date(now.getTime() - 7 * ONE_DAY_MS)
  const classes = await Class.find({ students: studentId, status: 'active' })
    .select('_id')
    .lean()

  if (classes.length === 0) {
    return { hasMissed: false, assignments: [] }
  }

  const assignments = await Assignment.find({
    classId: { $in: classes.map(studentClass => studentClass._id) },
    dueDate: { $gt: scanWindowStart, $lte: now },
  })
    .select('title dueDate')
    .sort({ dueDate: -1 })
    .lean()

  if (assignments.length === 0) {
    return { hasMissed: false, assignments: [] }
  }

  const submittedAssignmentIds = await Essay.distinct('assignment', {
    student: studentId,
    assignment: { $in: assignments.map(assignment => assignment._id) },
    status: { $in: ['submitted', 'reviewed', 'needs_revision'] },
  })
  const submittedIds = new Set(submittedAssignmentIds.map(id => id.toString()))
  const missedAssignments = assignments.filter(assignment => !submittedIds.has(assignment._id.toString()))

  return {
    hasMissed: missedAssignments.length > 0,
    assignments: missedAssignments,
  }
}

/**
 * Run automatic early warning scan for all students in the system
 */
export const runEarlyWarningScan = async () => {
  const startedAt = new Date()
  const summary = {
    startedAt: startedAt.toISOString(),
    finishedAt: null,
    scanned: 0,
    created: 0,
    failed: 0,
    failures: [],
  }

  const batchSize = 100
  let page = 0
  let hasMore = true

  while (hasMore) {
    const rawQuery = User.find({ role: 'student', accountStatus: 'active' })
    const isMongooseQuery = rawQuery && typeof rawQuery.skip === 'function'

    const students = isMongooseQuery
      ? await rawQuery.skip(page * batchSize).limit(batchSize).lean()
      : await finalizeQuery(rawQuery, batchSize)

    if (!students || students.length === 0) {
      hasMore = false
      break
    }

    summary.scanned += students.length

    for (let offset = 0; offset < students.length; offset += SCAN_BATCH_SIZE) {
      const batch = students.slice(offset, offset + SCAN_BATCH_SIZE)
      const results = await Promise.allSettled(batch.map(scanStudent))

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          summary.created += result.value
        } else {
          summary.failed++
          summary.failures.push({
            studentId: batch[index]._id.toString(),
            error: result.reason?.message || 'Unknown scan error',
          })
        }
      })
    }

    // If query is not a chained Mongoose query (e.g. unit test mock) or returned fewer than batchSize
    if (!isMongooseQuery || students.length < batchSize) {
      hasMore = false
    } else {
      page++
    }
  }

  summary.finishedAt = new Date().toISOString()
  return summary
}

/**
 * Create alert in database and notify parent via email
 */
export async function createAndNotifyAlert(student, type, metric, detail) {
  const existingAlert = await Alert.findOne({
    student: student._id,
    metric,
    isResolved: false,
  })

  if (existingAlert) return false

  const studentClass = await finalizeQuery(Class.findOne({ students: student._id, status: 'active' }), 1)
  const teacherId = studentClass?.teacher || null
  const classId = studentClass?._id || null

  // Create alert in DB
  const alert = new Alert({
    student: student._id,
    class: classId,
    teacher: teacherId,
    type,
    metric,
    detail,
    icon: type === 'critical' ? 'alert-triangle' : 'info'
  })

  await alert.save()

  const parents = await finalizeQuery(User.find({ role: 'parent', children: student._id }), 20)
  const notifications = []

  if (teacherId) {
    notifications.push({
      recipient: teacherId,
      sender: null,
      alert: alert._id,
      relatedUser: student._id,
      title: `Learning alert: ${student.name}`,
      message: detail,
      type: 'academic_alert',
      link: '/teacher/alerts',
    })
  }

  for (const parent of parents) {
    notifications.push({
      recipient: parent._id,
      sender: null,
      alert: alert._id,
      relatedUser: student._id,
      title: `Learning alert for ${student.name}`,
      message: detail,
      type: 'academic_alert',
      link: `/parent/children/${student._id}`,
    })
  }

  if (notifications.length > 0) {
    try {
      await createManyNotifications(notifications)
    } catch (error) {
      console.error(`[EarlyWarning] In-app notification failure for ${student._id}:`, error.message)
    }
  }

  for (const parent of parents) {
    if (parent.notifications?.email === false) continue

    try {
      const parentName = escapeHtml(parent.name)
      const studentName = escapeHtml(student.name)
      const safeDetail = escapeHtml(detail)
      await sendEmailWithRetry({
        email: parent.email,
        subject: `[LexiGrow Alert] Cảnh báo học tập của học sinh ${student.name}`,
        message: `Xin chào phụ huynh ${parent.name},\n\nLexiGrow phát hiện cảnh báo cho ${student.name}: ${detail}\n\nVui lòng đăng nhập để xem tiến trình chi tiết.`,
        html: `
          <h3>Xin chào phụ huynh ${parentName},</h3>
          <p>LexiGrow phát hiện cảnh báo sớm cho <strong>${studentName}</strong>:</p>
          <p><strong>${safeDetail}</strong></p>
          <p>Vui lòng đăng nhập để xem tiến trình chi tiết và phối hợp hỗ trợ học sinh.</p>
        `,
      })
    } catch (error) {
      console.error(`[EarlyWarning] Email delivery failed for parent ${parent._id}:`, error.message)
    }
  }

  return true
}

async function scanStudent(student) {
  let created = 0
  const [vocabulary, grammar, overallScore, missedDeadlines] = await Promise.all([
    checkVocabularyStagnation(student._id, new Date(), student.createdAt),
    checkGrammarDecline(student._id),
    checkOverallScoreDecline(student._id),
    checkMissedAssignmentDeadlines(student._id),
  ])

  if (vocabulary.isStagnant) {
    if (await createAndNotifyAlert(
      student,
      'warning',
      'vocabulary_stagnation',
      'Học sinh đã không tích lũy thêm từ mới nào trong 4 tuần liên tiếp.'
    )) created++
  }

  if (grammar.isDeclining) {
    const scores = grammar.scores
    if (await createAndNotifyAlert(
      student,
      'critical',
      'grammar_decline',
      `Độ chính xác ngữ pháp giảm liên tiếp qua 3 bài viết gần nhất (${scores[2].toFixed(1)} -> ${scores[1].toFixed(1)} -> ${scores[0].toFixed(1)}).`
    )) created++
  }

  if (overallScore.isDeclining) {
    const scores = overallScore.scores
    if (await createAndNotifyAlert(
      student,
      'critical',
      'overall_score_decline',
      `Overall writing score declined across the latest three reviewed essays (${scores[2].toFixed(1)} -> ${scores[1].toFixed(1)} -> ${scores[0].toFixed(1)}).`
    )) created++
  }

  if (missedDeadlines.hasMissed) {
    const [latestMissed] = missedDeadlines.assignments
    const additionalCount = missedDeadlines.assignments.length - 1
    if (await createAndNotifyAlert(
      student,
      'warning',
      'missed_assignment_deadline',
      `Assignment "${latestMissed.title}" passed its deadline on ${latestMissed.dueDate.toLocaleDateString('en-GB')}${additionalCount > 0 ? `, with ${additionalCount} more overdue assignment${additionalCount === 1 ? '' : 's'}` : ''}, without a submission.`
    )) created++
  }

  return created
}
