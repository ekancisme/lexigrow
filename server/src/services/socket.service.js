import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Class from '../models/Class.js'

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

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: User ${userId}`)
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
