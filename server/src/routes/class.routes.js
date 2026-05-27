import { Router } from 'express'
import {
  createClass, getClasses, getClassDetail,
  updateClass, deleteClass, addStudent, removeStudent,
} from '../controllers/class.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.route('/')
  .post(authorize('teacher'), createClass)
  .get(authorize('teacher', 'student'), getClasses)

router.route('/:id')
  .get(authorize('teacher'), getClassDetail)
  .put(authorize('teacher'), updateClass)
  .delete(authorize('teacher'), deleteClass)

router.post('/:id/students', authorize('teacher'), addStudent)
router.delete('/:id/students/:studentId', authorize('teacher'), removeStudent)

export default router
