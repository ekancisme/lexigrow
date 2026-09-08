import SubscriptionPlan from '../models/SubscriptionPlan.js'
import Subscription from '../models/Subscription.js'
import PaymentTransaction from '../models/PaymentTransaction.js'
import Class from '../models/Class.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import { createPayOSPaymentLink, verifyPayOSWebhookData } from '../services/payos.service.js'
import { getUserEffectiveTier } from '../services/tier.service.js'
import { logAction } from '../utils/auditLogger.js'

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
    verifiedData = verifyPayOSWebhookData(webhookBody)
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
    const transaction = await PaymentTransaction.findOne({ orderCode: Number(orderCode) })

    if (transaction && transaction.status !== 'PAID') {
      transaction.status = 'PAID'
      transaction.paidAt = new Date()
      transaction.webhookData = verifiedData
      await transaction.save()

      const plan = await SubscriptionPlan.findById(transaction.plan)

      // Calculate expiration date (30 days for monthly, 365 days for yearly)
      const durationDays = transaction.billingCycle === 'yearly' ? 365 : 30
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)

      // Deactivate any previous active subscriptions
      await Subscription.updateMany(
        { user: transaction.user, status: 'active' },
        { status: 'expired' }
      )

      // Create new active subscription
      const subscription = await Subscription.create({
        user: transaction.user,
        plan: transaction.plan,
        planSlug: transaction.planSlug,
        targetRole: transaction.targetRole,
        tier: transaction.tier,
        billingCycle: transaction.billingCycle,
        amountPaid: transaction.amount,
        orderCode: transaction.orderCode,
        startDate,
        endDate,
        status: 'active',
        maxSponsoredStudents: plan?.maxSponsoredStudents || 0,
        payosTransactionId: verifiedData.reference || '',
      })

      await logAction(transaction.user, 'PAYMENT_SUCCESS_ACTIVATE_SUBSCRIPTION', 'Subscription', subscription._id, {
        orderCode,
        tier: transaction.tier,
        billingCycle: transaction.billingCycle,
        endDate,
      })

      console.log(`✅ Subscription activated successfully for User ${transaction.user}, Tier: ${transaction.tier}`)
    }
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
