import { Router } from 'express'
import { getDashboard, getStudentAnalytics, getStudentEssays, getStudentVocabulary } from '../controllers/teacher.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { getLexicalErrors } from '../controllers/learningProgress.controller.js'

const router = Router()

router.use(protect)
router.use(authorize('teacher'))
router.get('/classes/:classId/lexical-errors', getLexicalErrors)

router.get('/dashboard', getDashboard)
router.get('/students/:id', getStudentAnalytics)
router.get('/students/:id/essays', getStudentEssays)
router.get('/students/:id/vocabulary', getStudentVocabulary)

export default router
