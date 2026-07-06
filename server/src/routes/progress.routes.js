import { Router } from 'express'
import { getOverview, getGrowthChart, getMilestones, getWeeklyComparison } from '../controllers/progress.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('student', 'teacher', 'parent'))

router.get('/overview', getOverview)
router.get('/growth-chart', getGrowthChart)
router.get('/milestones', getMilestones)
router.get('/weekly-comparison', getWeeklyComparison)

export default router
