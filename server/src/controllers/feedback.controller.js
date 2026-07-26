import ManualFeedback from '../models/ManualFeedback.js'
import Essay from '../models/Essay.js'
import AIAnalysis from '../models/AIAnalysis.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * Helper: sync teacher-adjusted scores back to AIAnalysis so the student
 * sees updated numbers and overall score immediately after the teacher saves.
 */
async function syncTeacherScoresToAnalysis(essayId, scores) {
  if (!scores) return
  try {
    const analysis = await AIAnalysis.findOne({ essay: essayId })
    if (!analysis) return

    const { grammar, vocabulary, coherence, complexity } = scores
    if (grammar !== undefined) analysis.scores.grammarAccuracy = Number(grammar)
    if (vocabulary !== undefined) analysis.scores.vocabularyDiversity = Number(vocabulary)
    if (coherence !== undefined) analysis.scores.coherence = Number(coherence)
    if (complexity !== undefined) analysis.scores.complexityIndex = Number(complexity)

    // Recalculate overall score as average of 4 metrics (all out of 10)
    const g = Number(analysis.scores.grammarAccuracy) || 0
    const v = Number(analysis.scores.vocabularyDiversity) || 0
    const c = Number(analysis.scores.coherence) || 0
    const cx = Number(analysis.scores.complexityIndex) || 0

    analysis.overallScore = Math.round(((g + v + c + cx) / 4) * 10) / 10

    await analysis.save()
  } catch (err) {
    console.error('Error syncing teacher scores to AIAnalysis:', err.message)
  }
}

/**
 * @desc    Get essays pending teacher feedback
 * @route   GET /api/feedback/pending
 * @access  Private (teacher)
 */
export const getPendingEssays = asyncHandler(async (req, res) => {
  const Class = (await import('../models/Class.js')).default
  const classes = await Class.find({ teacher: req.user._id })
  const studentIds = [...new Set(classes.flatMap(c => c.students.map(s => s.toString())))]

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

  if (scores) {
    await syncTeacherScoresToAnalysis(essay._id, scores)
  }

  res.status(201).json({ success: true, data: feedback })
})

/**
 * @desc    Update feedback (save draft)
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

  if (scores) {
    await syncTeacherScoresToAnalysis(feedback.essay, scores)
  }

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

  // Sync teacher scores to AIAnalysis
  if (feedback.scores) {
    await syncTeacherScoresToAnalysis(feedback.essay, feedback.scores)
  }

  // Mark essay as reviewed
  const essay = await Essay.findByIdAndUpdate(feedback.essay, { status: 'reviewed' }, { new: true })

  // Send real-time notification to student
  if (essay) {
    const { createNotification } = await import('../services/notification.service.js')
    createNotification({
      recipient: essay.student,
      sender: req.user._id,
      title: 'Teacher Written Feedback',
      message: `Teacher ${req.user.name} has provided written feedback on your essay "${essay.title}".`,
      type: 'feedback',
      link: `/student/feedback?id=${essay._id}`,
    }).catch(err => {
      console.error('Failed to send feedback notification:', err.message)
    })
  }

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
