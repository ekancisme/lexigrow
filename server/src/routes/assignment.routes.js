import { Router } from 'express'
import {
  createAssignment,
  getAssignmentsByClass,
  getAssignmentInbox,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from '../controllers/assignment.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

// Student: get their assignment inbox
router.get('/inbox', authorize('student'), getAssignmentInbox)

// Teacher: create / list assignments by class
router.route('/')
  .post(authorize('teacher'), createAssignment)
  .get(authorize('teacher'), getAssignmentsByClass)

// Both: get single assignment; teacher: update/delete
router.route('/:id')
  .get(authorize('teacher', 'student'), getAssignmentById)
  .put(authorize('teacher'), updateAssignment)
  .delete(authorize('teacher'), deleteAssignment)

export default router
