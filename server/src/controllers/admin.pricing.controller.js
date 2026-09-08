import SubscriptionPlan from '../models/SubscriptionPlan.js'
import Subscription from '../models/Subscription.js'
import PaymentTransaction from '../models/PaymentTransaction.js'
import User from '../models/User.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import { logAction } from '../utils/auditLogger.js'

/**
 * @desc    Admin: Get all pricing plans
 * @route   GET /api/admin/pricing/plans
 * @access  Private (Admin)
 */
export const adminGetPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find().sort({ targetRole: 1, sortOrder: 1, monthlyPrice: 1 })
  res.status(200).json({ success: true, count: plans.length, data: plans })
})

/**
 * @desc    Admin: Create a new plan
 * @route   POST /api/admin/pricing/plans
 * @access  Private (Admin)
 */
export const adminCreatePlan = asyncHandler(async (req, res) => {
  const { slug, name, targetRole, tier, monthlyPrice, yearlyPrice, features, maxSponsoredStudents, maxClasses, dailyAiEssayLimit, highlightBadge, sortOrder, isActive } = req.body

  if (!slug || !name || !targetRole || !tier || monthlyPrice === undefined || yearlyPrice === undefined) {
    throw new ErrorResponse('Vui lòng điền đầy đủ các thông tin bắt buộc.', 400)
  }

  const existing = await SubscriptionPlan.findOne({ slug })
  if (existing) {
    throw new ErrorResponse(`Gói cước với mã slug "${slug}" đã tồn tại.`, 400)
  }

  const plan = await SubscriptionPlan.create({
    slug,
    name,
    targetRole,
    tier,
    monthlyPrice: Number(monthlyPrice),
    yearlyPrice: Number(yearlyPrice),
    features: Array.isArray(features) ? features : [],
    maxSponsoredStudents: Number(maxSponsoredStudents) || 0,
    maxClasses: Number(maxClasses) || 1,
    dailyAiEssayLimit: Number(dailyAiEssayLimit) || 3,
    highlightBadge: highlightBadge || '',
    sortOrder: Number(sortOrder) || 0,
    isActive: isActive !== false,
  })

  await logAction(req.user._id, 'ADMIN_CREATE_PLAN', 'SubscriptionPlan', plan._id, { name, slug })
  res.status(201).json({ success: true, data: plan })
})

/**
 * @desc    Admin: Update pricing plan
 * @route   PUT /api/admin/pricing/plans/:id
 * @access  Private (Admin)
 */
export const adminUpdatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findById(req.params.id)
  if (!plan) {
    throw new ErrorResponse('Gói cước không tồn tại.', 404)
  }

  const allowedFields = [
    'name', 'description', 'monthlyPrice', 'yearlyPrice',
    'features', 'maxSponsoredStudents', 'maxClasses',
    'dailyAiEssayLimit', 'highlightBadge', 'isActive', 'sortOrder'
  ]

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      plan[field] = req.body[field]
    }
  })

  await plan.save()
  await logAction(req.user._id, 'ADMIN_UPDATE_PLAN', 'SubscriptionPlan', plan._id, { name: plan.name, slug: plan.slug })

  res.status(200).json({ success: true, data: plan })
})

/**
 * @desc    Admin: Delete a plan
 * @route   DELETE /api/admin/pricing/plans/:id
 * @access  Private (Admin)
 */
export const adminDeletePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findById(req.params.id)
  if (!plan) {
    throw new ErrorResponse('Gói cước không tồn tại.', 404)
  }

  await SubscriptionPlan.deleteOne({ _id: plan._id })
  await logAction(req.user._id, 'ADMIN_DELETE_PLAN', 'SubscriptionPlan', plan._id, { slug: plan.slug })

  res.status(200).json({ success: true, message: 'Đã xóa gói cước thành công.' })
})

/**
 * @desc    Admin: Get all payment transactions
 * @route   GET /api/admin/pricing/transactions
 * @access  Private (Admin)
 */
export const adminGetTransactions = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query
  const query = {}
  if (status) query.status = status

  const transactions = await PaymentTransaction.find(query)
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))

  const total = await PaymentTransaction.countDocuments(query)

  // Calculate revenue
  const revenueStats = await PaymentTransaction.aggregate([
    { $match: { status: 'PAID' } },
    { $group: { _id: null, totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }
  ])

  res.status(200).json({
    success: true,
    count: transactions.length,
    total,
    totalRevenue: revenueStats[0]?.totalRevenue || 0,
    paidCount: revenueStats[0]?.count || 0,
    data: transactions,
  })
})

/**
 * @desc    Admin: Get all active/expired subscriptions
 * @route   GET /api/admin/pricing/subscriptions
 * @access  Private (Admin)
 */
export const adminGetSubscriptions = asyncHandler(async (req, res) => {
  const { status, tier } = req.query
  const query = {}
  if (status) query.status = status
  if (tier) query.tier = tier

  const subscriptions = await Subscription.find(query)
    .populate('user', 'name email role')
    .populate('plan', 'name slug')
    .sort({ createdAt: -1 })
    .limit(100)

  res.status(200).json({ success: true, count: subscriptions.length, data: subscriptions })
})

/**
 * @desc    Admin: Manually grant/activate subscription for a user
 * @route   POST /api/admin/pricing/grant-subscription
 * @access  Private (Admin)
 */
export const adminGrantSubscription = asyncHandler(async (req, res) => {
  const { userId, planSlug, durationDays = 30 } = req.body

  const user = await User.findById(userId)
  if (!user) throw new ErrorResponse('Người dùng không tồn tại.', 404)

  const plan = await SubscriptionPlan.findOne({ slug: planSlug })
  if (!plan) throw new ErrorResponse('Gói cước không tồn tại.', 404)

  const orderCode = Math.floor(100000 + Math.random() * 900000)
  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000)

  await Subscription.updateMany(
    { user: user._id, status: 'active' },
    { status: 'expired' }
  )

  const subscription = await Subscription.create({
    user: user._id,
    plan: plan._id,
    planSlug: plan.slug,
    targetRole: plan.targetRole,
    tier: plan.tier,
    billingCycle: Number(durationDays) >= 365 ? 'yearly' : 'monthly',
    amountPaid: 0,
    orderCode,
    startDate,
    endDate,
    status: 'active',
    maxSponsoredStudents: plan.maxSponsoredStudents || 0,
  })

  await logAction(req.user._id, 'ADMIN_MANUALLY_GRANT_SUBSCRIPTION', 'Subscription', subscription._id, {
    grantedToUser: user.email,
    planSlug: plan.slug,
    durationDays,
  })

  res.status(201).json({ success: true, data: subscription })
})
