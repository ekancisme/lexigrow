import { beforeEach, describe, expect, it, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import request from 'supertest'

process.env.JWT_SECRET = 'vitest-test-only-jwt-secret'
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'

// 1. Mock DB connection
vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

// 2. Mock User model
vi.mock('../src/models/User.js', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
  },
}))

// 3. Mock PendingUser model
vi.mock('../src/models/PendingUser.js', () => ({
  default: {
    findOne: vi.fn(),
    findOneAndDelete: vi.fn(),
    create: vi.fn(),
    deleteOne: vi.fn(),
  },
}))

// 4. Mock SubscriptionPlan model
vi.mock('../src/models/SubscriptionPlan.js', () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
  },
}))

// 5. Mock Subscription model
vi.mock('../src/models/Subscription.js', () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  },
}))

// 6. Mock PaymentTransaction model
vi.mock('../src/models/PaymentTransaction.js', () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn().mockResolvedValue({}),
    deleteOne: vi.fn().mockResolvedValue({}),
  },
}))

// 7. Mock audit logger
vi.mock('../src/utils/auditLogger.js', () => ({
  logAction: vi.fn().mockResolvedValue(undefined),
}))

// 8. Mock sendEmail
vi.mock('../src/utils/sendEmail.js', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

// 9. Mock PayOS service
vi.mock('../src/services/payos.service.js', () => ({
  createPayOSPaymentLink: vi.fn().mockResolvedValue({
    paymentLinkId: 'link_123',
    checkoutUrl: 'https://checkout.payos.vn/mock-checkout',
    qrCode: 'data:image/png;base64,mockqrcode',
  }),
  verifyPayOSWebhookData: vi.fn(),
  getPayOSPaymentInfo: vi.fn(),
  getPayOSClient: vi.fn(),
}))

// 10. Mock google-auth-library
vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    constructor() {}
    async getToken() {
      return { tokens: { id_token: 'mock-google-id-token' } }
    }
    async verifyIdToken() {
      return {
        getPayload: () => ({
          sub: 'google_user_123',
          email: 'googleuser@example.com',
          name: 'Google User',
          picture: 'https://example.com/avatar.jpg',
        }),
      }
    }
  },
}))

import app from '../src/index.js'
import User from '../src/models/User.js'
import PendingUser from '../src/models/PendingUser.js'
import SubscriptionPlan from '../src/models/SubscriptionPlan.js'
import Subscription from '../src/models/Subscription.js'
import PaymentTransaction from '../src/models/PaymentTransaction.js'
import sendEmail from '../src/utils/sendEmail.js'

// Helper for mongoose chained queries: .sort().limit()
const mockQuery = (data) => ({
  sort: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  then: (resolve, reject) => Promise.resolve(data).then(resolve, reject),
  catch: (fn) => Promise.resolve(data).catch(fn),
})

describe('Person 1: Authentication, Profile, Onboarding & Subscription (All 16 Tasks)', () => {
  const mockUserId = '60d0fe4f5311236168a109ca'
  const mockAuthToken = jwt.sign({ id: mockUserId }, process.env.JWT_SECRET, { expiresIn: '7d' })

  const baseStudentUser = {
    _id: mockUserId,
    name: 'Student One',
    email: 'student@example.com',
    role: 'student',
    englishLevel: 'B1',
    isVerified: true,
    accountStatus: 'active',
    learningProfile: {
      interests: ['IELTS', 'Technology'],
      targetLevel: 'B2',
      dailyGoalMinutes: 15,
      pace: 'standard',
      onboardingCompleted: false,
      timezone: 'Asia/Ho_Chi_Minh',
    },
    notifications: {
      email: true,
      push: true,
      weekly: false,
    },
    matchPassword: vi.fn().mockResolvedValue(true),
    save: vi.fn().mockResolvedValue(true),
    toObject() {
      return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        englishLevel: this.englishLevel,
        isVerified: this.isVerified,
        accountStatus: this.accountStatus,
        learningProfile: this.learningProfile,
        notifications: this.notifications,
      }
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    User.findById.mockResolvedValue({ ...baseStudentUser })
  })

  // -------------------------------------------------------------
  // Task 1: Register Account
  // -------------------------------------------------------------
  it('Task 1: Register Account -> creates pending user and sends email OTP', async () => {
    User.findOne.mockResolvedValue(null)
    PendingUser.findOneAndDelete.mockResolvedValue(null)
    PendingUser.create.mockResolvedValue({
      _id: 'pending_1',
      name: 'New Student',
      email: 'newstudent@example.com',
      verificationCode: '123456',
    })

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Student',
        email: 'newstudent@example.com',
        password: 'Password123',
        role: 'student',
        englishLevel: 'A2',
      })
      .expect(201)

    expect(res.body.success).toBe(true)
    expect(PendingUser.create).toHaveBeenCalled()
    expect(sendEmail).toHaveBeenCalled()
  })

  // -------------------------------------------------------------
  // Task 2: Login
  // -------------------------------------------------------------
  it('Task 2: Login -> validates credentials and returns JWT token', async () => {
    const userForLogin = {
      ...baseStudentUser,
      matchPassword: vi.fn().mockResolvedValue(true),
      select: vi.fn().mockReturnThis(),
    }
    User.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(userForLogin),
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@example.com',
        password: 'Password123',
      })
      .expect(200)

    expect(res.body.success).toBe(true)
    const setCookie = res.headers['set-cookie']
    expect(setCookie).toBeDefined()
    expect(setCookie.some(c => c.startsWith('token='))).toBe(true)
    expect(res.body.user.email).toBe('student@example.com')
  })

  // -------------------------------------------------------------
  // Task 3: Login with Google
  // -------------------------------------------------------------
  it('Task 3: Login with Google -> exchanges auth code and returns user JWT', async () => {
    User.findOne.mockResolvedValue(null)
    User.create.mockResolvedValue({
      ...baseStudentUser,
      email: 'googleuser@example.com',
      googleId: 'google_user_123',
    })

    const res = await request(app)
      .post('/api/auth/google')
      .send({ code: 'google-auth-code-123', role: 'student' })
      .expect(200)

    expect(res.body.success).toBe(true)
    const setCookieGoogle = res.headers['set-cookie']
    expect(setCookieGoogle).toBeDefined()
    expect(setCookieGoogle.some(c => c.startsWith('token='))).toBe(true)
    expect(res.body.user.email).toBe('googleuser@example.com')
  })

  // -------------------------------------------------------------
  // Task 4: Verify Email
  // -------------------------------------------------------------
  it('Task 4: Verify Email -> verifies OTP code and activates user account', async () => {
    User.findOne.mockResolvedValue(null)
    PendingUser.findOne.mockResolvedValue({
      _id: 'pending_user_id',
      name: 'Pending Student',
      email: 'pending@example.com',
      password: 'plain_password',
      role: 'student',
      verificationCode: '654321',
      verificationCodeExpire: new Date(Date.now() + 60000),
    })
    User.create.mockResolvedValue({
      ...baseStudentUser,
      name: 'Pending Student',
      email: 'pending@example.com',
    })
    PendingUser.deleteOne.mockResolvedValue({ deletedCount: 1 })

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'pending@example.com', code: '654321' })
      .expect(200)

    expect(res.body.success).toBe(true)
    const setCookieVerify = res.headers['set-cookie']
    expect(setCookieVerify).toBeDefined()
    expect(setCookieVerify.some(c => c.startsWith('token='))).toBe(true)
    expect(PendingUser.deleteOne).toHaveBeenCalled()
  })

  // -------------------------------------------------------------
  // Task 5: Resend Verification Email
  // -------------------------------------------------------------
  it('Task 5: Resend Verification Email -> generates new code and resends email', async () => {
    User.findOne.mockResolvedValue(null)
    const mockPending = {
      email: 'pending@example.com',
      name: 'Pending Student',
      save: vi.fn().mockResolvedValue(true),
    }
    PendingUser.findOne.mockResolvedValue(mockPending)

    const res = await request(app)
      .post('/api/auth/resend-verify')
      .send({ email: 'pending@example.com' })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(mockPending.save).toHaveBeenCalled()
    expect(sendEmail).toHaveBeenCalled()
  })

  // -------------------------------------------------------------
  // Task 6: Reset Password
  // -------------------------------------------------------------
  it('Task 6: Reset Password -> requests OTP code then updates password', async () => {
    const mockUser = {
      ...baseStudentUser,
      save: vi.fn().mockResolvedValue(true),
    }
    User.findOne.mockResolvedValue(mockUser)

    // Step A: Forgot password
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'student@example.com' })
      .expect(200)

    expect(forgotRes.body.success).toBe(true)
    expect(sendEmail).toHaveBeenCalled()

    // Step B: Reset password with code
    User.findOne.mockResolvedValue(mockUser)
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'student@example.com',
        code: '123456',
        newPassword: 'BrandNewPassword123',
      })
      .expect(200)

    expect(resetRes.body.success).toBe(true)
    expect(mockUser.save).toHaveBeenCalled()
  })

  // -------------------------------------------------------------
  // Task 7: Get Current User Information
  // -------------------------------------------------------------
  it('Task 7: Get Current User Information -> returns authenticated user info', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${mockAuthToken}`)
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.user._id).toBe(mockUserId)
    expect(res.body.user.email).toBe('student@example.com')
  })

  // -------------------------------------------------------------
  // Task 8: View Personal Profile
  // -------------------------------------------------------------
  it('Task 8: View Personal Profile -> returns user profile details', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${mockAuthToken}`)
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('Student One')
  })

  // -------------------------------------------------------------
  // Task 9: Edit Personal Profile
  // -------------------------------------------------------------
  it('Task 9: Edit Personal Profile -> updates profile details', async () => {
    const mockUserToUpdate = {
      ...baseStudentUser,
      save: vi.fn().mockResolvedValue(true),
    }
    User.findById.mockResolvedValue(mockUserToUpdate)

    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${mockAuthToken}`)
      .send({ name: 'Student Updated', englishLevel: 'B2' })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(mockUserToUpdate.name).toBe('Student Updated')
    expect(mockUserToUpdate.englishLevel).toBe('B2')
    expect(mockUserToUpdate.save).toHaveBeenCalled()
  })

  // -------------------------------------------------------------
  // Task 10: Change Password
  // -------------------------------------------------------------
  it('Task 10: Change Password -> verifies current password and saves new password', async () => {
    const mockUserWithPwd = {
      ...baseStudentUser,
      matchPassword: vi.fn().mockResolvedValue(true),
      save: vi.fn().mockResolvedValue(true),
    }
    User.findById.mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUserWithPwd),
    })

    const res = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${mockAuthToken}`)
      .send({
        currentPassword: 'OldPassword123',
        newPassword: 'NewSecretPassword456',
      })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(mockUserWithPwd.matchPassword).toHaveBeenCalledWith('OldPassword123')
    expect(mockUserWithPwd.save).toHaveBeenCalled()
  })

  // -------------------------------------------------------------
  // Task 11: Manage Notification Preferences
  // -------------------------------------------------------------
  it('Task 11: Manage Notification Preferences -> updates notification settings', async () => {
    const mockUser = {
      ...baseStudentUser,
      save: vi.fn().mockResolvedValue(true),
    }
    User.findById.mockResolvedValue(mockUser)

    const res = await request(app)
      .put('/api/profile/notifications')
      .set('Authorization', `Bearer ${mockAuthToken}`)
      .send({ email: false, weekly: true })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(mockUser.notifications.email).toBe(false)
    expect(mockUser.notifications.weekly).toBe(true)
    expect(mockUser.save).toHaveBeenCalled()
  })

  // -------------------------------------------------------------
  // Task 12: Complete Student Onboarding
  // -------------------------------------------------------------
  it('Task 12: Complete Student Onboarding -> sets onboardingCompleted flag to true', async () => {
    User.findByIdAndUpdate.mockResolvedValue({
      learningProfile: {
        ...baseStudentUser.learningProfile,
        onboardingCompleted: true,
      },
    })

    const res = await request(app)
      .put('/api/profile/learning')
      .set('Authorization', `Bearer ${mockAuthToken}`)
      .send({ onboardingCompleted: true })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.onboardingCompleted).toBe(true)
    expect(User.findByIdAndUpdate).toHaveBeenCalled()
  })

  // -------------------------------------------------------------
  // Task 13: Set Learning Preferences
  // -------------------------------------------------------------
  it('Task 13: Set Learning Preferences -> gets and updates targetLevel, dailyGoalMinutes and interests', async () => {
    // A: Get current learning preferences
    const getRes = await request(app)
      .get('/api/profile/learning')
      .set('Authorization', `Bearer ${mockAuthToken}`)
      .expect(200)

    expect(getRes.body.success).toBe(true)
    expect(getRes.body.data.targetLevel).toBe('B2')

    // B: Update preferences
    User.findByIdAndUpdate.mockResolvedValue({
      learningProfile: {
        interests: ['Business', 'IELTS'],
        targetLevel: 'C1',
        dailyGoalMinutes: 20,
        pace: 'intensive',
        onboardingCompleted: true,
      },
    })

    const putRes = await request(app)
      .put('/api/profile/learning')
      .set('Authorization', `Bearer ${mockAuthToken}`)
      .send({
        interests: ['Business', 'IELTS'],
        targetLevel: 'C1',
        dailyGoalMinutes: 20,
        pace: 'intensive',
      })
      .expect(200)

    expect(putRes.body.success).toBe(true)
    expect(putRes.body.data.targetLevel).toBe('C1')
    expect(putRes.body.data.dailyGoalMinutes).toBe(20)
    expect(putRes.body.data.pace).toBe('intensive')
  })

  // -------------------------------------------------------------
  // Task 14: View Pricing Plans
  // -------------------------------------------------------------
  it('Task 14: View Pricing Plans -> returns public subscription plans list', async () => {
    const samplePlans = [
      { slug: 'free-student', name: 'Free Student', monthlyPrice: 0, targetRole: 'student' },
      { slug: 'plus-student', name: 'Plus Student', monthlyPrice: 99000, targetRole: 'student' },
      { slug: 'pro-student', name: 'Pro Student', monthlyPrice: 199000, targetRole: 'student' },
    ]
    SubscriptionPlan.find.mockReturnValue(mockQuery(samplePlans))

    const res = await request(app)
      .get('/api/payments/plans')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.length).toBe(3)
    expect(res.body.data[0].slug).toBe('free-student')
  })

  // -------------------------------------------------------------
  // Task 15: Purchase Subscription
  // -------------------------------------------------------------
  it('Task 15: Purchase Subscription -> creates payment order and returns PayOS checkout link', async () => {
    SubscriptionPlan.findOne.mockResolvedValue({
      _id: 'plan_plus_id',
      slug: 'plus-student',
      name: 'Plus Student',
      tier: 'plus',
      targetRole: 'student',
      monthlyPrice: 99000,
      yearlyPrice: 990000,
      isActive: true,
    })

    PaymentTransaction.create.mockResolvedValue({
      _id: 'tx_123',
      orderCode: 123456,
      amount: 99000,
      checkoutUrl: 'https://checkout.payos.vn/mock-checkout',
      qrCode: 'data:image/png;base64,mockqrcode',
      status: 'PENDING',
    })

    const res = await request(app)
      .post('/api/payments/create-payment-link')
      .set('Authorization', `Bearer ${mockAuthToken}`)
      .send({
        planSlug: 'plus-student',
        billingCycle: 'monthly',
      })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.checkoutUrl).toBe('https://checkout.payos.vn/mock-checkout')
    expect(res.body.data.amount).toBe(99000)
    expect(PaymentTransaction.create).toHaveBeenCalled()
  })

  // -------------------------------------------------------------
  // Task 16: View Subscription and Payment History
  // -------------------------------------------------------------
  it('Task 16: View Subscription and Payment History -> returns subscription status and user transactions', async () => {
    // A: My subscription
    Subscription.findOne.mockReturnValue(
      mockQuery({
        _id: 'sub_active_1',
        tier: 'plus',
        planSlug: 'plus-student',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
    )
    SubscriptionPlan.findOne.mockResolvedValue({
      name: 'Plus Student Plan',
      features: ['15 bài chấm AI/ngày', 'Kho từ vựng đầy đủ'],
    })

    const subRes = await request(app)
      .get('/api/payments/my-subscription')
      .set('Authorization', `Bearer ${mockAuthToken}`)
      .expect(200)

    expect(subRes.body.success).toBe(true)
    expect(subRes.body.data.tier).toBe('plus')

    // B: Payment transactions history
    const sampleTransactions = [
      {
        _id: 'tx_1',
        orderCode: 100001,
        amount: 99000,
        planName: 'Plus Student',
        status: 'PAID',
        createdAt: new Date(),
      },
    ]
    PaymentTransaction.find.mockReturnValue(mockQuery(sampleTransactions))

    const txRes = await request(app)
      .get('/api/payments/my-transactions')
      .set('Authorization', `Bearer ${mockAuthToken}`)
      .expect(200)

    expect(txRes.body.success).toBe(true)
    expect(txRes.body.data.length).toBe(1)
    expect(txRes.body.data[0].status).toBe('PAID')
  })
})
