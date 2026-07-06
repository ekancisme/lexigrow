import { vi, describe, it, expect } from 'vitest'

// Mock db connection
vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockImplementation(() => Promise.resolve())
}))

// Mock models
vi.mock('../src/models/Vocabulary.js', () => ({
  default: {
    countDocuments: vi.fn(),
  }
}))
vi.mock('../src/models/Essay.js', () => ({
  default: {
    find: vi.fn(),
  }
}))
vi.mock('../src/models/AIAnalysis.js', () => ({
  default: {
    find: vi.fn(),
  }
}))
vi.mock('../src/models/User.js', () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn(),
  }
}))
vi.mock('../src/models/Class.js', () => ({
  default: {
    find: vi.fn(),
  }
}))

// Mock protect middleware to inject a mock req.user
vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_student_id', role: 'student', name: 'Mock Student' }
    next()
  },
  authorize: (...roles) => (req, res, next) => {
    next()
  }
}))

import request from 'supertest'
import app from '../src/index.js'
import Vocabulary from '../src/models/Vocabulary.js'
import Essay from '../src/models/Essay.js'
import AIAnalysis from '../src/models/AIAnalysis.js'

describe('Progress API - Weekly Comparison', () => {
  it('should return correct weekly comparison metrics', async () => {
    // 1. Mock vocabulary count (this week: 5, last week: 2)
    Vocabulary.countDocuments
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)

    // 2. Mock essay queries for this week and last week
    const mockDistinctThisWeek = vi.fn().mockResolvedValue(['essay1'])
    const mockDistinctLastWeek = vi.fn().mockResolvedValue(['essay2'])

    Essay.find
      .mockReturnValueOnce({ distinct: mockDistinctThisWeek })
      .mockReturnValueOnce({ distinct: mockDistinctLastWeek })

    // 3. Mock AI Analysis results
    AIAnalysis.find
      .mockResolvedValueOnce([
        { scores: { vocabularyDiversity: 0.6, complexityIndex: 7 } }
      ])
      .mockResolvedValueOnce([
        { scores: { vocabularyDiversity: 0.8, complexityIndex: 9 } }
      ])

    const res = await request(app)
      .get('/api/progress/weekly-comparison')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.newWords.thisWeek).toBe(5)
    expect(res.body.data.newWords.lastWeek).toBe(2)
    expect(res.body.data.newWords.change).toBe(150) // (5 - 2)/2 * 100

    expect(res.body.data.ttr.thisWeek).toBe(0.6)
    expect(res.body.data.ttr.lastWeek).toBe(0.8)
    expect(res.body.data.ttr.change).toBe(-25) // (0.6 - 0.8)/0.8 * 100

    expect(res.body.data.complexity.thisWeek).toBe(7)
    expect(res.body.data.complexity.lastWeek).toBe(9)
    expect(res.body.data.complexity.change).toBe(-22) // (7 - 9)/9 * 100
  })
})
