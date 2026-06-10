import Alert from '../models/Alert.js'
import Class from '../models/Class.js'
import Essay from '../models/Essay.js'
import AIAnalysis from '../models/AIAnalysis.js'
import Vocabulary from '../models/Vocabulary.js'
import WeeklyGoal from '../models/WeeklyGoal.js'

/**
 * Run alert checks for a teacher's students.
 * This can be triggered after essay submissions or run periodically.
 */
export const runAlertCheck = async (teacherId) => {
  try {
    const classes = await Class.find({ teacher: teacherId }).populate('students', 'name')
    const allStudents = [...new Map(
      classes.flatMap(c => c.students.map(s => [s._id.toString(), { student: s, class: c }]))
    ).values()]

    for (const { student, class: cls } of allStudents) {
      // 1. TTR Declining: compare last 2 submitted essays
      const recentEssays = await Essay.find({ student: student._id, status: { $ne: 'draft' } })
        .sort({ createdAt: -1 }).limit(2)

      if (recentEssays.length >= 2) {
        const [latest, previous] = recentEssays
        const latestAnalysis = await AIAnalysis.findOne({ essay: latest._id })
        const prevAnalysis = await AIAnalysis.findOne({ essay: previous._id })

        if (latestAnalysis && prevAnalysis) {
          const ttrDiff = (latestAnalysis.scores?.vocabularyDiversity || 0) - (prevAnalysis.scores?.vocabularyDiversity || 0)
          if (ttrDiff < -0.15) {
            await createAlertIfNotExists(teacherId, student._id, cls._id, {
              type: 'critical',
              metric: 'TTR Declining',
              detail: `TTR dropped from ${prevAnalysis.scores.vocabularyDiversity.toFixed(2)} to ${latestAnalysis.scores.vocabularyDiversity.toFixed(2)} in recent essays.`,
              icon: 'warning',
            })
          }
        }
      }

      // 2. Inactivity: no submitted essays in 5+ days
      const lastEssay = await Essay.findOne({ student: student._id, status: { $ne: 'draft' } }).sort({ createdAt: -1 })
      if (lastEssay) {
        const daysSinceLastEssay = Math.floor((Date.now() - lastEssay.createdAt) / (1000 * 60 * 60 * 24))
        if (daysSinceLastEssay >= 5) {
          await createAlertIfNotExists(teacherId, student._id, cls._id, {
            type: 'warning',
            metric: 'Inactivity',
            detail: `No new entries for ${daysSinceLastEssay} days.`,
            icon: 'assignment_late',
          })
        }
      }

      // 3. Low TTR: latest TTR < 0.50
      if (recentEssays.length > 0) {
        const latestAnalysis = await AIAnalysis.findOne({ essay: recentEssays[0]._id })
        if (latestAnalysis && (latestAnalysis.scores?.vocabularyDiversity || 0) < 0.5) {
          await createAlertIfNotExists(teacherId, student._id, cls._id, {
            type: 'warning',
            metric: 'Low TTR',
            detail: `TTR below 0.50 threshold (current: ${latestAnalysis.scores.vocabularyDiversity.toFixed(2)}).`,
            icon: 'trending_down',
          })
        }
      }
    }

    // 4. Vocab threshold per class
    for (const cls of classes) {
      const threshold = 100
      let readyCount = 0
      for (const studentId of cls.students) {
        const count = await Vocabulary.countDocuments({ student: studentId })
        if (count >= threshold) readyCount++
      }
      if (readyCount >= cls.students.length * 0.8 && cls.students.length > 0) {
        await createAlertIfNotExists(teacherId, null, cls._id, {
          type: 'success',
          metric: 'Quiz Ready',
          detail: `${readyCount} students reached the vocabulary threshold in ${cls.name}.`,
          icon: 'psychology_alt',
        })
      }
    }
  } catch (error) {
    console.error('Alert check error:', error.message)
  }
}

/**
 * Create alert only if a similar one doesn't exist in the last 7 days
 */
async function createAlertIfNotExists(teacherId, studentId, classId, data) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const existing = await Alert.findOne({
    teacher: teacherId,
    student: studentId,
    metric: data.metric,
    createdAt: { $gte: sevenDaysAgo },
    isResolved: false,
  })

  if (!existing) {
    await Alert.create({
      teacher: teacherId,
      student: studentId,
      class: classId,
      ...data,
    })
  }
}
