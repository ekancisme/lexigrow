import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const { state, mockStudents } = vi.hoisted(() => ({
  state: {
    user: { _id: 'student_viewer_1', role: 'student' },
  },
  mockStudents: [
    {
      _id: 'student_viewer_1',
      name: 'Alice Viewer',
      email: 'alice@example.com',
      anonymousNickname: 'Clever Panda 82',
      save: vi.fn().mockResolvedValue(true),
    },
    {
      _id: 'student_peer_2',
      name: 'Bob Peer',
      email: 'bob@example.com',
      anonymousNickname: 'Swift Eagle 19',
      save: vi.fn().mockResolvedValue(true),
    },
  ],
}))

vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockResolvedValue(),
}))

vi.mock('../src/models/Essay.js', () => ({
  default: {
    countDocuments: vi.fn().mockResolvedValue(5),
  },
}))

vi.mock('../src/models/Vocabulary.js', () => ({
  default: {
    countDocuments: vi.fn().mockResolvedValue(42),
  },
}))

vi.mock('../src/models/User.js', () => ({
  default: {
    findOne: vi.fn().mockResolvedValue(null), // For nickname uniqueness check
  },
}))

vi.mock('../src/models/Class.js', () => ({
  default: {
    findById: vi.fn().mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: 'class_123',
        teacher: 'teacher_999',
        students: mockStudents,
      }),
    }),
  },
}))

vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = state.user
    next()
  },
  authorize: () => (req, res, next) => next(),
}))

import app from '../src/index.js'

describe('Class Leaderboard Privacy Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.user = { _id: 'student_viewer_1', role: 'student' }
  })

  it('omits studentId from leaderboard response when viewed by a student', async () => {
    const res = await request(app)
      .get('/api/classes/class_123/leaderboard')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.length).toBe(2)

    for (const item of res.body.data) {
      expect(item.studentId).toBeUndefined()
      expect(item.anonymousNickname).toBeDefined()
      expect(item.rank).toBeDefined()
      expect(typeof item.isCurrentUser).toBe('boolean')
    }

    const selfItem = res.body.data.find((item) => item.isCurrentUser === true)
    const peerItem = res.body.data.find((item) => item.isCurrentUser === false)

    expect(selfItem).toBeDefined()
    expect(peerItem).toBeDefined()
    expect(JSON.stringify(res.body)).not.toContain('student_peer_2')
  })

  it('includes studentId when viewed by the class teacher', async () => {
    state.user = { _id: 'teacher_999', role: 'teacher' }

    const res = await request(app)
      .get('/api/classes/class_123/leaderboard')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.length).toBe(2)

    for (const item of res.body.data) {
      expect(item.studentId).toBeDefined()
    }
  })
})
