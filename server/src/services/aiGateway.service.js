import { randomUUID } from 'node:crypto'
import Config from '../models/Config.js'
import AIProviderAccount from '../models/AIProviderAccount.js'
import { decryptSecret } from '../utils/secretCrypto.js'

const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile'

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

export function estimateCost({ provider, model, usage }) {
  const normalized = normalizeUsage(usage)
  const pricing = PRICING_USD_PER_MILLION[`${provider}:${model}`]
  if (!pricing || normalized.totalTokens <= 0) return { cost: null, pricingSource: pricing ? 'registry' : 'unknown' }
  return {
    cost: (normalized.promptTokens * pricing.input + normalized.completionTokens * pricing.output) / 1e6,
    pricingSource: 'registry',
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
  return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : 0
}

export function classifyProviderError(error) {
  if (error instanceof AIProviderError) return error
  const status = Number(error?.status || error?.statusCode || error?.response?.status || 0)
  const code = String(error?.code || error?.error?.code || '').toUpperCase()
  const message = error?.message || 'AI provider request failed'
  const rateLimited = status === 429 || /RATE[_ -]?LIMIT|QUOTA|THROTTL|RESOURCE_EXHAUSTED/i.test(`${code} ${message}`)
  const network = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'UND_ERR_CONNECT_TIMEOUT'].includes(code) || /timeout|fetch failed|network/i.test(message)
  const retryable = rateLimited || network || status >= 500 || status === 408
  return new AIProviderError(message, {
    status: status || (network ? 504 : 502),
    code: rateLimited ? 'RATE_LIMITED' : network ? 'NETWORK_ERROR' : status >= 500 ? 'UPSTREAM_ERROR' : 'AI_REQUEST_ERROR',
    retryable,
    retryAfterMs: retryAfterMs(error),
  })
}

function modelForAccount(account, requestedModel) {
  return account?.model || requestedModel || DEFAULT_GROQ_MODEL
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
  const apiKey = config?.value || process.env[envKey]
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

async function legacyAccounts(providerPreference, requestedModel) {
  const providers = ['groq', 'gemini', 'openai-compatible']
  const ordered = [providerPreference, ...providers].filter((provider, index, list) => provider && list.indexOf(provider) === index)
  const accounts = []
  for (const provider of ordered) {
    const account = await legacyAccount(provider, requestedModel)
    if (account) accounts.push(account)
  }
  return accounts
}

async function candidates({ route, providerPreference, model }) {
  const legacy = await legacyAccounts(providerPreference, model)
  // Unit tests and offline utilities may mock the legacy Config model without a
  // Mongo connection. Do not wait for Mongoose's buffered query in that mode.
  if (AIProviderAccount.db.readyState !== 1) return legacy
  const query = { enabled: true }
  if (route) query.$or = [{ routes: route }, { routes: { $size: 0 } }]
  const stored = await AIProviderAccount.find(query).select('+encryptedApiKey').sort({ priority: 1, lastUsedAt: 1, _id: 1 }).lean()
  const usable = stored.filter((account) => !account.cooldownUntil || new Date(account.cooldownUntil) <= new Date())
  const withKeys = usable.flatMap((account) => {
    try {
      return [{ ...account, apiKey: decryptSecret(account.encryptedApiKey) }]
    } catch {
      console.warn(`Skipping AI provider account ${account.name || account._id}: invalid encrypted key`)
      return []
    }
  })
  if (withKeys.length) {
    return withKeys.sort((left, right) => {
      const leftProvider = left.provider === providerPreference ? 0 : 1
      const rightProvider = right.provider === providerPreference ? 0 : 1
      return leftProvider - rightProvider || left.priority - right.priority || String(left.lastUsedAt || '').localeCompare(String(right.lastUsedAt || ''))
    })
  }
  return legacy
}

async function groqChat(account, { messages, model, responseFormat, temperature, maxTokens = 4096 }) {
  const Groq = (await import('groq-sdk')).default
  const client = new Groq({ apiKey: account.apiKey })
  const response = await client.chat.completions.create({
    messages,
    model: modelForAccount(account, model),
    ...(responseFormat ? { response_format: responseFormat } : {}),
    ...(temperature === undefined ? {} : { temperature }),
    max_tokens: maxTokens,
  })
  const text = response.choices?.[0]?.message?.content
  if (typeof text !== 'string') throw new AIProviderError('Groq returned an empty response', { code: 'EMPTY_RESPONSE' })
  return { text, usage: response.usage || null, providerRequestId: response.id }
}

async function openAICompatibleChat(account, { messages, model, responseFormat, temperature, maxTokens = 4096 }) {
  const endpoint = (account.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '') + '/chat/completions'
  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${account.apiKey}` },
      body: JSON.stringify({
        messages,
        model: modelForAccount(account, model),
        ...(responseFormat ? { response_format: responseFormat } : {}),
        ...(temperature === undefined ? {} : { temperature }),
        max_tokens: maxTokens,
      }),
    })
  } catch (error) {
    throw classifyProviderError(error)
  }
  if (!response.ok) {
    const detail = await response.text()
    throw new AIProviderError(detail.slice(0, 500) || 'OpenAI-compatible request failed', {
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

async function geminiStructured(account, { prompt, messages, schema, model, responseFormat, maxTokens = 4096, temperature = 0.1 }) {
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
    const generated = await instance.generateContent(contents)
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
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
}) {
  const requestId = randomUUID()
  const started = Date.now()
  const pool = await candidates({ route, providerPreference, model })
  if (!pool.length) throw new AIProviderError('No AI provider is configured', { status: 503, code: 'AI_NOT_CONFIGURED' })
  const attempts = []
  let lastError
  for (const account of pool.slice(0, Math.max(1, maxAttempts))) {
    const attemptStarted = Date.now()
    try {
      const result = await callAccount(account, {
        messages,
        prompt,
        schema,
        model,
        responseFormat,
        temperature,
        maxTokens,
      })
      if (!account._legacy) {
        await AIProviderAccount.updateOne(
          { _id: account._id },
          { $set: { lastUsedAt: new Date(), consecutiveFailures: 0, lastErrorCode: '' }, $unset: { cooldownUntil: 1 } },
        )
      }
      attempts.push({ account: accountSafe(account), status: 'success', durationMs: Date.now() - attemptStarted })
      return {
        text: result.text,
        usage: normalizeUsage(result.usage),
        cost: estimateCost({ provider: account.provider, model: modelForAccount(account, model), usage: result.usage }),
        requestId,
        provider: account.provider,
        account: accountSafe(account),
        model: modelForAccount(account, model),
        durationMs: Date.now() - started,
        attempts,
        providerRequestId: result.providerRequestId || null,
      }
    } catch (rawError) {
      const error = classifyProviderError(rawError)
      lastError = error
      attempts.push({ account: accountSafe(account), status: 'failure', code: error.code, statusCode: error.status, durationMs: Date.now() - attemptStarted })
      if (!account._legacy) {
        const cooldown = error.retryAfterMs || (error.retryable ? Math.min(15 * 60 * 1000, 30000 * 2 ** Math.min(account.consecutiveFailures || 0, 4)) : 0)
        await AIProviderAccount.updateOne(
          { _id: account._id },
          { $set: { lastErrorCode: error.code, lastErrorAt: new Date(), ...(cooldown ? { cooldownUntil: new Date(Date.now() + cooldown) } : {}) }, $inc: { consecutiveFailures: 1 } },
        )
      }
      if (!error.retryable) break
    }
  }
  lastError.attempts = attempts
  lastError.requestId = requestId
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
