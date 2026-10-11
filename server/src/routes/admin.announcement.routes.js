import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from '../controllers/announcement.controller.js'

const router = Router()
router.use(protect, authorize('admin'))
router.get('/', listAnnouncements)
router.post('/', createAnnouncement)
router.patch('/:id', updateAnnouncement)
router.delete('/:id', deleteAnnouncement)
export default router
