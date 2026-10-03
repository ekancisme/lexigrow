import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import { completeAI } from '../services/aiGateway.service.js'
import { AI_ROUTES } from '../constants/aiRoutes.js'

export const completeInternalAI = asyncHandler(async (req, res) => {
  const body = req.body || {}
  if (!AI_ROUTES.has(body.route)) throw new ErrorResponse('Unsupported AI relay route', 400)
  if (!Array.isArray(body.messages) && typeof body.prompt !== 'string') throw new ErrorResponse('AI relay messages or prompt is required', 400)
  const messages = Array.isArray(body.messages) ? body.messages : undefined
  const result = await completeAI({
    route: body.route,
    providerPreference: body.providerPreference,
    model: body.model,
    messages,
    prompt: body.prompt,
    schema: body.schema,
    responseFormat: body.responseFormat,
    temperature: body.temperature,
    maxTokens: Math.min(Number(body.maxTokens) || 4096, 128000),
    maxAttempts: body.maxAttempts === undefined ? undefined : Math.min(Number(body.maxAttempts) || 1, 10),
    timeoutMs: Number(body.timeoutMs) || undefined,
    requestId: req.get('X-Request-Id'),
  })
  res.json({ success: true, data: result, _meta: { source: 'ai_relay', isFallback: false } })
})
