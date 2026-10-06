import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import cacheService from '../src/services/cache.service.js'

describe('shared recommendation leases', () => {
  let originalClient, originalReady, owner, expires, client
  beforeEach(() => {
    vi.useFakeTimers()
    originalClient = cacheService.redisClient
    originalReady = cacheService.isRedisReady
    owner = null
    client = {
      set: vi.fn(async (_key, token, options) => {
        if (owner && expires > Date.now()) return null
        owner = token
        expires = Date.now() + options.PX
        return 'OK'
      }),
      eval: vi.fn(async (script, { arguments: args }) => {
        if (owner !== args[0]) return 0
        if (script.includes('pexpire')) expires = Date.now() + Number(args[1])
        else owner = null
        return 1
      }),
    }
    cacheService.redisClient = client
    cacheService.isRedisReady = true
  })
  afterEach(() => {
    cacheService.redisClient = originalClient
    cacheService.isRedisReady = originalReady
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('uses an atomic NX lease, renews long-running work, and releases it', async () => {
    const release = await cacheService.acquireLease('same-inputs')
    expect(client.set).toHaveBeenCalledWith('lock:same-inputs', expect.any(String), { NX: true, PX: 30000 })
    expect(await cacheService.acquireLease('same-inputs')).toBeNull()
    await vi.advanceTimersByTimeAsync(61000)
    expect(await cacheService.acquireLease('same-inputs')).toBeNull()
    await release()
    expect(owner).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    const next = await cacheService.acquireLease('same-inputs')
    expect(next).toBeTypeOf('function')
    await next()
  })

  it('releases only its own token and leaves a replacement lease untouched', async () => {
    const release = await cacheService.acquireLease('same-inputs')
    owner = 'replacement-owner'
    await release()
    expect(owner).toBe('replacement-owner')
    expect(client.eval.mock.calls.at(-1)[0]).toContain('redis.call("get", KEYS[1]) == ARGV[1]')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps local operation available when Redis is absent or unavailable', async () => {
    cacheService.isRedisReady = false
    await expect(cacheService.acquireLease('no-redis')).resolves.toBeTypeOf('function')
    cacheService.isRedisReady = true
    client.set.mockRejectedValue(new Error('offline'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(cacheService.acquireLease('failed-redis')).resolves.toBeTypeOf('function')
    expect(vi.getTimerCount()).toBe(0)
  })
})
