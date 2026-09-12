import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Class from '../models/Class.js'
import ChatMessage from '../models/ChatMessage.js'
import gameCleanupService from './gameCleanup.service.js'
import { canAccessEssay, canAccessChatRoom } from '../utils/essayAccess.js'

let io = null

/**
 * Initialize Socket.io server
 * @param {Object} server - HTTP Server instance
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    }
  })

  // Middleware to authenticate socket connection using JWT token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token
      if (!token) {
        return next(new Error('Authentication error: Token missing'))
      }

      let jwtToken = token
      if (token.startsWith('Bearer ')) {
        jwtToken = token.split(' ')[1]
      }

      const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)
      if (!user) {
        return next(new Error('Authentication error: User not found'))
      }

      socket.user = user
      next()
    } catch (err) {
      console.error('Socket auth error:', err.message)
      next(new Error('Authentication error: Invalid token'))
    }
  })

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString()
    const userRole = socket.user.role
    console.log(`🔌 Socket connected: User ${userId} (${userRole})`)

    // Join personal room for user-targeted notifications
    socket.join(`user:${userId}`)

    // Join classes rooms for class-wide notifications
    try {
      let classes = []
      if (userRole === 'teacher') {
        classes = await Class.find({ teacher: userId })
      } else if (userRole === 'student') {
        classes = await Class.find({ students: userId })
      } else if (userRole === 'parent') {
        // Parents join rooms for their children's classes
        const parentUser = await User.findById(userId).populate('children')
        if (parentUser && parentUser.children && parentUser.children.length > 0) {
          const childrenIds = parentUser.children.map(c => c._id)
          classes = await Class.find({ students: { $in: childrenIds } })
          
          // Parents also join children's personal rooms to get updates for their children
          for (const childId of childrenIds) {
            const childRoom = `user:${childId.toString()}`
            socket.join(childRoom)
            console.log(`👨‍👩‍👦 Parent ${userId} joined child room: ${childRoom}`)
          }
        }
      }

      for (const cls of classes) {
        const classRoom = `class:${cls._id.toString()}`
        socket.join(classRoom)
        console.log(`🏫 User ${userId} joined class room: ${classRoom}`)
      }
    } catch (error) {
      console.error(`Error joining rooms for user ${userId}:`, error)
    }

    socket.on('join_essay_comments', async (essayId) => {
      try {
        const Essay = (await import('../models/Essay.js')).default
        const essay = await Essay.findById(essayId).select('student')
        if (!essay || !(await canAccessEssay(socket.user, essay))) {
          socket.emit('error', { message: 'Unauthorized' })
          return
        }
        socket.join(`essay:${essayId}`)
        console.log(`💬 User ${userId} joined essay comment room: essay:${essayId}`)
      } catch (err) {
        console.error('join_essay_comments error:', err.message)
        socket.emit('error', { message: 'Unauthorized' })
      }
    })

    socket.on('leave_essay_comments', (essayId) => {
      socket.leave(`essay:${essayId}`)
      console.log(`💬 User ${userId} left essay comment room: essay:${essayId}`)
    })

    // Chat event: send message
    socket.on('send_chat_message', async (data) => {
      try {
        const { content, recipientId, room } = data
        if (!content || content.trim().length === 0) {
          return socket.emit('chat_error', { message: 'Nội dung tin nhắn không được để trống.' })
        }

        const senderId = userId
        const isAdmin = userRole === 'admin'

        let targetRoom = room || 'support'
        let recipient = null

        if (recipientId) {
          const targetUser = await User.findById(recipientId)
          if (!targetUser) {
            return socket.emit('chat_error', { message: 'Người nhận không tồn tại.' })
          }
          if (!isAdmin && targetUser.role !== 'admin') {
            return socket.emit('chat_error', { message: 'Bạn chỉ có thể nhắn tin với bộ phận hỗ trợ.' })
          }
          recipient = recipientId
          targetRoom = `user:${senderId}`
        }
        // LG-10/LG-11: object-level authorization — never let a client inject
        // messages into a room they do not belong to (class:*, essay:*, user:*).
        if (!(await canAccessChatRoom(socket.user, targetRoom))) {
          return socket.emit('chat_error', { message: 'Bạn không có quyền gửi tin nhắn vào phòng này.' })
        }

        // Save to DB
        const message = await ChatMessage.create({
          sender: senderId,
          recipient: recipient,
          room: targetRoom,
          content: content.trim(),
          isRead: false,
        })

        // Populate sender info
        await message.populate('sender', 'name email role avatar')

        // Emit to room
        const io = getIO()
        io.to(targetRoom).emit('chat_message', message.toObject())
        // Deliver direct messages to the recipient's personal room too — otherwise
        // a user-to-user reply only lands in the sender's own room and is lost.
        if (recipient && recipient.toString() !== senderId) {
          io.to(`user:${recipient.toString()}`).emit('chat_message', message.toObject())
        }
        if (targetRoom === 'support' || targetRoom.startsWith('user:')) {
          io.to('admin_support').emit('chat_message', message.toObject())
        }
      } catch (error) {
        console.error('Chat send error:', error)
        socket.emit('chat_error', { message: 'Lỗi gửi tin nhắn.' })
      }
    })

    socket.on('join_chat_room', async (room) => {
      try {
        if (!(await canAccessChatRoom(socket.user, room))) {
          socket.emit('error', { message: 'Unauthorized' })
          return
        }
        socket.join(room)
        console.log(`💬 User ${userId} joined chat room: ${room}`)
      } catch (err) {
        console.error('join_chat_room error:', err.message)
        socket.emit('error', { message: 'Unauthorized' })
      }
    })

    // Admin joins support room automatically (already done above)
    // But we need to ensure admin_support room is created
    // This is handled in the connection logic above, but we also add an explicit join for admin if not already.
    // We'll also allow any user to join support room.

    socket.on('join_game_room', (roomId) => {
      gameCleanupService.joinGameRoom(socket, roomId)
      console.log(`🎮 User ${userId} joined game room: ${roomId}`)
    })

    socket.on('leave_game_room', (roomId) => {
      gameCleanupService.leaveGameRoom(socket, roomId)
      console.log(`🎮 User ${userId} left game room: ${roomId}`)
    })

    socket.on('disconnect', () => {
      gameCleanupService.cleanupSocket(socket)
      console.log(`🔌 Socket disconnected & resources cleaned up: User ${userId}`)
    })
  })

  return io
}

/**
 * Emit event to a specific user room
 * @param {string} userId
 * @param {Object} notification
 */
export const sendNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification)
    console.log(`📡 Emitted notification to user:${userId}`)
  } else {
    console.warn('Socket.io server not initialized. Failed to send notification.')
  }
}

/**
 * Emit event to a specific class room
 * @param {string} classId
 * @param {Object} notification
 */
export const sendNotificationToClass = (classId, notification) => {
  if (io) {
    io.to(`class:${classId}`).emit('notification', notification)
    console.log(`📡 Emitted notification to class:${classId}`)
  } else {
    console.warn('Socket.io server not initialized. Failed to send notification.')
  }
}

/**
 * Broadcast event to everyone
 * @param {Object} notification
 */
export const broadcastNotification = (notification) => {
  if (io) {
    io.emit('notification', notification)
    console.log('📡 Broadcasted notification to everyone')
  } else {
    console.warn('Socket.io server not initialized. Failed to send notification.')
  }
}

/**
 * Accessor for the io server instance
 * @returns {Object}
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}
