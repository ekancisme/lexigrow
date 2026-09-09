import { Router } from 'express'
import {
  getChatHistory,
  sendMessage,
  getChatRooms,
  markRoomRead,
} from '../controllers/chat.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

// All chat routes require authentication
router.use(protect)

// Get chat history for a room (user's own support room or admin access)
router.get('/history/:room', getChatHistory)

// Send a message (REST fallback)
router.post('/message', sendMessage)

// Admin only: get list of all chat rooms with unread counts
router.get('/rooms', authorize('admin'), getChatRooms)

// Mark all messages in a room as read
router.post('/rooms/:room/read', markRoomRead)

export default router