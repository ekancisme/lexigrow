import { vi, describe, it, expect } from 'vitest'

// Helper for mongoose query builder chain
const mockQuery = (val) => {
  const q = {
    populate: vi.fn().mockImplementation(() => q),
    select: vi.fn().mockImplementation(() => q),
    sort: vi.fn().mockImplementation(() => q),
    limit: vi.fn().mockImplementation(() => q),
    distinct: vi.fn().mockImplementation(() => q),
    then: (resolve) => resolve(val),
    catch: () => {}
  }
  return q
}

// Mock db connection
vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockImplementation(() => Promise.resolve())
}))

// Mock models
vi.mock('../src/models/User.js', () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  }
}))
vi.mock('../src/models/Vocabulary.js', () => ({
  default: {
    countDocuments: vi.fn(),
  }
}))
vi.mock('../src/models/Essay.js', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn(),
  }
}))
vi.mock('../src/models/AIAnalysis.js', () => ({
  default: {
    find: vi.fn(),
  }
}))
vi.mock('../src/models/Alert.js', () => ({
  default: {
    find: vi.fn(),
  }
}))

// Mock protect middleware to inject a mock req.user
vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_parent_id', role: 'parent', name: 'Mock Parent' }
    next()
  },
  authorize: (...roles) => (req, res, next) => {
    next()
  }
}))

import request from 'supertest'
import app from '../src/index.js'
import User from '../src/models/User.js'
import Vocabulary from '../src/models/Vocabulary.js'
import Essay from '../src/models/Essay.js'
import AIAnalysis from '../src/models/AIAnalysis.js'
import Alert from '../src/models/Alert.js'

describe('Parent API', () => {
  it('should successfully link a student using their email', async () => {
    const parentMock = {
      _id: 'mock_parent_id',
      children: [],
      save: vi.fn().mockResolvedValue(true)
    }
    const studentMock = {
      _id: 'mock_student_id',
      email: 'student@example.com',
      role: 'student',
      parents: [],
      save: vi.fn().mockResolvedValue(true)
    }

    User.findById.mockReturnValue(mockQuery(parentMock))
    User.findOne.mockReturnValue(mockQuery(studentMock))

    const res = await request(app)
      .post('/api/parent/link')
      .send({ childEmail: 'student@example.com' })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.message).toContain('Successfully linked with student')
    expect(parentMock.children).toContain('mock_student_id')
    expect(studentMock.parents).toContain('mock_parent_id')
  })

  it('should get linked children list', async () => {
    const parentMock = {
      _id: 'mock_parent_id',
      children: [{ _id: 'mock_student_id', name: 'Mock Child' }],
    }
    User.findById.mockReturnValue(mockQuery(parentMock))

    const res = await request(app)
      .get('/api/parent/children')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.length).toBe(1)
    expect(res.body.data[0].name).toBe('Mock Child')
  })

  it('should get progress overview of a child', async () => {
    const parentMock = {
      _id: 'mock_parent_id',
      children: ['mock_student_id'],
    }
    const childMock = {
      _id: 'mock_student_id',
      name: 'Mock Child',
      email: 'student@example.com',
      englishLevel: 'B1'
    }
    User.findById
      .mockReturnValueOnce(mockQuery(parentMock))
      .mockReturnValueOnce(mockQuery(childMock))

    Vocabulary.countDocuments.mockResolvedValueOnce(15) // totalVocab
    Vocabulary.countDocuments.mockResolvedValueOnce(5)  // thisMonthWords
    Vocabulary.countDocuments.mockResolvedValueOnce(2)  // lastMonthWords
    Essay.countDocuments.mockResolvedValueOnce(4)       // totalEssays
    Essay.find.mockReturnValueOnce(mockQuery(['essay1', 'essay2']))
    AIAnalysis.find.mockReturnValueOnce(mockQuery([
      { scores: { vocabularyDiversity: 0.65 } },
      { scores: { vocabularyDiversity: 0.75 } }
    ]))

    const res = await request(app)
      .get('/api/parent/children/mock_student_id/progress')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.totalVocab).toBe(15)
    expect(res.body.data.avgTTR).toBe(0.7) // (0.65 + 0.75) / 2
  })

  it('should get alerts of a child', async () => {
    const parentMock = {
      _id: 'mock_parent_id',
      children: ['mock_student_id'],
    }
    User.findById.mockReturnValue(mockQuery(parentMock))
    Alert.find.mockReturnValue(mockQuery([{ _id: 'alert_id', title: 'Stagnant Vocabulary' }]))

    const res = await request(app)
      .get('/api/parent/children/mock_student_id/alerts')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.length).toBe(1)
    expect(res.body.data[0].title).toBe('Stagnant Vocabulary')
  })

  it('should get essays of a child', async () => {
    const parentMock = {
      _id: 'mock_parent_id',
      children: ['mock_student_id'],
    }
    User.findById.mockReturnValue(mockQuery(parentMock))
    Essay.find.mockReturnValue(mockQuery([{ _id: 'essay_id', title: 'My Holiday' }]))

    const res = await request(app)
      .get('/api/parent/children/mock_student_id/essays')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.length).toBe(1)
    expect(res.body.data[0].title).toBe('My Holiday')
  })
})
