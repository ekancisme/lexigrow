import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/services/aiRelayClient.service.js', () => ({
  completeThroughRelay: vi.fn(),
}))

vi.mock('../src/services/aiGateway.service.js', () => ({
  logAICompletion: vi.fn(),
}))

import { completeThroughRelay } from '../src/services/aiRelayClient.service.js'
import { getPersonalizedLearningPath } from '../src/services/aiRecommendation.service.js'
import cacheService from '../src/services/cache.service.js'

const student = {
  _id: 'student-1',
  learningProfile: {
    targetLevel: 'B1',
    interests: ['travel'],
  },
}

const completion = {
  text: JSON.stringify({
    recommendedLevel: 'B1',
    focusAreas: ['vocabulary'],
    suggestedTopics: ['travel'],
    dailyGoalMinutes: 15,
    nextMilestone: 'Learn five words',
    learningPlan: 'Review and practice daily.',
  }),
  usage: {},
}

describe('personalized learning path recommendations', () => {
  beforeEach(() => {
    cacheService.clear()
    vi.clearAllMocks()
    completeThroughRelay.mockResolvedValue(completion)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('reuses a cached AI response for the same student inputs', async () => {
    const options = {
      competencyVersion: 3,
      recentWords: [{ word: 'journey' }],
      weakWords: [{ word: 'ticket' }],
      completedSessions: 4,
    }

    const first = await getPersonalizedLearningPath(student, options)
    const second = await getPersonalizedLearningPath(student, options)

    expect(completeThroughRelay).toHaveBeenCalledTimes(1)
    expect(first.meta.source).toBe('ai')
    expect(second).toEqual({
      data: first.data,
      meta: { source: 'cache', isFallback: false },
    })
  })

  it('uses a new AI response when competency inputs change', async () => {
    await getPersonalizedLearningPath(student, { competencyVersion: 3 })
    await getPersonalizedLearningPath(student, { competencyVersion: 4 })

    expect(completeThroughRelay).toHaveBeenCalledTimes(2)
  })

  it('deduplicates concurrent requests even when the provider exceeds the old 30s local TTL', async () => {
    vi.useFakeTimers()
    let resolve
    completeThroughRelay.mockImplementation(() => new Promise((done) => { resolve = done }))
    const first = getPersonalizedLearningPath(student)
    await vi.advanceTimersByTimeAsync(31000)
    const second = getPersonalizedLearningPath(student)
    await vi.advanceTimersByTimeAsync(1)
    expect(completeThroughRelay).toHaveBeenCalledTimes(1)
    resolve(completion)
    const [a, b] = await Promise.all([first, second])
    expect(a).toEqual(b)
    a.data.focusAreas.push('changed')
    expect(b.data.focusAreas).not.toContain('changed')
  })

  it('briefly caches transient failures, then recovers after expiry', async () => {
    vi.useFakeTimers()
    completeThroughRelay.mockRejectedValueOnce(Object.assign(new Error('timeout'), { code: 'TIMEOUT', status: 504 }))
    expect((await getPersonalizedLearningPath(student)).meta.isFallback).toBe(true)
    expect((await getPersonalizedLearningPath(student)).meta.source).toBe('offline_fallback_cache')
    expect(completeThroughRelay).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(20001)
    expect((await getPersonalizedLearningPath(student)).meta.source).toBe('ai')
    expect(completeThroughRelay).toHaveBeenCalledTimes(2)
  })

  it('does not cache invalid AI content or permanent configuration failures', async () => {
    completeThroughRelay.mockResolvedValueOnce({ text: '{"learningPlan":"incomplete"}' })
    expect((await getPersonalizedLearningPath(student)).meta.isFallback).toBe(true)
    completeThroughRelay.mockRejectedValueOnce(Object.assign(new Error('bad credentials'), { status: 401 }))
    expect((await getPersonalizedLearningPath(student)).meta.isFallback).toBe(true)
    expect((await getPersonalizedLearningPath(student)).meta.source).toBe('ai')
    expect(completeThroughRelay).toHaveBeenCalledTimes(3)
  })

  it('refreshes successful cache entries after five minutes', async () => {
    vi.useFakeTimers()
    await getPersonalizedLearningPath(student)
    await vi.advanceTimersByTimeAsync(300001)
    await getPersonalizedLearningPath(student)
    expect(completeThroughRelay).toHaveBeenCalledTimes(2)
  })

  it('refreshes recommendations immediately for profile and session changes', async () => {
    await getPersonalizedLearningPath(student)
    await getPersonalizedLearningPath({ ...student, learningProfile: { ...student.learningProfile, dailyGoalMinutes: 20 } })
    await getPersonalizedLearningPath(student, { completedSessions: 1 })
    expect(completeThroughRelay).toHaveBeenCalledTimes(3)
  })

  it('returns a usable pending fallback when another instance owns the lease', async () => {
    vi.spyOn(cacheService, 'acquireLease').mockResolvedValue(null)
    const result = await getPersonalizedLearningPath(student)
    expect(result.meta).toMatchObject({ source: 'pending', isFallback: true })
    expect(completeThroughRelay).not.toHaveBeenCalled()
  })
})
