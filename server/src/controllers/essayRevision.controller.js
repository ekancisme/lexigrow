import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import Essay from '../models/Essay.js'
import EssayRevision from '../models/EssayRevision.js'
import LearningSession from '../models/LearningSession.js'
import Assignment from '../models/Assignment.js'
import Class from '../models/Class.js'
import asyncHandler from '../utils/asyncHandler.js'
import { fail, objectId, text, hash, requestKey } from '../utils/learning.js'
import { transactIntent } from '../services/learningTransaction.service.js'
import {
  analyzeVocabulary,
  compareRevisions,
  validateAnalysis,
} from '../services/vocabularyAnalysis.service.js'
import { recordEvidence } from '../services/wordEvidence.service.js'

const writingContent = (body) => {
  const content = text(body.content, 'content', 10000)
    .replace(/\r\n?/g, '\n')
    .normalize('NFC')
  if (/<[^>]*>/.test(content)) fail('Submit plain text, not HTML')
  const wordCount = content.split(/\s+/).length
  if (wordCount < 60 || wordCount > 100)
    fail('Writing must contain 60–100 words')
  return { content, wordCount }
}
async function prepareRevision(req) {
  const { content, wordCount } = writingContent(req.body),
    key = requestKey(req)
  const originalId = req.params.id ? objectId(req.params.id) : null
  // Authorize the parent before validating fields that disclose its structure.
  let parent
  if (originalId) {
    parent = await Essay.findOne({ _id: originalId, student: req.user._id })
    if (!parent) fail('Essay not found', 404)
  }
  const sessionId = originalId
    ? null
    : objectId(req.body.sessionId, 'sessionId')
  const payload = {
    content,
    sessionId: sessionId ? String(sessionId) : null,
    essayId: originalId ? String(originalId) : null,
    targetWords: req.body.targetWords ?? null,
  }
  if (
    payload.targetWords !== null &&
    (!Array.isArray(payload.targetWords) ||
      payload.targetWords.length > 5 ||
      payload.targetWords.some((w) => typeof w !== 'string'))
  )
    fail('Invalid targetWords')
  return transactIntent(req.user._id, 'revision', key, payload, async (tx) => {
    const session = await LearningSession.findOne(
      originalId
        ? { originalEssay: originalId, student: req.user._id }
        : { _id: sessionId, student: req.user._id },
    ).session(tx)
    if (!session) fail('Session not found', 404)
    if (
      session.status !== 'in_progress' ||
      !['writing', 'feedback'].includes(session.currentStep)
    )
      fail('Session is not ready for writing', 409)
    const targets = session.targetWords.map((w) => w.word)
    if (
      payload.targetWords &&
      (new Set(payload.targetWords).size !== targets.length ||
        payload.targetWords.some((w) => !targets.includes(w)))
    )
      fail('Target words must match the learning session')
    const pending = await EssayRevision.exists({
      session: session._id,
      analysisStatus: { $in: ['pending', 'processing'] },
    }).session(tx)
    if (pending) fail('Finish analysis of the pending revision first', 409)
    let essay
    if (session.originalEssay) {
      essay = await Essay.findOne({
        _id: session.originalEssay,
        student: req.user._id,
      }).session(tx)
      if (!essay) fail('Essay not found', 404)
      if (!originalId)
        fail('Use the essay revisions endpoint for corrections', 409)
    } else {
      if (originalId) fail('Essay is not linked to a learning session', 409)
      let classId = null
      if (session.assignment) {
        const assignment = await Assignment.findOne({
          _id: session.assignment,
          status: 'active',
        }).session(tx)
        if (!assignment || assignment.dueDate < new Date())
          fail('Assignment unavailable', 409)
        const cls = await Class.findOne({
          _id: assignment.classId,
          students: req.user._id,
          status: 'active',
        }).session(tx)
        if (!cls) fail('Assignment unavailable', 404)
        classId = cls._id
      }
      const [created] = await Essay.create(
        [
          {
            student: req.user._id,
            title: session.learningSetSlug + ' practice',
            theme: session.theme,
            assignment: session.assignment,
            class: classId,
            content,
            status: 'submitted',
            submittedAt: new Date(),
          },
        ],
        { session: tx },
      )
      essay = created
      session.originalEssay = essay._id
    }
    essay.revisionCounter = (essay.revisionCounter || 0) + 1
    essay.content = content
    essay.status = 'submitted'
    await essay.save({ session: tx })
    const [revision] = await EssayRevision.create(
      [
        {
          student: req.user._id,
          originalEssay: essay._id,
          session: session._id,
          revisionNumber: essay.revisionCounter,
          content,
          wordCount,
          contentHash: hash(content),
          targetWords: targets,
          assisted: essay.revisionCounter > 1,
        },
      ],
      { session: tx },
    )
    await session.save({ session: tx })
    return { revisionId: revision._id }
  })
}
async function processRevision(id, user) {
  const claimToken = randomUUID(),
    now = new Date()
  let revision = await EssayRevision.findOneAndUpdate(
    {
      _id: id,
      student: user._id,
      $or: [
        { analysisStatus: { $in: ['pending', 'failed'] } },
        { analysisStatus: 'processing', processingUntil: { $lt: now } },
      ],
    },
    {
      $set: {
        analysisStatus: 'processing',
        processingToken: claimToken,
        processingUntil: new Date(Date.now() + 60000),
      },
    },
    { returnDocument: 'after' },
  )
  if (!revision) {
    revision = await EssayRevision.findOne({ _id: id, student: user._id })
    if (!revision) fail('Revision not found', 404)
    if (revision.analysisStatus === 'succeeded') return revision
    fail('Revision analysis is already running; retry shortly', 409)
  }
  try {
    const session = await LearningSession.findById(revision.session)
    const generated = await analyzeVocabulary(
      revision.content,
      revision.targetWords,
      {
        meanings: session.targetWords.map((w) => ({
          word: w.word,
          meaning: w.definitionVi,
          partOfSpeech: w.partOfSpeech,
        })),
      },
    )
    const analysis = validateAnalysis(
      generated,
      revision.content,
      revision.targetWords,
    )
    const previous = await EssayRevision.findOne({
      originalEssay: revision.originalEssay,
      revisionNumber: { $lt: revision.revisionNumber },
      analysisStatus: 'succeeded',
    }).sort({ revisionNumber: -1 })
    const comparison = compareRevisions(previous?.analysis, analysis)
    await mongoose.connection.transaction(async (tx) => {
      const current = await EssayRevision.findOne({
        _id: id,
        processingToken: claimToken,
        analysisStatus: 'processing',
      }).session(tx)
      if (!current) fail('Analysis claim expired', 409)
      await recordEvidence(
        current,
        session,
        analysis,
        user.learningProfile?.timezone || 'Asia/Ho_Chi_Minh',
        tx,
      )
      current.analysis = analysis
      current.targetWordResults = analysis.targetWordResults
      current.feedbackSummary = analysis.summary
      current.comparison = comparison
      current.analysisStatus = 'succeeded'
      current.errorCode = undefined
      await current.save({ session: tx })
      await LearningSession.updateOne(
        { _id: session._id, status: 'in_progress' },
        { $set: { currentStep: 'feedback' } },
        { session: tx },
      )
      await Essay.updateOne(
        { _id: current.originalEssay },
        { $set: { status: 'reviewed' } },
        { session: tx },
      )
    })
    return await EssayRevision.findById(id)
  } catch (err) {
    await EssayRevision.updateOne(
      { _id: id, processingToken: claimToken, analysisStatus: 'processing' },
      { $set: { analysisStatus: 'failed', errorCode: 'ANALYSIS_FAILED' } },
    )
    throw err
  }
}
export const submitRevision = asyncHandler(async (req, res) => {
  const prepared = await prepareRevision(req)
  try {
    const revision = await processRevision(prepared.result.revisionId, req.user)
    res
      .status(prepared.replayed ? 200 : 201)
      .json({ success: true, data: revision })
  } catch (err) {
    if (err.statusCode === 502 || err.statusCode === 503)
      return res
        .status(err.statusCode)
        .json({
          success: false,
          error: err.message,
          revisionId: prepared.result.revisionId,
          retryUrl:
            '/api/essays/revisions/' + prepared.result.revisionId + '/analyze',
        })
    throw err
  }
})
export const retryRevision = asyncHandler(async (req, res) => {
  const revision = await processRevision(
    objectId(req.params.revisionId),
    req.user,
  )
  res.json({ success: true, data: revision })
})
export const getRevisions = asyncHandler(async (req, res) => {
  const essay = await Essay.findOne({
    _id: objectId(req.params.id),
    student: req.user._id,
  })
  if (!essay) fail('Essay not found', 404)
  const revisions = await EssayRevision.find({
    originalEssay: essay._id,
    student: req.user._id,
  })
    .sort({ revisionNumber: -1 })
    .limit(100)
  res.json({ success: true, data: revisions })
})
