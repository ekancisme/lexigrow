import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock db connection
vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockImplementation(() => Promise.resolve())
}))

// Mock models
vi.mock('../src/models/AuditLog.js', () => {
  const mockCreate = vi.fn().mockImplementation((data) => Promise.resolve({ _id: 'mock_log_id', ...data }))
  const mockFind = vi.fn()
  const mockCount = vi.fn()
  
  const mockModel = {
    create: mockCreate,
    find: mockFind,
    countDocuments: mockCount
  }
  return { default: mockModel }
})

vi.mock('../src/models/User.js', () => {
  const mockFind = vi.fn().mockReturnValue({
    select: vi.fn().mockImplementation(() => Promise.resolve([{ _id: 'user_1' }, { _id: 'user_2' }]))
  })
  const mockCount = vi.fn()
  const mockAggregate = vi.fn()
  
  const mockModel = {
    find: mockFind,
    countDocuments: mockCount,
    aggregate: mockAggregate
  }
  return { default: mockModel }
})

vi.mock('../src/models/Essay.js', () => {
  const mockCount = vi.fn()
  const mockAggregate = vi.fn()
  const mockModel = {
    countDocuments: mockCount,
    aggregate: mockAggregate
  }
  return { default: mockModel }
})

vi.mock('../src/models/Class.js', () => {
  const mockCount = vi.fn()
  const mockModel = {
    countDocuments: mockCount
  }
  return { default: mockModel }
})

vi.mock('../src/models/AIAnalysis.js', () => {
  const mockFind = vi.fn()
  const mockAggregate = vi.fn()
  const mockModel = {
    find: mockFind,
    aggregate: mockAggregate
  }
  return { default: mockModel }
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
import AuditLog from '../src/models/AuditLog.js'
import User from '../src/models/User.js'
import Essay from '../src/models/Essay.js'
import Class from '../src/models/Class.js'
import AIAnalysis from '../src/models/AIAnalysis.js'
import { logAction } from '../src/utils/auditLogger.js'

describe('Audit Logs & Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('logAction helper', () => {
    it('should successfully call AuditLog.create with details', async () => {
      await logAction('user_123', 'CREATE_CLASS', 'Class', 'class_456', { name: 'IELTS 1' })
      expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        user: 'user_123',
        action: 'CREATE_CLASS',
        targetType: 'Class',
        targetId: 'class_456',
        details: { name: 'IELTS 1' }
      }))
    })

    it('should not log if userId is not provided', async () => {
      await logAction(null, 'CREATE_CLASS', 'Class', 'class_456')
      expect(AuditLog.create).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/admin/logs', () => {
    it('should return a paginated list of audit logs', async () => {
      AuditLog.countDocuments.mockResolvedValue(25)
      
      const mockLogs = [
        { _id: 'log1', action: 'CREATE_CLASS', user: { name: 'Admin 1' } },
        { _id: 'log2', action: 'UPDATE_PROMPT', user: { name: 'Admin 2' } }
      ]
      
      const mockPopulate = vi.fn().mockResolvedValue(mockLogs)
      const mockLimit = vi.fn().mockReturnValue({ populate: mockPopulate })
      const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = vi.fn().mockReturnValue({ skip: mockSkip })
      AuditLog.find.mockReturnValue({ sort: mockSort })

      const res = await request(app)
        .get('/api/admin/logs?page=2&limit=10')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.pagination.total).toBe(25)
      expect(res.body.pagination.page).toBe(2)
      expect(res.body.pagination.limit).toBe(10)
      expect(res.body.pagination.pages).toBe(3)
      expect(res.body.data).toHaveLength(2)
      expect(AuditLog.find).toHaveBeenCalled()
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(mockSkip).toHaveBeenCalledWith(10)
      expect(mockLimit).toHaveBeenCalledWith(10)
    })
  })

  describe('GET /api/admin/analytics', () => {
    it('should return aggregated counts and chart statistics', async () => {
      User.countDocuments
        .mockResolvedValueOnce(35) // totalUsers
        .mockResolvedValueOnce(20) // studentsCount
        .mockResolvedValueOnce(10) // teachersCount
        .mockResolvedValueOnce(5)  // parentsCount

      Essay.countDocuments.mockResolvedValue(42) // totalEssays
      Class.countDocuments.mockResolvedValue(8)  // totalClasses

      AIAnalysis.find.mockReturnValue({
        select: vi.fn().mockResolvedValue([
          { overallScore: 7.5 },
          { overallScore: 8.5 }
        ])
      })

      User.aggregate.mockResolvedValue([
        { _id: { year: 2026, week: 1 }, count: 5, createdAt: new Date() }
      ])

      Essay.aggregate.mockResolvedValue([
        { _id: '2026-07-08', count: 12 }
      ])

      AIAnalysis.aggregate.mockResolvedValue([
        { _id: 6, count: 2 } // boundary 6: score range 6-8
      ])

      const res = await request(app)
        .get('/api/admin/analytics')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.metrics.totalUsers).toBe(35)
      expect(res.body.data.metrics.totalEssays).toBe(42)
      expect(res.body.data.metrics.totalClasses).toBe(8)
      expect(res.body.data.metrics.avgScore).toBe(8.0) // (7.5 + 8.5) / 2
      expect(res.body.data.metrics.roles.student).toBe(20)
      expect(res.body.data.metrics.roles.teacher).toBe(10)
      expect(res.body.data.metrics.roles.parent).toBe(5)
      expect(res.body.data.charts.userGrowth).toHaveLength(1)
      expect(res.body.data.charts.essaySubmissions).toHaveLength(1)
      expect(res.body.data.charts.scoreDistribution).toHaveLength(5)
    })
  })
})
