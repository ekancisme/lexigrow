import { Router } from 'express'
import { getVocabulary, getVocabStats, getVocabGrowth, updateMastery, createVocabulary, batchCreateVocabulary, getDueToday, reviewVocabulary } from '../controllers/vocabulary.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('student'))

router.get('/', getVocabulary)
router.post('/', createVocabulary)
router.post('/batch', batchCreateVocabulary)
router.get('/stats', getVocabStats)
router.get('/growth', getVocabGrowth)
router.get('/due-today', getDueToday)
router.post('/review', reviewVocabulary)
router.patch('/:id', updateMastery)

export default router
