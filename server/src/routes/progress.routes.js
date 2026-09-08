import { Router } from 'express'
import { getOverview, getGrowthChart, getMilestones, getWeeklyComparison } from '../controllers/progress.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { getActiveVocabulary, getWordEvidence } from '../controllers/learningProgress.controller.js'

const router = Router()

router.use(protect)
router.use(authorize('student', 'teacher', 'parent'))
router.get('/active-vocabulary', authorize('student'), getActiveVocabulary)
router.get('/evidence', authorize('student'), getWordEvidence)
router.get('/evidence/:word', authorize('student'), getWordEvidence)

router.get('/overview', getOverview)
router.get('/growth-chart', getGrowthChart)
router.get('/milestones', getMilestones)
router.get('/weekly-comparison', getWeeklyComparison)

export default router
