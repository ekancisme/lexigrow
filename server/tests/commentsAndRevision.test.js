import { vi, describe, it, expect } from 'vitest'

// Helper for mongoose query builder chain
const mockQuery = (val) => {
  const q = {
    sort: vi.fn().mockImplementation(() => q),
    populate: vi.fn().mockImplementation(() => q),
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
vi.mock('../src/models/Essay.js', () => ({
  default: {
    findById: vi.fn(),
  }
}))

vi.mock('../src/models/Config.js', () => ({
  default: {
    findOne: vi.fn(),
  }
}))

vi.mock('../src/models/Comment.js', () => {
  const mockComment = {
    _id: 'mock_comment_id',
    essay: 'mock_essay_id',
    user: 'mock_user_id',
    content: 'Mock discussion message content',
    populate: vi.fn().mockImplementation(() => Promise.resolve(mockComment)),
    createdAt: new Date().toISOString()
  }
  
  return {
    default: {
      find: vi.fn(),
      create: vi.fn().mockResolvedValue(mockComment),
      index: vi.fn()
    }
  }
})

// Mock protect middleware to inject a mock req.user
vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_user_id', role: 'teacher', name: 'Mock Teacher' }
    next()
  },
  authorize: (...roles) => (req, res, next) => {
    next()
  }
}))

// Mock Notification model to avoid console error warnings
vi.mock('../src/models/Notification.js', () => ({
  default: {
    create: vi.fn().mockResolvedValue({}),
  }
}))

// Mock socket service
vi.mock('../src/services/socket.service.js', () => ({
  initSocket: vi.fn(),
  getIO: vi.fn().mockImplementation(() => ({
    to: vi.fn().mockImplementation(() => ({
      emit: vi.fn()
    }))
  }))
}))

import request from 'supertest'
import app from '../src/index.js'
import Essay from '../src/models/Essay.js'
import Comment from '../src/models/Comment.js'
import Config from '../src/models/Config.js'

describe('Comments & Revision API', () => {
  it('should successfully transition an essay status to needs_revision', async () => {
    const saveMock = vi.fn().mockResolvedValue(true)
    Essay.findById.mockResolvedValue({
      _id: 'mock_essay_id',
      title: 'Mock Essay Title',
      status: 'reviewed',
      save: saveMock
    })

    const res = await request(app)
      .patch('/api/essays/mock_essay_id/request-revision')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('needs_revision')
    expect(saveMock).toHaveBeenCalled()
  })

  it('should fetch comments for a specific essay', async () => {
    Essay.findById.mockResolvedValue({
      _id: 'mock_essay_id',
      student: 'mock_student_id'
    })

    const commentsList = [
      {
        _id: 'comment_1',
        content: 'Please look at paragraph 2',
        user: { _id: 'user_1', name: 'Mock Teacher', role: 'teacher' }
      }
    ]

    Comment.find.mockReturnValue(mockQuery(commentsList))

    const res = await request(app)
      .get('/api/comments/essay/mock_essay_id')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.length).toBe(1)
    expect(res.body.data[0].content).toBe('Please look at paragraph 2')
  })

  it('should allow posting a new comment to an essay', async () => {
    Essay.findById.mockResolvedValue({
      _id: 'mock_essay_id',
      student: 'mock_student_id'
    })

    const res = await request(app)
      .post('/api/comments/essay/mock_essay_id')
      .send({ content: 'Looks great but check vocabulary.' })
      .expect(201)

    expect(res.body.success).toBe(true)
    expect(res.body.data.content).toBe('Mock discussion message content')
  })

  describe('GET /api/essays/paste-config', () => {
    it('should return allowPaste value from db configuration', async () => {
      Config.findOne.mockResolvedValue({ key: 'ALLOW_PASTE_ESSAY', value: 'false' })

      const res = await request(app)
        .get('/api/essays/paste-config')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.allowPaste).toBe(false)
    })
  })
})
