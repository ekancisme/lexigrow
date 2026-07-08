import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock db connection
vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockImplementation(() => Promise.resolve())
}))

// Mock models
vi.mock('../src/models/Config.js', () => {
  const mockFind = vi.fn()
  const mockFindOne = vi.fn()
  const mockCreate = vi.fn()
  
  const mockModel = {
    find: mockFind,
    findOne: mockFindOne,
    create: mockCreate
  }
  return { default: mockModel }
})

vi.mock('../src/models/AILog.js', () => {
  const mockCount = vi.fn()
  const mockFind = vi.fn()
  const mockAggregate = vi.fn()
  const mockCreate = vi.fn()
  
  const mockModel = {
    countDocuments: mockCount,
    find: mockFind,
    aggregate: mockAggregate,
    create: mockCreate
  }
  return { default: mockModel }
})

vi.mock('../src/models/AuditLog.js', () => {
  const mockCreate = vi.fn().mockImplementation((data) => Promise.resolve({ _id: 'mock_audit_id', ...data }))
  return { default: { create: mockCreate } }
})

vi.mock('../src/models/User.js', () => {
  return { default: {} }
})

// Mock protect middleware to inject a mock admin user
vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_admin_id', role: 'admin', name: 'Mock Admin' }
    next()
  },
  authorize: (...roles) => (req, res, next) => {
    next()
  }
}))

import request from 'supertest'
import app from '../src/index.js'
import Config from '../src/models/Config.js'
import AILog from '../src/models/AILog.js'

describe('AI Config & Monitoring API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/config', () => {
    it('should return system configurations with masked API keys', async () => {
      const mockConfigs = [
        { key: 'GROQ_API_KEY', value: 'gsk_dummy_test_key_groq_masked_value_for_testing_ya5T', description: 'Groq Key' },
        { key: 'DEFAULT_AI_MODEL', value: 'llama-3.3-70b-versatile', description: 'Model' }
      ]
      Config.find.mockResolvedValue(mockConfigs)

      const res = await request(app)
        .get('/api/admin/config')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(2)
      
      // Verification of key masking
      const groqConfig = res.body.data.find(c => c.key === 'GROQ_API_KEY')
      expect(groqConfig.value).toBe('gsk_ep...ya5T') // should be masked
      
      const modelConfig = res.body.data.find(c => c.key === 'DEFAULT_AI_MODEL')
      expect(modelConfig.value).toBe('llama-3.3-70b-versatile') // should NOT be masked
    })
  })

  describe('PUT /api/admin/config', () => {
    it('should update unmasked configurations and skip masked api keys', async () => {
      const mockSave = vi.fn().mockResolvedValue(true)
      const mockGroqConfig = { key: 'GROQ_API_KEY', value: 'old_key', save: mockSave }
      const mockModelConfig = { key: 'DEFAULT_AI_MODEL', value: 'old_model', save: mockSave }

      Config.findOne
        .mockResolvedValueOnce(mockGroqConfig) // first call for GROQ_API_KEY
        .mockResolvedValueOnce(mockModelConfig) // second call for DEFAULT_AI_MODEL

      const res = await request(app)
        .put('/api/admin/config')
        .send({
          settings: [
            { key: 'GROQ_API_KEY', value: 'gsk_ep...ya5T' }, // masked key, should skip
            { key: 'DEFAULT_AI_MODEL', value: 'llama-3.1-8b-instant' } // new model, should update
          ]
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(1) // only DEFAULT_AI_MODEL updated
      expect(res.body.data[0].key).toBe('DEFAULT_AI_MODEL')
      expect(res.body.data[0].value).toBe('llama-3.1-8b-instant')
      
      expect(mockModelConfig.value).toBe('llama-3.1-8b-instant')
      expect(mockGroqConfig.value).toBe('old_key') // remained unchanged
    })
  })

  describe('GET /api/admin/ai/logs', () => {
    it('should return paginated AI logs list', async () => {
      AILog.countDocuments.mockResolvedValue(12)
      
      const mockLogs = [
        { _id: 'ailog1', model: 'llama-3.3-70b-versatile', action: 'essay_analysis', status: 'success' }
      ]
      const mockLimit = vi.fn().mockResolvedValue(mockLogs)
      const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = vi.fn().mockReturnValue({ skip: mockSkip })
      AILog.find.mockReturnValue({ sort: mockSort })

      const res = await request(app)
        .get('/api/admin/ai/logs?page=2&limit=5')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.pagination.total).toBe(12)
      expect(res.body.pagination.page).toBe(2)
      expect(res.body.pagination.pages).toBe(3)
      expect(res.body.data).toHaveLength(1)
      expect(AILog.find).toHaveBeenCalled()
    })
  })

  describe('GET /api/admin/ai/monitoring', () => {
    it('should return overall metrics and dailyStats aggregation', async () => {
      AILog.countDocuments
        .mockResolvedValueOnce(50) // totalCalls
        .mockResolvedValueOnce(45) // successCalls
        .mockResolvedValueOnce(5)  // failedCalls

      AILog.aggregate
        .mockResolvedValueOnce([{ totalTokens: 12000, totalCost: 0.08, avgTime: 850 }]) // tokenStats
        .mockResolvedValueOnce([
          { _id: '2026-07-08', calls: 15, success: 13, failed: 2, tokens: 3000, cost: 0.02 }
        ]) // dailyStats

      const res = await request(app)
        .get('/api/admin/ai/monitoring')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.metrics.totalCalls).toBe(50)
      expect(res.body.data.metrics.successRate).toBe(90)
      expect(res.body.data.metrics.totalTokens).toBe(12000)
      expect(res.body.data.metrics.totalCost).toBe(0.08)
      expect(res.body.data.metrics.avgResponseTime).toBe(850)
      expect(res.body.data.dailyStats).toHaveLength(1)
    })
  })
})
