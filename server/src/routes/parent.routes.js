import { Router } from 'express'
import {
  linkChild,
  getChildren,
  getChildProgress,
  getChildAlerts,
  getChildEssays
} from '../controllers/parent.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('parent'))

router.post('/link', linkChild)
router.get('/children', getChildren)
router.get('/children/:id/progress', getChildProgress)
router.get('/children/:id/alerts', getChildAlerts)
router.get('/children/:id/essays', getChildEssays)

export default router
