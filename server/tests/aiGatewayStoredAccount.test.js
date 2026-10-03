import { beforeEach, describe, expect, it, vi } from 'vitest'
import { encryptSecret } from '../src/utils/secretCrypto.js'

const { mockCreate, mockFind, mockUpdate, mockConfig } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFind: vi.fn(),
  mockUpdate: vi.fn(),
  mockConfig: vi.fn(),
}))

const accounts = [
  {
    _id: 'account-a', name: 'Groq A', provider: 'groq', model: 'model-a', priority: 1,
    encryptedApiKey: encryptSecret('secret-a'), enabled: true, routes: [], consecutiveFailures: 0,
  },
  {
    _id: 'account-b', name: 'Groq B', provider: 'groq', model: 'model-b', priority: 2,
    encryptedApiKey: encryptSecret('secret-b'), enabled: true, routes: [], consecutiveFailures: 0,
    inputCostPerMillionUsd: 3, outputCostPerMillionUsd: 9,
  },
]

vi.mock('../src/models/Config.js', () => ({ default: { findOne: mockConfig } }))
vi.mock('../src/models/AIProviderAccount.js', () => ({
  default: {
    db: { readyState: 1 },
    find: mockFind,
    updateOne: mockUpdate,
  },
}))
vi.mock('groq-sdk', () => ({
  default: class MockGroq {
    constructor({ apiKey }) {
      this.apiKey = apiKey
      this.chat = { completions: { create: mockCreate } }
    }
  },
}))

import { completeAI } from '../src/services/aiGateway.service.js'

describe('stored provider account failover', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockFind.mockReturnValue({
      select: () => ({ sort: () => ({ lean: async () => accounts }) }),
    })
    mockUpdate.mockResolvedValue({})
    mockConfig.mockResolvedValue(null)
  })

  it('uses the stored account model and cools down the failed account', async () => {
    mockCreate
      .mockRejectedValueOnce(Object.assign(new Error('quota'), { status: 429 }))
      .mockResolvedValueOnce({ id: 'ok', choices: [{ message: { content: 'done' } }], usage: { prompt_tokens: 2, completion_tokens: 1 } })
    const result = await completeAI({
      route: 'essay_analysis',
      providerPreference: 'groq',
      model: 'requested-model-must-not-win',
      messages: [{ role: 'user', content: 'hello' }],
      maxAttempts: 2,
    })
    expect(mockCreate.mock.calls[0][0].model).toBe('model-a')
    expect(mockCreate.mock.calls[1][0].model).toBe('model-b')
    expect(result.model).toBe('model-b')
    expect(result.usageAvailable).toBe(true)
    expect(result.cost).toEqual({ cost: 0.000015, pricingSource: 'account' })
    expect(JSON.stringify(result)).not.toContain('secret-a')
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ _id: 'account-a' }), expect.objectContaining({ $inc: { consecutiveFailures: 1 } }))
  })

  it('preserves provider/model/attempt metadata when all eligible accounts fail', async () => {
    mockCreate.mockRejectedValue(Object.assign(new Error('quota'), { status: 429 }))
    await expect(completeAI({
      route: 'essay_analysis',
      providerPreference: 'groq',
      messages: [{ role: 'user', content: 'hello' }],
      maxAttempts: 1,
    })).rejects.toMatchObject({
      provider: 'groq',
      account: 'Groq A',
      model: 'model-a',
      statusCode: 429,
      attempts: [expect.objectContaining({ status: 'failure', code: 'RATE_LIMITED' })],
    })
  })

  it('marks usage unavailable when the provider omits token counts', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: 'done' } }] })
    const result = await completeAI({
      route: 'essay_analysis',
      providerPreference: 'groq',
      messages: [{ role: 'user', content: 'hello' }],
      maxAttempts: 1,
    })
    expect(result.usageAvailable).toBe(false)
    expect(result.usage).toEqual({ promptTokens: 0, completionTokens: 0, totalTokens: 0 })
  })
})
