import { createHash, randomUUID } from 'node:crypto'
import Config from '../models/Config.js'
import AIProviderAccount from '../models/AIProviderAccount.js'
import AIProviderModel from '../models/AIProviderModel.js'
import AIModelCombo from '../models/AIModelCombo.js'
import AILog from '../models/AILog.js'
import AIRequest from '../models/AIRequest.js'
import { decryptSecret } from '../utils/secretCrypto.js'
import { fetchSafeUrl } from '../utils/ssrfValidator.js'

const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile'
const AI_REQUEST_LEASE_MS = 180000
const AI_REQUEST_RETENTION_MS = 90 * 24 * 60 * 60 * 1000

const PRICING_USD_PER_MILLION = {
  'groq:llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'groq:llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'gemini:gemini-2.5-flash': { input: 0.30, output: 2.50 },
  'openai-compatible:gpt-4o-mini': { input: 0.15, output: 0.60 },
}

export function normalizeUsage(usage) {
  if (!usage) return { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  const promptTokens = Number(usage.promptTokens ?? usage.prompt_tokens ?? usage.promptTokenCount ?? 0)
  const completionTokens = Number(usage.completionTokens ?? usage.completion_tokens ?? usage.candidatesTokenCount ?? 0)
  const totalTokens = Number(usage.totalTokens ?? usage.total_tokens ?? usage.totalTokenCount ?? (promptTokens + completionTokens))
  return { promptTokens, completionTokens, totalTokens }
}

export function estimateCost({ provider, model, usage, inputCostPerMillionUsd, outputCostPerMillionUsd }) {
  const normalized = normalizeUsage(usage)
  const hasAccountPricing = Number.isFinite(inputCostPerMillionUsd) && inputCostPerMillionUsd >= 0
    && Number.isFinite(outputCostPerMillionUsd) && outputCostPerMillionUsd >= 0
  const pricing = hasAccountPricing
    ? { input: inputCostPerMillionUsd, output: outputCostPerMillionUsd }
    : PRICING_USD_PER_MILLION[`${provider}:${model}`]
  const pricingSource = hasAccountPricing ? 'account' : (pricing ? 'registry' : 'unknown')
  if (!pricing || normalized.totalTokens <= 0) return { cost: null, pricingSource }
  return {
    cost: (normalized.promptTokens * pricing.input + normalized.completionTokens * pricing.output) / 1e6,
    pricingSource,
  }
}

export class AIProviderError extends Error {
  constructor(message, { status = 502, code = 'AI_PROVIDER_ERROR', retryable = false, retryAfterMs = 0 } = {}) {
    super(message)
    this.name = 'AIProviderError'
    this.status = status
    this.code = code
    this.retryable = retryable
    this.retryAfterMs = retryAfterMs
  }
}

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

function retryAfterMs(error) {
  const value = error?.headers?.get?.('retry-after') || error?.response?.headers?.get?.('retry-after')
  if (!value) return 0
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0
}

export function classifyProviderError(error) {
  if (error instanceof AIProviderError) return error
  const status = Number(error?.status || error?.statusCode || error?.response?.status || 0)
  const code = String(error?.code || error?.error?.code || '').toUpperCase()
  const message = error?.message || 'AI provider request failed'
  const rateLimited = status === 429 || /RATE[_ -]?LIMIT|QUOTA|THROTTL|RESOURCE_EXHAUSTED/i.test(`${code} ${message}`)
  const timedOut = error?.name === 'AbortError' || ['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(code) || /timeout|timed out/i.test(message)
  const network = timedOut || ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'UND_ERR_CONNECT_TIMEOUT'].includes(code) || /fetch failed|network/i.test(message)
  const retryable = rateLimited || network || status >= 500 || status === 408
  return new AIProviderError(message, {
    status: status || (network ? 504 : 502),
    code: rateLimited ? 'RATE_LIMITED' : timedOut ? 'TIMEOUT' : network ? 'NETWORK_ERROR' : status >= 500 ? 'UPSTREAM_ERROR' : 'AI_REQUEST_ERROR',
    retryable,
    retryAfterMs: retryAfterMs(error),
  })
}

function modelForAccount(account, requestedModel) {
  return account?.model || requestedModel || DEFAULT_GROQ_MODEL
}

function costRates(account) {
  const configured = Number.isFinite(account.inputCostPerMillionUsd) && account.inputCostPerMillionUsd >= 0
    && Number.isFinite(account.outputCostPerMillionUsd) && account.outputCostPerMillionUsd >= 0
  if (configured) return { input: account.inputCostPerMillionUsd, output: account.outputCostPerMillionUsd }
  return PRICING_USD_PER_MILLION[`${account.provider}:${modelForAccount(account)}`] || null
}

function maximumAttemptCost(account, { messages, prompt, maxTokens }) {
  const rates = costRates(account)
  if (!rates) return null
  const input = typeof prompt === 'string' ? prompt : JSON.stringify(messages || [])
  // UTF-8 bytes are a conservative upper bound for the input token estimate.
  const inputTokenUpperBound = Buffer.byteLength(input || '', 'utf8')
  return (inputTokenUpperBound * rates.input + maxTokens * rates.output) / 1e6
}

function requestConflict(code, message) {
  return new AIProviderError(message, { status: 409, code, retryable: false })
}

async function claimIdempotentRequest(requestId, fingerprint) {
  if (AIRequest.db.readyState !== 1) {
    throw new AIProviderError('AI idempotency storage is unavailable; request was not sent to a provider', {
      status: 503,
      code: 'AI_IDEMPOTENCY_STORE_UNAVAILABLE',
      retryable: false,
    })
  }
  const now = new Date()
  try {
    await AIRequest.create({
      requestId,
      fingerprint,
      state: 'processing',
      leaseUntil: new Date(now.getTime() + AI_REQUEST_LEASE_MS),
    })
    return { requestId, fingerprint }
  } catch (error) {
    if (error?.code !== 11000) throw error
  }

  const prior = await AIRequest.findOne({ requestId }).lean()
  if (!prior) throw requestConflict('AI_REQUEST_IN_PROGRESS', 'This AI request is already being claimed; retry with the same request ID.')
  if (prior.fingerprint !== fingerprint) {
    throw requestConflict('AI_REQUEST_KEY_REUSED', 'This idempotency key was already used for different AI input.')
  }
  if (prior.state === 'completed') return { replay: prior.result }
  if (prior.state === 'possibly_processed') {
    throw requestConflict('AI_REQUEST_POSSIBLY_PROCESSED', 'The provider may have processed this request. It was not sent again to avoid duplicate charges.')
  }
  if (prior.state === 'processing' && prior.leaseUntil > now) {
    throw requestConflict('AI_REQUEST_IN_PROGRESS', 'This AI request is still processing; retry with the same request ID.')
  }
  if (prior.state === 'processing') {
    await AIRequest.updateOne(
      { requestId, fingerprint, state: 'processing', leaseUntil: prior.leaseUntil },
      { $set: { state: 'possibly_processed', leaseUntil: null } },
    )
    throw requestConflict('AI_REQUEST_POSSIBLY_PROCESSED', 'The request owner stopped responding. The provider may have processed it, so it was not resent.')
  }

  const reclaimed = await AIRequest.updateOne(
    { requestId, fingerprint, state: 'failed' },
    { $set: { state: 'processing', leaseUntil: new Date(now.getTime() + AI_REQUEST_LEASE_MS) }, $unset: { result: 1, expiresAt: 1 } },
  )
  if (!reclaimed.modifiedCount) throw requestConflict('AI_REQUEST_IN_PROGRESS', 'This AI request is already being retried.')
  return { requestId, fingerprint }
}

function accountSafe(account) {
  return account?.name || `${account?.provider || 'legacy'}:${account?.model || 'unknown'}`
}

async function legacyAccount(providerPreference, requestedModel) {
  const keys = {
    groq: ['GROQ_API_KEY', 'GROQ_API_KEY'],
    gemini: ['GEMINI_API_KEY', 'GEMINI_API_KEY'],
    'openai-compatible': ['OPENAI_API_KEY', 'OPENAI_API_KEY'],
    huggingface: ['HF_API_TOKEN', 'HF_API_TOKEN'],
  }
  const provider = providerPreference || 'groq'
  const [configKey, envKey] = keys[provider] || keys.groq
  const configQuery = Config.findOne({ key: configKey })
  const config = typeof configQuery?.lean === 'function' ? await configQuery.lean() : await configQuery
  const apiKey = config?.value
    ? (String(config.value).startsWith('v1.') || String(config.value).startsWith('v2.') ? decryptSecret(config.value) : config.value)
    : process.env[envKey]
  if (!apiKey || String(apiKey).startsWith('gsk_dummy_prefix_000000000000') || String(apiKey).startsWith('your_')) return null
  return {
    _legacy: true,
    name: `legacy-${provider}`,
    provider,
    model: provider === 'groq'
      ? (requestedModel || process.env.DEFAULT_AI_MODEL || DEFAULT_GROQ_MODEL)
      : provider === 'gemini'
        ? (process.env.GEMINI_MODEL || 'gemini-2.5-flash')
        : (process.env.OPENAI_MODEL || 'gpt-4o-mini'),
    baseUrl: provider === 'openai-compatible' ? (process.env.OPENAI_BASE_URL || '') : '',
    apiKey,
    routes: [],
    priority: 1000,
  }
}

async function comboCandidates({ route, model, schema }) {
  if (AIModelCombo.db.readyState !== 1 || AIProviderModel.db.readyState !== 1) return []
  const counterKey = `r_${Buffer.from(String(route || 'default')).toString('hex')}`
  const defaultComboConfig = await Config.findOne({ key: 'DEFAULT_AI_COMBO' }).lean()
  const requestedComboId = typeof defaultComboConfig?.value === 'string'
    ? defaultComboConfig.value.match(/^[a-f\d]{24}$/i)?.[0]
    : null
  const increment = { $inc: { [`roundRobinCounters.${counterKey}`]: 1 } }
  let combo = requestedComboId
    ? await AIModelCombo.findOneAndUpdate(
      { _id: requestedComboId, routes: route, enabled: true },
      increment,
      { new: true, returnDocument: 'after' },
    ).lean()
    : null
  if (!combo) {
    combo = await AIModelCombo.findOneAndUpdate(
      { routes: route, active: true, enabled: true },
      increment,
      { new: true, returnDocument: 'after' },
    ).sort({ version: -1, updatedAt: -1 }).lean()
  }
  if (!combo) return []
  const fallbackModel = model
  const ordered = [...combo.candidates].filter((candidate) => candidate.enabled !== false).sort((a, b) => a.order - b.order)
  const resolved = []
  for (const candidate of ordered) {
    const providerModel = await AIProviderModel.findOne({ _id: candidate.model, enabled: true }).lean()
    if (!providerModel || (schema && !providerModel.capabilities?.structuredSchema && !providerModel.capabilities?.jsonMode)) continue
    const account = await AIProviderAccount.findOne({ _id: providerModel.account, enabled: true }).select('+encryptedApiKey').lean()
    if (!account || account.needsAttention || (account.cooldownUntil && new Date(account.cooldownUntil) > new Date())) continue
    try {
      resolved.push({
        ...account,
        provider: account.provider,
        model: providerModel.modelId,
        apiKey: decryptSecret(account.encryptedApiKey),
        inputCostPerMillionUsd: providerModel.inputCostPerMillionUsd ?? account.inputCostPerMillionUsd,
        outputCostPerMillionUsd: providerModel.outputCostPerMillionUsd ?? account.outputCostPerMillionUsd,
        comboId: combo._id,
      })
    } catch {
      await AIProviderAccount.updateOne(
        { _id: account._id },
        { $set: { needsAttention: true, lastErrorCode: 'KEY_DECRYPTION_FAILED', lastErrorAt: new Date() } },
      )
    }
  }
  const primary = resolved.filter((account) => account.provider !== 'groq')
  const groq = resolved.filter((account) => account.provider === 'groq')
  if (!groq.length) {
    groq.push(...await storedGroqFallbacks(route, fallbackModel, new Set(resolved.map((item) => String(item._id)))))
    if (!groq.length) {
      const legacyGroq = await legacyAccount('groq', fallbackModel)
      if (legacyGroq) groq.push(legacyGroq)
    }
  }
  const counter = Number(combo.roundRobinCounters?.get?.(counterKey) ?? combo.roundRobinCounters?.[counterKey] ?? 1)
  if (primary.length) {
    const offset = Math.max(0, counter - 1) % primary.length
    primary.push(...primary.splice(0, offset))
  }
  return {
    pool: [...primary, ...groq],
    policy: { maxAttempts: combo.maxAttempts, timeoutMs: combo.timeoutMs, maxCostUsd: combo.maxCostUsd, comboId: combo._id },
  }
}

async function storedGroqFallbacks(route, model, excludedIds = new Set()) {
  if (AIProviderAccount.db.readyState !== 1) return []
  const query = { provider: 'groq', enabled: true, needsAttention: { $ne: true } }
  if (route) query.$or = [{ routes: route }, { routes: { $size: 0 } }]
  const stored = await AIProviderAccount.find(query).select('+encryptedApiKey').sort({ priority: 1, _id: 1 }).lean()
  return stored.flatMap((account) => {
    if (excludedIds.has(String(account._id)) || (account.cooldownUntil && new Date(account.cooldownUntil) > new Date())) return []
    try {
      return [{ ...account, apiKey: decryptSecret(account.encryptedApiKey), model: account.model || model }]
    } catch {
      console.warn(`Skipping AI provider account ${account.name || account._id}: invalid encrypted key`)
      void AIProviderAccount.updateOne(
        { _id: account._id },
        { $set: { needsAttention: true, lastErrorCode: 'KEY_DECRYPTION_FAILED', lastErrorAt: new Date() } },
      )
      return []
    }
  })
}

async function candidates({ route, providerPreference, model, schema }) {
  const combo = await comboCandidates({ route, model, schema })
  if (combo && Array.isArray(combo.pool) && combo.pool.length) return combo
  const groqAccounts = await storedGroqFallbacks(route, model)
  const legacyGroq = await legacyAccount('groq', model)
  if (legacyGroq) groqAccounts.push(legacyGroq)
  if (providerPreference === 'gemini' || !groqAccounts.length) {
    const legacyGemini = await legacyAccount('gemini', model)
    if (legacyGemini) groqAccounts.unshift(legacyGemini)
  }
  return { pool: groqAccounts, policy: { maxAttempts: DEFAULT_MAX_ATTEMPTS, timeoutMs: 30000, maxCostUsd: null } }
}

async function groqChat(account, { messages, model, responseFormat, temperature, maxTokens = 4096, timeoutMs = 30000, signal }) {
  const Groq = (await import('groq-sdk')).default
  const client = new Groq({ apiKey: account.apiKey, timeout: timeoutMs })
  const response = await client.chat.completions.create({
    messages,
    model: modelForAccount(account, model),
    ...(responseFormat ? { response_format: responseFormat } : {}),
    ...(temperature === undefined ? {} : { temperature }),
    max_tokens: maxTokens,
  }, { signal })
  const text = response.choices?.[0]?.message?.content
  if (typeof text !== 'string') throw new AIProviderError('Groq returned an empty response', { code: 'EMPTY_RESPONSE' })
  return { text, usage: response.usage || null, providerRequestId: response.id }
}

async function openAICompatibleChat(account, { messages, model, responseFormat, temperature, maxTokens = 4096, timeoutMs = 30000, requestId }) {
  const endpoint = (account.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '') + '/chat/completions'
  let response
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    response = await fetchSafeUrl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${account.apiKey}`,
        ...(requestId ? { 'Idempotency-Key': requestId, 'X-Request-Id': requestId } : {}),
      },
      body: JSON.stringify({
        messages,
        model: modelForAccount(account, model),
        ...(responseFormat ? { response_format: responseFormat } : {}),
        ...(temperature === undefined ? {} : { temperature }),
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
      redirect: 'error',
    })
  } catch (error) {
    if (controller.signal.aborted) {
      throw Object.assign(new AIProviderError('Provider request timed out; upstream processing may have completed', {
        status: 504, code: 'TIMEOUT', retryable: true,
      }), { mayHaveProcessed: true })
    }
    throw classifyProviderError(error)
  } finally {
    clearTimeout(timer)
  }
  if (!response.ok) {
    try { await response.body?.cancel?.() } catch { /* response body is discarded */ }
    throw new AIProviderError('OpenAI-compatible provider request failed', {
      status: response.status,
      code: response.status === 429 ? 'RATE_LIMITED' : 'AI_REQUEST_ERROR',
      retryable: response.status === 429 || response.status >= 500,
      retryAfterMs: retryAfterMs(response),
    })
  }
  const data = await response.json()
  const text = data.choices?.[0]?.message?.content
  if (typeof text !== 'string') throw new AIProviderError('OpenAI-compatible provider returned an empty response', { code: 'EMPTY_RESPONSE' })
  return { text, usage: data.usage || null, providerRequestId: data.id }
}

async function geminiStructured(account, { prompt, messages, schema, model, responseFormat, maxTokens = 4096, temperature = 0.1, timeoutMs = 30000 }) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const ai = new GoogleGenerativeAI(account.apiKey)
  const contents = prompt || (messages || []).map((message) => `${message.role}: ${message.content}`).join('\n\n')
  const wantsJson = Boolean(schema || responseFormat?.type === 'json_object')
  const instance = ai.getGenerativeModel({
    model: modelForAccount(account, model),
    generationConfig: {
      ...(wantsJson ? { responseMimeType: 'application/json' } : {}),
      ...(schema ? { responseSchema: schema } : {}),
      temperature,
      maxOutputTokens: maxTokens,
    },
  })
  try {
    let timer
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new AIProviderError(
        'Gemini request timed out; upstream processing may have completed',
        { status: 504, code: 'TIMEOUT', retryable: true },
      ), { mayHaveProcessed: true })), timeoutMs)
    })
    let generated
    try {
      generated = await Promise.race([instance.generateContent(contents), timeout])
    } finally {
      clearTimeout(timer)
    }
    const text = generated.response.text()
    if (!text) throw new AIProviderError('Gemini returned an empty response', { code: 'EMPTY_RESPONSE' })
    return {
      text,
      usage: generated.response.usageMetadata ? {
        prompt_tokens: number(generated.response.usageMetadata.promptTokenCount),
        completion_tokens: number(generated.response.usageMetadata.candidatesTokenCount),
        total_tokens: number(generated.response.usageMetadata.totalTokenCount),
      } : null,
      providerRequestId: null,
    }
  } catch (error) {
    throw classifyProviderError(error)
  }
}

async function callAccount(account, options) {
  if (account.provider === 'groq') return groqChat(account, options)
  if (account.provider === 'gemini') return geminiStructured(account, options)
  if (account.provider === 'openai-compatible') return openAICompatibleChat(account, options)
  throw new AIProviderError(`Provider ${account.provider} does not support chat completion`, { status: 400, code: 'UNSUPPORTED_PROVIDER' })
}

export async function testAIProviderAccount(accountDocument, prompt = 'Reply with the word OK.') {
  const account = accountDocument.toObject ? accountDocument.toObject() : { ...accountDocument }
  account.apiKey = decryptSecret(account.encryptedApiKey)
  const result = await callAccount(account, {
    prompt,
    messages: [{ role: 'user', content: prompt }],
    schema: undefined,
    responseFormat: undefined,
    maxTokens: 32,
    temperature: 0,
    timeoutMs: 10000,
  })
  return { provider: account.provider, model: modelForAccount(account), usage: result.usage }
}

export async function completeAI({
  route,
  providerPreference,
  model,
  messages,
  prompt,
  schema,
  responseFormat,
  temperature,
  maxTokens = 4096,
  maxAttempts,
  timeoutMs,
  requestId: incomingRequestId,
}) {
  const requestId = typeof incomingRequestId === 'string' && incomingRequestId.trim() && incomingRequestId.length <= 128
    ? incomingRequestId
    : randomUUID()
  const hasStableRequestId = requestId === incomingRequestId
  const started = Date.now()
  const candidateSet = await candidates({ route, providerPreference, model, schema })
  const pool = candidateSet.pool
  const policy = candidateSet.policy || {}
  if (!pool.length) throw new AIProviderError('No AI provider is configured', { status: 503, code: 'AI_NOT_CONFIGURED' })
  const configuredAttempts = Number(policy.maxAttempts) || DEFAULT_MAX_ATTEMPTS
  const requestedAttempts = Number(maxAttempts) > 0 ? Number(maxAttempts) : configuredAttempts
  const attemptLimit = Math.max(1, Math.min(configuredAttempts, requestedAttempts, 10))
  const effectiveTimeoutMs = Math.max(1000, Math.min(Number(policy.timeoutMs) || 30000, Number(timeoutMs) || Number(policy.timeoutMs) || 30000))
  const costLimit = Number.isFinite(policy.maxCostUsd) && policy.maxCostUsd >= 0 ? policy.maxCostUsd : null
  let attemptPool = pool.slice(0, attemptLimit)
  const groqIndex = pool.findIndex((account) => account.provider === 'groq')
  if (groqIndex >= attemptLimit && attemptLimit > 1) {
    attemptPool = [...pool.slice(0, attemptLimit - 1), pool[groqIndex]]
  }
  const attempts = []
  let lastError
  let lastAccount
  let reservedCost = 0
  const deadline = started + effectiveTimeoutMs
  const effectiveMessages = Array.isArray(messages) && messages.length
    ? messages
    : (prompt ? [{ role: 'user', content: prompt }] : [])
  const effectivePrompt = prompt || (messages || []).map((m) => `${m.role}: ${m.content}`).join('\n\n')
  const effectiveResponseFormat = responseFormat || (schema ? { type: 'json_object' } : undefined)
  let idempotencyClaim = null
  if (hasStableRequestId) {
    const fingerprint = createHash('sha256').update(JSON.stringify({
      route, providerPreference, model, messages: effectiveMessages, prompt: effectivePrompt,
      schema, responseFormat: effectiveResponseFormat, temperature, maxTokens,
    })).digest('hex')
    idempotencyClaim = await claimIdempotentRequest(requestId, fingerprint)
    if (idempotencyClaim && Object.hasOwn(idempotencyClaim, 'replay')) return idempotencyClaim.replay
  }

  for (const account of attemptPool) {
    lastAccount = account
    let projectedAttemptCost = null
    const remainingMs = deadline - Date.now()
    if (remainingMs <= 0) {
      lastError = Object.assign(new AIProviderError('AI request exceeded its route timeout', { status: 504, code: 'TIMEOUT', retryable: false }), { mayHaveProcessed: false })
      break
    }
    if (costLimit !== null) {
      const projected = maximumAttemptCost(account, { messages: effectiveMessages, prompt: effectivePrompt, maxTokens })
      projectedAttemptCost = projected
      if (projected === null || reservedCost + projected > costLimit) {
        lastError = new AIProviderError(projected === null
          ? 'Cannot enforce route cost limit because provider pricing is unknown'
          : 'Route cost limit reached before another provider attempt', { status: 429, code: 'AI_COST_LIMIT', retryable: false })
        attempts.push({ account: accountSafe(account), status: 'skipped', code: lastError.code, mayHaveProcessed: false })
        break
      }
      // Reserve the maximum configured input/output spend before sending data.
      // This also accounts conservatively for timed-out attempts that may be billed.
      reservedCost += projected
    }
    const attemptStarted = Date.now()
    let upstreamReturned = false
    try {
      const result = await callAccount(account, {
        messages: effectiveMessages,
        prompt: effectivePrompt,
        schema,
        model,
        responseFormat: effectiveResponseFormat,
        temperature,
        maxTokens,
        timeoutMs: Math.max(1, deadline - Date.now()),
        requestId,
      })
      upstreamReturned = true
      if (!account._legacy) {
        await AIProviderAccount.updateOne(
          { _id: account._id },
          { $set: { lastUsedAt: new Date(), consecutiveFailures: 0, lastErrorCode: '', needsAttention: false }, $unset: { cooldownUntil: 1 } },
        )
      }
      attempts.push({ account: accountSafe(account), status: 'success', durationMs: Date.now() - attemptStarted, cost: result.usage ? estimateCost({ provider: account.provider, model: modelForAccount(account, model), usage: result.usage, inputCostPerMillionUsd: account.inputCostPerMillionUsd, outputCostPerMillionUsd: account.outputCostPerMillionUsd }).cost : null })
      const anyPriorMayHaveProcessed = attempts.slice(0, -1).some(a => a.mayHaveProcessed)
      const successResult = {
        text: result.text,
        usage: normalizeUsage(result.usage),
        usageAvailable: result.usage !== null && result.usage !== undefined,
        cost: estimateCost({
          provider: account.provider,
          model: modelForAccount(account, model),
          usage: result.usage,
          inputCostPerMillionUsd: account.inputCostPerMillionUsd,
          outputCostPerMillionUsd: account.outputCostPerMillionUsd,
        }),
        requestId,
        provider: account.provider,
        account: accountSafe(account),
        model: modelForAccount(account, model),
        durationMs: Date.now() - started,
        attempts,
        providerRequestId: result.providerRequestId || null,
        possibly_processed: anyPriorMayHaveProcessed,
      }
      if (idempotencyClaim) {
        try {
          await AIRequest.updateOne(
            { requestId, fingerprint: idempotencyClaim.fingerprint, state: 'processing' },
            { $set: {
              state: 'completed',
              result: successResult,
              leaseUntil: null,
              expiresAt: new Date(Date.now() + AI_REQUEST_RETENTION_MS),
            } },
          )
        } catch (error) {
          await AIRequest.updateOne(
            { requestId, fingerprint: idempotencyClaim.fingerprint, state: 'processing' },
            { $set: { state: 'possibly_processed', leaseUntil: null } },
          ).catch(() => {})
          throw Object.assign(new AIProviderError('Provider completed the request but its idempotency record could not be saved', {
            status: 503, code: 'AI_REQUEST_RECORD_FAILED', retryable: false,
          }), { mayHaveProcessed: true, cause: error })
        }
      }
      return successResult
    } catch (rawError) {
      const error = classifyProviderError(rawError)
      lastError = error
      const mayHaveProcessed = Boolean(
        upstreamReturned || rawError.mayHaveProcessed || error.mayHaveProcessed ||
        error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR' || error.status >= 500,
      )
      attempts.push({ account: accountSafe(account), status: 'failure', code: error.code, statusCode: error.status, durationMs: Date.now() - attemptStarted, mayHaveProcessed, possibleChargeUsd: mayHaveProcessed ? projectedAttemptCost : null })
      if (!account._legacy) {
        const cooldown = error.retryAfterMs || (error.retryable ? Math.min(15 * 60 * 1000, 30000 * 2 ** Math.min(account.consecutiveFailures || 0, 4)) : 0)
        await AIProviderAccount.updateOne(
          { _id: account._id },
          { $set: { lastErrorCode: error.code, lastErrorAt: new Date(), ...([401, 403].includes(error.status) ? { needsAttention: true } : {}), ...(cooldown ? { cooldownUntil: new Date(Date.now() + cooldown) } : {}) }, $inc: { consecutiveFailures: 1 } },
        )
      }
      // AI-09: Do not failover to a different provider if the request may have already been processed upstream to prevent double billing
      if (!error.retryable || mayHaveProcessed) break
    }
  }
  if (idempotencyClaim) {
    const possiblyProcessed = attempts.some((attempt) => attempt.mayHaveProcessed)
    await AIRequest.updateOne(
      { requestId, fingerprint: idempotencyClaim.fingerprint, state: 'processing' },
      { $set: {
        state: possiblyProcessed ? 'possibly_processed' : 'failed',
        leaseUntil: null,
        ...(possiblyProcessed ? {} : { expiresAt: new Date(Date.now() + AI_REQUEST_RETENTION_MS) }),
      } },
    ).catch(() => {})
  }
  lastError.attempts = attempts
  lastError.requestId = requestId
  const failedAccount = lastAccount
  if (failedAccount) {
    lastError.provider = failedAccount.provider
    lastError.account = accountSafe(failedAccount)
    lastError.model = modelForAccount(failedAccount, model)
  }
  lastError.statusCode = lastError.status
  throw lastError
}

export const aiMeta = ({ result, source = 'ai', isFallback = false }) => ({
  source,
  isFallback,
  provider: result?.provider || null,
  account: result?.account || null,
  model: result?.model || null,
  latencyMs: result?.durationMs || 0,
  requestId: result?.requestId || null,
  attempts: result?.attempts || [],
})

export async function logAICompletion({ route, action = route, result, error, durationMs = 0 }) {
  const usage = normalizeUsage(result?.usage)
  const cost = result?.cost || estimateCost({ provider: result?.provider || error?.provider, model: result?.model || error?.model, usage })
  try {
    await AILog.create({
      route,
      action,
      model: result?.model || error?.model || 'unknown',
      provider: result?.provider || error?.provider || '',
      providerAccount: result?.account || error?.account || '',
      requestId: result?.requestId || error?.requestId || '',
      providerRequestId: result?.providerRequestId || '',
      attempts: result?.attempts || error?.attempts || [],
      statusCode: error?.status || error?.statusCode || null,
      failoverReason: (result?.attempts || error?.attempts || []).filter((attempt) => attempt.status === 'failure').map((attempt) => attempt.code).join(','),
      tokensUsed: usage,
      usageAvailable: Boolean(result?.usageAvailable),
      processingTimeMs: result?.durationMs || durationMs,
      costEstimate: cost.cost,
      pricingSource: cost.pricingSource,
      status: error ? 'failure' : 'success',
      errorMessage: error ? String(error.code || (error.status === 504 ? 'TIMEOUT' : 'AI_PROVIDER_ERROR')).slice(0, 120) : undefined,
      source: 'ai',
      isFallback: false,
    })
  } catch (loggingError) {
    console.error('Failed to save AI completion log:', loggingError.message)
  }
}
