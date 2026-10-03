import AIProviderAccount from '../models/AIProviderAccount.js'
import AIProviderModel from '../models/AIProviderModel.js'
import AIModelCombo from '../models/AIModelCombo.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import { encryptSecret, maskSecret } from '../utils/secretCrypto.js'
import { testAIProviderAccount } from '../services/aiGateway.service.js'

const PROVIDERS = new Set(['groq', 'gemini', 'openai-compatible'])
const clean = (value, max = 300) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const parsePricing = (input, output) => {
  const hasInput = input !== undefined && input !== null && input !== ''
  const hasOutput = output !== undefined && output !== null && output !== ''
  if (hasInput !== hasOutput) throw new ErrorResponse('Set both input and output token prices, or leave both empty', 400)
  if (!hasInput) return { inputCostPerMillionUsd: null, outputCostPerMillionUsd: null }
  const inputCostPerMillionUsd = Number(input)
  const outputCostPerMillionUsd = Number(output)
  if (![inputCostPerMillionUsd, outputCostPerMillionUsd].every((value) => Number.isFinite(value) && value >= 0)) {
    throw new ErrorResponse('Token prices must be non-negative numbers', 400)
  }
  return { inputCostPerMillionUsd, outputCostPerMillionUsd }
}
const publicAccount = (account) => ({
  _id: account._id,
  name: account.name,
  provider: account.provider,
  model: account.model,
  inputCostPerMillionUsd: account.inputCostPerMillionUsd ?? null,
  outputCostPerMillionUsd: account.outputCostPerMillionUsd ?? null,
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
  const { name, provider, model, apiKey, baseUrl, priority, routes, enabled, inputCostPerMillionUsd, outputCostPerMillionUsd } = req.body || {}
  if (!clean(name, 100) || !PROVIDERS.has(provider) || !clean(model, 160) || !clean(apiKey, 1000)) {
    throw new ErrorResponse('Provider name, type, model and API key are required', 400)
  }
  const account = await AIProviderAccount.create({
    name: clean(name, 100),
    provider,
    model: clean(model, 160),
    ...parsePricing(inputCostPerMillionUsd, outputCostPerMillionUsd),
    baseUrl: clean(baseUrl, 300),
    encryptedApiKey: encryptSecret(apiKey),
    priority: Number.isInteger(priority) ? Math.min(1000, Math.max(0, priority)) : 100,
    routes: Array.isArray(routes) ? routes.map((route) => clean(route, 100)).filter(Boolean).slice(0, 30) : [],
    enabled: enabled !== false,
  })
  const defaultModel = await AIProviderModel.create({
    account: account._id,
    modelId: clean(model, 160),
    displayName: clean(model, 160),
    capabilities: { jsonMode: true, structuredSchema: provider === 'gemini', text: true, vision: false },
    ...parsePricing(inputCostPerMillionUsd, outputCostPerMillionUsd),
  })
  res.status(201).json({ success: true, data: { ...publicAccount(account.toObject()), maskedKey: maskSecret(apiKey), defaultModel: publicModel(defaultModel.toObject()) } })
})

export const updateAIProvider = asyncHandler(async (req, res) => {
  const account = await AIProviderAccount.findById(req.params.id).select('+encryptedApiKey')
  if (!account) throw new ErrorResponse('AI provider account not found', 404)
  const { name, provider, model, apiKey, baseUrl, priority, routes, enabled, inputCostPerMillionUsd, outputCostPerMillionUsd } = req.body || {}
  if (provider !== undefined && !PROVIDERS.has(provider)) throw new ErrorResponse('Unsupported AI provider', 400)
  if (name !== undefined) account.name = clean(name, 100)
  if (provider !== undefined) account.provider = provider
  if (model !== undefined) account.model = clean(model, 160)
  if (inputCostPerMillionUsd !== undefined || outputCostPerMillionUsd !== undefined) {
    Object.assign(account, parsePricing(inputCostPerMillionUsd, outputCostPerMillionUsd))
  }
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

const publicModel = (model) => ({
  _id: model._id,
  account: model.account,
  modelId: model.modelId,
  displayName: model.displayName,
  capabilities: model.capabilities,
  inputCostPerMillionUsd: model.inputCostPerMillionUsd,
  outputCostPerMillionUsd: model.outputCostPerMillionUsd,
  enabled: model.enabled,
})

export const listAIModels = asyncHandler(async (req, res) => {
  const models = await AIProviderModel.find().populate('account', 'name provider baseUrl enabled').sort({ modelId: 1 }).lean()
  res.json({ success: true, data: models.map(publicModel) })
})

export const createAIModel = asyncHandler(async (req, res) => {
  const { account, modelId, displayName, capabilities, inputCostPerMillionUsd, outputCostPerMillionUsd, enabled } = req.body || {}
  if (!account || !clean(modelId, 160)) throw new ErrorResponse('Provider account and model are required', 400)
  const owner = await AIProviderAccount.findById(account).lean()
  if (!owner) throw new ErrorResponse('Provider account not found', 404)
  const pricing = parsePricing(inputCostPerMillionUsd, outputCostPerMillionUsd)
  const model = await AIProviderModel.create({
    account,
    modelId: clean(modelId, 160),
    displayName: clean(displayName, 160),
    capabilities: capabilities || {},
    ...pricing,
    enabled: enabled !== false,
  })
  res.status(201).json({ success: true, data: publicModel(model.toObject()) })
})

export const updateAIModel = asyncHandler(async (req, res) => {
  const model = await AIProviderModel.findById(req.params.id)
  if (!model) throw new ErrorResponse('Provider model not found', 404)
  const { modelId, displayName, capabilities, inputCostPerMillionUsd, outputCostPerMillionUsd, enabled } = req.body || {}
  if (modelId !== undefined) model.modelId = clean(modelId, 160)
  if (displayName !== undefined) model.displayName = clean(displayName, 160)
  if (capabilities !== undefined) model.capabilities = capabilities
  if (inputCostPerMillionUsd !== undefined || outputCostPerMillionUsd !== undefined) Object.assign(model, parsePricing(inputCostPerMillionUsd, outputCostPerMillionUsd))
  if (enabled !== undefined) model.enabled = Boolean(enabled)
  await model.save()
  res.json({ success: true, data: publicModel(model.toObject()) })
})

export const deleteAIModel = asyncHandler(async (req, res) => {
  const result = await AIProviderModel.deleteOne({ _id: req.params.id })
  if (!result.deletedCount) throw new ErrorResponse('Provider model not found', 404)
  res.json({ success: true, data: null })
})

const publicCombo = (combo) => ({
  _id: combo._id,
  name: combo.name,
  routes: combo.routes,
  candidates: combo.candidates,
  enabled: combo.enabled,
  active: combo.active,
  maxAttempts: combo.maxAttempts,
  timeoutMs: combo.timeoutMs,
  maxCostUsd: combo.maxCostUsd,
  version: combo.version,
})

export const listAICombos = asyncHandler(async (req, res) => {
  const combos = await AIModelCombo.find().populate({ path: 'candidates.model', populate: { path: 'account', select: 'name provider' } }).sort({ name: 1 }).lean()
  res.json({ success: true, data: combos.map(publicCombo) })
})

export const createAICombo = asyncHandler(async (req, res) => {
  const { name, routes, candidates, maxAttempts, timeoutMs, maxCostUsd, enabled, active } = req.body || {}
  if (!clean(name, 120) || !Array.isArray(candidates) || candidates.length < 1) throw new ErrorResponse('Combo name and candidates are required', 400)
  const modelIds = candidates.map((candidate) => candidate.model)
  const validCount = await AIProviderModel.countDocuments({ _id: { $in: modelIds }, enabled: true })
  if (validCount !== new Set(modelIds).size) throw new ErrorResponse('Combo contains an unavailable model', 400)
  if (active && Array.isArray(routes) && routes.length) await AIModelCombo.updateMany({ routes: { $in: routes } }, { $set: { active: false } })
  const combo = await AIModelCombo.create({ name: clean(name, 120), routes: Array.isArray(routes) ? routes.map((route) => clean(route, 100)).filter(Boolean) : [], candidates: candidates.map((candidate, index) => ({ model: candidate.model, order: index + 1, enabled: candidate.enabled !== false })), maxAttempts, timeoutMs, maxCostUsd, enabled: enabled !== false, active: Boolean(active) })
  res.status(201).json({ success: true, data: publicCombo(combo.toObject()) })
})

export const updateAICombo = asyncHandler(async (req, res) => {
  const combo = await AIModelCombo.findById(req.params.id)
  if (!combo) throw new ErrorResponse('AI model combo not found', 404)
  const { name, routes, candidates, maxAttempts, timeoutMs, maxCostUsd, enabled, active } = req.body || {}
  if (name !== undefined) combo.name = clean(name, 120)
  if (Array.isArray(routes)) combo.routes = routes.map((route) => clean(route, 100)).filter(Boolean)
  if (Array.isArray(candidates)) combo.candidates = candidates.map((candidate, index) => ({ model: candidate.model, order: index + 1, enabled: candidate.enabled !== false }))
  if (maxAttempts !== undefined) combo.maxAttempts = maxAttempts
  if (timeoutMs !== undefined) combo.timeoutMs = timeoutMs
  if (maxCostUsd !== undefined) combo.maxCostUsd = maxCostUsd
  if (enabled !== undefined) combo.enabled = Boolean(enabled)
  if (active !== undefined) combo.active = Boolean(active)
  if (combo.active && combo.routes.length) await AIModelCombo.updateMany({ _id: { $ne: combo._id }, routes: { $in: combo.routes } }, { $set: { active: false } })
  combo.version += 1
  await combo.save()
  res.json({ success: true, data: publicCombo(combo.toObject()) })
})

export const deleteAICombo = asyncHandler(async (req, res) => {
  const result = await AIModelCombo.deleteOne({ _id: req.params.id })
  if (!result.deletedCount) throw new ErrorResponse('AI model combo not found', 404)
  res.json({ success: true, data: null })
})

export const activateAICombo = asyncHandler(async (req, res) => {
  const combo = await AIModelCombo.findById(req.params.id)
  if (!combo) throw new ErrorResponse('AI model combo not found', 404)
  await AIModelCombo.updateMany({ routes: { $in: combo.routes } }, { $set: { active: false } })
  combo.active = true
  combo.enabled = true
  combo.version += 1
  await combo.save()
  res.json({ success: true, data: publicCombo(combo.toObject()) })
})

export const testAIProvider = asyncHandler(async (req, res) => {
  const account = await AIProviderAccount.findById(req.params.id).select('+encryptedApiKey')
  if (!account) throw new ErrorResponse('AI provider account not found', 404)
  const started = Date.now()
  const result = await testAIProviderAccount(account)
  res.json({ success: true, data: { ...result, latencyMs: Date.now() - started } })
})
