import { vi, describe, it, expect, beforeEach } from 'vitest'

// Declare mocks with 'mock' prefix so they are accessible inside vi.mock (hoisting-safe)
const mockSave = vi.fn().mockResolvedValue(true)
const mockFindOne = vi.fn().mockResolvedValue(null)

// Mock db connection
vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockImplementation(() => Promise.resolve())
}))

// Mock sendEmail utility
vi.mock('../src/utils/sendEmail.js', () => ({
  default: vi.fn().mockResolvedValue({ success: true })
}))

vi.mock('../src/services/notification.service.js', () => ({
  createManyNotifications: vi.fn().mockResolvedValue([])
}))

// Mock models
vi.mock('../src/models/User.js', () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn()
  }
}))
vi.mock('../src/models/Vocabulary.js', () => ({
  default: {
    countDocuments: vi.fn()
  }
}))
vi.mock('../src/models/Essay.js', () => {
  const findMock = vi.fn().mockReturnValue({
    sort: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([])
    })
  })
  return {
    default: {
      find: findMock
    }
  }
})
vi.mock('../src/models/AIAnalysis.js', () => ({
  default: {
    find: vi.fn()
  }
}))

vi.mock('../src/models/Alert.js', () => {
  class MockAlert {
    constructor(data) {
      Object.assign(this, data)
      this._id = 'alert_123'
    }
    save() {
      return mockSave()
    }
    static findOne(...args) {
      return mockFindOne(...args)
    }
  }
  return {
    default: MockAlert
  }
})

vi.mock('../src/models/Class.js', () => ({
  default: {
    findOne: vi.fn()
  }
}))

import { checkVocabularyStagnation, checkGrammarDecline, createAndNotifyAlert, runEarlyWarningScan } from '../src/services/earlyWarning.service.js'
import Vocabulary from '../src/models/Vocabulary.js'
import Essay from '../src/models/Essay.js'
import AIAnalysis from '../src/models/AIAnalysis.js'
import User from '../src/models/User.js'
import Class from '../src/models/Class.js'
import sendEmail from '../src/utils/sendEmail.js'
import { createManyNotifications } from '../src/services/notification.service.js'

describe('Early Warning System Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSave.mockClear()
    mockFindOne.mockClear()
  })

  describe('checkVocabularyStagnation', () => {
    it('should return isStagnant: true if all 4 weeks have 0 vocabulary items created', async () => {
      Vocabulary.countDocuments.mockResolvedValue(0)

      const result = await checkVocabularyStagnation('student_123')
      expect(result.isStagnant).toBe(true)
      expect(result.counts).toEqual([0, 0, 0, 0])
    })

    it('should return isStagnant: false if at least one week has new vocabulary', async () => {
      Vocabulary.countDocuments
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)

      const result = await checkVocabularyStagnation('student_123')
      expect(result.isStagnant).toBe(false)
      expect(result.counts).toEqual([0, 3, 0, 0])
    })
  })

  describe('checkGrammarDecline', () => {
    it('should return isDeclining: false if student has less than 3 essays', async () => {
      Essay.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ _id: 'e1' }, { _id: 'e2' }])
        })
      })

      const result = await checkGrammarDecline('student_123')
      expect(result.isDeclining).toBe(false)
    })

    it('should return isDeclining: true if grammar accuracy has continuously decreased over last 3 essays', async () => {
      // 3 essays, order from newest (0) to oldest (2):
      // e1 (newest), e2 (middle), e3 (oldest)
      Essay.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { _id: 'e1' }, // newest
            { _id: 'e2' }, // middle
            { _id: 'e3' }  // oldest
          ])
        })
      })

      AIAnalysis.find.mockResolvedValue([
        { essay: 'e1', scores: { grammarAccuracy: 5.5 } }, // newest
        { essay: 'e2', scores: { grammarAccuracy: 7.0 } }, // middle
        { essay: 'e3', scores: { grammarAccuracy: 8.5 } }  // oldest
      ])

      const result = await checkGrammarDecline('student_123')
      expect(result.isDeclining).toBe(true)
      expect(result.scores).toEqual([5.5, 7.0, 8.5])
    })

    it('should return isDeclining: false if grammar accuracy is stable or improving', async () => {
      Essay.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { _id: 'e1' }, // newest
            { _id: 'e2' }, // middle
            { _id: 'e3' }  // oldest
          ])
        })
      })

      AIAnalysis.find.mockResolvedValue([
        { essay: 'e1', scores: { grammarAccuracy: 9.0 } },
        { essay: 'e2', scores: { grammarAccuracy: 8.0 } },
        { essay: 'e3', scores: { grammarAccuracy: 7.0 } }
      ])

      const result = await checkGrammarDecline('student_123')
      expect(result.isDeclining).toBe(false)
    })

    it('should ignore a continuous but insignificant grammar fluctuation', async () => {
      Essay.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ _id: 'e1' }, { _id: 'e2' }, { _id: 'e3' }])
        })
      })
      AIAnalysis.find.mockResolvedValue([
        { essay: 'e1', scores: { grammarAccuracy: 7.7 } },
        { essay: 'e2', scores: { grammarAccuracy: 7.8 } },
        { essay: 'e3', scores: { grammarAccuracy: 7.9 } }
      ])

      const result = await checkGrammarDecline('student_123')
      expect(result.isDeclining).toBe(false)
    })
  })

  describe('runEarlyWarningScan', () => {
    it('should scan all students and create alerts/emails if vocabulary is stagnant', async () => {
      // Mock students
      User.find.mockResolvedValueOnce([
        { _id: 'student_123', name: 'John Doe', role: 'student' }
      ])

      // Mock stagnant vocabulary (all 4 weeks count as 0)
      Vocabulary.countDocuments.mockResolvedValue(0)

      // Mock grammar decline: false (fewer than 3 essays)
      Essay.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })

      mockFindOne.mockResolvedValue(null)
      Class.findOne.mockResolvedValue({ _id: 'class_123', teacher: 'teacher_123' })
      User.find.mockResolvedValueOnce([{ _id: 'parent_123', email: 'parent@example.com', name: 'Parent Doe', role: 'parent' }])

      const summary = await runEarlyWarningScan()

      expect(summary).toEqual(expect.objectContaining({ scanned: 1, created: 1, failed: 0 }))
      expect(mockSave).toHaveBeenCalled()
      expect(createManyNotifications).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ recipient: 'teacher_123', type: 'academic_alert' }),
        expect.objectContaining({ recipient: 'parent_123', type: 'academic_alert' })
      ]))
      expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        email: 'parent@example.com',
        subject: expect.stringContaining('John Doe')
      }))
    })

    it('should not duplicate an unresolved alert or resend notifications', async () => {
      mockFindOne.mockResolvedValue({ _id: 'existing_alert' })

      const created = await createAndNotifyAlert(
        { _id: 'student_123', name: 'John Doe' },
        'warning',
        'vocabulary_stagnation',
        'No vocabulary growth.'
      )

      expect(created).toBe(false)
      expect(mockSave).not.toHaveBeenCalled()
      expect(createManyNotifications).not.toHaveBeenCalled()
      expect(sendEmail).not.toHaveBeenCalled()
      expect(User.findOne).not.toHaveBeenCalled()
    })
  })
})
