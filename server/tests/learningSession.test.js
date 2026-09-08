import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import request from 'supertest'
import jwt from 'jsonwebtoken'
vi.mock('../src/services/vocabularyAnalysis.service.js', async (original) => {
  const real = await original()
  return { ...real, analyzeVocabulary: vi.fn() }
})
import app from '../src/app.js'
import User from '../src/models/User.js'
import LearningSet from '../src/models/LearningSet.js'
import Vocabulary from '../src/models/Vocabulary.js'
import LearningSession from '../src/models/LearningSession.js'
import ReviewEvent from '../src/models/ReviewEvent.js'
import PracticeAttempt from '../src/models/PracticeAttempt.js'
import EssayRevision from '../src/models/EssayRevision.js'
import WordUsageEvidence from '../src/models/WordUsageEvidence.js'
import Class from '../src/models/Class.js'
import Essay from '../src/models/Essay.js'
import Assignment from '../src/models/Assignment.js'
import { learningSetCache } from '../src/services/learningCache.service.js'
import { analyzeVocabulary } from '../src/services/vocabularyAnalysis.service.js'
let mongo, student, stranger, teacher, token, otherToken, teacherToken, set
const auth = (r, t = token) => r.set('Authorization', 'Bearer ' + t)
const item = (word) => ({
  word,
  partOfSpeech: 'noun',
  definitionVi: 'nghĩa ' + word,
  quizQuestions: [
    {
      type: 'multiple-choice',
      question: 'Meaning?',
      options: ['yes', 'no'],
      correctAnswer: 'yes',
    },
  ],
})
beforeAll(async () => {
  process.env.JWT_SECRET = 'test-only-learning-secret'
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
  await mongoose.connect(mongo.getUri())
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()))
}, 120000)
afterAll(async () => {
  await mongoose.disconnect()
  if (mongo) await mongo.stop()
}, 30000)
beforeEach(async () => {
  learningSetCache.clear()
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.deleteMany({})),
  )
  student = await User.create({
    name: 'Student',
    email: 'student@example.test',
    password: 'password1',
  })
  stranger = await User.create({
    name: 'Other',
    email: 'other@example.test',
    password: 'password1',
  })
  teacher = await User.create({
    name: 'Teacher',
    email: 'teacher@example.test',
    password: 'password1',
    role: 'teacher',
  })
  token = jwt.sign({ id: student.id }, process.env.JWT_SECRET)
  otherToken = jwt.sign({ id: stranger.id }, process.env.JWT_SECRET)
  teacherToken = jwt.sign({ id: teacher.id }, process.env.JWT_SECRET)
  set = await LearningSet.create({
    slug: 'daily-life',
    title: 'Daily life',
    description: 'Daily',
    level: 'B1',
    category: 'Daily Life',
    status: 'published',
    items: [item('routine'), item('commute'), item('grocery')],
  })
  analyzeVocabulary.mockReset()
})
const start = () =>
  auth(request(app).post('/api/sessions/start')).send({
    learningSetSlug: 'daily-life',
  })
const toWriting = async () => {
  const session = (await start()).body.data
  await auth(request(app).put('/api/sessions/' + session._id + '/step'))
    .send({ currentStep: 'practice' })
    .expect(200)
  for (const w of session.targetWords)
    await auth(request(app).post('/api/practice/submit'))
      .set('Idempotency-Key', session._id + w.word)
      .send({
        sessionId: session._id,
        wordId: w.wordId,
        questionType: 'multiple_choice',
        answer: 'yes',
      })
      .expect(201)
  await auth(request(app).put('/api/sessions/' + session._id + '/step'))
    .send({ currentStep: 'writing' })
    .expect(200)
  return session
}
const goodAnalysis = (content, words) => ({
  summary: 'Good',
  strengths: [],
  priorities: [],
  lexicalSuggestions: [],
  targetWordResults: words.map((word) => ({
    word,
    found: true,
    matchedText: word,
    status: 'correct',
    issueType: null,
    explanationVi: 'Đúng',
    suggestedUpgrade: null,
    quoteVerified: true,
    start: content.indexOf(word),
    end: content.indexOf(word) + word.length,
  })),
})
describe('Learning API with real Mongo transactions and JWT', () => {
  it('protects all new endpoint families', async () => {
    for (const path of [
      '/api/profile/learning',
      '/api/sessions/current',
      '/api/srs/due',
      '/api/garden/status',
      '/api/progress/active-vocabulary',
    ]) {
      await request(app).get(path).expect(401)
    }
  })
  it('validates and persists profile without privilege escalation', async () => {
    await auth(request(app).put('/api/profile/learning'))
      .send({
        targetLevel: 'C1',
        dailyGoalMinutes: 15,
        interests: ['Travel'],
        onboardingCompleted: true,
        timezone: 'Asia/Ho_Chi_Minh',
      })
      .expect(200)
    const r = await auth(request(app).get('/api/profile/learning')).expect(200)
    expect(r.body.data.targetLevel).toBe('C1')
    await auth(request(app).put('/api/profile/learning'))
      .send({ role: 'admin' })
      .expect(400)
    await auth(request(app).put('/api/profile/learning'))
      .send({ timezone: 'Not/AZone' })
      .expect(400)
  })
  it('starts one active session even under concurrent requests and hides answers', async () => {
    const results = await Promise.all([start(), start(), start()])
    expect(results.every((r) => [200, 201].includes(r.status))).toBe(true)
    expect(new Set(results.map((r) => r.body.data._id)).size).toBe(1)
    expect(await LearningSession.countDocuments({ student: student.id })).toBe(
      1,
    )
    expect(JSON.stringify(results[0].body)).not.toContain('correctAnswer')
  })
  it('rejects other students and skipped steps', async () => {
    const r = await start()
    const id = r.body.data._id
    await auth(request(app).put('/api/sessions/' + id + '/step'), otherToken)
      .send({ currentStep: 'practice' })
      .expect(404)
    await auth(request(app).put('/api/sessions/' + id + '/step'))
      .send({ currentStep: 'completed', status: 'completed' })
      .expect(409)
    await auth(request(app).put('/api/sessions/' + id + '/step'))
      .send({ currentStep: 'practice' })
      .expect(200)
  })
  it('grades from snapshot and deduplicates practice intents', async () => {
    const r = await start(),
      session = r.body.data
    await auth(request(app).put('/api/sessions/' + session._id + '/step'))
      .send({ currentStep: 'practice' })
      .expect(200)
    const body = {
      sessionId: session._id,
      wordId: session.targetWords[0].wordId,
      questionType: 'multiple_choice',
      answer: 'no',
      isCorrect: true,
    }
    const send = () =>
      auth(request(app).post('/api/practice/submit'))
        .set('Idempotency-Key', 'practice-one')
        .send(body)
    const first = await send().expect(201)
    expect(first.body.data.isCorrect).toBe(false)
    await send().expect(200)
    expect(await PracticeAttempt.countDocuments()).toBe(1)
    await auth(request(app).post('/api/practice/submit'))
      .set('Idempotency-Key', 'practice-one')
      .send({ ...body, answer: 'yes' })
      .expect(409)
  })
  it('atomically reviews, records events and prevents duplicate requests', async () => {
    const word = await Vocabulary.create({
      student: student.id,
      word: 'routine',
    })
    const send = () =>
      auth(request(app).post('/api/srs/review'))
        .set('Idempotency-Key', 'review-one')
        .send({ vocabularyId: word.id, rating: 3 })
    const rr = await Promise.all([send(), send()])
    expect(rr.every((r) => r.status === 200)).toBe(true)
    expect((await Vocabulary.findById(word.id)).reviewCount).toBe(1)
    expect(await ReviewEvent.countDocuments()).toBe(1)
    await auth(request(app).post('/api/srs/review'), otherToken)
      .set('Idempotency-Key', 'other')
      .send({ vocabularyId: word.id, rating: 3 })
      .expect(404)
    await auth(request(app).post('/api/srs/review'))
      .set('Idempotency-Key', 'review-one')
      .send({ vocabularyId: word.id, rating: 1 })
      .expect(409)
  })
  it('runs practice → writing → revision → evidence → completion without repeat AI charges', async () => {
    const session = (await start()).body.data
    await auth(request(app).put('/api/sessions/' + session._id + '/step'))
      .send({ currentStep: 'practice' })
      .expect(200)
    for (const w of session.targetWords) {
      await auth(request(app).post('/api/practice/submit'))
        .set('Idempotency-Key', w.word)
        .send({
          sessionId: session._id,
          wordId: w.wordId,
          questionType: 'multiple_choice',
          answer: 'yes',
        })
        .expect(201)
    }
    await auth(request(app).put('/api/sessions/' + session._id + '/step'))
      .send({ currentStep: 'writing' })
      .expect(200)
    const content =
      'My daily routine includes a commute and grocery shopping. ' +
      Array(53).fill('word').join(' ')
    analyzeVocabulary.mockResolvedValue({
      summary: 'Good',
      strengths: [],
      priorities: [],
      lexicalSuggestions: [],
      targetWordResults: session.targetWords.map((w) => ({
        word: w.word,
        found: true,
        matchedText: w.word,
        status: 'correct',
        issueType: null,
        explanationVi: 'Đúng',
        suggestedUpgrade: null,
        quoteVerified: true,
        start: content.indexOf(w.word),
        end: content.indexOf(w.word) + w.word.length,
      })),
    })
    const send = () =>
      auth(request(app).post('/api/essays/submit-revision'))
        .set('Idempotency-Key', 'essay-one')
        .send({
          sessionId: session._id,
          content,
          targetWords: session.targetWords.map((w) => w.word),
        })
    const first = await send().expect(201)
    await send().expect(200)
    expect(analyzeVocabulary).toHaveBeenCalledTimes(1)
    expect(await EssayRevision.countDocuments()).toBe(1)
    expect(await WordUsageEvidence.countDocuments()).toBe(3)
    const essayId = first.body.data.originalEssay
    await auth(
      request(app).post('/api/essays/' + essayId + '/revisions'),
      otherToken,
    )
      .set('Idempotency-Key', 'steal')
      .send({ content })
      .expect(404)
    await auth(request(app).put('/api/sessions/' + session._id + '/step'))
      .send({ currentStep: 'completed' })
      .expect(200)
    const progress = await auth(
      request(app).get('/api/progress/active-vocabulary'),
    ).expect(200)
    expect(progress.body.data.masteredCount).toBe(0)
  })
  it('never returns another teacher class lexical data', async () => {
    const cls = await Class.create({
      name: 'Class',
      teacher: teacher.id,
      students: [student.id],
    })
    await auth(
      request(app).get('/api/teacher/classes/' + cls.id + '/lexical-errors'),
    ).expect(403)
    const r = await auth(
      request(app).get('/api/teacher/classes/' + cls.id + '/lexical-errors'),
      teacherToken,
    ).expect(200)
    expect(r.body.data).toEqual([])
  })
  it('counts mastery only for two independent essays and days, not assisted corrections', async () => {
    const word = await Vocabulary.create({
      student: student.id,
      word: 'routine',
      reviewInterval: 8,
      reviewCount: 2,
    })
    const make = (overrides) => ({
      student: student.id,
      word: 'routine',
      meaning: 'habit',
      contextSentence: 'A',
      essayId: new mongoose.Types.ObjectId(),
      revisionId: new mongoose.Types.ObjectId(),
      isVerifiedCorrect: true,
      assisted: false,
      localDay: '2026-09-07',
      theme: 'Daily Life',
      ...overrides,
    })
    await WordUsageEvidence.create([
      make({}),
      make({ contextSentence: 'B', localDay: '2026-09-08', assisted: true }),
    ])
    let r = await auth(request(app).get('/api/progress/active-vocabulary'))
    expect(r.body.data).toEqual({
      savedCount: 1,
      retainedCount: 1,
      masteredCount: 0,
    })
    await WordUsageEvidence.create(
      make({ contextSentence: 'C', localDay: '2026-09-08' }),
    )
    r = await auth(request(app).get('/api/progress/active-vocabulary'))
    expect(r.body.data.masteredCount).toBe(1)
    const g = await auth(request(app).get('/api/garden/status')).expect(200)
    expect(g.body.data).toEqual([
      { theme: 'Daily Life', masteredCount: 1, stage: 'sprout' },
    ])
    const other = await auth(
      request(app).get('/api/progress/evidence/routine'),
      otherToken,
    ).expect(200)
    expect(other.body.data).toEqual([])
    expect(word.id).toBeTruthy()
  })
  it('does not count same-day essays or different meanings as mastery', async () => {
    const make = (meaning, day) => ({
      student: student.id,
      word: 'routine',
      meaning,
      contextSentence: meaning + day,
      essayId: new mongoose.Types.ObjectId(),
      revisionId: new mongoose.Types.ObjectId(),
      isVerifiedCorrect: true,
      localDay: day,
    })
    await WordUsageEvidence.create([
      make('habit', '2026-09-08'),
      make('performance', '2026-09-09'),
    ])
    expect(
      (await auth(request(app).get('/api/progress/active-vocabulary'))).body
        .data.masteredCount,
    ).toBe(0)
  })
  it('stores failed revisions and retries the same snapshot without a second revision', async () => {
    const session = await toWriting()
    const content =
      'My routine involves a commute and grocery shopping. ' +
      Array(54).fill('word').join(' ')
    const body = { sessionId: session._id, content }
    analyzeVocabulary.mockRejectedValueOnce(
      Object.assign(new Error('Provider unavailable'), { statusCode: 502 }),
    )
    const r = await auth(request(app).post('/api/essays/submit-revision'))
      .set('Idempotency-Key', 'retry-me')
      .send(body)
      .expect(502)
    expect(await EssayRevision.countDocuments()).toBe(1)
    expect(await WordUsageEvidence.countDocuments()).toBe(0)
    analyzeVocabulary.mockResolvedValue(
      goodAnalysis(
        content,
        session.targetWords.map((w) => w.word),
      ),
    )
    await auth(request(app).post(r.body.retryUrl)).expect(200)
    await auth(request(app).post(r.body.retryUrl)).expect(200)
    expect(analyzeVocabulary).toHaveBeenCalledTimes(2)
    expect(await EssayRevision.countDocuments()).toBe(1)
  })
  it('marks corrections assisted and preserves original content', async () => {
    const session = await toWriting()
    const content =
      'My routine involves a commute and grocery shopping. ' +
      Array(54).fill('word').join(' ')
    analyzeVocabulary.mockResolvedValue(
      goodAnalysis(
        content,
        session.targetWords.map((w) => w.word),
      ),
    )
    const first = await auth(request(app).post('/api/essays/submit-revision'))
      .set('Idempotency-Key', 'first')
      .send({ sessionId: session._id, content })
      .expect(201)
    const correction = content.replace('My routine', 'Our routine')
    analyzeVocabulary.mockResolvedValue(
      goodAnalysis(
        correction,
        session.targetWords.map((w) => w.word),
      ),
    )
    const second = await auth(
      request(app).post(
        '/api/essays/' + first.body.data.originalEssay + '/revisions',
      ),
    )
      .set('Idempotency-Key', 'second')
      .send({ content: correction })
      .expect(201)
    expect(second.body.data.assisted).toBe(true)
    expect((await EssayRevision.findById(first.body.data._id)).content).toBe(
      content,
    )
    expect(second.body.data.revisionNumber).toBe(2)
  })
  it('does not disclose question answers in learning set APIs', async () => {
    const r = await auth(
      request(app).get('/api/learning-sets/daily-life'),
    ).expect(200)
    expect(JSON.stringify(r.body)).not.toContain('correctAnswer')
    await auth(request(app).get('/api/learning-sets?category[$ne]=x')).expect(
      400,
    )
  })
  it('validates missing keys and immutable target words', async () => {
    const session = await toWriting()
    const content =
      'My routine involves a commute and grocery shopping. ' +
      Array(54).fill('word').join(' ')
    await auth(request(app).post('/api/essays/submit-revision'))
      .send({ sessionId: session._id, content })
      .expect(400)
    await auth(request(app).post('/api/essays/submit-revision'))
      .set('Idempotency-Key', 'bad-targets')
      .send({ sessionId: session._id, content, targetWords: ['fake'] })
      .expect(400)
    expect(analyzeVocabulary).not.toHaveBeenCalled()
  })
  it('teacher assignments link published sets and validate enrollment', async () => {
    const cls = await Class.create({
      name: 'Class',
      teacher: teacher.id,
      students: [student.id],
    })
    const a = await auth(request(app).post('/api/assignments'), teacherToken)
      .send({
        title: 'Practice',
        classId: cls.id,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        learningSetId: set.id,
      })
      .expect(201)
    expect(a.body.data.learningSetId).toBe(set.id)
    await auth(request(app).post('/api/sessions/start'), otherToken)
      .send({ assignmentId: a.body.data._id })
      .expect(404)
    const s = await auth(request(app).post('/api/sessions/start'))
      .send({ assignmentId: a.body.data._id })
      .expect(201)
    expect(s.body.data.assignment).toBe(a.body.data._id)
  })
  it('aggregates latest revision errors only within the teacher class', async () => {
    const cls = await Class.create({
      name: 'Class',
      teacher: teacher.id,
      students: [student.id],
    })
    const essay = await Essay.create({
      student: student.id,
      title: 'Essay',
      class: cls.id,
    })
    const base = {
      student: student.id,
      originalEssay: essay.id,
      session: new mongoose.Types.ObjectId(),
      content: 'Test',
      contentHash: 'test',
      wordCount: 1,
      targetWords: ['routine'],
      analysisStatus: 'succeeded',
    }
    await EssayRevision.create([
      {
        ...base,
        revisionNumber: 1,
        targetWordResults: [
          { word: 'routine', status: 'incorrect', issueType: 'collocation' },
        ],
      },
      {
        ...base,
        revisionNumber: 2,
        targetWordResults: [
          { word: 'routine', status: 'correct', issueType: null },
        ],
      },
    ])
    const r = await auth(
      request(app).get('/api/teacher/classes/' + cls.id + '/lexical-errors'),
      teacherToken,
    ).expect(200)
    expect(r.body.data).toEqual([])
    await EssayRevision.create({
      ...base,
      revisionNumber: 3,
      targetWordResults: [
        {
          word: 'routine',
          status: 'needs_improvement',
          issueType: 'word_form',
        },
      ],
    })
    const r2 = await auth(
      request(app).get('/api/teacher/classes/' + cls.id + '/lexical-errors'),
      teacherToken,
    ).expect(200)
    expect(r2.body.data).toEqual([
      { word: 'routine', issueType: 'word_form', count: 1 },
    ])
  })
  it('rejects suspended accounts', async () => {
    await User.updateOne(
      { _id: student.id },
      { $set: { accountStatus: 'suspended' } },
    )
    await auth(request(app).get('/api/sessions/current')).expect(403)
  })
})
