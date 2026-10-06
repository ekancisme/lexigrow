import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/services/api.js'

const pendingUntilAbort = (signal) => new Promise((_, reject) => {
  if (signal.aborted) reject(new DOMException('Aborted', 'AbortError'))
  else signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
})

describe('dashboard API deadlines', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('normalizes a timeout before headers arrive', async () => {
    fetch.mockImplementation((_, config) => pendingUntilAbort(config.signal))
    const result = expect(api.get('/slow', { timeoutMs: 5000 })).rejects.toMatchObject({ status: 408, code: 'TIMEOUT' })
    await vi.advanceTimersByTimeAsync(5000)
    await result
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps the deadline active while the response body is streaming', async () => {
    fetch.mockImplementation(async (_, config) => ({
      ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }),
      text: () => pendingUntilAbort(config.signal),
    }))
    const result = expect(api.get('/slow-body', { timeoutMs: 5000 })).rejects.toMatchObject({ code: 'TIMEOUT' })
    await vi.advanceTimersByTimeAsync(5000)
    await result
  })

  it('preserves caller cancellation alongside a deadline', async () => {
    fetch.mockImplementation((_, config) => pendingUntilAbort(config.signal))
    const controller = new AbortController()
    const result = expect(api.get('/cancel', { timeoutMs: 5000, signal: controller.signal })).rejects.toMatchObject({ status: 0, code: 'ABORTED' })
    controller.abort()
    await result
    expect(vi.getTimerCount()).toBe(0)
  })

  it('honors an already cancelled caller', async () => {
    fetch.mockImplementation((_, config) => pendingUntilAbort(config.signal))
    const controller = new AbortController()
    controller.abort()
    await expect(api.get('/cancel', { signal: controller.signal })).rejects.toMatchObject({ code: 'ABORTED' })
  })

  it('cleans up after success and keeps timeoutMs out of fetch options', async () => {
    fetch.mockResolvedValue(new Response('{"data":42}', { headers: { 'content-type': 'application/json' } }))
    await expect(api.get('/fast', { timeoutMs: 5000 })).resolves.toEqual({ data: 42 })
    expect(fetch.mock.calls[0][1]).not.toHaveProperty('timeoutMs')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('supports deadlines for POST requests without changing existing body handling', async () => {
    fetch.mockResolvedValue(new Response('{"success":true}', { headers: { 'content-type': 'application/json' } }))
    await expect(api.post('/submit', { content: 'essay' }, { timeoutMs: 45000 })).resolves.toEqual({ success: true })
    expect(fetch.mock.calls[0][1].method).toBe('POST')
    expect(fetch.mock.calls[0][1].body).toBe('{"content":"essay"}')
    expect(fetch.mock.calls[0][1]).not.toHaveProperty('timeoutMs')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('preserves malformed JSON errors instead of reporting a network failure', async () => {
    fetch.mockResolvedValue(new Response('{', { headers: { 'content-type': 'application/json' } }))
    await expect(api.get('/bad-json', { timeoutMs: 5000 })).rejects.toMatchObject({ code: 'INVALID_JSON' })
    expect(vi.getTimerCount()).toBe(0)
  })
})
