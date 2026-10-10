import { randomUUID } from 'node:crypto'
import AIAnalysis from '../models/AIAnalysis.js'
import Essay from '../models/Essay.js'
import Class from '../models/Class.js'
import SystemPrompt from '../models/SystemPrompt.js'
import { processEssayAnalysis, translateTextToVietnamese } from '../services/ai.service.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import ParentStudentLink from '../models/ParentStudentLink.js'
import { computeContentHash } from '../utils/contentHash.js'

async function authorizedEssay(req, writing = false) {
  const essay = await Essay.findById(req.params.essayId)
  if (!essay) throw new ErrorResponse('Essay not found', 404)
  let allowed = req.user.role === 'admin'
  if (req.user.role === 'student') allowed = String(essay.student) === String(req.user._id)
  if (req.user.role === 'teacher') {
    const cls = await Class.findOne({
      ...(essay.class ? { _id: essay.class } : {}),
      teacher: req.user._id,
      students: essay.student,
      status: 'active',
    })
    allowed = Boolean(cls)
  }
  if (req.user.role === 'parent' && !writing) {
    allowed = Boolean(await ParentStudentLink.findOne({ parent: req.user._id, student: essay.student, status: 'active' }))
  }
  if (!allowed) throw new ErrorResponse('Essay not found', 404)
  return essay
}

/**
 * @desc    Get AI analysis for an essay
 * @route   GET /api/essays/:essayId/analysis
 * @access  Private
 */
export const getAnalysis = asyncHandler(async (req, res) => {
  const essay = await authorizedEssay(req)
  const analysis = await AIAnalysis.findOne({ essay: req.params.essayId })
    .populate('essay', 'title content wordCount')

  if (!analysis) {
    throw new ErrorResponse('Analysis not found for this essay', 404)
  }

  // AI-05/AI-10: Check contentHash if requested by caller or if matchEssay query param is set
  const requestedHash = req.query.contentHash || (req.query.matchEssay === 'true' ? computeContentHash(essay.content) : null)
  const currentEssayHash = computeContentHash(essay.content)
  if (requestedHash && requestedHash !== currentEssayHash) {
    return res.status(409).json({
      success: false,
      pending: false,
      code: 'ANALYSIS_CONTENT_CHANGED',
      message: 'The essay changed while its analysis was being requested.',
      data: null,
    })
  }
  if (requestedHash && (!analysis.contentHash || analysis.contentHash !== requestedHash)) {
    const legacyAnalysisMissingHash = !analysis.contentHash
    return res.status(202).json({
      success: false,
      pending: true,
      needsReanalysis: legacyAnalysisMissingHash,
      reason: legacyAnalysisMissingHash ? 'legacy_analysis_missing_hash' : 'analysis_hash_mismatch',
      message: 'Analysis for this content revision must be generated before it can be displayed.',
      data: null,
    })
  }

  res.status(200).json({ success: true, data: analysis })
})

/**
 * @desc    Trigger re-analysis of an essay
 * @route   POST /api/essays/:essayId/reanalyze
 * @access  Private
 */
export const reanalyze = asyncHandler(async (req, res) => {
  const essay = await authorizedEssay(req, true)

  if (!essay) {
    throw new ErrorResponse('Essay not found', 404)
  }

  if (essay.status === 'draft') {
    throw new ErrorResponse('Cannot analyze a draft essay', 400)
  }

  // AI-11: Distributed lease with owner token and heartbeat across server instances.
  const LOCK_TIMEOUT_MS = 120000
  const lockToken = randomUUID()
  const lockCutoff = new Date(Date.now() - LOCK_TIMEOUT_MS)
  const lockedEssay = await Essay.findOneAndUpdate(
    {
      _id: essay._id,
      $or: [
        { analysisLockAt: null },
        { analysisLockAt: { $exists: false } },
        { analysisLockAt: { $lt: lockCutoff } },
      ],
    },
    { $set: { analysisLockAt: new Date(), analysisLockToken: lockToken } },
    { new: true }
  )

  if (!lockedEssay) {
    throw new ErrorResponse('Re-analysis is already in progress for this essay. Please wait.', 409)
  }

  const heartbeat = setInterval(() => {
    void Essay.updateOne(
      { _id: essay._id, analysisLockToken: lockToken },
      { $set: { analysisLockAt: new Date() } },
    ).catch(() => {})
  }, Math.floor(LOCK_TIMEOUT_MS / 3))
  heartbeat.unref?.()

  try {
    // Load teacher's active system prompt (if any)
    let customPrompt = null
    let promptMeta = null
    try {
      let teacherId = null
      if (essay.class) {
        const cls = await Class.findById(essay.class).select('teacher')
        if (cls) teacherId = cls.teacher
      }
      if (!teacherId) {
        const cls = await Class.findOne({ students: essay.student, status: 'active' }).select('teacher').sort({ updatedAt: -1 })
        if (cls) teacherId = cls.teacher
      }
      if (teacherId) {
        const activePrompt = await SystemPrompt.findOne({ teacher: teacherId, status: 'active' }).sort({ updatedAt: -1 })
        if (activePrompt) {
          customPrompt = activePrompt.template
          promptMeta = { name: activePrompt.name, promptId: activePrompt._id }
        }
      }
    } catch (promptErr) {
      console.error('[Reanalyze] Error loading custom prompt (falling back to default):', promptErr.message)
    }

    const requestId = req.get('Idempotency-Key')?.trim().slice(0, 128) || randomUUID()
    const analysis = await processEssayAnalysis(essay._id, essay.student, essay.content, customPrompt, promptMeta, requestId)

    const stillOwner = await Essay.exists({ _id: essay._id, analysisLockToken: lockToken })
    if (!stillOwner) throw new ErrorResponse('Re-analysis lease expired; retry the request.', 409)

    // Mark essay as reviewed
    essay.status = 'reviewed'
    await essay.save()

    res.status(200).json({ success: true, data: analysis })
  } finally {
    clearInterval(heartbeat)
    await Essay.updateOne(
      { _id: essay._id, analysisLockToken: lockToken },
      { $set: { analysisLockAt: null }, $unset: { analysisLockToken: 1 } },
    ).catch(() => {})
  }
})

/**
 * @desc    Translate selected text to Vietnamese
 * @route   POST /api/analysis/translate
 * @access  Private
 */
export const translateText = asyncHandler(async (req, res) => {
  const { text } = req.body

  if (!text) {
    throw new ErrorResponse('Please provide text to translate', 400)
  }

  const translation = await translateTextToVietnamese(text)
  res.status(200).json({ success: true, translation })
})
