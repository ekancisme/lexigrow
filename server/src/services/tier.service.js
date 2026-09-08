import User from '../models/User.js'
import Class from '../models/Class.js'
import Subscription from '../models/Subscription.js'
import SubscriptionPlan from '../models/SubscriptionPlan.js'
import Essay from '../models/Essay.js'

/**
 * Get user's effective subscription tier (including teacher sponsorship inheritance)
 * @param {string|Object} userOrId
 * @returns {Promise<Object>}
 */
export async function getUserEffectiveTier(userOrId) {
  const userId = typeof userOrId === 'object' ? userOrId._id || userOrId.id : userOrId
  const user = typeof userOrId === 'object' && userOrId.role ? userOrId : await User.findById(userId)

  if (!user) {
    return {
      tier: 'free',
      source: 'default',
      dailyAiEssayLimit: 3,
      isUnlimitedAi: false,
      features: ['3 bài chấm AI/ngày', 'Tham gia 1 lớp học', '3 bộ từ vựng cơ bản'],
    }
  }

  const now = new Date()

  // 1. Check direct active personal subscription
  const directSub = await Subscription.findOne({
    user: user._id,
    status: 'active',
    endDate: { $gte: now },
  }).sort({ endDate: -1 })

  if (directSub) {
    const plan = await SubscriptionPlan.findOne({ slug: directSub.planSlug })
    const isUnlimited = directSub.tier === 'pro' || directSub.tier === 'ultra'
    const dailyLimit = isUnlimited ? 9999 : directSub.tier === 'plus' ? 15 : 3

    return {
      tier: directSub.tier,
      source: 'personal_subscription',
      subscription: directSub,
      planName: plan?.name || `${directSub.tier.toUpperCase()} Plan`,
      dailyAiEssayLimit: dailyLimit,
      isUnlimitedAi: isUnlimited,
      features: plan?.features || [],
      expiresAt: directSub.endDate,
    }
  }

  // 2. If user is a student, check if they inherit from an active Teacher plan
  if (user.role === 'student') {
    // Find all active classes the student is enrolled in
    const enrolledClasses = await Class.find({
      students: user._id,
      status: 'active',
    }).populate('teacher', 'name email')

    for (const cls of enrolledClasses) {
      if (!cls.teacher) continue

      // Check if teacher has an active subscription
      const teacherSub = await Subscription.findOne({
        user: cls.teacher._id,
        status: 'active',
        endDate: { $gte: now },
      }).sort({ endDate: -1 })

      if (teacherSub) {
        // Check teacher's student sponsorship capacity
        const allTeacherClasses = await Class.find({
          teacher: cls.teacher._id,
          status: 'active',
        })
        const totalUniqueStudents = new Set()
        allTeacherClasses.forEach((c) => {
          c.students.forEach((s) => totalUniqueStudents.add(s.toString()))
        })

        const maxAllowed = teacherSub.maxSponsoredStudents || 30
        if (totalUniqueStudents.size <= maxAllowed || totalUniqueStudents.has(user._id.toString())) {
          const isUnlimited = teacherSub.tier === 'pro' || teacherSub.tier === 'ultra'
          const dailyLimit = isUnlimited ? 9999 : 15

          return {
            tier: teacherSub.tier,
            source: 'teacher_sponsored',
            sponsoredByTeacher: {
              _id: cls.teacher._id,
              name: cls.teacher.name,
              email: cls.teacher.email,
              className: cls.name,
            },
            planName: `Được bảo trợ bởi GV ${cls.teacher.name} (${teacherSub.tier.toUpperCase()})`,
            dailyAiEssayLimit: dailyLimit,
            isUnlimitedAi: isUnlimited,
            features: [
              `Quyền lợi ${teacherSub.tier.toUpperCase()} được giáo viên ${cls.teacher.name} bảo trợ miễn phí`,
              'Không giới hạn lượt học từ vựng SRS',
              'Sử dụng đầy đủ Vườn Tri Thức và phân tích AI',
            ],
            expiresAt: teacherSub.endDate,
          }
        }
      }
    }
  }

  // 3. Fallback: Free tier
  return {
    tier: 'free',
    source: 'free',
    planName: 'Gói Miễn Phí (Free)',
    dailyAiEssayLimit: 3,
    isUnlimitedAi: false,
    features: ['3 bài chấm AI/ngày', 'Tham gia 1 lớp học', '3 bộ từ vựng cơ bản'],
  }
}

/**
 * Check if student has remaining AI essay review quota for today
 * @param {string|Object} userOrId
 * @returns {Promise<{ canSubmit: boolean, usedToday: number, limit: number, remaining: number, tierInfo: Object }>}
 */
export async function checkDailyEssayQuota(userOrId) {
  const userId = typeof userOrId === 'object' ? userOrId._id || userOrId.id : userOrId
  const tierInfo = await getUserEffectiveTier(userId)

  if (tierInfo.isUnlimitedAi) {
    return {
      canSubmit: true,
      usedToday: 0,
      limit: 9999,
      remaining: 9999,
      tierInfo,
    }
  }

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const usedToday = await Essay.countDocuments({
    student: userId,
    status: { $in: ['submitted', 'reviewed'] },
    createdAt: { $gte: startOfToday },
  })

  const limit = tierInfo.dailyAiEssayLimit || 3
  const remaining = Math.max(0, limit - usedToday)

  return {
    canSubmit: usedToday < limit,
    usedToday,
    limit,
    remaining,
    tierInfo,
  }
}
