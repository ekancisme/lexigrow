import { rateLimit } from 'express-rate-limit'

/**
 * Rate limiters tailored for game interactions to prevent spam clicks and DB overload.
 */

// General game play actions (e.g., getting puzzle, requesting clues, moving words)
export const gamePlayRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 120, // 120 requests per minute
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip || 'anonymous',
  message: {
    success: false,
    message: 'Too many game actions. Please wait a moment.',
  },
})

// Game submission / Score completion (e.g., submitting final results or claiming rewards)
export const gameSubmitRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 30, // 30 submissions per minute
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip || 'anonymous',
  message: {
    success: false,
    message: 'Too many score submissions. Please wait a moment before trying again.',
  },
})

// AI-powered dynamic game recommendation limiter
export const gameAIRecommendationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 20, // 20 AI recommendation calls per minute
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip || 'anonymous',
  message: {
    success: false,
    message: 'Too many AI quest generation requests. Please try again in a minute.',
  },
})
