import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import {
  startLearningSession,
  getCurrentSession,
  updateSessionStep,
} from '../controllers/learningSession.controller.js'
const router = Router()
router.use(protect, authorize('student'))
router.post('/start', startLearningSession)
router.get('/current', getCurrentSession)
router.put('/:id/step', updateSessionStep)
export default router
