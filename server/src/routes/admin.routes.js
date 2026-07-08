import { Router } from 'express'
import {
  getAuditLogs,
  getSystemAnalytics,
  seedMockData,
  getConfigs,
  updateConfigs,
  getAILogs,
  getAIMonitoringAnalytics
} from '../controllers/admin.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('admin'))

router.get('/logs', getAuditLogs)
router.get('/analytics', getSystemAnalytics)
router.post('/logs/seed', seedMockData)

// Config routes
router.get('/config', getConfigs)
router.put('/config', updateConfigs)

// AI Monitoring routes
router.get('/ai/logs', getAILogs)
router.get('/ai/monitoring', getAIMonitoringAnalytics)

export default router
