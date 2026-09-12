import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

// Mutable per-test state shared between the model mocks and the auth mock.
const state = vi.hoisted(() => ({
  user: { _id: 'user1', role: 'student' },
  classExists: false,
}))

vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockResolvedValue(),
}))

// Essay.findById(...).populate(...) returns the essay owned by `student1`.
vi.mock('../src/models/Essay.js', () => {
  const essay = { _id: 'essay1', student: { _id: 'student1' }, title: 'Sample' }
  const query = {
    populate: vi.fn().mockImplementation(() => query),
    sort: vi.fn().mockImplementation(() => query),
    then: (resolve) => resolve(essay),
    catch: () => {},
  }
  return {
    default: {
      findById: vi.fn().mockImplementation(() => query),
      find: vi.fn().mockImplementation(() => query),
    },
  }
})

vi.mock('../src/models/Class.js', () => ({
  default: {
    exists: vi.fn().mockImplementation(() => Promise.resolve(state.classExists)),
    find: vi.fn().mockImplementation(() => ({
      select: () => ({ lean: () => Promise.resolve([]) }),
      lean: () => Promise.resolve([]),
    })),
  },
}))

vi.mock('../src/models/Config.js', () => ({
  default: { findOne: vi.fn().mockResolvedValue(null) },
}))

vi.mock('../src/models/SystemPrompt.js', () => ({
  default: { findOne: vi.fn() },
}))

vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = state.user
    next()
  },
  authorize: () => (req, res, next) => next(),
}))

import app from '../src/index.js'

describe('Essay object-level authorization (BOLA/IDOR)', () => {
  beforeEach(() => {
    state.classExists = false
    state.user = { _id: 'user1', role: 'student' }
  })

  it('denies a student reading another student\'s essay (403)', async () => {
    state.user = { _id: 'student2', role: 'student' }
    const res = await request(app).get('/api/essays/essay1').expect(403)
    expect(res.body.success).toBe(false)
  })

  it('denies a teacher who does not teach the student (403)', async () => {
    state.user = { _id: 'teacherX', role: 'teacher' }
    state.classExists = false
    const res = await request(app).get('/api/essays/essay1').expect(403)
    expect(res.body.success).toBe(false)
  })

  it('allows a teacher whose active class contains the student (200)', async () => {
    state.user = { _id: 'teacherY', role: 'teacher' }
    state.classExists = true
    const res = await request(app).get('/api/essays/essay1').expect(200)
    expect(res.body.success).toBe(true)
  })

  it('denies a parent who is not the student\'s parent (403)', async () => {
    state.user = { _id: 'parentX', role: 'parent', children: ['someoneElse'] }
    const res = await request(app).get('/api/essays/essay1').expect(403)
    expect(res.body.success).toBe(false)
  })

  it('allows a parent of the essay\'s student (200)', async () => {
    state.user = { _id: 'parentY', role: 'parent', children: ['student1'] }
    const res = await request(app).get('/api/essays/essay1').expect(200)
    expect(res.body.success).toBe(true)
  })

  it('allows an admin to read any essay (200)', async () => {
    state.user = { _id: 'admin1', role: 'admin' }
    const res = await request(app).get('/api/essays/essay1').expect(200)
    expect(res.body.success).toBe(true)
  })
})