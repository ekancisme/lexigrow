import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { getActiveAnnouncements, suppressAnnouncementForDay } from '../controllers/announcement.controller.js'

const router = Router()
router.use(protect)
router.get('/active', getActiveAnnouncements)
router.post('/:id/suppress-24h', suppressAnnouncementForDay)
export default router
