import Comment from '../models/Comment.js'
import Essay from '../models/Essay.js'
import { getIO } from '../services/socket.service.js'
import { canAccessEssay } from '../utils/essayAccess.js'

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

    // Role & ownership verification via centralised access control helper
    const hasAccess = await canAccessEssay(req.user, essay)
    if (!hasAccess) {
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

    // Role & ownership verification via centralised access control helper
    const hasAccess = await canAccessEssay(req.user, essay)
    if (!hasAccess) {
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
