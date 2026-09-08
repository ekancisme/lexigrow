import { Router } from 'express'
import {
  getLearningSets,
  getLearningSetBySlug,
  createLearningSet,
  updateLearningSet,
  deleteLearningSet
} from '../controllers/learningSet.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.route('/')
  .get(getLearningSets)
  .post(authorize('admin'), createLearningSet)

router.route('/:slug')
  .get(getLearningSetBySlug)
  .put(authorize('admin'), updateLearningSet)
  .delete(authorize('admin'), deleteLearningSet)

export default router
