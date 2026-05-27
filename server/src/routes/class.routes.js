import { Router } from 'express'
import {
  createClass, getClasses, getClassDetail,
  updateClass, deleteClass, addStudent, removeStudent,
} from '../controllers/class.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('teacher'))

router.route('/')
  .post(createClass)
  .get(getClasses)

router.route('/:id')
  .get(getClassDetail)
  .put(updateClass)
  .delete(deleteClass)

router.post('/:id/students', addStudent)
router.delete('/:id/students/:studentId', removeStudent)

export default router
