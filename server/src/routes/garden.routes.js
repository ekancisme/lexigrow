import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { getGardenStatus, waterGarden } from '../controllers/learningProgress.controller.js'
const router = Router()
router.use(protect, authorize('student'))
router.get('/status', getGardenStatus)
router.post('/water', waterGarden)
export default router
