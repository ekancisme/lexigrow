import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeThroughRelay } from '../src/services/aiRelayClient.service.js'

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.AI_RELAY_INTERNAL_URL
  delete process.env.AI_RELAY_SERVICE_TOKEN
})

describe('AI relay client', () => {
  it('calls one internal URL and forwards the canonical request', async () => {
    process.env.AI_RELAY_INTERNAL_URL = 'http://relay.internal'
    process.env.AI_RELAY_SERVICE_TOKEN = 'service-secret'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { text: 'ok', provider: 'gemini', model: 'gemini-test' } }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const result = await completeThroughRelay({ route: 'vocabulary_analysis', prompt: 'test', schema: { type: 'object' } })
    expect(result.model).toBe('gemini-test')
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/internal/ai/v1/complete'), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer service-secret' }),
    }))
  })
})
