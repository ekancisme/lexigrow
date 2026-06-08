import { Router } from 'express'
import { getDashboard, getStudentAnalytics, getStudentEssays } from '../controllers/teacher.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('teacher'))

router.get('/dashboard', getDashboard)
router.get('/students/:id', getStudentAnalytics)
router.get('/students/:id/essays', getStudentEssays)

export default router
