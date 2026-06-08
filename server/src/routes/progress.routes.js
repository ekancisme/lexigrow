import { Router } from 'express'
import { getOverview, getGrowthChart, getMilestones } from '../controllers/progress.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('student'))

router.get('/overview', getOverview)
router.get('/growth-chart', getGrowthChart)
router.get('/milestones', getMilestones)

export default router
