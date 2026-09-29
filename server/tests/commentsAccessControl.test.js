import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const state = vi.hoisted(() => ({
  user: { _id: 'student1', role: 'student' },
  classExists: false,
}))

vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockResolvedValue(),
}))

vi.mock('../src/models/Essay.js', () => {
  const essay = { _id: 'essay1', student: 'student1', title: 'Sample Essay' }
  return {
    default: {
      findById: vi.fn().mockImplementation((id) => {
        if (id === 'not_found') return Promise.resolve(null)
        return Promise.resolve(essay)
      }),
    },
  }
})

vi.mock('../src/models/Comment.js', () => {
  const mockComment = {
    _id: 'comment1',
    essay: 'essay1',
    user: 'user1',
    content: 'Nice paragraph',
    populate: vi.fn().mockResolvedValue({
      _id: 'comment1',
      essay: 'essay1',
      user: { _id: 'user1', name: 'User 1', role: 'student' },
      content: 'Nice paragraph',
    }),
  }
  const query = {
    sort: vi.fn().mockImplementation(() => query),
    populate: vi.fn().mockImplementation(() => query),
    then: (resolve) => resolve([mockComment]),
    catch: () => {},
  }
  return {
    default: {
      find: vi.fn().mockImplementation(() => query),
      create: vi.fn().mockResolvedValue(mockComment),
    },
  }
})

vi.mock('../src/models/Class.js', () => ({
  default: {
    exists: vi.fn().mockImplementation(() => Promise.resolve(state.classExists)),
  },
}))

vi.mock('../src/services/socket.service.js', () => ({
  initSocket: vi.fn(),
  getIO: vi.fn().mockReturnValue({
    to: () => ({ emit: vi.fn() }),
  }),
}))

vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = state.user
    next()
  },
  authorize: () => (req, res, next) => next(),
}))

import app from '../src/index.js'

describe('Comments API Object-Level Authorization (BOLA/IDOR)', () => {
  beforeEach(() => {
    state.user = { _id: 'student1', role: 'student' }
    state.classExists = false
  })

  it('allows the essay author (student) to read and create comments', async () => {
    const getRes = await request(app).get('/api/comments/essay/essay1').expect(200)
    expect(getRes.body.success).toBe(true)

    const postRes = await request(app)
      .post('/api/comments/essay/essay1')
      .send({ content: 'Author question on feedback' })
      .expect(201)
    expect(postRes.body.success).toBe(true)
  })

  it('rejects another student from reading or creating comments', async () => {
    state.user = { _id: 'intruder_student', role: 'student' }

    const getRes = await request(app).get('/api/comments/essay/essay1').expect(403)
    expect(getRes.body.success).toBe(false)
    expect(getRes.body.message).toBe('Access denied')

    const postRes = await request(app)
      .post('/api/comments/essay/essay1')
      .send({ content: 'Intruder comment attempt' })
      .expect(403)
    expect(postRes.body.success).toBe(false)
    expect(postRes.body.message).toBe('Access denied')
  })

  it('allows a teacher who teaches the student in an active class to read and create comments', async () => {
    state.user = { _id: 'teacher1', role: 'teacher' }
    state.classExists = true

    const getRes = await request(app).get('/api/comments/essay/essay1').expect(200)
    expect(getRes.body.success).toBe(true)

    const postRes = await request(app)
      .post('/api/comments/essay/essay1')
      .send({ content: 'Teacher feedback on essay' })
      .expect(201)
    expect(postRes.body.success).toBe(true)
  })

  it('rejects a teacher who does NOT teach the student in an active class', async () => {
    state.user = { _id: 'unrelated_teacher', role: 'teacher' }
    state.classExists = false

    const getRes = await request(app).get('/api/comments/essay/essay1').expect(403)
    expect(getRes.body.success).toBe(false)
    expect(getRes.body.message).toBe('Access denied')

    const postRes = await request(app)
      .post('/api/comments/essay/essay1')
      .send({ content: 'Unrelated teacher comment attempt' })
      .expect(403)
    expect(postRes.body.success).toBe(false)
    expect(postRes.body.message).toBe('Access denied')
  })

  it('allows a linked parent to read and create comments', async () => {
    state.user = { _id: 'parent1', role: 'parent', children: ['student1'] }

    const getRes = await request(app).get('/api/comments/essay/essay1').expect(200)
    expect(getRes.body.success).toBe(true)

    const postRes = await request(app)
      .post('/api/comments/essay/essay1')
      .send({ content: 'Parent encouragement note' })
      .expect(201)
    expect(postRes.body.success).toBe(true)
  })

  it('rejects an unlinked parent from reading or creating comments', async () => {
    state.user = { _id: 'other_parent', role: 'parent', children: ['different_child'] }

    const getRes = await request(app).get('/api/comments/essay/essay1').expect(403)
    expect(getRes.body.success).toBe(false)
    expect(getRes.body.message).toBe('Access denied')

    const postRes = await request(app)
      .post('/api/comments/essay/essay1')
      .send({ content: 'Unlinked parent comment attempt' })
      .expect(403)
    expect(postRes.body.success).toBe(false)
    expect(postRes.body.message).toBe('Access denied')
  })

  it('allows admin to read and create comments', async () => {
    state.user = { _id: 'admin1', role: 'admin' }

    const getRes = await request(app).get('/api/comments/essay/essay1').expect(200)
    expect(getRes.body.success).toBe(true)

    const postRes = await request(app)
      .post('/api/comments/essay/essay1')
      .send({ content: 'Admin moderation comment' })
      .expect(201)
    expect(postRes.body.success).toBe(true)
  })

  it('returns 404 when essay does not exist', async () => {
    const res = await request(app).get('/api/comments/essay/not_found').expect(404)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Essay not found')
  })
})
