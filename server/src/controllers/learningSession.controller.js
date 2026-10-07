import mongoose from 'mongoose'
import LearningSession from '../models/LearningSession.js'
import LearningSet from '../models/LearningSet.js'
import PracticeAttempt from '../models/PracticeAttempt.js'
import EssayRevision from '../models/EssayRevision.js'
import Essay from '../models/Essay.js'
import Vocabulary from '../models/Vocabulary.js'
import Assignment from '../models/Assignment.js'
import Class from '../models/Class.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  fail,
  text,
  objectId,
  publicLearning,
  integer,
} from '../utils/learning.js'
import { selectAdaptiveTargets, getCompetencySnapshot, invalidateCompetencySnapshot } from '../services/competency.service.js'
export const startLearningSession = asyncHandler(async (req, res) => {
  const active = await LearningSession.findOne({
    student: req.user._id,
    status: 'in_progress',
  })

  // Look at completed sessions to advance sets and avoid word repetition
  const completedSessions = await LearningSession.find({
    student: req.user._id,
    status: 'completed',
  }).select('learningSet learningSetSlug targetWords completedAt').sort({ completedAt: -1 }).lean()

  const completedSlugs = new Set(completedSessions.map(s => s.learningSetSlug).filter(Boolean))

  const adaptiveRequested = req.body.adaptive === true || req.body.mode === 'adaptive' || req.body.recommendationId
  const requestedSlug = req.body.learningSetSlug ? text(req.body.learningSetSlug, 'learningSetSlug', 100) : null
  const wantsAdvance = req.body.advance === true || req.body.reset === true || req.body.abandonActive === true

  if (active) {
    const hasDraftOrEssay = Boolean(active.originalEssay)
    const isCompletedSlug = active.learningSetSlug && completedSlugs.has(active.learningSetSlug)
    const isTopicSwitch = requestedSlug && active.learningSetSlug && active.learningSetSlug !== requestedSlug
    const isModeSwitch = adaptiveRequested && active.sessionType !== 'adaptive_recommendation'

    // If student explicitly wants to advance/reset, or if active session is for an already-completed set without essay,
    // or if student wants to switch topics without a saved essay: abandon stale active session and proceed fresh.
    if (wantsAdvance || (!hasDraftOrEssay && (isCompletedSlug || isTopicSwitch || isModeSwitch))) {
      active.status = 'abandoned'
      await active.save()
    } else {
      return res.json({
        success: true,
        data: publicLearning(active),
        message: 'Continue your current learning session',
      })
    }
  }
  const isStandaloneMongoError = (err) =>
    Boolean(
      err?.message && (
        err.message.includes('Transaction numbers are only allowed on a replica set') ||
        err.message.includes('does not support retryable writes') ||
        err.message.includes('Transaction is not supported')
      )
    )

  if (adaptiveRequested && !req.body.assignmentId) {
    const count = integer(req.body.count, 5, 1, 10)
    const theme = typeof req.body.theme === 'string' && req.body.theme.trim()
      ? req.body.theme.trim().slice(0, 100)
      : 'Adaptive Learning'
    const rationale = typeof req.body.rationale === 'string' ? req.body.rationale.trim().slice(0, 500) : ''
    const { snapshot, targets } = await selectAdaptiveTargets(req.user, {
      count,
      theme,
      requestedWords: req.body.targetWords,
    })
    if (targets.length < 1) fail('No vocabulary available for an adaptive session', 404)
    let created
    const executeCreateAdaptive = async (tx) => {
      const sessionOpts = tx ? { session: tx } : {}
      const [session] = await LearningSession.create([{
        student: req.user._id,
        learningSet: null,
        learningSetSlug: null,
        theme,
        level: snapshot?.level || req.user.learningProfile?.targetLevel || 'B1',
        sessionType: 'adaptive_recommendation',
        targetWords: targets,
        snapshot: {
          targetWords: targets,
          rationale,
          recommendationId: String(req.body.recommendationId || ''),
          competencyVersion: snapshot?.version || null,
        },
      }], sessionOpts)
      for (const word of targets) {
        if (word.wordId?.startsWith('adaptive:')) {
          await Vocabulary.updateOne(
            { student: req.user._id, word: word.word },
            { $setOnInsert: {
              student: req.user._id,
              word: word.word,
              theme,
              definition: word.definition,
              partOfSpeech: word.partOfSpeech,
              ipa: word.phonetic,
              exampleSentence: word.exampleSentences?.[0] || '',
              masteryLevel: 'new',
            } },
            { upsert: true, ...(tx ? { session: tx } : {}) },
          )
        }
      }
      return session
    }

    try {
      created = await mongoose.connection.transaction(executeCreateAdaptive)
    } catch (err) {
      if (isStandaloneMongoError(err)) {
        try {
          created = await executeCreateAdaptive(null)
        } catch (innerErr) {
          if (innerErr.code !== 11000) throw innerErr
          const existing = await LearningSession.findOne({ student: req.user._id, status: 'in_progress' })
          if (!existing) throw innerErr
          return res.json({ success: true, data: publicLearning(existing), message: 'Continue your current learning session' })
        }
      } else if (err.code === 11000) {
        const existing = await LearningSession.findOne({ student: req.user._id, status: 'in_progress' })
        if (!existing) throw err
        return res.json({ success: true, data: publicLearning(existing), message: 'Continue your current learning session' })
      } else {
        throw err
      }
    }
    return res.status(201).json({
      success: true,
      data: publicLearning(created),
      _meta: { source: 'deterministic_competency', isFallback: false, competencyVersion: snapshot?.version || null },
    })
  }
  let assignment = null
  if (req.body.assignmentId) {
    assignment = await Assignment.findById(
      objectId(req.body.assignmentId, 'assignmentId'),
    )
    if (
      !assignment ||
      assignment.status !== 'active' ||
      assignment.dueDate < new Date()
    )
      fail('Assignment unavailable', 404)
    const cls = await Class.findOne({
      _id: assignment.classId,
      students: req.user._id,
      status: 'active',
    })
    if (!cls) fail('Assignment unavailable', 404)
  }
  const recentlyPracticedWords = new Set()
  for (const s of completedSessions.slice(0, 5)) {
    for (const w of s.targetWords || []) {
      if (w.word) recentlyPracticedWords.add(w.word.toLowerCase())
    }
  }

  let set = null
  if (assignment) {
    if (!assignment.learningSetId) fail('Assignment has no learning set')
    set = await LearningSet.findOne({ _id: assignment.learningSetId, status: 'published' }).lean()
  } else if (wantsAdvance || !requestedSlug || (completedSlugs.has(requestedSlug) && !req.body.forceSet)) {
    // Student wants to advance, no slug specified, OR requested set was already completed (and not forceSet):
    // Choose next uncompleted published set matching their level or next in sequence!
    set = await LearningSet.findOne({
      status: 'published',
      slug: { $nin: [...completedSlugs] },
      ...(req.user.learningProfile?.targetLevel ? { level: req.user.learningProfile.targetLevel } : {})
    }).sort({ level: 1, createdAt: 1 }).lean()

    if (!set) {
      set = await LearningSet.findOne({
        status: 'published',
        slug: { $nin: [...completedSlugs] }
      }).sort({ level: 1, createdAt: 1 }).lean()
    }

    if (!set) {
      // If student completed all sets, pick the oldest completed set to cycle through
      const oldestSession = completedSessions[completedSessions.length - 1]
      if (oldestSession?.learningSetSlug) {
        set = await LearningSet.findOne({ slug: oldestSession.learningSetSlug, status: 'published' }).lean()
      }
      if (!set) {
        set = await LearningSet.findOne({ status: 'published' }).sort({ slug: 1 }).lean()
      }
    }
  } else {
    set = await LearningSet.findOne({ slug: requestedSlug, status: 'published' }).lean()
  }

  if (!set && !requestedSlug) {
    set = await LearningSet.findOne({ status: 'published' }).sort({ slug: 1 }).lean()
  }
  if (!set || set.items.length < 1)
    fail('No published learning set available', 404)

  // Query student's vocabulary to know which words they already learned or practiced
  const studentVocab = await Vocabulary.find({ student: req.user._id })
    .select('word masteryLevel reviewCount')
    .lean()
  const masteredOrPracticedWords = new Set(
    studentVocab
      .filter((v) => v.masteryLevel === 'mastered' || (v.reviewCount > 0 && v.masteryLevel !== 'new'))
      .map((v) => v.word.toLowerCase())
  )

  // Filter out recently practiced words AND already mastered words
  let availableItems = (set.items || []).filter(
    (item) => !recentlyPracticedWords.has(item.word.toLowerCase()) && !masteredOrPracticedWords.has(item.word.toLowerCase())
  )
  if (availableItems.length < 3) {
    availableItems = (set.items || []).filter(
      (item) => !recentlyPracticedWords.has(item.word.toLowerCase())
    )
  }
  if (availableItems.length < 3) {
    availableItems = set.items || []
  }

  const targets = availableItems
    .slice(0, 5)
    .map((w, i) => ({
      ...w,
      word: w.word.toLowerCase(),
      wordId: set._id + ':' + i,
    }))
  let created
  const executeCreateCurated = async (tx) => {
    const sessionOpts = tx ? { session: tx } : {}
    const [session] = await LearningSession.create(
      [
        {
          student: req.user._id,
          learningSet: set._id,
          learningSetSlug: set.slug,
          theme: set.category,
          level: set.level,
          setVersion: set.updatedAt,
          targetWords: targets,
          assignment: assignment?._id || null,
          sessionType: assignment ? 'assignment' : 'curated_set',
          snapshot: { targetWords: targets, rationale: set.description || `Practice vocabulary for ${set.title}`, recommendationId: '', competencyVersion: null },
        },
      ],
      sessionOpts,
    )
    for (const w of targets)
      await Vocabulary.updateOne(
        { student: req.user._id, word: w.word },
        {
          $setOnInsert: {
            student: req.user._id,
            word: w.word,
            theme: set.category,
            definition: w.definitionVi,
            partOfSpeech: w.partOfSpeech,
            ipa: w.phonetic,
            exampleSentence: w.exampleSentences?.[0] || '',
            masteryLevel: 'new',
          },
        },
        { upsert: true, ...(tx ? { session: tx } : {}) },
      )
    return session
  }

  try {
    created = await mongoose.connection.transaction(executeCreateCurated)
  } catch (err) {
    if (isStandaloneMongoError(err)) {
      try {
        created = await executeCreateCurated(null)
      } catch (innerErr) {
        if (innerErr.code !== 11000) throw innerErr
        const existing = await LearningSession.findOne({
          student: req.user._id,
          status: 'in_progress',
        })
        if (!existing) throw innerErr
        return res.json({
          success: true,
          data: publicLearning(existing),
          message: 'Continue your current learning session',
        })
      }
    } else if (err.code === 11000) {
      const existing = await LearningSession.findOne({
        student: req.user._id,
        status: 'in_progress',
      })
      if (!existing) throw err
      return res.json({
        success: true,
        data: publicLearning(existing),
        message: 'Continue your current learning session',
      })
    } else {
      throw err
    }
  }
  res.status(201).json({ success: true, data: publicLearning(created) })
})
export const getCurrentSession = asyncHandler(async (req, res) => {
  const session = await LearningSession.findOne({
    student: req.user._id,
    status: 'in_progress',
  })
  res.json({ success: true, data: session ? publicLearning(session) : null })
})
export const getSessionDraft = asyncHandler(async (req, res) => {
  const session = await LearningSession.findOne({
    _id: objectId(req.params.id),
    student: req.user._id,
  }).lean()
  if (!session) fail('Session not found', 404)
  const essay = session.originalEssay
    ? await Essay.findOne({ _id: session.originalEssay, student: req.user._id })
        .select('_id content status updatedAt')
        .lean()
    : null
  res.json({
    success: true,
    data: {
      essayId: essay?._id || null,
      content: essay?.content || '',
      status: essay?.status || null,
      updatedAt: essay?.updatedAt || null,
    },
  })
})
export const saveSessionDraft = asyncHandler(async (req, res) => {
  const session = await LearningSession.findOne({
    _id: objectId(req.params.id),
    student: req.user._id,
  })
  if (!session) fail('Session not found', 404)
  if (session.status !== 'in_progress') fail('Session is no longer active', 409)
  if (typeof req.body.content !== 'string' || req.body.content.length > 10000)
    fail('Invalid draft content')
  const content = req.body.content.replace(/\r\n?/g, '\n').normalize('NFC')
  if (/<[^>]*>/.test(content)) fail('Draft must be plain text')
  const pending = await EssayRevision.exists({
    session: session._id,
    analysisStatus: { $in: ['pending', 'processing'] },
  })
  if (pending) fail('Wait for the current analysis before editing the draft', 409)

  let essay = session.originalEssay
    ? await Essay.findOne({ _id: session.originalEssay, student: req.user._id })
    : null
  if (session.originalEssay && !essay) fail('Linked essay not found', 404)
  if (!essay && !content.trim()) {
    return res.json({ success: true, data: { essayId: null, content: '', status: null } })
  }
  if (!essay) {
    essay = await Essay.create({
      student: req.user._id,
      title: session.learningSetSlug
        ? `${session.learningSetSlug} practice`
        : `${session.theme || 'Learning'} Practice Essay`,
      theme: session.theme || 'General',
      assignment: session.assignment || null,
      content,
      status: 'draft',
    })
    session.originalEssay = essay._id
    await session.save()
  } else if (essay.content !== content || essay.status !== 'draft') {
    essay.content = content
    essay.status = 'draft'
    essay.submittedAt = undefined
    await essay.save()
  }

  res.json({
    success: true,
    data: {
      essayId: essay._id,
      content: essay.content,
      status: essay.status,
      updatedAt: essay.updatedAt,
    },
  })
})
export const updateSessionStep = asyncHandler(async (req, res) => {
  const session = await LearningSession.findOne({
    _id: objectId(req.params.id),
    student: req.user._id,
  })
  if (!session) fail('Session not found', 404)
  const steps = ['lesson', 'practice', 'writing', 'feedback', 'completed']
  const target = req.body.currentStep
  if (target !== undefined && !steps.includes(target))
    fail('Invalid currentStep')
  if (
    req.body.status !== undefined &&
    !['in_progress', 'completed', 'abandoned'].includes(req.body.status)
  )
    fail('Invalid status')
  if (req.body.status === 'abandoned') {
    if (session.status === 'completed') fail('Session already completed', 409)
    session.status = 'abandoned'
  } else {
    if (session.status !== 'in_progress') {
      if (session.status === 'completed' && target === 'completed')
        return res.json({ success: true, data: publicLearning(session) })
      fail('Session is no longer active', 409)
    }
    const next = target || session.currentStep,
      delta = steps.indexOf(next) - steps.indexOf(session.currentStep)
    if (delta < 0 || delta > 1) fail('Complete the current step first', 409)
    if (req.body.status === 'completed' && next !== 'completed')
      fail('Complete feedback first', 409)
    if (next === 'writing') {
      // Student has completed practice and proceeds to writing
    }
    if (['feedback', 'completed'].includes(next)) {
      const reviewed = await EssayRevision.findOne({
        session: session._id,
        student: req.user._id,
      }).sort({ revisionNumber: -1 })
      if (!reviewed || reviewed.analysisStatus !== 'succeeded')
        fail('Submit writing and wait for feedback first', 409)
    }
    session.currentStep = next
    if (next === 'completed') {
      session.status = 'completed'
      session.completedAt = new Date()

      try {
        const practicedWords = (session.targetWords || []).map((w) => w.word?.toLowerCase()).filter(Boolean)
        if (practicedWords.length > 0) {
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
          await Vocabulary.updateMany(
            { student: req.user._id, word: { $in: practicedWords } },
            {
              $set: {
                lastPracticed: new Date(),
                nextReviewDate: tomorrow,
                masteryLevel: 'learning',
              },
              $inc: { reviewCount: 1 },
            },
          )
        }

        const latestRev = await EssayRevision.findOne({
          session: session._id,
          student: req.user._id,
        })
          .sort({ revisionNumber: -1 })
          .lean()

        if (latestRev?.targetWordResults) {
          for (const res of latestRev.targetWordResults) {
            if (res.suggestedUpgrade) {
              const match = res.suggestedUpgrade.match(/"([^"]+)"|'([^']+)'/)
              const upgradedWord = match ? (match[1] || match[2]).toLowerCase().trim() : null
              if (upgradedWord && upgradedWord.length > 2 && upgradedWord.length < 30 && !upgradedWord.includes(' ')) {
                await Vocabulary.updateOne(
                  { student: req.user._id, word: upgradedWord },
                  {
                    $setOnInsert: {
                      student: req.user._id,
                      word: upgradedWord,
                      theme: session.theme || 'Suggested Words',
                      definition: `Gợi ý nâng cao từ bài viết: "${res.word}"`,
                      definitionVi: `Gợi ý nâng cao từ bài viết: "${res.word}"`,
                      partOfSpeech: 'other',
                      masteryLevel: 'new',
                    },
                  },
                  { upsert: true },
                )
              }
            }
          }
        }

        await invalidateCompetencySnapshot(req.user._id)
      } catch (vocabErr) {
        console.error('[SessionCompletion] Error updating vocabulary progress:', vocabErr.message)
      }
    }
  }
  if (req.body.activeTimeSeconds !== undefined) {
    const reported = integer(req.body.activeTimeSeconds, 0, 0, 86400)
    session.activeTimeSeconds = Math.min(
      Math.max(session.activeTimeSeconds, reported),
      Math.max(
        0,
        Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
      ),
    )
  }
  // Optimistic concurrency prevents an old tab from undoing a completed session.
  await session.save()
  res.json({ success: true, data: publicLearning(session) })
})

export const getLearningPathRecommendation = asyncHandler(async (req, res) => {
  const snapshot = await getCompetencySnapshot(req.user, { force: false })
  const { targets } = await selectAdaptiveTargets(req.user, { count: 5 })
  const completedSessions = await LearningSession.countDocuments({ student: req.user._id, status: 'completed' })
  const recommendationId = `adaptive-${String(req.user._id)}-${snapshot?.version || 1}`
  const deterministic = {
    recommendationId,
    targetWords: targets,
    rationale: `Prioritize ${snapshot?.summary?.due || 0} due words, ${snapshot?.summary?.struggling || 0} struggling words, then new CEFR-matched vocabulary.`,
    metrics: snapshot?.summary || {},
  }
  try {
    const { getPersonalizedLearningPath } = await import('../services/aiRecommendation.service.js')
    const recentWords = (snapshot?.words || []).filter((word) => word.state !== 'unseen').slice(0, 20)
    const weakWords = (snapshot?.words || []).filter((word) => word.state === 'struggling' || word.state === 'due').slice(0, 10)
    const recommendationResult = await getPersonalizedLearningPath(req.user, {
      recentWords,
      weakWords,
      completedSessions,
      competencyVersion: snapshot?.version || 1,
    })
    const recommendation = recommendationResult.data
    res.json({
      success: true,
      data: {
        ...recommendation,
        ...deterministic,
        currentLevel: req.user.learningProfile?.targetLevel || 'B1',
        interests: req.user.learningProfile?.interests || [],
        completedSessions,
      },
      _meta: { ...recommendationResult.meta, competencyVersion: snapshot?.version || null },
    })
  } catch (error) {
    console.error('Learning path recommendation error:', error.message)
    res.json({
      success: true,
      data: {
        recommendedLevel: req.user.learningProfile?.targetLevel || 'B1',
        focusAreas: ['vocabulary'],
        suggestedTopics: req.user.learningProfile?.interests || ['general'],
        dailyGoalMinutes: 15,
        nextMilestone: 'Continue your learning journey!',
        learningPlan: 'Continue building vocabulary through daily quests and learning sessions.',
        currentLevel: req.user.learningProfile?.targetLevel || 'B1',
        interests: req.user.learningProfile?.interests || [],
        completedSessions,
        ...deterministic,
      },
      _meta: { source: 'offline_fallback', isFallback: true, competencyVersion: snapshot?.version || null },
    })
  }
})
