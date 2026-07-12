import { vi, describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'

// Helper for mongoose query builder chain
const mockQuery = (val) => {
  const q = {
    select: vi.fn().mockImplementation(() => q),
    sort: vi.fn().mockImplementation(() => q),
    skip: vi.fn().mockImplementation(() => q),
    limit: vi.fn().mockImplementation(() => q),
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
vi.mock('../src/models/GlobalVocabulary.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn().mockResolvedValue(10),
    aggregate: vi.fn().mockResolvedValue([{ _id: 'B1', count: 10 }]),
    bulkWrite: vi.fn()
  }
}))

vi.mock('../src/models/AuditLog.js', () => ({
  default: {
    create: vi.fn().mockResolvedValue({})
  }
}))

// Mock protect middleware to inject a mock req.user with role: 'admin'
vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_admin_id', role: 'admin', name: 'Mock Admin' }
    next()
  },
  authorize: (...roles) => (req, res, next) => {
    if (roles.includes('admin')) {
      next()
    } else {
      res.status(403).json({ success: false, error: 'Forbidden' })
    }
  }
}))

import app from '../src/index.js'
import GlobalVocabulary from '../src/models/GlobalVocabulary.js'

describe('Global Vocabulary API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    GlobalVocabulary.find.mockReturnValue(mockQuery([]))
  })

  it('should successfully get list of global vocabularies', async () => {
    const mockWords = [
      { _id: '1', word: 'ubiquitous', ipa: '/juːˈbɪkwɪtəs/', partOfSpeech: 'adjective', definition: 'Present, appearing, or found everywhere.', cefr: 'C1', awl: '' },
      { _id: '2', word: 'mitigate', ipa: '/ˈmɪtɪɡeɪt/', partOfSpeech: 'verb', definition: 'Make less severe, serious, or painful.', cefr: 'B2', awl: 'Sublist 5' }
    ]

    GlobalVocabulary.find.mockReturnValueOnce(mockQuery(mockWords))

    const res = await request(app)
      .get('/api/admin/global-vocabulary')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.length).toBe(2)
    expect(res.body.data[0].word).toBe('ubiquitous')
    expect(res.body.data[1].word).toBe('mitigate')
  })

  it('should escape special regex characters in search and normalize pagination', async () => {
    const query = mockQuery([])
    GlobalVocabulary.find.mockReturnValueOnce(query)

    await request(app)
      .get('/api/admin/global-vocabulary?search=%5B&page=-1&limit=1000')
      .expect(200)

    expect(GlobalVocabulary.find).toHaveBeenCalledWith({
      $or: [
        { word: { $regex: '\\[', $options: 'i' } },
        { definition: { $regex: '\\[', $options: 'i' } }
      ]
    })
    expect(query.skip).toHaveBeenCalledWith(0)
    expect(query.limit).toHaveBeenCalledWith(100)
  })

  it('should successfully create a new global vocabulary word', async () => {
    GlobalVocabulary.findOne.mockReturnValueOnce(mockQuery(null))
    GlobalVocabulary.create.mockResolvedValueOnce({
      _id: 'new_id',
      word: 'scrutinize',
      ipa: '/ˈskruːtənaɪz/',
      partOfSpeech: 'verb',
      definition: 'Examine or inspect closely and thoroughly.',
      cefr: 'C1',
      awl: 'Sublist 2'
    })

    const res = await request(app)
      .post('/api/admin/global-vocabulary')
      .send({
        word: 'scrutinize',
        ipa: '/ˈskruːtənaɪz/',
        partOfSpeech: 'verb',
        definition: 'Examine or inspect closely and thoroughly.',
        cefr: 'C1',
        awl: 'Sublist 2'
      })
      .expect(201)

    expect(res.body.success).toBe(true)
    expect(res.body.data.word).toBe('scrutinize')
  })

  it('should prevent creating a word that already exists', async () => {
    GlobalVocabulary.findOne.mockReturnValueOnce(mockQuery({ _id: 'exist_id', word: 'scrutinize' }))

    const res = await request(app)
      .post('/api/admin/global-vocabulary')
      .send({
        word: 'scrutinize',
        definition: 'Test'
      })
      .expect(400)

    expect(res.body.success).toBe(false)
    expect(res.body.error).toContain('already exists')
  })

  it('should successfully bulk import vocabularies', async () => {
    GlobalVocabulary.find.mockReturnValueOnce(mockQuery([
      { word: 'evaluate', ipa: '', partOfSpeech: 'verb', definition: 'Old definition', cefr: 'B2', awl: 'Sublist 1' }
    ]))
    GlobalVocabulary.bulkWrite.mockResolvedValueOnce({})

    const res = await request(app)
      .post('/api/admin/global-vocabulary/import')
      .send({
        words: [
          { word: 'acquire', ipa: '/əˈkwaɪə/', partOfSpeech: 'verb', definition: 'Buy or obtain for oneself.', cefr: 'B2', awl: 'Sublist 2' },
          { word: 'evaluate', ipa: '/ɪˈvæljueɪt/', partOfSpeech: 'verb', definition: 'Form an idea of the amount, number, or value of.', cefr: 'B2', awl: 'Sublist 1' }
        ]
      })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.createdCount).toBe(1)
    expect(res.body.updatedCount).toBe(1)
    expect(res.body.unchangedCount).toBe(0)
    expect(res.body.errors.length).toBe(0)
  })

  it('should report unchanged rows separately from updated rows', async () => {
    GlobalVocabulary.find.mockReturnValueOnce(mockQuery([
      { word: 'acquire', ipa: '', partOfSpeech: 'verb', definition: 'Old definition', cefr: 'B2', awl: '' },
      { word: 'evaluate', ipa: '', partOfSpeech: 'verb', definition: 'Unchanged definition', cefr: 'B2', awl: '' }
    ]))
    GlobalVocabulary.bulkWrite.mockResolvedValueOnce({})

    const res = await request(app)
      .post('/api/admin/global-vocabulary/import')
      .send({
        words: [
          { word: 'acquire', partOfSpeech: 'verb', definition: 'Updated definition', cefr: 'B2' },
          { word: 'evaluate', partOfSpeech: 'verb', definition: 'Unchanged definition', cefr: 'B2' }
        ]
      })
      .expect(200)

    expect(res.body.createdCount).toBe(0)
    expect(res.body.updatedCount).toBe(1)
    expect(res.body.unchangedCount).toBe(1)
  })

  it('should preserve source line numbers and reject non-string import fields', async () => {
    const res = await request(app)
      .post('/api/admin/global-vocabulary/import')
      .send({
        words: [
          { line: 7, word: 123, definition: 'Numeric words are invalid' },
          { line: 11, word: 'valid', definition: 'Valid definition', ipa: 123 }
        ]
      })
      .expect(200)

    expect(res.body.errors).toHaveLength(2)
    expect(res.body.errors.map(error => error.line)).toEqual([7, 11])
    expect(GlobalVocabulary.bulkWrite).not.toHaveBeenCalled()
  })

  it('should capture format errors during bulk import', async () => {
    const res = await request(app)
      .post('/api/admin/global-vocabulary/import')
      .send({
        words: [
          { word: '', definition: 'Test definition' }, // missing word
          { word: 'analyze', definition: '' }, // missing definition
          { word: 'create', partOfSpeech: 'invalid_pos', definition: 'Create something' } // invalid POS
        ]
      })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.createdCount).toBe(0)
    expect(res.body.errors.length).toBe(3)
    expect(res.body.errors[0].message).toContain('không được để trống')
    expect(res.body.errors[2].message).toContain('không hợp lệ')
  })

  it('should export vocabulary as CSV text', async () => {
    const mockWords = [
      { word: 'abandon', ipa: '/əˈbændən/', partOfSpeech: 'verb', definition: 'Cease to support or look after.', cefr: 'B2', awl: 'Sublist 8', replace: () => {} }
    ]
    // Mock the find method chain
    const mockFind = {
      sort: vi.fn().mockResolvedValue(mockWords)
    }
    GlobalVocabulary.find.mockReturnValue(mockFind)

    const res = await request(app)
      .get('/api/admin/global-vocabulary/export')
      .expect(200)

    expect(res.header['content-type']).toContain('text/csv')
    expect(res.text).toContain('Word,IPA,Part of Speech,Definition,CEFR,AWL')
    expect(res.text).toContain('"abandon","\/əˈbændən\/","verb","Cease to support or look after.","B2","Sublist 8"')
  })
})
