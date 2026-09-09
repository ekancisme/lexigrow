import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest'
import process from 'node:process'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import express from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import router from '../src/routes/dailyQuest.routes.js'
import DailyQuest from '../src/models/DailyQuest.js'
import User from '../src/models/User.js'
import Vocabulary from '../src/models/Vocabulary.js'
import { wordCells } from '../src/services/crossword.service.js'
import { applyPlay } from '../src/services/dailyQuest.service.js'

const app = express()
app.use(express.json())
app.use('/quests', router)
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  res.status(err.statusCode || 500).json({ error: err.message })
})
let mongo, student, token, otherToken, teacherToken
const auth = () => `Bearer ${token}`
async function createQuest() {
  return (await request(app).post('/quests/today').set('Authorization', auth()).expect(200)).body
    .data
}
beforeAll(async () => {
  process.env.JWT_SECRET = 'daily-quest-test-only'
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
  await DailyQuest.init()
  const users = await User.create([
    { name: 'Quest Student', email: 'quest@example.test', password: 'test1234', role: 'student' },
    { name: 'Other Student', email: 'other@example.test', password: 'test1234', role: 'student' },
    { name: 'Teacher', email: 'teacher@example.test', password: 'test1234', role: 'teacher' },
  ])
  student = users[0]
  ;[token, otherToken, teacherToken] = users.map((u) =>
    jwt.sign({ id: u.id }, process.env.JWT_SECRET),
  )
}, 180_000)
afterAll(async () => {
  await mongoose.disconnect()
  await mongo?.stop()
})
beforeEach(async () => {
  await DailyQuest.deleteMany({})
  await Vocabulary.deleteMany({})
})

describe('Daily Quest API with MongoDB', () => {
  it('requires a student session', async () => {
    await request(app).post('/quests/today').expect(401)
    await request(app)
      .post('/quests/today')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(403)
  })
  it('creates exactly one daily puzzle under concurrent requests, without exposing answers', async () => {
    const quests = await Promise.all([createQuest(), createQuest(), createQuest()])
    expect(new Set(quests.map((q) => q.id)).size).toBe(1)
    expect(await DailyQuest.countDocuments()).toBe(1)
    expect(quests[0].words.length).toBeGreaterThanOrEqual(5)
    expect(quests[0].words[0]).not.toHaveProperty('answer')
  })
  it('saves and restores progress and rejects stale updates', async () => {
    const q = await createQuest(),
      w = q.words[0],
      cells = { [`${w.row},${w.col}`]: 'X' }
    const saved = await request(app)
      .post(`/quests/${q.id}/play`)
      .set('Authorization', auth())
      .send({ action: 'save', revision: 0, cells })
      .expect(200)
    expect(saved.body.data.revision).toBe(1)
    expect((await createQuest()).cells).toEqual(cells)
    await request(app)
      .post(`/quests/${q.id}/play`)
      .set('Authorization', auth())
      .send({ action: 'save', revision: 0, cells: {} })
      .expect(409)
  })
  it('protects ownership and rejects invalid coordinates', async () => {
    const q = await createQuest()
    await request(app)
      .post(`/quests/${q.id}/play`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({})
      .expect(404)
    await request(app)
      .post(`/quests/${q.id}/play`)
      .set('Authorization', auth())
      .send({ action: 'save', revision: 0, cells: { '999,999': 'A' } })
      .expect(400)
    await request(app)
      .post(`/quests/${q.id}/play`)
      .set('Authorization', auth())
      .send({ action: 'save', revision: 0, cells: [] })
      .expect(400)
  })
  it('checks answers on the server and marks reveals as assisted', async () => {
    const q = await createQuest()
    const wrong = await request(app)
      .post(`/quests/${q.id}/play`)
      .set('Authorization', auth())
      .send({ action: 'check', wordId: q.words[0].id, revision: 0, cells: {} })
      .expect(200)
    expect(wrong.body.correct).toBe(false)
    expect(wrong.body.data.solved).toHaveLength(0)
    const hint = await request(app)
      .post(`/quests/${q.id}/play`)
      .set('Authorization', auth())
      .send({ action: 'hint', wordId: q.words[0].id, revision: 1, cells: {} })
      .expect(200)
    expect(hint.body.data.assisted).toEqual([q.words[0].id])
    expect(hint.body.data.solved).toEqual([q.words[0].id])
  })
  it('awards one firefly atomically and leaves SRS and mastery unchanged', async () => {
    const vocab = await Vocabulary.create({
      student: student.id,
      word: 'garden',
      definition: 'A place to grow flowers',
      reviewCount: 3,
      masteryLevel: 'learning',
    })
    let q = await createQuest()
    const stored = await DailyQuest.findById(q.id).lean()
    const cells = {}
    stored.words.forEach((w) =>
      wordCells(w).forEach((k, i) => {
        cells[k] = w.answer[i]
      }),
    )
    for (const w of q.words.slice(0, -1)) {
      q = (
        await request(app)
          .post(`/quests/${q.id}/play`)
          .set('Authorization', auth())
          .send({ action: 'check', wordId: w.id, revision: q.revision, cells })
          .expect(200)
      ).body.data
    }
    const body = { action: 'check', wordId: q.words.at(-1).id, revision: q.revision, cells }
    const responses = await Promise.all(
      [0, 1].map(() =>
        request(app).post(`/quests/${q.id}/play`).set('Authorization', auth()).send(body),
      ),
    )
    expect(responses.some((r) => r.status === 200)).toBe(true)
    expect(responses.every((r) => [200, 409].includes(r.status))).toBe(true)
    const retry = await request(app)
      .post(`/quests/${q.id}/play`)
      .set('Authorization', auth())
      .send(body)
      .expect(200)
    expect(retry.body.data.completedAt).toBeTruthy()
    expect(retry.body.data.reward).toBe(1)
    expect(retry.body.data.words[0].answer).toBeTruthy()
    const summary = await request(app)
      .get('/quests/summary')
      .set('Authorization', auth())
      .expect(200)
    expect(summary.body.data.fireflies).toBe(1)
    const unchanged = await Vocabulary.findById(vocab.id)
    expect(unchanged.reviewCount).toBe(3)
    expect(unchanged.masteryLevel).toBe('learning')
  })
  it('expires unfinished quests after the daily boundary', async () => {
    const q = await createQuest()
    await DailyQuest.updateOne({ _id: q.id }, { $set: { day: '2020-01-01' } })
    await request(app)
      .post(`/quests/${q.id}/play`)
      .set('Authorization', auth())
      .send({ action: 'save', revision: 0, cells: {} })
      .expect(410)
  })
})

it('keeps solved crossing cells immutable and does not trust client reward fields', () => {
  const q = {
    words: [{ id: 'a', answer: 'CAT', row: 0, col: 0, direction: 'across' }],
    solved: ['a'],
    assisted: [],
    checks: 0,
  }
  const result = applyPlay(q, { action: 'save', revision: 0, cells: { '0,0': 'X' }, reward: 999 })
  expect(result.update.cells).toEqual({ '0,0': 'C', '0,1': 'A', '0,2': 'T' })
  expect(result.update.reward).toBe(1)
})
