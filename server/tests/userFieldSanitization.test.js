import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const state = vi.hoisted(() => ({
  user: null,
}))

vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockResolvedValue(),
}))

vi.mock('../src/models/User.js', () => {
  return {
    default: {
      findOne: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    },
  }
})

vi.mock('../src/models/PendingUser.js', () => ({
  default: {
    findOne: vi.fn(),
    findOneAndDelete: vi.fn(),
    deleteOne: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = state.user
    next()
  },
  authorize: () => (req, res, next) => next(),
}))

import app from '../src/index.js'
import User from '../src/models/User.js'

describe('User Field Sanitization & Password Reset Privacy', () => {
  const mockUserWithSecretResetCode = {
    _id: '65f123456789012345678901',
    name: 'Security Test User',
    email: 'testuser@example.com',
    role: 'student',
    resetPasswordCode: '987654',
    resetPasswordExpire: new Date(Date.now() + 600000),
    toObject() {
      return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        resetPasswordCode: this.resetPasswordCode,
        resetPasswordExpire: this.resetPasswordExpire,
      }
    },
    save: vi.fn().mockResolvedValue(true),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    state.user = { _id: mockUserWithSecretResetCode._id, role: 'student' }
  })

  it('GET /api/auth/me strips resetPasswordCode and resetPasswordExpire from response', async () => {
    User.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUserWithSecretResetCode),
    })

    const res = await request(app).get('/api/auth/me').expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.user).toBeDefined()
    expect(res.body.user.email).toBe('testuser@example.com')
    expect(res.body.user.resetPasswordCode).toBeUndefined()
    expect(res.body.user.resetPasswordExpire).toBeUndefined()
    expect(JSON.stringify(res.body)).not.toContain('987654')
  })

  it('POST /api/auth/login response user object strips resetPasswordCode and resetPasswordExpire', async () => {
    const userForLogin = {
      ...mockUserWithSecretResetCode,
      matchPassword: vi.fn().mockResolvedValue(true),
      select: vi.fn().mockReturnThis(),
    }
    User.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(userForLogin),
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@example.com', password: 'Password123!' })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeUndefined()
    const setCookie = res.headers['set-cookie']
    expect(setCookie).toBeDefined()
    expect(setCookie.some(c => c.startsWith('token='))).toBe(true)
    expect(res.body.user.resetPasswordCode).toBeUndefined()
    expect(res.body.user.resetPasswordExpire).toBeUndefined()
    expect(JSON.stringify(res.body)).not.toContain('987654')
  })

  it('POST /api/auth/reset-password queries with +resetPasswordCode and updates password', async () => {
    const queryChain = {
      select: vi.fn().mockResolvedValue(mockUserWithSecretResetCode),
    }
    User.findOne.mockReturnValue(queryChain)

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'testuser@example.com',
        code: '987654',
        newPassword: 'BrandNewSecurePassword123!',
      })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(queryChain.select).toHaveBeenCalledWith(
      expect.stringContaining('+resetPasswordCode')
    )
    expect(mockUserWithSecretResetCode.resetPasswordCode).toBe('')
    expect(mockUserWithSecretResetCode.save).toHaveBeenCalled()
  })
})
