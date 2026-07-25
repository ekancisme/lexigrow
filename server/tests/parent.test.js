import { vi, describe, it, expect } from 'vitest'

// Helper for mongoose query builder chain
const mockQuery = (val) => {
  const q = {
    populate: vi.fn().mockImplementation(() => q),
    select: vi.fn().mockImplementation(() => q),
    sort: vi.fn().mockImplementation(() => q),
    limit: vi.fn().mockImplementation(() => q),
    distinct: vi.fn().mockImplementation(() => q),
    lean: vi.fn().mockImplementation(() => q),
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
    updateOne: vi.fn(),
  }
}))
vi.mock('../src/models/ChildLinkCode.js', () => ({
  default: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  }
}))
vi.mock('../src/models/ParentStudentLink.js', () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
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
  authorize: () => (req, res, next) => {
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
import ChildLinkCode from '../src/models/ChildLinkCode.js'
import ParentStudentLink from '../src/models/ParentStudentLink.js'

describe('Parent API', () => {
  it('should generate a one-time child link code without storing the raw code', async () => {
    ChildLinkCode.deleteMany.mockResolvedValue({ deletedCount: 0 })
    ChildLinkCode.create.mockResolvedValue({ _id: 'code_id' })

    const res = await request(app)
      .post('/api/parent/link-code')
      .expect(201)

    expect(res.body.success).toBe(true)
    expect(res.body.data.code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/)
    expect(ChildLinkCode.create).toHaveBeenCalledWith(expect.objectContaining({
      student: 'mock_parent_id',
      codeHash: expect.not.stringContaining(res.body.data.code),
    }))
  })

  it('should successfully link a student using a one-time code', async () => {
    const studentMock = {
      _id: 'mock_student_id',
      name: 'Mock Child',
      role: 'student',
      avatar: '',
      englishLevel: 'B1',
    }
    const linkMock = {
      _id: 'link_id',
      relationship: 'guardian',
    }

    ChildLinkCode.findOneAndUpdate.mockResolvedValue({
      _id: 'code_id',
      student: 'mock_student_id',
    })
    User.findOne.mockResolvedValue(studentMock)
    ParentStudentLink.findOne.mockResolvedValue(null)
    ParentStudentLink.create.mockResolvedValue(linkMock)
    User.updateOne.mockResolvedValue({ modifiedCount: 1 })

    const res = await request(app)
      .post('/api/parent/link')
      .send({ linkCode: 'ABCD2345', relationship: 'guardian' })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.message).toContain('Successfully linked with student')
    expect(ParentStudentLink.create).toHaveBeenCalledWith({
      parent: 'mock_parent_id',
      student: 'mock_student_id',
      relationship: 'guardian',
    })
    expect(User.updateOne).toHaveBeenCalledTimes(2)
  })

  it('should revoke only the selected child relationship', async () => {
    const linkMock = {
      status: 'active',
      revokedAt: null,
      revokedBy: null,
      save: vi.fn().mockResolvedValue(true),
    }
    ParentStudentLink.findOne.mockResolvedValue(linkMock)
    User.updateOne.mockResolvedValue({ modifiedCount: 1 })

    const res = await request(app)
      .delete('/api/parent/children/mock_student_id/link')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(linkMock.status).toBe('revoked')
    expect(linkMock.revokedBy).toBe('mock_parent_id')
    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: 'mock_parent_id' },
      { $pull: { children: 'mock_student_id' } }
    )
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
    Vocabulary.countDocuments.mockResolvedValueOnce(0)
    Vocabulary.countDocuments.mockResolvedValueOnce(1)
    Vocabulary.countDocuments.mockResolvedValueOnce(2)
    Vocabulary.countDocuments.mockResolvedValueOnce(3)
    Vocabulary.countDocuments.mockResolvedValueOnce(4)
    Vocabulary.countDocuments.mockResolvedValueOnce(5)
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
    expect(res.body.data.englishLevel).toBe('B1')
    expect(res.body.data.weeklyVocabulary.map(week => week.count)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('should reject progress access for an unlinked student', async () => {
    User.findById.mockReturnValue(mockQuery({
      _id: 'mock_parent_id',
      children: ['different_student_id'],
    }))

    const res = await request(app)
      .get('/api/parent/children/mock_student_id/progress')
      .expect(403)

    expect(res.body.success).toBe(false)
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
    AIAnalysis.find.mockReturnValue(mockQuery([{
      essay: { toString: () => 'essay_id' },
      overallScore: 8.2,
    }]))

    const res = await request(app)
      .get('/api/parent/children/mock_student_id/essays')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.length).toBe(1)
    expect(res.body.data[0].title).toBe('My Holiday')
    expect(res.body.data[0].analysis.overallScore).toBe(8.2)
  })
})
