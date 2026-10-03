import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCreate, mockConfig } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockConfig: vi.fn(),
}))

vi.mock('../src/models/Config.js', () => ({ default: { findOne: mockConfig } }))
vi.mock('../src/models/AIProviderAccount.js', () => ({
  default: { db: { readyState: 0 } },
}))
vi.mock('groq-sdk', () => ({
  default: class MockGroq {
    constructor() {
      this.chat = { completions: { create: mockCreate } }
    }
  },
}))

import { completeAI, estimateCost } from '../src/services/aiGateway.service.js'

describe('AI gateway failover', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockConfig.mockImplementation(({ key }) => Promise.resolve(
      key === 'GROQ_API_KEY' ? { value: 'groq-legacy-key' } : key === 'OPENAI_API_KEY' ? { value: 'openai-legacy-key' } : null,
    ))
  })

  it('fails over to the next configured legacy account on rate limit', async () => {
    mockCreate.mockRejectedValueOnce(Object.assign(new Error('quota exceeded'), { status: 429 }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'provider-request-2', choices: [{ message: { content: '{"ok":true}' } }], usage: { total_tokens: 3 } }),
    }))
    const result = await completeAI({
      route: 'test',
      providerPreference: 'groq',
      model: 'test-model',
      messages: [{ role: 'user', content: 'hello' }],
      responseFormat: { type: 'json_object' },
      maxAttempts: 3,
    })
    expect(result.text).toBe('{"ok":true}')
    expect(result.attempts).toHaveLength(2)
    expect(result.attempts[0]).toMatchObject({ status: 'failure', code: 'RATE_LIMITED' })
    expect(result.attempts[1]).toMatchObject({ status: 'success' })
    vi.unstubAllGlobals()
  })

  it('does not retry a non-retryable bad request', async () => {
    mockCreate.mockRejectedValue(Object.assign(new Error('invalid schema'), { status: 400 }))
    await expect(completeAI({
      route: 'test',
      providerPreference: 'groq',
      messages: [{ role: 'user', content: 'hello' }],
      maxAttempts: 3,
    })).rejects.toMatchObject({ code: 'AI_REQUEST_ERROR', retryable: false })
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('uses model registry prices and leaves unknown models explicitly unpriced', () => {
    expect(estimateCost({
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      usage: { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 },
    })).toEqual({ cost: 1.38, pricingSource: 'registry' })
    expect(estimateCost({
      provider: 'openai-compatible',
      model: 'custom-model',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    })).toEqual({ cost: null, pricingSource: 'unknown' })
  })
})
