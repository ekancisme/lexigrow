import Essay from '../models/Essay.js'
import { processEssayAnalysis } from '../services/ai.service.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * @desc    Create a new essay (draft)
 * @route   POST /api/essays
 * @access  Private (student)
 */
export const createEssay = asyncHandler(async (req, res) => {
  const { title, content, classId } = req.body

  const essay = await Essay.create({
    title,
    content: content || '',
    student: req.user._id,
    class: classId || undefined,
    status: 'draft',
  })

  res.status(201).json({ success: true, data: essay })
})

/**
 * @desc    Get all essays for current student
 * @route   GET /api/essays
 * @access  Private (student)
 */
export const getEssays = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query

  const query = { student: req.user._id }
  if (status) query.status = status

  const essays = await Essay.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))

  const total = await Essay.countDocuments(query)

  res.status(200).json({
    success: true,
    count: essays.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: essays,
  })
})

/**
 * @desc    Get single essay
 * @route   GET /api/essays/:id
 * @access  Private
 */
export const getEssay = asyncHandler(async (req, res) => {
  const essay = await Essay.findById(req.params.id).populate('student', 'name email')

  if (!essay) {
    throw new ErrorResponse('Essay not found', 404)
  }

  // Students can only view their own essays
  if (req.user.role === 'student' && essay.student._id.toString() !== req.user._id.toString()) {
    throw new ErrorResponse('Not authorized to access this essay', 403)
  }

  res.status(200).json({ success: true, data: essay })
})

/**
 * @desc    Update essay (save draft)
 * @route   PUT /api/essays/:id
 * @access  Private (student, owner only)
 */
export const updateEssay = asyncHandler(async (req, res) => {
  let essay = await Essay.findById(req.params.id)

  if (!essay) {
    throw new ErrorResponse('Essay not found', 404)
  }

  if (essay.student.toString() !== req.user._id.toString()) {
    throw new ErrorResponse('Not authorized to update this essay', 403)
  }

  if (essay.status !== 'draft') {
    throw new ErrorResponse('Cannot edit a submitted essay', 400)
  }

  const { title, content } = req.body
  if (title !== undefined) essay.title = title
  if (content !== undefined) essay.content = content

  await essay.save()

  res.status(200).json({ success: true, data: essay })
})

/**
 * @desc    Submit essay for AI analysis
 * @route   PATCH /api/essays/:id/submit
 * @access  Private (student, owner only)
 */
export const submitEssay = asyncHandler(async (req, res) => {
  const essay = await Essay.findById(req.params.id)

  if (!essay) {
    throw new ErrorResponse('Essay not found', 404)
  }

  if (essay.student.toString() !== req.user._id.toString()) {
    throw new ErrorResponse('Not authorized', 403)
  }

  if (essay.status !== 'draft') {
    throw new ErrorResponse('Essay already submitted', 400)
  }

  if (!essay.content || essay.wordCount < 50) {
    throw new ErrorResponse('Essay must have at least 50 words to submit', 400)
  }

  essay.status = 'submitted'
  essay.submittedAt = new Date()
  await essay.save()

  // Trigger AI analysis asynchronously (non-blocking)
  processEssayAnalysis(essay._id, req.user._id, essay.content).catch(err => {
    console.error('Background AI analysis failed:', err.message)
  })

  res.status(200).json({ success: true, data: essay, message: 'Essay submitted successfully' })
})

/**
 * @desc    Delete essay (draft only)
 * @route   DELETE /api/essays/:id
 * @access  Private (student, owner only)
 */
export const deleteEssay = asyncHandler(async (req, res) => {
  const essay = await Essay.findById(req.params.id)

  if (!essay) {
    throw new ErrorResponse('Essay not found', 404)
  }

  if (essay.student.toString() !== req.user._id.toString()) {
    throw new ErrorResponse('Not authorized', 403)
  }

  if (essay.status !== 'draft') {
    throw new ErrorResponse('Cannot delete a submitted essay', 400)
  }

  await essay.deleteOne()

  res.status(200).json({ success: true, message: 'Essay deleted' })
})

/**
 * @desc    Get essays by student ID (for teachers)
 * @route   GET /api/essays/student/:studentId
 * @access  Private (teacher)
 */
export const getEssaysByStudent = asyncHandler(async (req, res) => {
  const essays = await Essay.find({ student: req.params.studentId })
    .sort({ createdAt: -1 })

  res.status(200).json({ success: true, count: essays.length, data: essays })
})
