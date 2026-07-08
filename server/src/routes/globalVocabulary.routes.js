import { Router } from 'express'
import {
  getGlobalVocabularies,
  getGlobalVocabularyById,
  createGlobalVocabulary,
  updateGlobalVocabulary,
  deleteGlobalVocabulary,
  importGlobalVocabularies,
  exportGlobalVocabularies
} from '../controllers/globalVocabulary.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('admin'))

router.route('/')
  .get(getGlobalVocabularies)
  .post(createGlobalVocabulary)

router.post('/import', importGlobalVocabularies)
router.get('/export', exportGlobalVocabularies)

router.route('/:id')
  .get(getGlobalVocabularyById)
  .put(updateGlobalVocabulary)
  .delete(deleteGlobalVocabulary)

export default router
