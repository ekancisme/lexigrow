import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { getGardenStatus } from '../controllers/learningProgress.controller.js'
const router = Router()
router.use(protect, authorize('student'))
router.get('/status', getGardenStatus)
export default router
