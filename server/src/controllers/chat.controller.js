import ChatMessage from '../models/ChatMessage.js'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import { getIO } from '../services/socket.service.js'
import { canAccessChatRoom } from '../utils/essayAccess.js'

/**
 * @desc    Get chat history for a room
 * @route   GET /api/chat/history/:room
 * @access  Private
 */
export const getChatHistory = asyncHandler(async (req, res) => {
  const { room } = req.params
  const { limit = 50, before } = req.query

  // Object-level authorization: admins may read any room; everyone else only
  // the rooms they own or belong to (support, user:<own>, class/essay rooms).
  if (!(await canAccessChatRoom(req.user, room))) {
    throw new ErrorResponse('Bạn không có quyền truy cập phòng chat này.', 403)
  }

  const query = { room }
  if (before) {
    query.createdAt = { $lt: new Date(before) }
  }

  const messages = await ChatMessage.find(query)
    .populate('sender', 'name email role avatar')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean()

  const isAdmin = req.user?.role === 'admin'

  // Mark messages as read if recipient is current user
  if (!isAdmin) {
    await ChatMessage.updateMany(
      { room, recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    )
  }

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages.reverse(), // return in chronological order
  })
})

/**
 * @desc    Send a chat message via REST (fallback for socket)
 * @route   POST /api/chat/message
 * @access  Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, recipientId, room } = req.body

  if (!content || content.trim().length === 0) {
    throw new ErrorResponse('Nội dung tin nhắn không được để trống.', 400)
  }

  const senderId = req.user._id
  const isAdmin = req.user.role === 'admin'

  // Determine room
  let targetRoom = room || 'support'
  let recipient = null

  if (recipientId) {
    // Private chat to a specific user (admin to user or user to admin)
    const targetUser = await User.findById(recipientId)
    if (!targetUser) {
      throw new ErrorResponse('Người nhận không tồn tại.', 404)
    }
    // For non-admin, only allow sending to admin or to themselves? Usually chat is support.
    // We'll allow user to send to admin via support room, or admin to user.
    if (!isAdmin && targetUser.role !== 'admin') {
      throw new ErrorResponse('Bạn chỉ có thể nhắn tin với bộ phận hỗ trợ.', 403)
    }
    recipient = recipientId
    // For private chat with admin, room format: user:{userId}
    targetRoom = `user:${senderId}`
  }

  // Object-level authorization for room-targeted messages (support is open
  // to any authenticated user; other rooms must be ones the sender belongs to).
  if (!(await canAccessChatRoom(req.user, targetRoom))) {
    throw new ErrorResponse('Bạn không có quyền gửi tin nhắn vào phòng này.', 403)
  }

  const message = await ChatMessage.create({
    sender: senderId,
    recipient: recipient,
    room: targetRoom,
    content: content.trim(),
    isRead: false,
  })

  // Populate sender info for realtime event
  const populated = await message.populate('sender', 'name email role avatar')

  // Emit via socket.io
  const io = getIO()
  // Send to the room
  io.to(targetRoom).emit('chat_message', populated.toObject())
  // Also emit to admin support room if this is a support chat
  if (targetRoom === 'support' || targetRoom.startsWith('user:')) {
    io.to('admin_support').emit('chat_message', populated.toObject())
  }

  res.status(201).json({
    success: true,
    data: populated,
  })
})

/**
 * @desc    Get list of chat rooms with unread counts (for admin)
 * @route   GET /api/chat/rooms
 * @access  Private (Admin only)
 */
export const getChatRooms = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ErrorResponse('Chỉ admin mới có quyền xem danh sách phòng chat.', 403)
  }

  // Aggregate distinct rooms with unread count
  const rooms = await ChatMessage.aggregate([
    {
      $group: {
        _id: '$room',
        lastMessageAt: { $max: '$createdAt' },
        unreadCount: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] },
        },
        totalMessages: { $sum: 1 },
      },
    },
    { $sort: { lastMessageAt: -1 } },
  ])

  // Enrich with user info for user rooms
  const enrichedRooms = await Promise.all(
    rooms.map(async (room) => {
      let user = null
      let roomType = 'support'
      if (room._id.startsWith('user:')) {
        const userId = room._id.replace('user:', '')
        user = await User.findById(userId).select('name email role')
        roomType = 'private'
      }
      return {
        room: room._id,
        roomType,
        user,
        lastMessageAt: room.lastMessageAt,
        unreadCount: room.unreadCount,
        totalMessages: room.totalMessages,
      }
    })
  )

  res.status(200).json({
    success: true,
    data: enrichedRooms,
  })
})

/**
 * @desc    Mark all messages in a room as read (for admin)
 * @route   POST /api/chat/rooms/:room/read
 * @access  Private (Admin or room owner)
 */
export const markRoomRead = asyncHandler(async (req, res) => {
  const { room } = req.params

  // Object-level authorization: admins may mark any room read; users only
  // rooms they are allowed to access.
  if (!(await canAccessChatRoom(req.user, room))) {
    throw new ErrorResponse('Bạn không có quyền đánh dấu đọc cho phòng này.', 403)
  }

  const result = await ChatMessage.updateMany(
    { room, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  )

  res.status(200).json({
    success: true,
    message: `Đã đánh dấu ${result.modifiedCount} tin nhắn là đã đọc.`,
    modifiedCount: result.modifiedCount,
  })
})