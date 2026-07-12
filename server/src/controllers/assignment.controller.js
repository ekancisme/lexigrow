import Assignment from '../models/Assignment.js'
import Class from '../models/Class.js'
import Essay from '../models/Essay.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import { createManyNotifications, createNotification } from '../services/notification.service.js'

const parseFutureDueDate = (value) => {
  const dueDate = new Date(value)
  if (Number.isNaN(dueDate.getTime())) {
    throw new ErrorResponse('Please provide a valid due date', 400)
  }
  if (dueDate <= new Date()) {
    throw new ErrorResponse('Due date must be in the future', 400)
  }
  return dueDate
}

/**
 * @desc    Create a new assignment for a class
 * @route   POST /api/assignments
 * @access  Private (teacher)
 */
export const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, dueDate, keywords, classId } = req.body
  const validatedDueDate = parseFutureDueDate(dueDate)

  // Verify the class belongs to this teacher
  const cls = await Class.findById(classId)
  if (!cls) throw new ErrorResponse('Class not found', 404)
  if (cls.teacher.toString() !== req.user._id.toString()) {
    throw new ErrorResponse('Not authorized to create assignments for this class', 403)
  }

  const assignment = await Assignment.create({
    title,
    description: description || '',
    dueDate: validatedDueDate,
    keywords: keywords || [],
    classId,
    teacher: req.user._id,
    status: 'active',
  })

  // Send real-time notifications to all students in the class
  if (cls.students && cls.students.length > 0) {
    const notifications = cls.students.map(studentId => ({
      recipient: studentId,
      sender: req.user._id,
      title: 'New Assignment Assigned',
      message: `Teacher ${req.user.name} has posted a new assignment: "${title}" in class "${cls.name}".`,
      type: 'assignment',
      link: `/student/class/${classId}`,
    }))

    createManyNotifications(notifications).catch(err => {
      console.error('Failed to send assignment notifications:', err.message)
    })
  }

  res.status(201).json({ success: true, data: assignment })
})

/**
 * @desc    Get all assignments for a specific class (teacher view)
 * @route   GET /api/assignments?classId=xxx
 * @access  Private (teacher)
 */
export const getAssignmentsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.query

  if (!classId) throw new ErrorResponse('Please provide a classId query parameter', 400)

  // Verify ownership or enrollment
  const cls = await Class.findById(classId)
  if (!cls) throw new ErrorResponse('Class not found', 404)

  if (req.user.role === 'teacher') {
    if (cls.teacher.toString() !== req.user._id.toString()) {
      throw new ErrorResponse('Not authorized to view assignments for this class', 403)
    }
  } else if (req.user.role === 'student') {
    const isEnrolled = cls.students?.some(studentId => studentId.toString() === req.user._id.toString())
    if (!isEnrolled) {
      throw new ErrorResponse('Not authorized to view assignments for this class', 403)
    }
  }

  const assignments = await Assignment.find({ classId })
    .sort({ createdAt: -1 })

  res.status(200).json({ success: true, count: assignments.length, data: assignments })
})

/**
 * @desc    Get all active assignments for the current student (inbox)
 * @route   GET /api/assignments/inbox
 * @access  Private (student)
 */
export const getAssignmentInbox = asyncHandler(async (req, res) => {
  // Step 1: Find all classes the student is enrolled in
  const enrolledClasses = await Class.find({ students: req.user._id }).select('_id')
  const classIds = enrolledClasses.map(c => c._id)

  if (classIds.length === 0) {
    return res.status(200).json({ success: true, count: 0, data: [] })
  }

  // Step 2: Find active assignments for those classes
  const assignments = await Assignment.find({
    classId: { $in: classIds },
    status: 'active',
  })
    .populate('classId', 'name')
    .populate('teacher', 'name')
    .sort({ dueDate: 1 }) // Nearest deadline first

  res.status(200).json({ success: true, count: assignments.length, data: assignments })
})

/**
 * @desc    Get a single assignment by ID
 * @route   GET /api/assignments/:id
 * @access  Private (teacher, student)
 */
export const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('classId', 'name students')
    .populate('teacher', 'name')

  if (!assignment) throw new ErrorResponse('Assignment not found', 404)

  // Authorization check
  if (req.user.role === 'teacher') {
    if (assignment.teacher._id.toString() !== req.user._id.toString()) {
      throw new ErrorResponse('Not authorized', 403)
    }
  } else if (req.user.role === 'student') {
    // Student must be enrolled in the assignment's class
    const cls = await Class.findById(assignment.classId._id)
    const isEnrolled = cls?.students?.some(s => s.toString() === req.user._id.toString())
    if (!isEnrolled) throw new ErrorResponse('Not authorized', 403)
  }

  res.status(200).json({ success: true, data: assignment })
})

/**
 * @desc    Update an assignment
 * @route   PUT /api/assignments/:id
 * @access  Private (teacher, owner)
 */
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) throw new ErrorResponse('Assignment not found', 404)
  if (assignment.teacher.toString() !== req.user._id.toString()) {
    throw new ErrorResponse('Not authorized', 403)
  }

  const { title, description, dueDate, keywords, status } = req.body
  if (title !== undefined) assignment.title = title
  if (description !== undefined) assignment.description = description
  if (dueDate !== undefined) assignment.dueDate = parseFutureDueDate(dueDate)
  if (keywords !== undefined) assignment.keywords = keywords
  if (status !== undefined) assignment.status = status

  await assignment.save()

  // Send real-time notifications to all students in the class about the update
  const cls = await Class.findById(assignment.classId)
  if (cls && cls.students && cls.students.length > 0) {
    const notifications = cls.students.map(studentId => ({
      recipient: studentId,
      sender: req.user._id,
      title: 'Assignment Updated',
      message: `Teacher ${req.user.name} has updated the assignment: "${assignment.title}" in class "${cls.name}".`,
      type: 'assignment',
      link: `/student/class/${assignment.classId}`,
    }))

    createManyNotifications(notifications).catch(err => {
      console.error('Failed to send assignment update notifications:', err.message)
    })
  }

  // Send a self-notification to the teacher to confirm successful update via notification bell toast
  createNotification({
    recipient: req.user._id,
    sender: req.user._id,
    title: 'Assignment Updated',
    message: `Assignment "${assignment.title}" has been updated successfully.`,
    type: 'assignment',
    link: `/teacher/assignment/${assignment._id}`,
  }).catch(err => {
    console.error('Failed to send teacher self update notification:', err.message)
  })

  res.status(200).json({ success: true, data: assignment })
})

/**
 * @desc    Delete an assignment
 * @route   DELETE /api/assignments/:id
 * @access  Private (teacher, owner)
 */
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) throw new ErrorResponse('Assignment not found', 404)
  if (assignment.teacher.toString() !== req.user._id.toString()) {
    throw new ErrorResponse('Not authorized', 403)
  }

  await assignment.deleteOne()
  res.status(200).json({ success: true, message: 'Assignment deleted' })
})

/**
 * @desc    Get all essays submitted for an assignment
 * @route   GET /api/assignments/:id/submissions
 * @access  Private (teacher)
 */
export const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) throw new ErrorResponse('Assignment not found', 404)
  if (assignment.teacher.toString() !== req.user._id.toString()) {
    throw new ErrorResponse('Not authorized to access submissions of this assignment', 403)
  }

  // Find submitted essays linked to this assignment
  // status: { $ne: 'draft' } -> only show submitted or reviewed essays
  const submissions = await Essay.find({ 
    assignment: req.params.id,
    status: { $ne: 'draft' }
  })
    .populate('student', 'name email')
    .sort({ submittedAt: -1 })

  res.status(200).json({ success: true, count: submissions.length, data: submissions })
})
