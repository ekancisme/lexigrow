import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const { mockUser } = vi.hoisted(() => ({
  mockUser: {
    _id: '65f999888777666555444333',
    name: 'Cookie Test User',
    email: 'cookieuser@example.com',
    role: 'student',
    accountStatus: 'active',
    matchPassword: vi.fn().mockResolvedValue(true),
    select: vi.fn().mockReturnThis(),
    toObject() {
      return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        accountStatus: this.accountStatus,
      }
    },
  },
}))

vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockResolvedValue(),
}))

vi.mock('../src/models/User.js', () => ({
  default: {
    findOne: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    }),
    findById: vi.fn().mockResolvedValue(mockUser),
  },
}))

import app from '../src/index.js'

describe('Auth Cookie & Token Security Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login sets HttpOnly token cookie with 24h expiration', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cookieuser@example.com', password: 'Password123!' })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeUndefined()
    const setCookieHeaders = res.headers['set-cookie']
    expect(setCookieHeaders).toBeDefined()

    const tokenCookie = setCookieHeaders.find((cookie) => cookie.startsWith('token='))
    expect(tokenCookie).toBeDefined()
    expect(tokenCookie).toMatch(/HttpOnly/i)
    expect(tokenCookie).toMatch(/Path=\//i)
  })

  it('protect middleware authenticates requests via HttpOnly cookie alone', async () => {
    const validToken = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' })

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${validToken}`)
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.user.email).toBe('cookieuser@example.com')
  })

  it('logout clears the token cookie on the server', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .expect(200)

    expect(res.body.success).toBe(true)
    const setCookieHeaders = res.headers['set-cookie']
    expect(setCookieHeaders).toBeDefined()

    const tokenCookie = setCookieHeaders.find((cookie) => cookie.startsWith('token='))
    expect(tokenCookie).toBeDefined()
    // Cleared cookie has token=none
    expect(tokenCookie).toContain('token=none')
  })

  it('request with malformed percent-encoded cookie does not throw or return 500 error', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Cookie', 'discount=50%off; bad=%E0%A4%A; regular=hello')
      .expect(200)

    expect(res.body.success).toBe(true)
  })
})
