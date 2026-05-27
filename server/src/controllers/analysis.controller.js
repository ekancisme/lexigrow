import AIAnalysis from '../models/AIAnalysis.js'
import Essay from '../models/Essay.js'
import { processEssayAnalysis } from '../services/ai.service.js'
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

  const analysis = await processEssayAnalysis(essay._id, essay.student, essay.content)

  // Mark essay as reviewed
  essay.status = 'reviewed'
  await essay.save()

  res.status(200).json({ success: true, data: analysis })
})
