import { Router } from 'express'
import {
  getPendingEssays, createFeedback,
  updateFeedback, submitFeedback, getFeedbackByEssay,
} from '../controllers/feedback.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.get('/pending', authorize('teacher'), getPendingEssays)
router.get('/essay/:essayId', getFeedbackByEssay)
router.post('/:essayId', authorize('teacher'), createFeedback)
router.put('/:id', authorize('teacher'), updateFeedback)
router.patch('/:id/submit', authorize('teacher'), submitFeedback)

export default router
