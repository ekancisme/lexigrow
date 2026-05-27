import { Router } from 'express'
import { getCurrentGoals, createGoals, updateGoals, getRecommendations } from '../controllers/goals.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('student'))

router.route('/')
  .get(getCurrentGoals)
  .post(createGoals)

router.get('/recommendations', getRecommendations)
router.put('/:id', updateGoals)

export default router
