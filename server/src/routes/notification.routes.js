import { Router } from 'express'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from '../controllers/notification.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

// Tất cả route đều yêu cầu đăng nhập (student, parent, teacher đều dùng được)
router.use(protect)

router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.patch('/read-all', markAllNotificationsRead)
router.patch('/:id/read', markNotificationRead)

export default router
