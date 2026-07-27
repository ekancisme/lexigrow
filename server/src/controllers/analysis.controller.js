import AIAnalysis from '../models/AIAnalysis.js'
import Essay from '../models/Essay.js'
import Class from '../models/Class.js'
import SystemPrompt from '../models/SystemPrompt.js'
import { processEssayAnalysis, translateTextToVietnamese } from '../services/ai.service.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * @desc    Get AI analysis for an essay
 * @route   GET /api/essays/:essayId/analysis
 * @access  Private
 */
export const getAnalysis = asyncHandler(async (req, res) => {
  const analysis = await AIAnalysis.findOne({ essay: req.params.essayId })
    .populate('essay', 'title content wordCount')

  if (!analysis) {
    throw new ErrorResponse('Analysis not found for this essay', 404)
  }

  res.status(200).json({ success: true, data: analysis })
})

/**
 * @desc    Trigger re-analysis of an essay
 * @route   POST /api/essays/:essayId/reanalyze
 * @access  Private
 */
export const reanalyze = asyncHandler(async (req, res) => {
  const essay = await Essay.findById(req.params.essayId)

  if (!essay) {
    throw new ErrorResponse('Essay not found', 404)
  }

  if (essay.status === 'draft') {
    throw new ErrorResponse('Cannot analyze a draft essay', 400)
  }

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

  const analysis = await processEssayAnalysis(essay._id, essay.student, essay.content, customPrompt, promptMeta)

  // Mark essay as reviewed
  essay.status = 'reviewed'
  await essay.save()

  res.status(200).json({ success: true, data: analysis })
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
