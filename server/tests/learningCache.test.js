import { describe, it, expect, vi } from 'vitest'
import { createLearningCache } from '../src/services/learningCache.service.js'
describe('Bounded static-content cache', () => {
  it('deduplicates same reads and invalidates after publishing', async () => {
    const c = createLearningCache({ ttlMs: 100, maxEntries: 2 }),
      load = vi.fn().mockResolvedValue({ title: 'old' })
    await Promise.all([c.get('a', load), c.get('a', load)])
    expect(load).toHaveBeenCalledTimes(1)
    c.clear()
    load.mockResolvedValue({ title: 'new' })
    expect((await c.get('a', load)).title).toBe('new')
    expect(load).toHaveBeenCalledTimes(2)
  })
  it('does not expose mutable cached objects to callers', async () => {
    const c = createLearningCache({})
    const r = await c.get('a', async () => ({ x: 1 }))
    r.x = 2
    expect(await c.get('a', async () => ({ x: 3 }))).toEqual({ x: 1 })
  })
  it('expires stale content and bounds storage', async () => {
    let now = 0
    const c = createLearningCache({ ttlMs: 10, maxEntries: 1, now: () => now })
    const load = vi.fn().mockResolvedValue(1)
    await c.get('a', load)
    now = 11
    await c.get('a', load)
    expect(load).toHaveBeenCalledTimes(2)
    await c.get('b', load)
    await c.get('a', load)
    expect(load).toHaveBeenCalledTimes(4)
  })
})
