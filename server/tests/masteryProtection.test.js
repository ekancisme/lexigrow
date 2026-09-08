import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

vi.mock('../src/models/Vocabulary.js', () => ({
  default: { findOne: vi.fn() },
}))

vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'student-1', role: 'student' }
    next()
  },
  authorize: () => (req, res, next) => next(),
}))

import Vocabulary from '../src/models/Vocabulary.js'
import vocabularyRoutes from '../src/routes/vocabulary.routes.js'
import errorHandler from '../src/middleware/error.middleware.js'

const app = express()
app.use(express.json())
app.use('/api/vocabulary', vocabularyRoutes)
app.use(errorHandler)

describe('PATCH /api/vocabulary/:id protects evidence-based mastery', () => {
  beforeEach(() => vi.resetAllMocks())

  it.each([
    ['new', 'mastered'],
    ['learning', 'mastered'],
    ['mastered', 'learning'],
    ['mastered', 'new'],
  ])('rejects a client changing %s to %s without a review', async (initial, requested) => {
    const word = {
      _id: 'word-1',
      student: 'student-1',
      word: 'explore',
      masteryLevel: initial,
      reviewCount: 4,
      reviewInterval: 12,
      easeFactor: 2.5,
      save: vi.fn().mockResolvedValue(undefined),
    }
    Vocabulary.findOne.mockResolvedValue(word)

    const response = await request(app)
      .patch('/api/vocabulary/word-1')
      .send({ masteryLevel: requested })

    expect(response.status).toBe(403)
    expect(response.body.success).toBe(false)
    expect(word.masteryLevel).toBe(initial)
    expect(word.reviewCount).toBe(4)
    expect(word.reviewInterval).toBe(12)
    expect(word.easeFactor).toBe(2.5)
    expect(word.save).not.toHaveBeenCalled()
  })
})
