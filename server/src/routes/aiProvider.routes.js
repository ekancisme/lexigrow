import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import {
  listAIProviders,
  createAIProvider,
  updateAIProvider,
  deleteAIProvider,
  testAIProvider,
  listAIModels,
  createAIModel,
  updateAIModel,
  deleteAIModel,
  listAICombos,
  createAICombo,
  updateAICombo,
  deleteAICombo,
  activateAICombo,
} from '../controllers/aiProvider.controller.js'

const router = Router()
router.use(protect, authorize('admin'))
router.get('/', listAIProviders)
router.post('/', createAIProvider)
router.get('/models', listAIModels)
router.post('/models', createAIModel)
router.patch('/models/:id', updateAIModel)
router.delete('/models/:id', deleteAIModel)
router.get('/combos', listAICombos)
router.post('/combos', createAICombo)
router.patch('/combos/:id', updateAICombo)
router.delete('/combos/:id', deleteAICombo)
router.post('/combos/:id/activate', activateAICombo)
router.patch('/:id', updateAIProvider)
router.delete('/:id', deleteAIProvider)
router.post('/:id/test', testAIProvider)
export default router
