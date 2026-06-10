import { Router } from 'express'
import {
  createPrompt, getPrompts, getPrompt,
  updatePrompt, deletePrompt, testPrompt,
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

export default router
