import crypto from 'node:crypto'
import ErrorResponse from '../utils/ErrorResponse.js'

export function requireAIRelayService(req, res, next) {
  const expected = process.env.AI_RELAY_SERVICE_TOKEN
  if (!expected) return next(new ErrorResponse('AI relay is not configured', 503))
  const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!provided || provided.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return next(new ErrorResponse('Invalid AI relay credentials', 403))
  }
  next()
}
