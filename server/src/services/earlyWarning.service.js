import User from '../models/User.js'
import Essay from '../models/Essay.js'
import AIAnalysis from '../models/AIAnalysis.js'
import Vocabulary from '../models/Vocabulary.js'
import Alert from '../models/Alert.js'
import Class from '../models/Class.js'
import sendEmail from '../utils/sendEmail.js'

/**
 * Check if the student has stagnated in vocabulary growth (0 new words for 4 consecutive weeks)
 */
export const checkVocabularyStagnation = async (studentId) => {
  const now = new Date()
  const oneDay = 24 * 60 * 60 * 1000

  const week1End = now
  const week1Start = new Date(now.getTime() - 7 * oneDay)

  const week2End = week1Start
  const week2Start = new Date(now.getTime() - 14 * oneDay)

  const week3End = week2Start
  const week3Start = new Date(now.getTime() - 21 * oneDay)

  const week4End = week3Start
  const week4Start = new Date(now.getTime() - 28 * oneDay)

  const counts = await Promise.all([
    Vocabulary.countDocuments({ student: studentId, createdAt: { $gte: week1Start, $lte: week1End } }),
    Vocabulary.countDocuments({ student: studentId, createdAt: { $gte: week2Start, $lt: week2End } }),
    Vocabulary.countDocuments({ student: studentId, createdAt: { $gte: week3Start, $lt: week3End } }),
    Vocabulary.countDocuments({ student: studentId, createdAt: { $gte: week4Start, $lt: week4End } })
  ])

  const isStagnant = counts.every(count => count === 0)

  return {
    isStagnant,
    counts
  }
}

/**
 * Check if the student has a steady decline in grammar accuracy over the last 3 essays
 */
export const checkGrammarDecline = async (studentId) => {
  const essays = await Essay.find({ student: studentId, status: 'reviewed' })
    .sort({ createdAt: -1 })
    .limit(3)

  if (essays.length < 3) {
    return {
      isDeclining: false,
      scores: []
    }
  }

  const essayIds = essays.map(e => e._id)
  const analyses = await AIAnalysis.find({ essay: { $in: essayIds } })

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

  // Decline means older score > middle score > newest score
  // Index 0: newest, Index 1: middle, Index 2: oldest
  const isDeclining = scores[2] > scores[1] && scores[1] > scores[0]

  return {
    isDeclining,
    scores
  }
}

/**
 * Run automatic early warning scan for all students in the system
 */
export const runEarlyWarningScan = async () => {
  console.log('Starting early warning system scan...')
  try {
    const students = await User.find({ role: 'student' })
    let alertCount = 0

    for (const student of students) {
      // 1. Check vocabulary stagnation
      const vocabCheck = await checkVocabularyStagnation(student._id)
      if (vocabCheck.isStagnant) {
        await createAndNotifyAlert(
          student,
          'warning',
          'vocabulary_stagnation',
          'Học sinh đã không tích lũy thêm từ mới nào trong 4 tuần liên tiếp.'
        )
        alertCount++
      }

      // 2. Check grammar decline
      const grammarCheck = await checkGrammarDecline(student._id)
      if (grammarCheck.isDeclining) {
        const s = grammarCheck.scores
        await createAndNotifyAlert(
          student,
          'critical',
          'grammar_decline',
          `Độ chính xác ngữ pháp của học sinh giảm liên tiếp qua 3 bài viết gần nhất (${s[2].toFixed(1)} -> ${s[1].toFixed(1)} -> ${s[0].toFixed(1)}).`
        )
        alertCount++
      }
    }

    console.log(`Early warning scan completed. Created ${alertCount} alerts/notifications.`)
  } catch (error) {
    console.error('Error during early warning scan:', error)
  }
}

/**
 * Create alert in database and notify parent via email
 */
async function createAndNotifyAlert(student, type, metric, detail) {
  // Find class and teacher
  const studentClass = await Class.findOne({ students: student._id })
  let teacherId = null
  let classId = null

  if (studentClass) {
    teacherId = studentClass.teacher
    classId = studentClass._id
  } else {
    // Find any teacher as a fallback to avoid validation error
    const anyTeacher = await User.findOne({ role: 'teacher' })
    if (anyTeacher) {
      teacherId = anyTeacher._id
    }
  }

  if (!teacherId) {
    console.warn(`No teacher found to assign early warning alert for student: ${student.name}`)
    return
  }

  // Check if a similar active alert was created recently to avoid duplicate alerts (e.g., in the last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const existingAlert = await Alert.findOne({
    student: student._id,
    metric,
    isResolved: false,
    createdAt: { $gte: oneDayAgo }
  })

  if (existingAlert) {
    return
  }

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

  // Find linked parents
  const parents = await User.find({ role: 'parent', children: student._id })
  for (const parent of parents) {
    try {
      await sendEmail({
        email: parent.email,
        subject: `[LexiGrow Alert] Cảnh báo học tập của học sinh ${student.name}`,
        message: `Xin chào phụ huynh ${parent.name},\n\nHệ thống LexiGrow phát hiện cảnh báo sớm cho con của bạn (${student.name}):\n- Chi tiết: ${detail}\n\nVui lòng đăng nhập vào hệ thống LexiGrow để theo dõi thêm tiến trình của con.\n\nTrân trọng,\nĐội ngũ LexiGrow`,
        html: `
          <h3>Xin chào phụ huynh ${parent.name},</h3>
          <p>Hệ thống LexiGrow phát hiện cảnh báo sớm cho con của bạn (<strong>${student.name}</strong>):</p>
          <ul>
            <li><strong>Loại cảnh báo:</strong> ${metric === 'grammar_decline' ? 'Độ chính xác ngữ pháp suy giảm' : 'Tốc độ tích lũy từ vựng chững lại'}</li>
            <li><strong>Chi tiết:</strong> ${detail}</li>
          </ul>
          <p>Vui lòng đăng nhập vào hệ thống LexiGrow để theo dõi thêm tiến trình của con.</p>
          <br/>
          <p>Trân trọng,<br/><strong>Đội ngũ LexiGrow</strong></p>
        `
      })
    } catch (err) {
      console.error(`Failed to send alert email to parent ${parent.email}:`, err)
    }
  }
}
