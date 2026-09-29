import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../src/app.js'
import User from '../src/models/User.js'
import LearningSet from '../src/models/LearningSet.js'
import LearningSession from '../src/models/LearningSession.js'
import WordUsageEvidence from '../src/models/WordUsageEvidence.js'
import Vocabulary from '../src/models/Vocabulary.js'

let mongo, student, otherStudent, teacher, parent, admin
let token, teacherToken, parentToken, adminToken, set
const auth = (r, t = token) => r.set('Authorization', 'Bearer ' + t)

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-only-garden-secret'
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
  await mongoose.connect(mongo.getUri())
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()))
}, 120000)
afterAll(async () => {
  await mongoose.disconnect()
  if (mongo) await mongo.stop()
}, 30000)
beforeEach(async () => {
  await Promise.all(Object.values(mongoose.models).map((m) => m.deleteMany({})))
  const users = await User.create([
    { name: 'Student', email: 'student@example.test', password: 'password1' },
    { name: 'Other', email: 'other@example.test', password: 'password1' },
    { name: 'Teacher', email: 'teacher@example.test', password: 'password1', role: 'teacher' },
    { name: 'Parent', email: 'parent@example.test', password: 'password1', role: 'parent' },
    { name: 'Admin', email: 'admin@example.test', password: 'password1', role: 'admin' },
  ])
  ;[student, otherStudent, teacher, parent, admin] = users
  token = jwt.sign({ id: student.id }, process.env.JWT_SECRET)
  teacherToken = jwt.sign({ id: teacher.id }, process.env.JWT_SECRET)
  parentToken = jwt.sign({ id: parent.id }, process.env.JWT_SECRET)
  adminToken = jwt.sign({ id: admin.id }, process.env.JWT_SECRET)
  set = await LearningSet.create({
    slug: 'academic-topic',
    title: 'Academic',
    description: 'Academic words',
    level: 'B1',
    category: 'Academic',
    status: 'published',
    items: [{ word: 'analyze', partOfSpeech: 'verb', definitionVi: 'phân tích', quizQuestions: [] }],
  })
})

// Evidence-based mastery: same word used correctly, unassisted, across
// ≥2 essays and ≥2 local days counts as mastered (see masteredPipeline).
const evidence = (word, theme, essayDay) => ({
  student: student._id,
  word,
  meaning: 'meaning of ' + word,
  // Unique index is (student, word, contextSentence) — vary the sentence per day.
  contextSentence: `I use ${word} on ${essayDay}.`,
  essayId: new mongoose.Types.ObjectId(),
  revisionId: new mongoose.Types.ObjectId(),
  theme,
  isVerifiedCorrect: true,
  assisted: false,
  localDay: essayDay,
})

const plantTopic = async (theme) =>
  LearningSession.create({
    student: student._id,
    learningSet: set._id,
    learningSetSlug: set.slug,
    theme,
    targetWords: [{ word: 'analyze' }],
    status: 'completed',
  })

describe('POST /api/garden/water', () => {
  it('G-01..G-04: rejects missing token and non-student roles', async () => {
    await request(app).post('/api/garden/water').send({ slug: 'academic' }).expect(401)
    await auth(request(app).post('/api/garden/water'), teacherToken).send({ slug: 'academic' }).expect(403)
    await auth(request(app).post('/api/garden/water'), parentToken).send({ slug: 'academic' }).expect(403)
    await auth(request(app).post('/api/garden/water'), adminToken).send({ slug: 'academic' }).expect(403)
  })

  it('G-05..G-09: validates input for a valid student', async () => {
    await plantTopic('academic')
    const ok = await auth(request(app).post('/api/garden/water')).send({ slug: 'academic' }).expect(200)
    expect(ok.body.success).toBe(true)
    expect(ok.body.data.watered).toBe(true)

    await auth(request(app).post('/api/garden/water')).send({}).expect(400)
    await auth(request(app).post('/api/garden/water')).send({ other: 'x' }).expect(400)
    await auth(request(app).post('/api/garden/water')).send({ slug: 123 }).expect(400)
    await auth(request(app).post('/api/garden/water')).send({ slug: ['a'] }).expect(400)
    await auth(request(app).post('/api/garden/water')).send({ slug: 'x'.repeat(101) }).expect(400)
  })

  it('G-10: unknown topic returns 404', async () => {
    await auth(request(app).post('/api/garden/water')).send({ slug: 'does-not-exist' }).expect(404)
  })

  it('G-11/G-13: topic without vocabulary waters with masteredCount 0 and creates no fake mastery', async () => {
    await plantTopic('academic')
    const res = await auth(request(app).post('/api/garden/water')).send({ slug: 'academic' }).expect(200)
    expect(res.body.data.masteredCount).toBe(0)
    expect(res.body.data.stage).toBe('seed')
    expect(await WordUsageEvidence.countDocuments()).toBe(0)
    expect(await Vocabulary.countDocuments({ masteryLevel: 'mastered' })).toBe(0)
  })

  it('G-12: watering never reads or mutates another student\'s topics', async () => {
    // The theme only exists for the other student.
    await LearningSession.create({
      student: otherStudent._id,
      learningSet: set._id,
      theme: 'private-topic',
      targetWords: [{ word: 'analyze' }],
      status: 'completed',
    })
    await auth(request(app).post('/api/garden/water')).send({ slug: 'private-topic' }).expect(404)
  })

  it('G-13/G-16/G-17: counts evidence-based mastery only and never touches Vocabulary.masteryLevel', async () => {
    await plantTopic('academic')
    // One mastered word: correct, unassisted, 2 essays, 2 days.
    await WordUsageEvidence.create([
      evidence('analyze', 'academic', '2026-09-01'),
      evidence('analyze', 'academic', '2026-09-02'),
    ])
    // A Vocabulary row the water action must NOT modify.
    const vocab = await Vocabulary.create({
      student: student._id,
      word: 'analyze',
      category: 'academic',
      theme: 'academic',
      masteryLevel: 'learning',
    })

    const res = await auth(request(app).post('/api/garden/water')).send({ slug: 'academic' }).expect(200)
    expect(res.body.data.masteredCount).toBe(1)
    expect(res.body.data.stage).toBe('sprout')

    const after = await Vocabulary.findById(vocab._id)
    expect(after.masteryLevel).toBe('learning')
  })

  it('G-14/G-15: repeated and concurrent watering is consistent (read-only semantics)', async () => {
    await plantTopic('academic')
    await WordUsageEvidence.create([
      evidence('analyze', 'academic', '2026-09-01'),
      evidence('analyze', 'academic', '2026-09-02'),
    ])
    const [a, b, c] = await Promise.all([
      auth(request(app).post('/api/garden/water')).send({ slug: 'academic' }),
      auth(request(app).post('/api/garden/water')).send({ slug: 'academic' }),
      auth(request(app).post('/api/garden/water')).send({ slug: 'academic' }),
    ])
    for (const r of [a, b, c]) {
      expect(r.status).toBe(200)
      expect(r.body.data.masteredCount).toBe(1)
    }
  })

  it('G-17: stage thresholds follow gardenStage()', async () => {
    await plantTopic('academic')
    // 3 mastered words in one theme → 'leafy'
    for (const w of ['analyze', 'evaluate', 'create']) {
      await WordUsageEvidence.create([
        evidence(w, 'academic', '2026-09-01'),
        evidence(w, 'academic', '2026-09-02'),
      ])
    }
    const res = await auth(request(app).post('/api/garden/water')).send({ slug: 'academic' }).expect(200)
    expect(res.body.data.masteredCount).toBe(3)
    expect(res.body.data.stage).toBe('leafy')
  })

  it('G-18: GET /garden/status stays consistent with POST /garden/water', async () => {
    await plantTopic('academic')
    await WordUsageEvidence.create([
      evidence('analyze', 'academic', '2026-09-01'),
      evidence('analyze', 'academic', '2026-09-02'),
    ])
    const watered = await auth(request(app).post('/api/garden/water')).send({ slug: 'academic' }).expect(200)
    const status = await auth(request(app).get('/api/garden/status')).expect(200)
    const topic = status.body.data.find((t) => t.theme === 'academic')
    expect(topic).toBeDefined()
    expect(topic.masteredCount).toBe(watered.body.data.masteredCount)
    expect(topic.stage).toBe(watered.body.data.stage)
  })
})

describe('GET /api/admin/global-vocabulary/stats authorization', () => {
  it('A-01..A-05/A-07/A-09: admin-only, correct shape, no CastError fall-through', async () => {
    await request(app).get('/api/admin/global-vocabulary/stats').expect(401)
    await auth(request(app).get('/api/admin/global-vocabulary/stats'), token).expect(403)
    await auth(request(app).get('/api/admin/global-vocabulary/stats'), teacherToken).expect(403)
    await auth(request(app).get('/api/admin/global-vocabulary/stats'), parentToken).expect(403)

    // Empty collection: all counts zero, and /stats must not hit /:id (no CastError).
    const res = await auth(request(app).get('/api/admin/global-vocabulary/stats'), adminToken).expect(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual({
      totalCount: 0,
      awlCount: 0,
      cefr: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
    })
  })
})