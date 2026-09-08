import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { submitPractice } from '../controllers/practice.controller.js'
const router = Router()
router.use(protect, authorize('student'))
router.post('/submit', submitPractice)
export default router
