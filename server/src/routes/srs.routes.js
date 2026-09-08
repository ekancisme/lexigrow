import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { submitSrsReview, getSrsDue } from '../controllers/srs.controller.js'
const router = Router()
router.use(protect, authorize('student'))
router.post('/review', submitSrsReview)
router.get('/due', getSrsDue)
export default router
