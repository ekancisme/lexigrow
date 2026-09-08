import rateLimit from 'express-rate-limit'
export const createAiLimiter = (options = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user._id),
    message: {
      success: false,
      error: 'AI request limit reached. Please retry later.',
    },
    ...options,
  })
export const aiLearningLimiter = createAiLimiter()
