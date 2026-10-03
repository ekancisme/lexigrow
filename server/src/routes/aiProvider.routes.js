import { Router } from 'express'
import { protect, authorize } from '../middleware/auth.middleware.js'
import {
  listAIProviders,
  createAIProvider,
  updateAIProvider,
  deleteAIProvider,
  testAIProvider,
} from '../controllers/aiProvider.controller.js'

const router = Router()
router.use(protect, authorize('admin'))
router.get('/', listAIProviders)
router.post('/', createAIProvider)
router.patch('/:id', updateAIProvider)
router.delete('/:id', deleteAIProvider)
router.post('/:id/test', testAIProvider)
export default router
