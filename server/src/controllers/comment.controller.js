import Comment from '../models/Comment.js'
import Essay from '../models/Essay.js'
import { getIO } from '../services/socket.service.js'

// @desc    Get comments for an essay
// @route   GET /api/comments/essay/:essayId
// @access  Private
export const getComments = async (req, res, next) => {
  try {
    const { essayId } = req.params

    // Check if essay exists
    const essay = await Essay.findById(essayId)
    if (!essay) {
      return res.status(404).json({ success: false, message: 'Essay not found' })
    }

    // Role verification: check if teacher is associated with class, parent is associated with child, or user is student
    const isTeacher = req.user.role === 'teacher'
    const isParent = req.user.role === 'parent'
    const isStudent = req.user.role === 'student' && essay.student.toString() === req.user._id.toString()

    if (isParent) {
      const isLinked = req.user.children && req.user.children.some(childId => childId.toString() === essay.student.toString())
      if (!isLinked) {
        return res.status(403).json({ success: false, message: 'Access denied: not your child' })
      }
    } else if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    // Retrieve comments in chronological order and populate user info
    const comments = await Comment.find({ essay: essayId })
      .sort({ createdAt: 1 })
      .populate('user', 'name role')

    res.status(200).json({ success: true, data: comments })
  } catch (error) {
    next(error)
  }
}

// @desc    Create comment for an essay
// @route   POST /api/comments/essay/:essayId
// @access  Private
export const createComment = async (req, res, next) => {
  try {
    const { essayId } = req.params
    const { content } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' })
    }

    const essay = await Essay.findById(essayId)
    if (!essay) {
      return res.status(404).json({ success: false, message: 'Essay not found' })
    }

    // Access check
    const isTeacher = req.user.role === 'teacher'
    const isParent = req.user.role === 'parent'
    const isStudent = req.user.role === 'student' && essay.student.toString() === req.user._id.toString()

    if (isParent) {
      const isLinked = req.user.children && req.user.children.some(childId => childId.toString() === essay.student.toString())
      if (!isLinked) {
        return res.status(403).json({ success: false, message: 'Access denied: not your child' })
      }
    } else if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const comment = await Comment.create({
      essay: essayId,
      user: req.user._id,
      content: content.trim()
    })

    // Populate user info for socket broadcast and client response
    await comment.populate('user', 'name role')

    // Real-time broadcast to essay room
    const io = getIO()
    if (io) {
      io.to(`essay:${essayId}`).emit('new_comment', comment)
    }

    res.status(201).json({ success: true, data: comment })
  } catch (error) {
    next(error)
  }
}
