import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import { completeAI } from '../services/aiGateway.service.js'

const ROUTES = new Set([
  'essay_analysis',
  'synonym_generation',
  'topic_generation',
  'vocabulary_enrichment',
  'translation',
  'ai_helper_spellcheck',
  'ai_helper_improve',
  'learning_path',
  'daily_quest',
  'goal_recommendation',
  'vocabulary_analysis',
])

export const completeInternalAI = asyncHandler(async (req, res) => {
  const body = req.body || {}
  if (!ROUTES.has(body.route)) throw new ErrorResponse('Unsupported AI relay route', 400)
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
    maxAttempts: Math.min(Number(body.maxAttempts) || 3, 10),
  })
  res.json({ success: true, data: result, _meta: { source: 'ai_relay', isFallback: false } })
})
