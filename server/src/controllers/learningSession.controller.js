import mongoose from 'mongoose'
import LearningSession from '../models/LearningSession.js'
import LearningSet from '../models/LearningSet.js'
import PracticeAttempt from '../models/PracticeAttempt.js'
import EssayRevision from '../models/EssayRevision.js'
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
export const startLearningSession = asyncHandler(async (req, res) => {
  const active = await LearningSession.findOne({
    student: req.user._id,
    status: 'in_progress',
  })
  if (active)
    return res.json({
      success: true,
      data: publicLearning(active),
      message: 'Continue your current learning session',
    })
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
  let query = { status: 'published' }
  if (assignment) {
    if (!assignment.learningSetId) fail('Assignment has no learning set')
    query._id = assignment.learningSetId
  } else if (req.body.learningSetSlug !== undefined)
    query.slug = text(req.body.learningSetSlug, 'learningSetSlug', 100)
  else {
    query.level = req.user.learningProfile?.targetLevel || 'B1'
    if (req.user.learningProfile?.interests?.length)
      query.category = { $in: req.user.learningProfile.interests }
  }
  let set = await LearningSet.findOne(query).sort({ slug: 1 }).lean()
  if (!set && !assignment && req.body.learningSetSlug === undefined)
    set = await LearningSet.findOne({ status: 'published' })
      .sort({ slug: 1 })
      .lean()
  if (!set || set.items.length < 1)
    fail('No published learning set available', 404)
  const targets = set.items
    .slice(0, 5)
    .map((w, i) => ({
      ...w,
      word: w.word.toLowerCase(),
      wordId: set._id + ':' + i,
    }))
  let created
  try {
    created = await mongoose.connection.transaction(async (tx) => {
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
          },
        ],
        { session: tx },
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
          { upsert: true, session: tx },
        )
      return session
    })
  } catch (err) {
    if (err.code !== 11000) throw err
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
      const practiced = await PracticeAttempt.distinct('wordId', {
        session: session._id,
        student: req.user._id,
      })
      if (session.targetWords.some((w) => !practiced.includes(w.wordId)))
        fail('Practice every target word first', 409)
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
  try {
    const { getPersonalizedLearningPath } = await import('../services/aiRecommendation.service.js')

    // Get student's learning data
    const [recentWords, weakWords, completedSessions] = await Promise.all([
      Vocabulary.find({ student: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Vocabulary.find({ student: req.user._id, masteryLevel: { $in: ['new', 'learning'] } })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      LearningSession.countDocuments({ student: req.user._id, status: 'completed' }),
    ])

    const recommendation = await getPersonalizedLearningPath(req.user, {
      recentWords,
      weakWords,
      completedSessions,
    })

    res.json({
      success: true,
      data: {
        ...recommendation,
        currentLevel: req.user.learningProfile?.targetLevel || 'B1',
        interests: req.user.learningProfile?.interests || [],
        completedSessions,
      },
    })
  } catch (error) {
    console.error('Learning path recommendation error:', error.message)
    // Fallback response
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
        completedSessions: 0,
      },
    })
  }
})
