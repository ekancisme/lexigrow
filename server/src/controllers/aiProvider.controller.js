import AIProviderAccount from '../models/AIProviderAccount.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import { encryptSecret, maskSecret } from '../utils/secretCrypto.js'
import { testAIProviderAccount } from '../services/aiGateway.service.js'

const PROVIDERS = new Set(['groq', 'gemini', 'openai-compatible'])
const clean = (value, max = 300) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const publicAccount = (account) => ({
  _id: account._id,
  name: account.name,
  provider: account.provider,
  model: account.model,
  baseUrl: account.baseUrl || '',
  enabled: account.enabled,
  priority: account.priority,
  routes: account.routes || [],
  isConfigured: Boolean(account.encryptedApiKey),
  maskedKey: account.maskedKey || '••••••••',
  cooldownUntil: account.cooldownUntil,
  consecutiveFailures: account.consecutiveFailures,
  lastUsedAt: account.lastUsedAt,
  lastErrorCode: account.lastErrorCode,
})

export const listAIProviders = asyncHandler(async (req, res) => {
  const accounts = await AIProviderAccount.find().select('+encryptedApiKey').sort({ priority: 1, name: 1 }).lean()
  res.json({ success: true, data: accounts.map(publicAccount) })
})

export const createAIProvider = asyncHandler(async (req, res) => {
  const { name, provider, model, apiKey, baseUrl, priority, routes, enabled } = req.body || {}
  if (!clean(name, 100) || !PROVIDERS.has(provider) || !clean(model, 160) || !clean(apiKey, 1000)) {
    throw new ErrorResponse('Provider name, type, model and API key are required', 400)
  }
  const account = await AIProviderAccount.create({
    name: clean(name, 100),
    provider,
    model: clean(model, 160),
    baseUrl: clean(baseUrl, 300),
    encryptedApiKey: encryptSecret(apiKey),
    priority: Number.isInteger(priority) ? Math.min(1000, Math.max(0, priority)) : 100,
    routes: Array.isArray(routes) ? routes.map((route) => clean(route, 100)).filter(Boolean).slice(0, 30) : [],
    enabled: enabled !== false,
  })
  res.status(201).json({ success: true, data: { ...publicAccount(account.toObject()), maskedKey: maskSecret(apiKey) } })
})

export const updateAIProvider = asyncHandler(async (req, res) => {
  const account = await AIProviderAccount.findById(req.params.id).select('+encryptedApiKey')
  if (!account) throw new ErrorResponse('AI provider account not found', 404)
  const { name, provider, model, apiKey, baseUrl, priority, routes, enabled } = req.body || {}
  if (provider !== undefined && !PROVIDERS.has(provider)) throw new ErrorResponse('Unsupported AI provider', 400)
  if (name !== undefined) account.name = clean(name, 100)
  if (provider !== undefined) account.provider = provider
  if (model !== undefined) account.model = clean(model, 160)
  if (baseUrl !== undefined) account.baseUrl = clean(baseUrl, 300)
  if (apiKey && !String(apiKey).includes('••••')) account.encryptedApiKey = encryptSecret(apiKey)
  if (Number.isInteger(priority)) account.priority = Math.min(1000, Math.max(0, priority))
  if (Array.isArray(routes)) account.routes = routes.map((route) => clean(route, 100)).filter(Boolean).slice(0, 30)
  if (enabled !== undefined) account.enabled = Boolean(enabled)
  await account.save()
  res.json({ success: true, data: publicAccount({ ...account.toObject(), maskedKey: apiKey ? maskSecret(apiKey) : '••••••••' }) })
})

export const deleteAIProvider = asyncHandler(async (req, res) => {
  const result = await AIProviderAccount.deleteOne({ _id: req.params.id })
  if (!result.deletedCount) throw new ErrorResponse('AI provider account not found', 404)
  res.json({ success: true, data: null })
})

export const testAIProvider = asyncHandler(async (req, res) => {
  const account = await AIProviderAccount.findById(req.params.id).select('+encryptedApiKey')
  if (!account) throw new ErrorResponse('AI provider account not found', 404)
  const started = Date.now()
  const result = await testAIProviderAccount(account)
  res.json({ success: true, data: { ...result, latencyMs: Date.now() - started } })
})
