import { Router } from 'express'
import { getAlerts, markAsRead, markAsResolved, getAlertStats } from '../controllers/alert.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('teacher'))

router.get('/', getAlerts)
router.get('/stats', getAlertStats)
router.patch('/:id/read', markAsRead)
router.patch('/:id/resolve', markAsResolved)

export default router
