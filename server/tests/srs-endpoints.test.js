import { vi, describe, it, expect, beforeEach } from 'vitest'

// ── Mock helpers ──────────────────────────────────────────────────────────────

// Builds a chainable query compatible with .sort().limit() as used in getDueToday
const mockChainQuery = (val) => {
  const q = {
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(val),
  }
  return q
}

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockImplementation(() => Promise.resolve()),
}))

vi.mock('../src/models/Vocabulary.js', () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_student_id', role: 'student', name: 'Mock Student' }
    next()
  },
  authorize: (...roles) => (req, res, next) => next(),
}))

vi.mock('../src/services/ai.service.js', () => ({
  enrichWordsList: vi.fn().mockResolvedValue([]),
}))

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import request from 'supertest'
import app from '../src/index.js'
import Vocabulary from '../src/models/Vocabulary.js'

// ── GET /vocabulary/due-today ─────────────────────────────────────────────────

describe('GET /api/vocabulary/due-today', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with words due including null nextReviewDate', async () => {
    const mockWords = [
      { _id: 'word1', word: 'apple', nextReviewDate: null },
      { _id: 'word2', word: 'banana', nextReviewDate: new Date(Date.now() - 86400000) },
    ]
    Vocabulary.find.mockReturnValue(mockChainQuery(mockWords))

    const res = await request(app)
      .get('/api/vocabulary/due-today')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.count).toBe(2)
    expect(res.body.data).toHaveLength(2)
  })

  it('does not return words with future nextReviewDate (query condition is correct)', async () => {
    // Only past/null words should be in the query result — we verify the find()
    // was called with the correct $or condition including $lte: now
    const mockWords = [{ _id: 'word1', word: 'apple', nextReviewDate: null }]
    Vocabulary.find.mockReturnValue(mockChainQuery(mockWords))

    await request(app).get('/api/vocabulary/due-today').expect(200)

    const findArg = Vocabulary.find.mock.calls[0][0]
    expect(findArg.$or).toBeDefined()
    expect(findArg.$or[0]).toEqual({ nextReviewDate: null })
    expect(findArg.$or[1].nextReviewDate.$lte).toBeInstanceOf(Date)
  })

  it('passes limit query param to .limit()', async () => {
    Vocabulary.find.mockReturnValue(mockChainQuery([]))

    await request(app).get('/api/vocabulary/due-today?limit=5').expect(200)

    const chainMock = Vocabulary.find.mock.results[0].value
    expect(chainMock.limit).toHaveBeenCalledWith(5)
  })

  it('defaults to limit 20 when not provided', async () => {
    Vocabulary.find.mockReturnValue(mockChainQuery([]))

    await request(app).get('/api/vocabulary/due-today').expect(200)

    const chainMock = Vocabulary.find.mock.results[0].value
    expect(chainMock.limit).toHaveBeenCalledWith(20)
  })

  it('filters by current user student id', async () => {
    Vocabulary.find.mockReturnValue(mockChainQuery([]))

    await request(app).get('/api/vocabulary/due-today').expect(200)

    const findArg = Vocabulary.find.mock.calls[0][0]
    expect(findArg.student).toBe('mock_student_id')
  })

  it('returns empty array when no words are due', async () => {
    Vocabulary.find.mockReturnValue(mockChainQuery([]))

    const res = await request(app).get('/api/vocabulary/due-today').expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.count).toBe(0)
    expect(res.body.data).toEqual([])
  })
})

// ── POST /vocabulary/review ───────────────────────────────────────────────────

describe('POST /api/vocabulary/review', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockWord = () => ({
    _id: 'word_id',
    student: 'mock_student_id',
    word: 'apple',
    easeFactor: 2.5,
    reviewInterval: 1,
    reviewCount: 0,
    masteryLevel: 'new',
    save: vi.fn().mockResolvedValue(true),
  })

  it('returns 400 when wordId is missing', async () => {
    const res = await request(app)
      .post('/api/vocabulary/review')
      .send({ rating: 3 })
      .expect(400)

    expect(res.body.success).toBe(false)
    expect(res.body.error).toMatch(/wordId/)
  })

  it('returns 400 when rating is invalid (0)', async () => {
    const res = await request(app)
      .post('/api/vocabulary/review')
      .send({ wordId: 'some_id', rating: 0 })
      .expect(400)

    expect(res.body.success).toBe(false)
    expect(res.body.error).toMatch(/rating/)
  })

  it('returns 400 when rating is invalid (5)', async () => {
    const res = await request(app)
      .post('/api/vocabulary/review')
      .send({ wordId: 'some_id', rating: 5 })
      .expect(400)

    expect(res.body.success).toBe(false)
  })

  it('returns 404 when word does not belong to authenticated user', async () => {
    Vocabulary.findOne.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/vocabulary/review')
      .send({ wordId: 'other_users_word', rating: 3 })
      .expect(404)

    expect(res.body.success).toBe(false)
    expect(res.body.error).toMatch(/not found/i)
  })

  it('findOne is called with both _id and student for ownership check', async () => {
    Vocabulary.findOne.mockResolvedValue(null)

    await request(app)
      .post('/api/vocabulary/review')
      .send({ wordId: 'word_id', rating: 3 })

    expect(Vocabulary.findOne).toHaveBeenCalledWith({
      _id: 'word_id',
      student: 'mock_student_id',
    })
  })

  it('returns 200 and updates SRS fields on valid review (rating 3)', async () => {
    const word = mockWord()
    Vocabulary.findOne.mockResolvedValue(word)

    const res = await request(app)
      .post('/api/vocabulary/review')
      .send({ wordId: 'word_id', rating: 3 })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(word.save).toHaveBeenCalledTimes(1)
    // After rating 3 on a fresh word: reviewCount should be 1
    expect(word.reviewCount).toBe(1)
    expect(word.masteryLevel).toBe('learning')
    expect(word.nextReviewDate).toBeInstanceOf(Date)
  })

  it('updates masteryLevel to new when rating 1 (fails review)', async () => {
    const word = mockWord()
    word.reviewCount = 3
    word.masteryLevel = 'learning'
    Vocabulary.findOne.mockResolvedValue(word)

    await request(app)
      .post('/api/vocabulary/review')
      .send({ wordId: 'word_id', rating: 1 })
      .expect(200)

    expect(word.reviewCount).toBe(0)
    expect(word.masteryLevel).toBe('new')
  })

  it('accepts string rating coerced to number', async () => {
    const word = mockWord()
    Vocabulary.findOne.mockResolvedValue(word)

    const res = await request(app)
      .post('/api/vocabulary/review')
      .send({ wordId: 'word_id', rating: '4' })
      .expect(200)

    expect(res.body.success).toBe(true)
  })

  it('returns 200 with updated word data in response body', async () => {
    const word = mockWord()
    Vocabulary.findOne.mockResolvedValue(word)

    const res = await request(app)
      .post('/api/vocabulary/review')
      .send({ wordId: 'word_id', rating: 3 })
      .expect(200)

    expect(res.body.data).toBeDefined()
  })
})
