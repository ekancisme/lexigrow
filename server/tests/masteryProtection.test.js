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

// Policy: students may freely move between 'new' and 'learning', but
// 'mastered' is evidence-based only (SRS review / writing evidence) and
// every manual transition into or out of it is rejected.
const makeWord = (masteryLevel) => ({
  _id: 'word-1',
  student: 'student-1',
  word: 'explore',
  masteryLevel,
  reviewCount: 4,
  reviewInterval: 12,
  easeFactor: 2.5,
  save: vi.fn().mockResolvedValue(undefined),
})

describe('PATCH /api/vocabulary/:id protects evidence-based mastery', () => {
  beforeEach(() => vi.resetAllMocks())

  it.each([
    ['new', 'mastered'],
    ['learning', 'mastered'],
    ['mastered', 'learning'],
    ['mastered', 'new'],
  ])('rejects a client changing %s to %s without a review', async (initial, requested) => {
    const word = makeWord(initial)
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

  it.each([
    ['new', 'learning'],
    ['learning', 'new'],
  ])('allows a client moving %s to %s', async (initial, requested) => {
    const word = makeWord(initial)
    Vocabulary.findOne.mockResolvedValue(word)

    const response = await request(app)
      .patch('/api/vocabulary/word-1')
      .send({ masteryLevel: requested })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(word.masteryLevel).toBe(requested)
    expect(word.save).toHaveBeenCalled()
    // SRS fields must not be touched by a manual PATCH
    expect(word.reviewCount).toBe(4)
    expect(word.reviewInterval).toBe(12)
    expect(word.easeFactor).toBe(2.5)
  })

  it('returns the word unchanged when masteryLevel is absent', async () => {
    const word = makeWord('learning')
    Vocabulary.findOne.mockResolvedValue(word)

    const response = await request(app)
      .patch('/api/vocabulary/word-1')
      .send({})

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(word.masteryLevel).toBe('learning')
    expect(word.save).not.toHaveBeenCalled()
  })

  it('is idempotent for same-level transitions (new → new, learning → learning)', async () => {
    for (const level of ['new', 'learning']) {
      const word = makeWord(level)
      Vocabulary.findOne.mockResolvedValue(word)

      const response = await request(app)
        .patch('/api/vocabulary/word-1')
        .send({ masteryLevel: level })

      expect(response.status).toBe(200)
      expect(word.masteryLevel).toBe(level)
      expect(word.save).not.toHaveBeenCalled()
    }
  })

  it.each([
    ['invalid'],
    ['MASTERED'],
    [null],
    [123],
  ])('rejects an invalid masteryLevel value: %j', async (requested) => {
    const word = makeWord('new')
    Vocabulary.findOne.mockResolvedValue(word)

    const response = await request(app)
      .patch('/api/vocabulary/word-1')
      .send({ masteryLevel: requested })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
    expect(word.masteryLevel).toBe('new')
    expect(word.save).not.toHaveBeenCalled()
  })

  it('returns 404 when the word does not exist or belongs to another student', async () => {
    Vocabulary.findOne.mockResolvedValue(null)

    const response = await request(app)
      .patch('/api/vocabulary/missing-word')
      .send({ masteryLevel: 'learning' })

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
  })
})