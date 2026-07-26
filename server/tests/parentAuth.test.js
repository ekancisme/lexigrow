import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../src/models/User.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('../src/models/PendingUser.js', () => ({
  default: {
    findOne: vi.fn(),
    findOneAndDelete: vi.fn(),
    create: vi.fn(),
    deleteOne: vi.fn(),
  },
}))

vi.mock('../src/utils/sendEmail.js', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

import request from 'supertest'
import app from '../src/index.js'
import User from '../src/models/User.js'
import PendingUser from '../src/models/PendingUser.js'

describe('Parent authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers a parent without requiring child information', async () => {
    User.findOne.mockResolvedValue(null)
    PendingUser.findOneAndDelete.mockResolvedValue(null)
    PendingUser.create.mockImplementation(async data => ({ ...data }))

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Parent One',
        email: 'parent@example.com',
        password: 'secret123',
        role: 'parent',
      })
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(PendingUser.create).toHaveBeenCalledWith(expect.not.objectContaining({ childEmail: expect.anything() }))
  })

  it('activates a verified parent without admin approval', async () => {
    const pendingParent = {
      _id: 'pending_parent_id',
      name: 'Parent One',
      email: 'parent@example.com',
      password: 'secret123',
      role: 'parent',
      englishLevel: '',
      institution: '',
      verificationCode: '123456',
      verificationCodeExpire: new Date(Date.now() + 60_000),
    }
    const createdParent = {
      _id: 'parent_id',
      name: pendingParent.name,
      email: pendingParent.email,
      role: 'parent',
      accountStatus: 'active',
      populate: vi.fn().mockResolvedValue(undefined),
      toObject() {
        return {
          _id: this._id,
          name: this.name,
          email: this.email,
          role: this.role,
          accountStatus: this.accountStatus,
        }
      },
    }

    User.findOne.mockResolvedValue(null)
    PendingUser.findOne.mockResolvedValue(pendingParent)
    User.create.mockImplementation(async data => Object.assign(createdParent, data))
    PendingUser.deleteOne.mockResolvedValue({ deletedCount: 1 })

    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: pendingParent.email, code: pendingParent.verificationCode })
      .expect(200)

    expect(response.body.pendingApproval).toBeUndefined()
    expect(response.body.token).toBeTruthy()
    expect(response.body.user.role).toBe('parent')
    expect(response.body.user.accountStatus).toBe('active')
  })
})