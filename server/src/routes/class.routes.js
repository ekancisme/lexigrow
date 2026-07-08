import { Router } from 'express'
import {
  createClass, getClasses, getClassDetail,
  updateClass, deleteClass, addStudent, removeStudent,
  getAdminClasses, forceEnrollStudent, forceUnenrollStudent
} from '../controllers/class.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.route('/')
  .post(authorize('teacher'), createClass)
  .get(authorize('teacher', 'student'), getClasses)

// Admin-specific class route (placed before /:id)
router.route('/admin')
  .get(authorize('admin'), getAdminClasses)

router.post('/admin/:id/enroll', authorize('admin'), forceEnrollStudent)
router.post('/admin/:id/unenroll', authorize('admin'), forceUnenrollStudent)

router.route('/:id')
  .get(authorize('teacher'), getClassDetail)
  .put(authorize('teacher'), updateClass)
  .delete(authorize('teacher'), deleteClass)

router.post('/:id/students', authorize('teacher'), addStudent)
router.delete('/:id/students/:studentId', authorize('teacher'), removeStudent)

export default router
