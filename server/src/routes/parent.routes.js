import { Router } from 'express'
import {
  createChildLinkCode,
  linkChild,
  unlinkChild,
  getChildren,
  getChildProgress,
  getChildAlerts,
  getChildEssays,
  getChildVocabulary,
} from '../controllers/parent.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { rateLimit } from 'express-rate-limit'

const router = Router()
const linkAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'Too many link attempts. Please try again later.' },
})

router.use(protect)

router.post('/link-code', authorize('student'), createChildLinkCode)
router.post('/link', authorize('parent'), linkAttemptLimiter, linkChild)

router.use(authorize('parent'))
router.get('/children', getChildren)
router.delete('/children/:id/link', unlinkChild)
router.get('/children/:id/progress', getChildProgress)
router.get('/children/:id/alerts', getChildAlerts)
router.get('/children/:id/essays', getChildEssays)
router.get('/children/:id/vocabulary', getChildVocabulary)

export default router
