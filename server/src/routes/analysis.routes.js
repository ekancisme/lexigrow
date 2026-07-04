import { Router } from 'express'
import { getAnalysis, reanalyze, translateText } from '../controllers/analysis.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.get('/:essayId/analysis', getAnalysis)
router.post('/:essayId/reanalyze', reanalyze)
router.post('/translate', translateText)

export default router
