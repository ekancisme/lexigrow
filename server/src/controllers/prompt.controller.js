import SystemPrompt from '../models/SystemPrompt.js'
import { analyzeEssay } from '../services/ai.service.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * @desc    Create a new prompt
 * @route   POST /api/prompts
 * @access  Private (teacher)
 */
export const createPrompt = asyncHandler(async (req, res) => {
  const { name, category, template } = req.body

  const prompt = await SystemPrompt.create({
    name,
    category,
    template,
    teacher: req.user._id,
  })

  res.status(201).json({ success: true, data: prompt })
})

/**
 * @desc    Get all prompts for teacher
 * @route   GET /api/prompts
 * @access  Private (teacher)
 */
export const getPrompts = asyncHandler(async (req, res) => {
  const prompts = await SystemPrompt.find({ teacher: req.user._id })
    .sort({ updatedAt: -1 })

  res.status(200).json({ success: true, count: prompts.length, data: prompts })
})

/**
 * @desc    Get single prompt
 * @route   GET /api/prompts/:id
 * @access  Private (teacher)
 */
export const getPrompt = asyncHandler(async (req, res) => {
  const prompt = await SystemPrompt.findOne({ _id: req.params.id, teacher: req.user._id })
  if (!prompt) throw new ErrorResponse('Prompt not found', 404)

  res.status(200).json({ success: true, data: prompt })
})

/**
 * @desc    Update prompt
 * @route   PUT /api/prompts/:id
 * @access  Private (teacher)
 */
export const updatePrompt = asyncHandler(async (req, res) => {
  const prompt = await SystemPrompt.findOne({ _id: req.params.id, teacher: req.user._id })
  if (!prompt) throw new ErrorResponse('Prompt not found', 404)

  const { name, category, template, status } = req.body
  if (name) prompt.name = name
  if (category) prompt.category = category
  if (template) prompt.template = template
  if (status) prompt.status = status

  await prompt.save()
  res.status(200).json({ success: true, data: prompt })
})

/**
 * @desc    Delete prompt
 * @route   DELETE /api/prompts/:id
 * @access  Private (teacher)
 */
export const deletePrompt = asyncHandler(async (req, res) => {
  const prompt = await SystemPrompt.findOne({ _id: req.params.id, teacher: req.user._id })
  if (!prompt) throw new ErrorResponse('Prompt not found', 404)

  await prompt.deleteOne()
  res.status(200).json({ success: true, message: 'Prompt deleted' })
})

/**
 * @desc    Test prompt with sample text
 * @route   POST /api/prompts/:id/test
 * @access  Private (teacher)
 */
export const testPrompt = asyncHandler(async (req, res) => {
  const prompt = await SystemPrompt.findOne({ _id: req.params.id, teacher: req.user._id })
  if (!prompt) throw new ErrorResponse('Prompt not found', 404)

  const sampleText = req.body.sampleText || 'The rapid advancement of technology has significantly impacted modern education, transforming traditional pedagogical approaches and creating unprecedented opportunities for personalized learning experiences.'

  const result = await analyzeEssay(sampleText, prompt.template)

  // Update last used
  prompt.lastUsed = new Date()
  await prompt.save()

  res.status(200).json({ success: true, data: result })
})
