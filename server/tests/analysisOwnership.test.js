import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

const auth = vi.hoisted(() => ({ user: null }))
vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => { req.user = auth.user; next() },
}))
vi.mock('../src/models/Essay.js', () => ({ default: { findById: vi.fn() } }))
vi.mock('../src/models/AIAnalysis.js', () => ({ default: { findOne: vi.fn() } }))
vi.mock('../src/models/Class.js', () => ({ default: { findById: vi.fn(), findOne: vi.fn() } }))
vi.mock('../src/models/ParentStudentLink.js', () => ({ default: { findOne: vi.fn() } }))
vi.mock('../src/models/SystemPrompt.js', () => ({ default: { findOne: vi.fn() } }))
vi.mock('../src/services/ai.service.js', () => ({
  processEssayAnalysis: vi.fn(),
  translateTextToVietnamese: vi.fn(),
}))

import Essay from '../src/models/Essay.js'
import AIAnalysis from '../src/models/AIAnalysis.js'
import Class from '../src/models/Class.js'
import ParentStudentLink from '../src/models/ParentStudentLink.js'
import SystemPrompt from '../src/models/SystemPrompt.js'
import { processEssayAnalysis } from '../src/services/ai.service.js'
import analysisRoutes from '../src/routes/analysis.routes.js'
import errorHandler from '../src/middleware/error.middleware.js'

const query = value => {
  const result = {
    select: () => result,
    populate: () => result,
    sort: () => result,
    lean: () => result,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  }
  return result
}
const app = express()
app.use(express.json())
app.use('/api/essays', analysisRoutes)
app.use(errorHandler)

describe('Essay analysis access boundaries', () => {
  let essay
  beforeEach(() => {
    vi.resetAllMocks()
    auth.user = { _id: 'other-student', role: 'student' }
    essay = {
      _id: 'essay-1', student: 'owner-student', class: 'class-1',
      title: 'Private writing', content: 'Private essay content', status: 'submitted',
      save: vi.fn().mockResolvedValue(undefined),
    }
    Essay.findById.mockReturnValue(query(essay))
    AIAnalysis.findOne.mockReturnValue(query({ _id: 'analysis-1', essay }))
    Class.findById.mockReturnValue(query({ _id: 'class-1', teacher: 'assigned-teacher' }))
    Class.findOne.mockReturnValue(query(null))
    ParentStudentLink.findOne.mockReturnValue(query(null))
    SystemPrompt.findOne.mockReturnValue(query(null))
    processEssayAnalysis.mockResolvedValue({ _id: 'analysis-1' })
  })

  it.each([
    ['student', 'other-student'],
    ['teacher', 'unassigned-teacher'],
    ['parent', 'unlinked-parent'],
  ])('does not disclose an analysis to an unrelated %s', async (role, id) => {
    auth.user = { _id: id, role, children: [] }
    const response = await request(app).get('/api/essays/essay-1/analysis')
    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
    expect(response.body.data).toBeUndefined()
  })

  it.each([
    ['student', 'other-student'],
    ['teacher', 'unassigned-teacher'],
    ['parent', 'unlinked-parent'],
  ])('does not reanalyze another student writing for an unrelated %s', async (role, id) => {
    auth.user = { _id: id, role, children: [] }
    const response = await request(app).post('/api/essays/essay-1/reanalyze').send({})
    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
    expect(processEssayAnalysis).not.toHaveBeenCalled()
    expect(essay.save).not.toHaveBeenCalled()
    expect(essay.status).toBe('submitted')
  })

  it('allows the student to read their own analysis', async () => {
    auth.user = { _id: 'owner-student', role: 'student' }
    const response = await request(app).get('/api/essays/essay-1/analysis')
    expect(response.status).toBe(200)
    expect(response.body.data._id).toBe('analysis-1')
  })
})
