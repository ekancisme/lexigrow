import { beforeEach, describe, expect, it, vi } from 'vitest'

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
})
