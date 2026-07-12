import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockResolvedValue()
}))

vi.mock('../src/models/Assignment.js', () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn()
  }
}))

vi.mock('../src/models/Class.js', () => ({
  default: {
    findById: vi.fn()
  }
}))

vi.mock('../src/services/notification.service.js', () => ({
  createManyNotifications: vi.fn().mockResolvedValue([]),
  createNotification: vi.fn().mockResolvedValue({})
}))

vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'teacher_id', role: 'teacher', name: 'Test Teacher' }
    next()
  },
  authorize: (...roles) => (req, res, next) => {
    if (roles.includes(req.user.role)) return next()
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }
}))

import app from '../src/index.js'
import Assignment from '../src/models/Assignment.js'

describe('Assignment due date validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ['a past date', '2020-01-01T00:00:00.000Z'],
    ['an invalid date', 'not-a-date']
  ])('rejects %s when creating an assignment', async (_label, dueDate) => {
    const res = await request(app)
      .post('/api/assignments')
      .send({
        title: 'Invalid deadline',
        dueDate,
        classId: 'class_id'
      })
      .expect(400)

    expect(res.body.success).toBe(false)
    expect(Assignment.create).not.toHaveBeenCalled()
  })

  it('rejects moving an existing assignment deadline into the past', async () => {
    Assignment.findById.mockResolvedValue({
      teacher: { toString: () => 'teacher_id' },
      save: vi.fn()
    })

    const res = await request(app)
      .put('/api/assignments/assignment_id')
      .send({ dueDate: '2020-01-01T00:00:00.000Z' })
      .expect(400)

    expect(res.body.error).toContain('future')
  })
})