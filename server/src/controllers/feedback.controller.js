import ManualFeedback from '../models/ManualFeedback.js'
import Essay from '../models/Essay.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * @desc    Get essays pending teacher feedback
 * @route   GET /api/feedback/pending
 * @access  Private (teacher)
 */
export const getPendingEssays = asyncHandler(async (req, res) => {
  // Get all student IDs from teacher's classes
  const Class = (await import('../models/Class.js')).default
  const classes = await Class.find({ teacher: req.user._id })
  const studentIds = [...new Set(classes.flatMap(c => c.students.map(s => s.toString())))]

  // Get submitted essays without teacher feedback
  const feedbackEssayIds = await ManualFeedback.find({ teacher: req.user._id }).distinct('essay')

  const pendingEssays = await Essay.find({
    student: { $in: studentIds },
    status: { $in: ['submitted', 'reviewed'] },
    _id: { $nin: feedbackEssayIds },
  })
    .populate('student', 'name email englishLevel')
    .sort({ submittedAt: -1 })

  res.status(200).json({ success: true, count: pendingEssays.length, data: pendingEssays })
})

/**
 * @desc    Create feedback for an essay
 * @route   POST /api/feedback/:essayId
 * @access  Private (teacher)
 */
export const createFeedback = asyncHandler(async (req, res) => {
  const essay = await Essay.findById(req.params.essayId)
  if (!essay) throw new ErrorResponse('Essay not found', 404)

  // Check if feedback already exists
  const existing = await ManualFeedback.findOne({ essay: essay._id, teacher: req.user._id })
  if (existing) throw new ErrorResponse('Feedback already exists for this essay. Use PUT to update.', 400)

  const { scores, feedbackText } = req.body

  const feedback = await ManualFeedback.create({
    essay: essay._id,
    teacher: req.user._id,
    scores: scores || {},
    feedbackText: feedbackText || '',
    status: 'draft',
  })

  res.status(201).json({ success: true, data: feedback })
})

/**
 * @desc    Update feedback
 * @route   PUT /api/feedback/:id
 * @access  Private (teacher)
 */
export const updateFeedback = asyncHandler(async (req, res) => {
  const feedback = await ManualFeedback.findOne({ _id: req.params.id, teacher: req.user._id })
  if (!feedback) throw new ErrorResponse('Feedback not found', 404)

  const { scores, feedbackText } = req.body
  if (scores) feedback.scores = { ...feedback.scores, ...scores }
  if (feedbackText !== undefined) feedback.feedbackText = feedbackText

  await feedback.save()
  res.status(200).json({ success: true, data: feedback })
})

/**
 * @desc    Submit feedback (finalize)
 * @route   PATCH /api/feedback/:id/submit
 * @access  Private (teacher)
 */
export const submitFeedback = asyncHandler(async (req, res) => {
  const feedback = await ManualFeedback.findOne({ _id: req.params.id, teacher: req.user._id })
  if (!feedback) throw new ErrorResponse('Feedback not found', 404)

  feedback.status = 'submitted'
  feedback.submittedAt = new Date()
  await feedback.save()

  // Mark essay as reviewed
  await Essay.findByIdAndUpdate(feedback.essay, { status: 'reviewed' })

  res.status(200).json({ success: true, data: feedback, message: 'Feedback submitted' })
})

/**
 * @desc    Get feedback for a specific essay
 * @route   GET /api/feedback/essay/:essayId
 * @access  Private
 */
export const getFeedbackByEssay = asyncHandler(async (req, res) => {
  const feedback = await ManualFeedback.findOne({ essay: req.params.essayId })
    .populate('teacher', 'name')

  if (!feedback) {
    throw new ErrorResponse('No feedback found for this essay', 404)
  }

  res.status(200).json({ success: true, data: feedback })
})
