import { Router } from 'express'
import { getAnalysis, reanalyze, translateText } from '../controllers/analysis.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { aiLearningLimiter } from '../middleware/learningRateLimit.js'

const router = Router()

router.use(protect)

router.get('/:essayId/analysis', getAnalysis)
router.post('/:essayId/reanalyze', aiLearningLimiter, reanalyze)
router.post('/translate', aiLearningLimiter, translateText)

export default router
