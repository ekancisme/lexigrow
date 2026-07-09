import { vi, describe, it, expect } from 'vitest'

// Mock db connection
vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockImplementation(() => Promise.resolve())
}))

// Mock models
vi.mock('../src/models/Class.js', () => ({
  default: {
    findById: vi.fn(),
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

// Mock protect middleware to inject a mock req.user as teacher
vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_teacher_id', role: 'teacher', name: 'Mock Teacher' }
    next()
  },
  authorize: (...roles) => (req, res, next) => {
    next()
  }
}))

import request from 'supertest'
import app from '../src/index.js'
import Class from '../src/models/Class.js'
import Essay from '../src/models/Essay.js'
import AIAnalysis from '../src/models/AIAnalysis.js'

describe('Class Analytics API', () => {
  it('should return 200 and valid statistics structure', async () => {
    // 1. Mock Class.findById
    Class.findById.mockResolvedValue({
      _id: 'mock_class_id',
      teacher: 'mock_teacher_id',
      students: ['student1', 'student2'],
      name: 'Class A'
    })

    // 2. Mock Essay.find
    Essay.find.mockResolvedValue([
      { _id: 'essay1', student: 'student1' },
      { _id: 'essay2', student: 'student2' }
    ])

    // 3. Mock AIAnalysis.find
    AIAnalysis.find.mockResolvedValue([
      {
        essay: 'essay1',
        scores: { vocabularyDiversity: 0.5, grammarAccuracy: 7.0 },
        createdAt: new Date()
      },
      {
        essay: 'essay2',
        scores: { vocabularyDiversity: 0.6, grammarAccuracy: 8.0 },
        createdAt: new Date()
      }
    ])

    const res = await request(app)
      .get('/api/classes/mock_class_id/analytics')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.summary.overallAvgTTR).toBe(0.55)
    expect(res.body.data.summary.overallAvgGrammar).toBe(7.5)
    expect(res.body.data.summary.totalEssaysAnalyzed).toBe(2)
    expect(res.body.data.trend).toHaveLength(6)
  })

  it('should return 403 if class teacher does not match requester', async () => {
    Class.findById.mockResolvedValue({
      _id: 'mock_class_id',
      teacher: 'another_teacher_id',
      students: [],
      name: 'Class B'
    })

    const res = await request(app)
      .get('/api/classes/mock_class_id/analytics')
      .expect(403)

    expect(res.body.success).toBe(false)
  })

  it('should return 200 and valid insights data structure', async () => {
    // 1. Mock Class.findById
    Class.findById.mockResolvedValue({
      _id: 'mock_class_id',
      teacher: 'mock_teacher_id',
      students: ['student1', 'student2'],
      name: 'Class A'
    })

    // 2. Mock Essay.find
    Essay.find.mockResolvedValue([
      { _id: 'essay1', student: 'student1' },
      { _id: 'essay2', student: 'student2' }
    ])

    // 3. Mock AIAnalysis.find
    AIAnalysis.find.mockResolvedValue([
      {
        essay: 'essay1',
        nlpStats: {
          repeatedWords: [{ word: 'however', count: 5 }, { word: 'very', count: 3 }]
        },
        suggestions: [
          { type: 'improvement', text: 'You made a tense grammar error here.' }
        ]
      },
      {
        essay: 'essay2',
        nlpStats: {
          repeatedWords: [{ word: 'however', count: 2 }]
        },
        suggestions: [
          { type: 'improvement', text: 'Check your article preposition usage in this sentence.' }
        ]
      }
    ])

    const res = await request(app)
      .get('/api/classes/mock_class_id/insights')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.repeatedWords).toHaveLength(2)
    expect(res.body.data.repeatedWords[0].word).toBe('however')
    expect(res.body.data.repeatedWords[0].count).toBe(7)
    expect(res.body.data.repeatedWords[0].studentCount).toBe(2)
    expect(res.body.data.grammarErrors).toHaveLength(2)
  })
})
