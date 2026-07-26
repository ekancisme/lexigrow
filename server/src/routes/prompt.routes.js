import { Router } from 'express'
import {
  createPrompt, getPrompts, getPrompt,
  updatePrompt, deletePrompt, testPrompt,
  activatePrompt, deactivatePrompt,
} from '../controllers/prompt.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('teacher'))

router.route('/')
  .post(createPrompt)
  .get(getPrompts)

router.route('/:id')
  .get(getPrompt)
  .put(updatePrompt)
  .delete(deletePrompt)

router.post('/:id/test', testPrompt)
router.post('/:id/activate', activatePrompt)
router.post('/:id/deactivate', deactivatePrompt)

export default router
