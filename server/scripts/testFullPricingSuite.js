import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

import User from '../src/models/User.js'
import SubscriptionPlan from '../src/models/SubscriptionPlan.js'
import Subscription from '../src/models/Subscription.js'
import PaymentTransaction from '../src/models/PaymentTransaction.js'
import Class from '../src/models/Class.js'
import { getUserEffectiveTier, checkDailyEssayQuota } from '../src/services/tier.service.js'
import { createPayOSPaymentLink } from '../src/services/payos.service.js'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lexigrow?retryWrites=false'

async function runTestSuite() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('🧪 BẮT ĐẦU BỘ TESTCASE TOÀN DIỆN CHO TÍNH NĂNG PAYOS & BẢNG GIÁ')
  console.log('═══════════════════════════════════════════════════════════════\n')

  await mongoose.connect(MONGO_URI)
  console.log('✅ 1. Kết nối MongoDB thành công')

  let passedCount = 0
  let totalTests = 0

  async function test(title, fn) {
    totalTests++
    try {
      await fn()
      console.log(`   ✅ [PASS] ${title}`)
      passedCount++
    } catch (err) {
      console.error(`   ❌ [FAIL] ${title}`)
      console.error(`      Lỗi: ${err.message}`)
    }
  }

  try {
    // Setup test accounts
    const teacherEmail = 'test_teacher_suite@lexigrow.com'
    const student1Email = 'test_student1_suite@lexigrow.com'
    const student2Email = 'test_student2_suite@lexigrow.com'
    const adminEmail = 'test_admin_suite@lexigrow.com'

    await User.deleteMany({ email: { $in: [teacherEmail, student1Email, student2Email, adminEmail] } })
    await Class.deleteMany({ name: 'Suite Test Class' })

    const teacher = await User.create({
      name: 'Teacher Suite Test',
      email: teacherEmail,
      password: 'password123',
      role: 'teacher',
      institution: 'LexiGrow Suite'
    })

    const student1 = await User.create({
      name: 'Student 1 Suite Test',
      email: student1Email,
      password: 'password123',
      role: 'student',
      englishLevel: 'B1'
    })

    const student2 = await User.create({
      name: 'Student 2 Suite Test',
      email: student2Email,
      password: 'password123',
      role: 'student',
      englishLevel: 'A2'
    })

    const admin = await User.create({
      name: 'Admin Suite Test',
      email: adminEmail,
      password: 'password123',
      role: 'admin'
    })

    console.log('✅ 2. Thiết lập dữ liệu người dùng kiểm thử thành công\n')

    // --- TESTCASE 01: Plans Listing & Public Access ---
    await test('TC_PAY_01: Lấy danh sách gói cước hoạt động (Student & Teacher)', async () => {
      const allPlans = await SubscriptionPlan.find({ isActive: true })
      if (allPlans.length < 6) throw new Error(`Cần ít nhất 6 gói cước, tìm thấy ${allPlans.length}`)
      const studentPlans = allPlans.filter(p => p.targetRole === 'student')
      const teacherPlans = allPlans.filter(p => p.targetRole === 'teacher')
      if (studentPlans.length !== 3 || teacherPlans.length !== 3) {
        throw new Error('Số lượng gói student và teacher không khớp 3-3')
      }
    })

    // --- TESTCASE 02: Initial Free Tier & Essay Quota ---
    await test('TC_PAY_02: Kiểm tra hạng cước mặc định của học sinh mới (Free - 3 bài/ngày)', async () => {
      const tierInfo = await getUserEffectiveTier(student1._id)
      if (tierInfo.tier !== 'free' || tierInfo.source !== 'free') {
        throw new Error(`Kỳ vọng tier 'free', nhận được ${tierInfo.tier}`)
      }
      const quota = await checkDailyEssayQuota(student1._id)
      if (quota.limit !== 3 || !quota.canSubmit) {
        throw new Error(`Kỳ vọng hạn ngạch 3 bài/ngày, nhận được ${quota.limit}`)
      }
    })

    // --- TESTCASE 03: Live PayOS Payment Link Creation ---
    let generatedOrderCode = 0
    let payosResult = null
    await test('TC_PAY_03: Tạo liên kết thanh toán VietQR PayOS trực tiếp qua API thật', async () => {
      generatedOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 100))
      payosResult = await createPayOSPaymentLink({
        orderCode: generatedOrderCode,
        amount: 499000,
        description: 'TEACHER PRO 1T',
        buyerName: teacher.name,
        buyerEmail: teacher.email,
        returnUrl: 'http://localhost:5173/payment/success',
        cancelUrl: 'http://localhost:5173/payment/cancel'
      })

      if (!payosResult.checkoutUrl || !payosResult.qrCode) {
        throw new Error('PayOS không trả về checkoutUrl hoặc qrCode')
      }
      if (payosResult.orderCode !== generatedOrderCode) {
        throw new Error('OrderCode trả về không trùng khớp với mã gửi lên')
      }
    })

    // --- TESTCASE 04: Save Payment Transaction in DB ---
    let testTransaction = null
    await test('TC_PAY_04: Lưu bản ghi giao dịch PENDING vào PaymentTransaction collection', async () => {
      const teacherPlan = await SubscriptionPlan.findOne({ slug: 'teacher-pro' })
      testTransaction = await PaymentTransaction.create({
        orderCode: generatedOrderCode,
        user: teacher._id,
        plan: teacherPlan._id,
        planSlug: teacherPlan.slug,
        planName: teacherPlan.name,
        tier: teacherPlan.tier,
        targetRole: teacherPlan.targetRole,
        billingCycle: 'monthly',
        amount: 499000,
        status: 'PENDING',
        payosPaymentLinkId: payosResult.paymentLinkId || '',
        checkoutUrl: payosResult.checkoutUrl,
        qrCode: payosResult.qrCode
      })

      if (testTransaction.status !== 'PENDING') throw new Error('Trạng thái khởi tạo phải là PENDING')
    })

    // --- TESTCASE 05: Simulate Successful PayOS Webhook ---
    await test('TC_PAY_05: Mô phỏng Webhook thành công (code: 00) và kích hoạt Subscription', async () => {
      // Transition transaction to PAID
      testTransaction.status = 'PAID'
      testTransaction.paidAt = new Date()
      testTransaction.webhookData = { code: '00', desc: 'Success', orderCode: generatedOrderCode }
      await testTransaction.save()

      const teacherPlan = await SubscriptionPlan.findOne({ slug: 'teacher-pro' })
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)

      const sub = await Subscription.create({
        user: teacher._id,
        plan: teacherPlan._id,
        planSlug: teacherPlan.slug,
        targetRole: teacherPlan.targetRole,
        tier: 'pro',
        billingCycle: 'monthly',
        amountPaid: 499000,
        orderCode: generatedOrderCode,
        startDate,
        endDate,
        status: 'active',
        maxSponsoredStudents: teacherPlan.maxSponsoredStudents || 100
      })

      if (sub.status !== 'active' || sub.maxSponsoredStudents !== 100) {
        throw new Error('Gói giáo viên không được kích hoạt đúng hạn ngạch')
      }
    })

    // --- TESTCASE 06: Teacher Sponsorship Inheritance ---
    let testClass = null
    await test('TC_PAY_06: Học sinh tham gia lớp của Giáo viên tự động thừa hưởng quyền lợi PRO', async () => {
      // Before enrollment: Student 1 is Free
      const beforeTier = await getUserEffectiveTier(student1._id)
      if (beforeTier.tier !== 'free') throw new Error('Học sinh trước khi vào lớp phải là Free')

      // Enroll student 1 in teacher's class
      testClass = await Class.create({
        name: 'Suite Test Class',
        teacher: teacher._id,
        students: [student1._id],
        status: 'active'
      })

      // After enrollment: Student 1 inherits PRO
      const afterTier = await getUserEffectiveTier(student1._id)
      if (afterTier.tier !== 'pro' || afterTier.source !== 'teacher_sponsored') {
        throw new Error(`Kỳ vọng tier 'pro' qua 'teacher_sponsored', nhận được ${afterTier.tier} (${afterTier.source})`)
      }
      if (!afterTier.isUnlimitedAi) {
        throw new Error('Học sinh được bảo trợ PRO phải có isUnlimitedAi = true')
      }
    })

    // --- TESTCASE 07: Quota Enforcement on Sponsored vs Free Students ---
    await test('TC_PAY_07: Kiểm tra hạn ngạch bài viết AI giữa học sinh được bảo trợ vs học sinh tự do', async () => {
      const sponsoredQuota = await checkDailyEssayQuota(student1._id)
      if (sponsoredQuota.limit !== 9999 || !sponsoredQuota.canSubmit) {
        throw new Error(`Học sinh bảo trợ phải có quota 9999, nhận ${sponsoredQuota.limit}`)
      }

      const freeQuota = await checkDailyEssayQuota(student2._id)
      if (freeQuota.limit !== 3 || !freeQuota.canSubmit) {
        throw new Error(`Học sinh tự do phải có quota 3, nhận ${freeQuota.limit}`)
      }
    })

    // --- TESTCASE 08: Admin Dynamic Pricing CRUD ---
    let createdPlanId = null
    await test('TC_PAY_08: Admin tạo mới, cập nhật giá và xóa gói cước tùy chỉnh', async () => {
      const newPlan = await SubscriptionPlan.create({
        slug: 'custom-student-trial',
        name: 'Gói Dùng Thử Đặc Biệt',
        targetRole: 'student',
        tier: 'plus',
        monthlyPrice: 19000,
        yearlyPrice: 190000,
        features: ['10 bài chấm AI/ngày', 'Thử nghiệm tính năng mới'],
        maxSponsoredStudents: 0,
        maxClasses: 2,
        dailyAiEssayLimit: 10,
        highlightBadge: 'Flash Sale',
        sortOrder: 99,
        isActive: true
      })
      createdPlanId = newPlan._id

      // Update plan
      newPlan.monthlyPrice = 25000
      await newPlan.save()
      const updated = await SubscriptionPlan.findById(createdPlanId)
      if (updated.monthlyPrice !== 25000) throw new Error('Cập nhật giá gói cước thất bại')

      // Delete plan
      await SubscriptionPlan.deleteOne({ _id: createdPlanId })
      const deleted = await SubscriptionPlan.findById(createdPlanId)
      if (deleted) throw new Error('Xóa gói cước thất bại')
    })

    // --- TESTCASE 09: Admin Manual Subscription Grant ---
    await test('TC_PAY_09: Admin cấp gói cước trực tiếp cho người dùng không qua thanh toán', async () => {
      const studentPlan = await SubscriptionPlan.findOne({ slug: 'student-ultra' })
      const durationDays = 60
      const orderCode = Math.floor(100000 + Math.random() * 900000)
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)

      const grantedSub = await Subscription.create({
        user: student2._id,
        plan: studentPlan._id,
        planSlug: studentPlan.slug,
        targetRole: studentPlan.targetRole,
        tier: 'ultra',
        billingCycle: 'monthly',
        amountPaid: 0,
        orderCode,
        startDate,
        endDate,
        status: 'active',
        maxSponsoredStudents: 0
      })

      const student2Tier = await getUserEffectiveTier(student2._id)
      if (student2Tier.tier !== 'ultra' || student2Tier.source !== 'personal_subscription') {
        throw new Error(`Kỳ vọng tier 'ultra', nhận được ${student2Tier.tier}`)
      }
    })

    // --- TESTCASE 10: Admin Revenue & Transactions Aggregation ---
    await test('TC_PAY_10: Tổng hợp doanh thu và danh sách giao dịch qua MongoDB Aggregation', async () => {
      const revenueStats = await PaymentTransaction.aggregate([
        { $match: { status: 'PAID' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])

      const totalRevenue = revenueStats[0]?.totalRevenue || 0
      const count = revenueStats[0]?.count || 0
      if (count === 0 || totalRevenue < 499000) {
        throw new Error(`Kỳ vọng doanh thu >= 499.000đ, nhận được ${totalRevenue}đ (${count} đơn)`)
      }
    })

  } finally {
    await mongoose.disconnect()
    console.log('\n👋 Đã đóng kết nối MongoDB')
  }

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log(`📊 KẾT QUẢ BỘ KIỂM THỬ: ${passedCount}/${totalTests} TEST CASES ĐÃ ĐẠT (${Math.round(passedCount/totalTests*100)}%)`)
  console.log('═══════════════════════════════════════════════════════════════')
}

runTestSuite()
