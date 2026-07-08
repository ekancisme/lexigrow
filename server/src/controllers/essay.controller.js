import Essay from '../models/Essay.js'
import { processEssayAnalysis, generateTopicsByTheme } from '../services/ai.service.js'
import { getIO } from '../services/socket.service.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * @desc    Create a new essay (draft)
 * @route   POST /api/essays
 * @access  Private (student)
 */
export const createEssay = asyncHandler(async (req, res) => {
  const { title, content, classId, theme } = req.body

  const essay = await Essay.create({
    title,
    content: content || '',
    student: req.user._id,
    class: classId || undefined,
    theme: theme || 'General',
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

  // If the essay was already submitted or reviewed, modifying it resets its status to 'draft' (unless it is needs_revision)
  if (essay.status !== 'draft' && essay.status !== 'needs_revision') {
    essay.status = 'draft'
  }

  const { title, content, theme } = req.body
  if (title !== undefined) essay.title = title
  if (content !== undefined) essay.content = content
  if (theme !== undefined) essay.theme = theme

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

  if (essay.status !== 'draft' && essay.status !== 'needs_revision') {
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

/**
 * @desc    Get AI suggested topics based on a theme
 * @route   GET /api/essays/suggest-topics
 * @access  Private (student)
 */
export const getSuggestedTopics = asyncHandler(async (req, res) => {
  const { theme } = req.query

  if (!theme) {
    throw new ErrorResponse('Please provide a theme in the query parameters', 400)
  }

  // Find all existing essay titles of this student to exclude them from AI suggestion
  const existingEssays = await Essay.find({ student: req.user._id })
    .select('title')
    .sort({ createdAt: -1 })
    .limit(50) // limit to avoid prompt context bloat
  const existingTitles = existingEssays.map(e => e.title).filter(Boolean)

  const topics = await generateTopicsByTheme(theme, existingTitles)
  res.status(200).json({ success: true, data: topics })
})

/**
 * @desc    Request a student to revise their essay
 * @route   PATCH /api/essays/:id/request-revision
 * @access  Private (teacher only)
 */
export const requestRevision = asyncHandler(async (req, res) => {
  if (req.user.role !== 'teacher') {
    throw new ErrorResponse('Not authorized: teachers only', 403)
  }

  const essay = await Essay.findById(req.params.id)
  if (!essay) {
    throw new ErrorResponse('Essay not found', 404)
  }

  essay.status = 'needs_revision'
  await essay.save()

  // Create early warning or standard database notification for the student
  try {
    const Notification = (await import('../models/Notification.js')).default
    if (Notification) {
      await Notification.create({
        recipient: essay.student,
        sender: req.user._id,
        type: 'early_warning',
        title: 'Revision Requested',
        message: `Your teacher requested a revision for essay: "${essay.title}"`,
        relatedItem: essay._id,
        onModel: 'Essay'
      })
    }
  } catch (notiErr) {
    console.error('Could not create revision notification in database:', notiErr.message)
  }

  // Emit Socket event to student
  const io = getIO()
  if (io) {
    io.to(`user:${essay.student}`).emit('notification', {
      type: 'revision_requested',
      essayId: essay._id,
      title: essay.title,
      message: 'Your teacher has requested a revision on your essay.'
    })
  }

  res.status(200).json({ success: true, data: essay, message: 'Revision requested successfully' })
})
