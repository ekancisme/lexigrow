import { Router } from 'express'
import { getProfile, updateProfile, changePassword, updateNotifications } from '../controllers/profile.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)

router.route('/')
  .get(getProfile)
  .put(updateProfile)

router.put('/password', changePassword)
router.put('/notifications', updateNotifications)

export default router
