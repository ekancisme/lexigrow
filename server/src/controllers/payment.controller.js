import SubscriptionPlan from '../models/SubscriptionPlan.js'
import Subscription from '../models/Subscription.js'
import PaymentTransaction from '../models/PaymentTransaction.js'
import Class from '../models/Class.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import { createPayOSPaymentLink, verifyPayOSWebhookData } from '../services/payos.service.js'
import { getUserEffectiveTier } from '../services/tier.service.js'
import { logAction } from '../utils/auditLogger.js'
import mongoose from 'mongoose'

/**
 * @desc    Get all active subscription plans
 * @route   GET /api/payments/plans
 * @access  Public
 */
export const getPlans = asyncHandler(async (req, res) => {
  const { role } = req.query
  const query = { isActive: true }
  if (role && ['student', 'teacher'].includes(role)) {
    query.targetRole = role
  }

  const plans = await SubscriptionPlan.find(query).sort({ targetRole: 1, sortOrder: 1, monthlyPrice: 1 })
  res.status(200).json({ success: true, count: plans.length, data: plans })
})

/**
 * @desc    Get current user's effective subscription and tier details
 * @route   GET /api/payments/my-subscription
 * @access  Private
 */
export const getMySubscription = asyncHandler(async (req, res) => {
  const tierInfo = await getUserEffectiveTier(req.user)
  res.status(200).json({ success: true, data: tierInfo })
})

/**
 * @desc    Create a PayOS payment link for subscription
 * @route   POST /api/payments/create-payment-link
 * @access  Private
 */
export const createPayment = asyncHandler(async (req, res) => {
  const { planSlug, billingCycle = 'monthly' } = req.body

  if (!planSlug) {
    throw new ErrorResponse('Vui lòng chọn gói cước (planSlug).', 400)
  }

  if (!['monthly', 'yearly'].includes(billingCycle)) {
    throw new ErrorResponse('Chu kỳ thanh toán không hợp lệ (monthly hoặc yearly).', 400)
  }

  const plan = await SubscriptionPlan.findOne({ slug: planSlug, isActive: true })
  if (!plan) {
    throw new ErrorResponse('Gói cước không tồn tại hoặc đã ngừng cung cấp.', 404)
  }

  // Target role check
  if (req.user.role === 'teacher' && plan.targetRole === 'student') {
    throw new ErrorResponse('Tài khoản Giáo viên vui lòng chọn gói dành cho Giáo viên.', 400)
  }
  if (req.user.role === 'student' && plan.targetRole === 'teacher') {
    throw new ErrorResponse('Tài khoản Học sinh vui lòng chọn gói dành cho Học sinh.', 400)
  }

  const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
  if (amount <= 0) {
    throw new ErrorResponse('Gói cước miễn phí không cần thanh toán.', 400)
  }

  // PayOS orderCode must be a positive integer <= 9007199254740991
  const orderCode = Math.floor(100000 + Math.random() * 900000) + Math.floor(Date.now() % 1000000)

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  const returnUrl = `${clientUrl}/payment/success?orderCode=${orderCode}`
  const cancelUrl = `${clientUrl}/payment/cancel?orderCode=${orderCode}`

  const cycleText = billingCycle === 'yearly' ? '1 Năm' : '1 Tháng'
  const description = `${plan.tier.toUpperCase()} ${cycleText}`.substring(0, 25)

  // 1. Call PayOS API
  const payosResponse = await createPayOSPaymentLink({
    orderCode,
    amount,
    description,
    buyerName: req.user.name,
    buyerEmail: req.user.email,
    returnUrl,
    cancelUrl,
    items: [
      {
        name: `${plan.name} (${cycleText})`,
        quantity: 1,
        price: amount,
      },
    ],
  })

  // 2. Save Transaction into DB
  const transaction = await PaymentTransaction.create({
    orderCode,
    user: req.user._id,
    plan: plan._id,
    planSlug: plan.slug,
    planName: plan.name,
    tier: plan.tier,
    targetRole: plan.targetRole,
    billingCycle,
    amount,
    status: 'PENDING',
    payosPaymentLinkId: payosResponse.paymentLinkId || '',
    checkoutUrl: payosResponse.checkoutUrl,
    qrCode: payosResponse.qrCode,
  })

  await logAction(req.user._id, 'CREATE_PAYMENT_LINK', 'PaymentTransaction', transaction._id, {
    orderCode,
    amount,
    planSlug,
    billingCycle,
  })

  res.status(200).json({
    success: true,
    data: {
      orderCode,
      amount,
      checkoutUrl: payosResponse.checkoutUrl,
      qrCode: payosResponse.qrCode,
      planName: plan.name,
      billingCycle,
    },
  })
})

/**
 * @desc    PayOS Webhook handler (handles payment confirmation)
 * @route   POST /api/payments/payos-webhook
 * @access  Public (Signature Verified)
 */
export const payosWebhook = asyncHandler(async (req, res) => {
  const webhookBody = req.body

  // 1. Verify webhook signature
  let verifiedData = null
  try {
    verifiedData = await verifyPayOSWebhookData(webhookBody)
  } catch (err) {
    console.error('❌ PayOS Webhook signature verification failed:', err.message)
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' })
  }

  if (!verifiedData) {
    return res.status(400).json({ success: false, message: 'No webhook data' })
  }

  const { orderCode, code, desc } = verifiedData
  console.log(`🔔 PayOS Webhook received for Order: ${orderCode}, Code: ${code}, Desc: ${desc}`)

  // Code '00' indicates successful payment in PayOS
  if (code === '00') {
    const orderCodeNum = Number(orderCode)

    // Idempotency fast-path: already paid (e.g. PayOS retry) -> ack and stop.
    const existing = await PaymentTransaction.findOne({ orderCode: orderCodeNum })
    if (!existing || existing.status === 'PAID') {
      return res.status(200).json({ success: true, message: 'Already processed' })
    }

    const plan = await SubscriptionPlan.findById(existing.plan)

    // Calculate expiration date (30 days for monthly, 365 days for yearly)
    const durationDays = existing.billingCycle === 'yearly' ? 365 : 30
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)

    // Claim the transaction (PENDING -> PAID) and create the subscription so BOTH
    // commit together. If anything fails the claim is rolled back and PayOS can
    // retry; otherwise we would mark PAID without granting the subscription.
    const activate = async (tx) => {
      const sessionOpt = tx ? { session: tx } : {}
      const claimed = await PaymentTransaction.findOneAndUpdate(
        { orderCode: orderCodeNum, status: 'PENDING' },
        { $set: { status: 'PAID', paidAt: new Date(), webhookData: verifiedData } },
        { new: true, ...sessionOpt }
      )
      if (!claimed) return null

      const [subscription] = await Subscription.create(
        [
          {
            user: claimed.user,
            plan: claimed.plan,
            planSlug: claimed.planSlug,
            targetRole: claimed.targetRole,
            tier: claimed.tier,
            billingCycle: claimed.billingCycle,
            amountPaid: claimed.amount,
            orderCode: claimed.orderCode,
            startDate,
            endDate,
            status: 'active',
            maxSponsoredStudents: plan?.maxSponsoredStudents || 0,
            payosTransactionId: verifiedData.reference || '',
          },
        ],
        sessionOpt
      )

      // Expire previous subscriptions only AFTER the new one exists, so a failure
      // while creating it (especially in the non-transactional fallback) cannot
      // leave the user with no active subscription. Exclude the row just created.
      await Subscription.updateMany(
        { user: claimed.user, status: 'active', _id: { $ne: subscription._id } },
        { status: 'expired' },
        sessionOpt
      )
      return { subscription, claimed }
    }

    let result = null
    let session = null
    try {
      session = await mongoose.startSession()
      await session.withTransaction(async () => {
        result = await activate(session)
      })
    } catch (err) {
      const unsupported =
        err.code === 20 ||
        (err.message &&
          (err.message.includes('Transaction numbers are only allowed on a replica set') ||
            err.message.includes('does not support retryable writes') ||
            err.message.includes('Transaction is not supported')))
      if (!unsupported) {
        if (err.code === 11000) {
          return res.status(200).json({ success: true, message: 'Already processed' })
        }
        // Transaction rolled back: PAID was NOT persisted, PayOS may retry safely.
        throw err
      }
      console.warn(
        '⚠️ [payosWebhook] MongoDB transaction not supported (standalone mode). ' +
          'Falling back to sequential subscription activation. For production, use a replica set.'
      )
      try {
        result = await activate(null)
      } catch (fallbackErr) {
        if (fallbackErr.code === 11000) {
          return res.status(200).json({ success: true, message: 'Already processed' })
        }
        // No transaction available: undo the PAID claim so PayOS can retry and the
        // user is not left charged without a subscription.
        await PaymentTransaction.updateOne(
          { orderCode: orderCodeNum, status: 'PAID' },
          { $set: { status: 'PENDING', paidAt: null, webhookData: null } }
        ).catch(() => {})
        throw fallbackErr
      }
    } finally {
      if (session) await session.endSession()
    }

    if (!result) {
      // Another worker claimed it first.
      return res.status(200).json({ success: true, message: 'Already processed' })
    }

    const { subscription, claimed } = result

    await logAction(claimed.user, 'PAYMENT_SUCCESS_ACTIVATE_SUBSCRIPTION', 'Subscription', subscription._id, {
      orderCode,
      tier: claimed.tier,
      billingCycle: claimed.billingCycle,
      endDate,
    })

    console.log(`✅ Subscription activated successfully for User ${claimed.user}, Tier: ${claimed.tier}`)
  }

  res.status(200).json({ success: true })
})

/**
 * @desc    Get teacher's sponsorship status (quota & list of sponsored students)
 * @route   GET /api/payments/teacher-sponsorship
 * @access  Private (Teacher)
 */
export const getTeacherSponsorshipStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'teacher') {
    throw new ErrorResponse('Chỉ tài khoản Giáo viên mới có quyền xem thông tin này.', 403)
  }

  const now = new Date()
  const activeSub = await Subscription.findOne({
    user: req.user._id,
    status: 'active',
    endDate: { $gte: now },
  })

  // Get all active classes taught by this teacher
  const classes = await Class.find({
    teacher: req.user._id,
    status: 'active',
  }).populate('students', 'name email englishLevel')

  const uniqueStudentMap = new Map()
  classes.forEach((cls) => {
    cls.students.forEach((s) => {
      uniqueStudentMap.set(s._id.toString(), {
        _id: s._id,
        name: s.name,
        email: s.email,
        englishLevel: s.englishLevel,
        className: cls.name,
      })
    })
  })

  const sponsoredStudents = Array.from(uniqueStudentMap.values())
  const maxQuota = activeSub?.maxSponsoredStudents || 0

  res.status(200).json({
    success: true,
    data: {
      hasActiveSubscription: !!activeSub,
      currentTier: activeSub?.tier || 'free',
      planName: activeSub ? `${activeSub.tier.toUpperCase()} Teacher Plan` : 'Chưa đăng ký gói',
      expiresAt: activeSub?.endDate || null,
      maxSponsoredQuota: maxQuota,
      usedQuota: sponsoredStudents.length,
      remainingQuota: Math.max(0, maxQuota - sponsoredStudents.length),
      sponsoredStudents,
    },
  })
})

/**
 * @desc    Get current user's transaction history
 * @route   GET /api/payments/my-transactions
 * @access  Private
 */
export const getMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await PaymentTransaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
  res.status(200).json({ success: true, count: transactions.length, data: transactions })
})
