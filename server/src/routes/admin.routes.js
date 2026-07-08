import { Router } from 'express'
import { getAuditLogs, getSystemAnalytics, seedMockData } from '../controllers/admin.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('admin'))

router.get('/logs', getAuditLogs)
router.get('/analytics', getSystemAnalytics)
router.post('/logs/seed', seedMockData)

export default router
