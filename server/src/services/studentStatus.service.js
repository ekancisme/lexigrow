/**
 * studentStatus.service.js
 *
 * Single Source of Truth for classifying a student's learning progress.
 * All screens (Dashboard, Class Detail, Student Analytics) MUST use this
 * service so that the status is always consistent across the application.
 *
 * Classification Rules (in priority order):
 *   DECLINING   → grammarDecline signal is active
 *                 OR vocabStagnation + TTR trend is negative
 *   STAGNATING  → vocabStagnation is active (but no grammar decline)
 *   GROWING     → none of the warning signals are active
 *
 * If there is not enough data to determine any signal, the student is
 * classified as 'stagnating' to avoid over-optimistic counts.
 */

import {
  checkVocabularyStagnation,
  checkGrammarDecline,
} from './earlyWarning.service.js'
import Essay from '../models/Essay.js'
import AIAnalysis from '../models/AIAnalysis.js'

/**
 * Returns { status, signals } for a single student.
 *
 * status  : 'growing' | 'stagnating' | 'declining'
 * signals : {
 *   vocabStagnation : boolean  — zero new words for 4 consecutive weeks
 *   grammarDecline  : boolean  — grammar score dropped across last 3 essays
 *   ttrTrend        : number   — diff of TTR between newest and previous essay
 *                               (positive = improving, negative = worsening)
 * }
 */
export async function classifyStudentStatus(studentId) {
  // Run the two canonical checks from earlyWarning service in parallel
  const [vocabResult, grammarResult] = await Promise.all([
    checkVocabularyStagnation(studentId),
    checkGrammarDecline(studentId),
  ])

  const vocabStagnation = vocabResult.isStagnant
  const grammarDecline  = grammarResult.isDeclining

  // Additionally, compute TTR trend from the last 2 submitted essays
  let ttrTrend = 0
  try {
    const essays = await Essay
      .find({ student: studentId, status: { $ne: 'draft' } })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean()

    if (essays.length === 2) {
      const essayIds = essays.map(e => e._id)
      const analyses = await AIAnalysis.find({ essay: { $in: essayIds } }).lean()

      const getScore = (essayId) => {
        const a = analyses.find(a => a.essay.toString() === essayId.toString())
        return a?.scores?.vocabularyDiversity ?? null
      }

      const newestScore = getScore(essays[0]._id)
      const prevScore   = getScore(essays[1]._id)

      if (newestScore !== null && prevScore !== null) {
        ttrTrend = newestScore - prevScore
      }
    }
  } catch {
    // Non-critical: ttrTrend stays 0 on error
  }

  // ── Classify ──────────────────────────────────────────────────────────
  let status

  if (grammarDecline || (vocabStagnation && ttrTrend < -0.03)) {
    // Concrete decline signal → most severe
    status = 'declining'
  } else if (vocabStagnation) {
    // Not actively declining but stuck
    status = 'stagnating'
  } else if (ttrTrend > 0.02) {
    // Clear positive TTR improvement
    status = 'growing'
  } else {
    // Ambiguous / insufficient data: lean cautiously to stagnating
    status = 'stagnating'
  }

  return {
    status,
    signals: { vocabStagnation, grammarDecline, ttrTrend },
  }
}

/**
 * Convenience helper: classify an array of student IDs in parallel.
 * Returns a Map<studentId_string, classificationResult>.
 */
export async function classifyStudents(studentIds) {
  const results = await Promise.all(
    studentIds.map(async (id) => {
      const idStr = id.toString()
      try {
        const result = await classifyStudentStatus(id)
        return [idStr, result]
      } catch {
        return [idStr, { status: 'stagnating', signals: { vocabStagnation: false, grammarDecline: false, ttrTrend: 0 } }]
      }
    })
  )
  return new Map(results)
}
