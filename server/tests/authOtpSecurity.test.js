import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockResolvedValue(),
}))

vi.mock('../src/utils/sendEmail.js', () => ({
  default: vi.fn(),
}))

vi.mock('../src/models/User.js', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('../src/models/PendingUser.js', () => ({
  default: {
    findOne: vi.fn(),
    findOneAndDelete: vi.fn(),
    deleteOne: vi.fn(),
    create: vi.fn(),
  },
}))

import app from '../src/index.js'
import User from '../src/models/User.js'
import PendingUser from '../src/models/PendingUser.js'
import sendEmail from '../src/utils/sendEmail.js'

describe('Auth OTP Security Hardening (No devCode leakage)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('register: successful email send does NOT leak verification code in response', async () => {
    User.findOne.mockResolvedValue(null)
    PendingUser.findOneAndDelete.mockResolvedValue(null)
    PendingUser.create.mockResolvedValue({
      _id: 'pending_1',
      name: 'Safe User',
      email: 'safe@example.com',
      verificationCode: '888999',
    })
    sendEmail.mockResolvedValue({ messageId: 'ok' })

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Safe User',
        email: 'safe@example.com',
        password: 'Password123!',
        role: 'student',
      })
      .expect(201)

    expect(res.body.success).toBe(true)
    expect(res.body.devCode).toBeUndefined()
    expect(JSON.stringify(res.body)).not.toContain('888999')
  })

  it('register: failed email send returns 503 and NEVER returns devCode in development', async () => {
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    process.env.ENABLE_DEV_OTP = 'true'

    try {
      User.findOne.mockResolvedValue(null)
      PendingUser.findOneAndDelete.mockResolvedValue(null)
      PendingUser.create.mockResolvedValue({
        _id: 'pending_2',
        name: 'Fail User',
        email: 'fail@example.com',
        verificationCode: '777666',
      })
      PendingUser.deleteOne.mockResolvedValue({ deletedCount: 1 })
      sendEmail.mockRejectedValue(new Error('SMTP connection timeout'))

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Fail User',
          email: 'fail@example.com',
          password: 'Password123!',
          role: 'student',
        })
        .expect(503)

      expect(res.body.success).toBe(false)
      expect(res.body.devCode).toBeUndefined()
      expect(JSON.stringify(res.body)).not.toContain('777666')
    } finally {
      process.env.NODE_ENV = origEnv
      delete process.env.ENABLE_DEV_OTP
    }
  })

  it('resendVerification: failed email send returns 503 and NEVER returns devCode', async () => {
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    process.env.ENABLE_DEV_OTP = 'true'

    try {
      User.findOne.mockResolvedValue(null)
      const mockPending = {
        name: 'Resend User',
        email: 'resend@example.com',
        verificationCode: '111222',
        save: vi.fn().mockResolvedValue(true),
      }
      PendingUser.findOne.mockResolvedValue(mockPending)
      sendEmail.mockRejectedValue(new Error('SMTP down'))

      const res = await request(app)
        .post('/api/auth/resend-verify')
        .send({ email: 'resend@example.com' })
        .expect(503)

      expect(res.body.success).toBe(false)
      expect(res.body.devCode).toBeUndefined()
      expect(JSON.stringify(res.body)).not.toContain('111222')
    } finally {
      process.env.NODE_ENV = origEnv
      delete process.env.ENABLE_DEV_OTP
    }
  })
})
