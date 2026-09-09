import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import {
  startLearningSession,
  getCurrentSession,
  updateSessionStep,
  getLearningPathRecommendation,
} from '../controllers/learningSession.controller.js'
import { getLearningHistory } from '../controllers/learningHistory.controller.js'

const router = Router()
router.use(protect, authorize('student'))
router.post('/start', startLearningSession)
router.get('/current', getCurrentSession)
router.put('/:id/step', updateSessionStep)
router.get('/recommendation', getLearningPathRecommendation)
router.get('/history', getLearningHistory)
export default router
