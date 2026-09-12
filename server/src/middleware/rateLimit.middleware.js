import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

const FIFTEEN_MINUTES = 15 * 60 * 1000

const baseOptions = {
  windowMs: FIFTEEN_MINUTES,
  standardHeaders: true,
  legacyHeaders: false,
}

/**
 * 10 requests / 15 minutes / IP — registration endpoint.
 */
export const authRegisterLimiter = rateLimit({
  ...baseOptions,
  limit: 10,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau 15 phút.',
  },
})

/**
 * 10 failed requests / 15 minutes / IP — login endpoint.
 * Successful logins are not counted (skipSuccessfulRequests).
 */
export const authLoginLimiter = rateLimit({
  ...baseOptions,
  limit: 10,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
  },
})

/**
 * 10 requests / 15 minutes / IP — OTP verification (brute-force protection for 6-digit codes).
 */
export const authVerifyLimiter = rateLimit({
  ...baseOptions,
  limit: 10,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu xác thực. Vui lòng thử lại sau 15 phút.',
  },
})

/**
 * 3 requests / 15 minutes / EMAIL — resend verification / forgot password.
 * Falls back to the client IP when the email is absent from the body.
 */
export const authResendLimiter = rateLimit({
  ...baseOptions,
  limit: 3,
  keyGenerator: (req) => {
    const email =
      typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    return email || ipKeyGenerator(req.ip)
  },
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu gửi lại mã. Vui lòng thử lại sau 15 phút.',
  },
})

/**
 * 100 requests / minute / IP — PayOS webhook.
 * PayOS retries quickly on transient failures, so the ceiling is kept generous
 * to avoid dropping legitimate retries.
 */
export const payosWebhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu webhook. Vui lòng thử lại sau.',
  },
})