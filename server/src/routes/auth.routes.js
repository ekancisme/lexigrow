import { Router } from 'express'
import { register, login, getMe, googleAuth, forgotPassword, resetPassword, getAuthConfig, checkEmail, verifyEmail, resendVerification } from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { authRegisterLimiter, authLoginLimiter, authVerifyLimiter, authResendLimiter } from '../middleware/rateLimit.middleware.js'

const router = Router()

router.post('/register', authRegisterLimiter, register)
router.post('/login', authLoginLimiter, login)
router.post('/verify-email', authVerifyLimiter, verifyEmail)
router.post('/resend-verify', authResendLimiter, resendVerification)
router.get('/me', protect, getMe)
router.post('/google', googleAuth)
router.post('/forgot-password', authResendLimiter, forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/config', getAuthConfig)
router.post('/check-email', checkEmail)

export default router
