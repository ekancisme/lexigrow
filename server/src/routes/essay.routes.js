import { Router } from 'express'
import {
  createEssay, getEssays, getEssay,
  updateEssay, submitEssay, deleteEssay,
  getEssaysByStudent,
} from '../controllers/essay.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect) // All essay routes require authentication

router.route('/')
  .post(authorize('student'), createEssay)
  .get(authorize('student'), getEssays)

router.route('/:id')
  .get(getEssay)
  .put(authorize('student'), updateEssay)
  .delete(authorize('student'), deleteEssay)

router.patch('/:id/submit', authorize('student'), submitEssay)

router.get('/student/:studentId', authorize('teacher'), getEssaysByStudent)

export default router
