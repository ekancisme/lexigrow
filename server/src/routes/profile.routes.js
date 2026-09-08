import { Router } from 'express'
import { getProfile, updateProfile, changePassword, updateNotifications } from '../controllers/profile.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'
import { getLearningProfile, updateLearningProfile } from '../controllers/learningProfile.controller.js'

const router = Router()

router.use(protect)
router.route('/learning').get(authorize('student'), getLearningProfile).put(authorize('student'), updateLearningProfile)

router.route('/')
  .get(getProfile)
  .put(updateProfile)

router.put('/password', changePassword)
router.put('/notifications', updateNotifications)

export default router
