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
import {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  resetUserPassword,
  deleteUser,
  getPendingApprovals,
  approveUser,
  rejectUser,
} from '../controllers/admin.user.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('admin'))

// ── System / Audit ────────────────────────────────────────
router.get('/logs',           getAuditLogs)
router.get('/analytics',      getSystemAnalytics)
router.post('/logs/seed',     seedMockData)

// ── Config routes ─────────────────────────────────────────
router.get('/config',         getConfigs)
router.put('/config',         updateConfigs)

// ── AI Monitoring routes ──────────────────────────────────
router.get('/ai/logs',        getAILogs)
router.get('/ai/monitoring',  getAIMonitoringAnalytics)

// ── User Management routes ────────────────────────────────
router.get('/users',                          getUsers)
router.get('/users/:id',                      getUserById)
router.patch('/users/:id/status',             updateUserStatus)
router.patch('/users/:id/role',               updateUserRole)
router.post('/users/:id/reset-password',      resetUserPassword)
router.delete('/users/:id',                   deleteUser)

// ── Approval routes ───────────────────────────────────────
router.get('/approvals',                      getPendingApprovals)
router.post('/approvals/:id/approve',         approveUser)
router.post('/approvals/:id/reject',          rejectUser)

export default router
