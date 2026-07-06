import { Router } from 'express'
import { register, login, getMe, googleAuth, forgotPassword, resetPassword, getAuthConfig, checkEmail, verifyEmail, resendVerification } from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/verify-email', verifyEmail)
router.post('/resend-verify', resendVerification)
router.get('/me', protect, getMe)
router.post('/google', googleAuth)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/config', getAuthConfig)
router.post('/check-email', checkEmail)

export default router
