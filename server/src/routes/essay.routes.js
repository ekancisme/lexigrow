import { Router } from 'express'
import {
  createEssay, getEssays, getEssay,
  updateEssay, submitEssay, deleteEssay,
  getEssaysByStudent, getSuggestedTopics,
  requestRevision, getPasteConfig,
  runAIHelper,
} from '../controllers/essay.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { submitRevision, retryRevision, getRevisions } from '../controllers/essayRevision.controller.js'
import { aiLearningLimiter } from '../middleware/learningRateLimit.js'

const router = Router()

router.use(protect) // All essay routes require authentication
router.post('/submit-revision', authorize('student'), aiLearningLimiter, submitRevision)
router.post('/revisions/:revisionId/analyze', authorize('student'), aiLearningLimiter, retryRevision)
router.post('/:id/revisions', authorize('student'), aiLearningLimiter, submitRevision)
router.get('/:id/revisions', authorize('student'), getRevisions)

router.route('/')
  .post(authorize('student'), createEssay)
  .get(authorize('student'), getEssays)

router.post('/ai-helper', authorize('student'), aiLearningLimiter, runAIHelper)
router.get('/paste-config', authorize('student'), getPasteConfig)
router.get('/suggest-topics', authorize('student'), aiLearningLimiter, getSuggestedTopics)

router.route('/:id')
  .get(getEssay)
  .put(authorize('student'), updateEssay)
  .delete(authorize('student'), deleteEssay)

router.patch('/:id/submit', authorize('student'), submitEssay)
router.patch('/:id/request-revision', authorize('teacher'), requestRevision)

router.get('/student/:studentId', authorize('teacher'), getEssaysByStudent)

export default router
