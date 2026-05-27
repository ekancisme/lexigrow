import Class from '../models/Class.js'
import User from '../models/User.js'
import Essay from '../models/Essay.js'
import AIAnalysis from '../models/AIAnalysis.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * @desc    Create a new class
 * @route   POST /api/classes
 * @access  Private (teacher)
 */
export const createClass = asyncHandler(async (req, res) => {
  const { name, description, schedule } = req.body

  const cls = await Class.create({
    name,
    description,
    schedule,
    teacher: req.user._id,
  })

  res.status(201).json({ success: true, data: cls })
})

/**
 * @desc    Get all classes for teacher
 * @route   GET /api/classes
 * @access  Private (teacher)
 */
export const getClasses = asyncHandler(async (req, res) => {
  const query = req.user.role === 'teacher'
    ? { teacher: req.user._id }
    : { students: req.user._id }

  const classes = await Class.find(query)
    .populate('students', 'name email englishLevel')
    .sort({ createdAt: -1 })

  // Enrich with metrics
  const enriched = await Promise.all(classes.map(async (cls) => {
    const classObj = cls.toObject()
    const studentIds = cls.students.map(s => s._id)

    // Calculate avg TTR
    if (studentIds.length > 0) {
      const essays = await Essay.find({ student: { $in: studentIds }, status: { $ne: 'draft' } }).distinct('_id')
      const analyses = await AIAnalysis.find({ essay: { $in: essays } })
      const avgTTR = analyses.length > 0
        ? Math.round((analyses.reduce((sum, a) => sum + (a.scores?.vocabularyDiversity || 0), 0) / analyses.length) * 100) / 100
        : 0
      classObj.avgTTR = avgTTR
    } else {
      classObj.avgTTR = 0
    }

    classObj.studentCount = studentIds.length
    return classObj
  }))

  res.status(200).json({ success: true, count: enriched.length, data: enriched })
})

/**
 * @desc    Get single class detail with roster
 * @route   GET /api/classes/:id
 * @access  Private (teacher)
 */
export const getClassDetail = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id)
    .populate('students', 'name email englishLevel')

  if (!cls) {
    throw new ErrorResponse('Class not found', 404)
  }

  if (cls.teacher.toString() !== req.user._id.toString()) {
    throw new ErrorResponse('Not authorized', 403)
  }

  // Get per-student metrics
  const roster = await Promise.all(cls.students.map(async (student) => {
    const essays = await Essay.find({ student: student._id, status: { $ne: 'draft' } })
    const essayIds = essays.map(e => e._id)
    const analyses = await AIAnalysis.find({ essay: { $in: essayIds } })

    const avgTTR = analyses.length > 0
      ? Math.round((analyses.reduce((sum, a) => sum + (a.scores?.vocabularyDiversity || 0), 0) / analyses.length) * 100) / 100
      : 0

    // Growth: compare last 2 analyses
    let growth = '0%'
    let status = 'stagnating'
    if (analyses.length >= 2) {
      const sorted = analyses.sort((a, b) => b.createdAt - a.createdAt)
      const diff = (sorted[0].scores?.vocabularyDiversity || 0) - (sorted[1].scores?.vocabularyDiversity || 0)
      const pct = Math.round(diff * 100)
      growth = `${pct >= 0 ? '+' : ''}${pct}%`
      status = pct > 0 ? 'growing' : pct < -5 ? 'declining' : 'stagnating'
    } else if (analyses.length === 1) {
      status = 'growing'
      growth = '+0%'
    }

    return {
      _id: student._id,
      name: student.name,
      email: student.email,
      level: student.englishLevel || 'N/A',
      essays: essays.length,
      ttr: avgTTR,
      growth,
      status,
    }
  }))

  // Class-level metrics
  const allEssays = await Essay.find({ student: { $in: cls.students.map(s => s._id) }, status: { $ne: 'draft' } })
  const avgWordsPerEssay = allEssays.length > 0
    ? Math.round(allEssays.reduce((sum, e) => sum + e.wordCount, 0) / allEssays.length)
    : 0

  res.status(200).json({
    success: true,
    data: {
      ...cls.toObject(),
      roster,
      metrics: {
        avgWordsPerEssay,
        totalEssays: allEssays.length,
        studentCount: cls.students.length,
      },
    },
  })
})

/**
 * @desc    Update class
 * @route   PUT /api/classes/:id
 * @access  Private (teacher, owner)
 */
export const updateClass = asyncHandler(async (req, res) => {
  let cls = await Class.findById(req.params.id)

  if (!cls) throw new ErrorResponse('Class not found', 404)
  if (cls.teacher.toString() !== req.user._id.toString()) throw new ErrorResponse('Not authorized', 403)

  const { name, description, schedule, status } = req.body
  if (name) cls.name = name
  if (description !== undefined) cls.description = description
  if (schedule !== undefined) cls.schedule = schedule
  if (status) cls.status = status

  await cls.save()
  res.status(200).json({ success: true, data: cls })
})

/**
 * @desc    Delete class
 * @route   DELETE /api/classes/:id
 * @access  Private (teacher, owner)
 */
export const deleteClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id)
  if (!cls) throw new ErrorResponse('Class not found', 404)
  if (cls.teacher.toString() !== req.user._id.toString()) throw new ErrorResponse('Not authorized', 403)

  await cls.deleteOne()
  res.status(200).json({ success: true, message: 'Class deleted' })
})

/**
 * @desc    Add student to class by email
 * @route   POST /api/classes/:id/students
 * @access  Private (teacher)
 */
export const addStudent = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id)
  if (!cls) throw new ErrorResponse('Class not found', 404)
  if (cls.teacher.toString() !== req.user._id.toString()) throw new ErrorResponse('Not authorized', 403)

  const student = await User.findOne({ email: req.body.email, role: 'student' })
  if (!student) throw new ErrorResponse('Student not found with that email', 404)

  if (cls.students.includes(student._id)) {
    throw new ErrorResponse('Student already in this class', 400)
  }

  cls.students.push(student._id)
  await cls.save()

  res.status(200).json({ success: true, data: cls })
})

/**
 * @desc    Remove student from class
 * @route   DELETE /api/classes/:id/students/:studentId
 * @access  Private (teacher)
 */
export const removeStudent = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id)
  if (!cls) throw new ErrorResponse('Class not found', 404)
  if (cls.teacher.toString() !== req.user._id.toString()) throw new ErrorResponse('Not authorized', 403)

  cls.students = cls.students.filter(s => s.toString() !== req.params.studentId)
  await cls.save()

  res.status(200).json({ success: true, data: cls })
})
