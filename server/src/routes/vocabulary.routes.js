import { Router } from 'express'
import { getVocabulary, getVocabStats, getVocabGrowth, updateMastery, createVocabulary } from '../controllers/vocabulary.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('student'))

router.get('/', getVocabulary)
router.post('/', createVocabulary)
router.get('/stats', getVocabStats)
router.get('/growth', getVocabGrowth)
router.patch('/:id', updateMastery)

export default router
