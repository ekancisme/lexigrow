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

async function runTest() {
  console.log('🚀 Starting PayOS & Tier Sponsorship Integration Test...')
  
  await mongoose.connect(MONGO_URI)
  console.log('✅ Connected to MongoDB')

  try {
    // 1. Check Subscription Plans
    const plans = await SubscriptionPlan.find({ isActive: true })
    console.log(`📋 Found ${plans.length} active subscription plans in database`)
    if (plans.length === 0) {
      throw new Error('No subscription plans found. Run seed script first.')
    }

    // 2. Setup Test Users: 1 Teacher, 1 Sponsored Student, 1 Free Student
    const testTeacherEmail = 'test_teacher_payos@lexigrow.com'
    const testStudent1Email = 'test_student_sponsored@lexigrow.com'
    const testStudent2Email = 'test_student_free@lexigrow.com'

    await User.deleteMany({ email: { $in: [testTeacherEmail, testStudent1Email, testStudent2Email] } })
    await Subscription.deleteMany({}) // Clean test subscriptions if needed or delete by users
    await PaymentTransaction.deleteMany({})
    await Class.deleteMany({ name: 'Test PayOS Class' })

    const teacher = await User.create({
      name: 'Teacher PayOS Test',
      email: testTeacherEmail,
      password: 'hashed_password_123',
      role: 'teacher',
      institution: 'LexiGrow Academy'
    })

    const studentSponsored = await User.create({
      name: 'Student Sponsored Test',
      email: testStudent1Email,
      password: 'hashed_password_123',
      role: 'student',
      englishLevel: 'B2'
    })

    const studentFree = await User.create({
      name: 'Student Free Test',
      email: testStudent2Email,
      password: 'hashed_password_123',
      role: 'student',
      englishLevel: 'A2'
    })

    console.log('✅ Created test users (Teacher, Student 1, Student 2)')

    // 3. Test PayOS Payment Link Creation (Live API test with credentials)
    const teacherPlan = await SubscriptionPlan.findOne({ slug: 'teacher-pro' })
    if (!teacherPlan) throw new Error('teacher-pro plan not found')

    console.log('\n--- 1. Testing PayOS Payment Link Creation ---')
    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 100))
    const paymentResult = await createPayOSPaymentLink({
      orderCode,
      amount: 2000, // Small test amount to check PayOS API connection
      description: `SUB LexiGrow`,
      returnUrl: 'http://localhost:5173/payment/success',
      cancelUrl: 'http://localhost:5173/payment/cancel'
    })

    console.log('✅ PayOS Payment Link generated successfully:')
    console.log(`   - OrderCode: ${paymentResult.orderCode}`)
    console.log(`   - CheckoutUrl: ${paymentResult.checkoutUrl}`)
    console.log(`   - QR Code string present: ${!!paymentResult.qrCode}`)

    // 4. Test Webhook Simulation & Subscription Activation for Teacher
    console.log('\n--- 2. Simulating Webhook & Activating Teacher Pro Subscription ---')
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)

    const teacherSub = await Subscription.create({
      user: teacher._id,
      plan: teacherPlan._id,
      planSlug: teacherPlan.slug,
      targetRole: teacherPlan.targetRole,
      tier: 'pro',
      billingCycle: 'monthly',
      amountPaid: teacherPlan.monthlyPrice,
      orderCode,
      startDate,
      endDate,
      status: 'active',
      maxSponsoredStudents: teacherPlan.maxSponsoredStudents || 100
    })

    await PaymentTransaction.create({
      orderCode,
      user: teacher._id,
      plan: teacherPlan._id,
      planSlug: teacherPlan.slug,
      planName: teacherPlan.name,
      tier: teacherPlan.tier,
      targetRole: teacherPlan.targetRole,
      amount: teacherPlan.monthlyPrice,
      billingCycle: 'monthly',
      status: 'PAID',
      checkoutUrl: paymentResult.checkoutUrl,
      webhookData: { code: '00', desc: 'Success' }
    })

    console.log(`✅ Teacher Pro subscription activated (Max Sponsored Students: ${teacherSub.maxSponsoredStudents})`)

    // 5. Test Teacher Sponsorship Inheritance
    console.log('\n--- 3. Testing Teacher Sponsorship Inheritance ---')
    // Before enrolling in class, studentSponsored should be FREE tier
    const initialTier = await getUserEffectiveTier(studentSponsored._id)
    console.log(`   - Initial Student Tier: ${initialTier.tier} (Source: ${initialTier.source})`)
    if (initialTier.tier !== 'free') throw new Error('Expected initial tier to be free')

    // Create a class by the teacher and add studentSponsored
    const testClass = await Class.create({
      name: 'Test PayOS Class',
      teacher: teacher._id,
      students: [studentSponsored._id],
      status: 'active'
    })
    console.log(`✅ Created test class and enrolled Student 1`)

    // Now check studentSponsored's effective tier
    const effectiveTier = await getUserEffectiveTier(studentSponsored._id)
    console.log(`   - After Class Enrollment Effective Tier: ${effectiveTier.tier} (Source: ${effectiveTier.source})`)
    console.log(`   - Plan Name: ${effectiveTier.planName}`)
    console.log(`   - Daily Essay Limit: ${effectiveTier.dailyAiEssayLimit} (Unlimited: ${effectiveTier.isUnlimitedAi})`)

    if (effectiveTier.tier !== 'pro' || effectiveTier.source !== 'teacher_sponsored') {
      throw new Error(`Expected student tier to be 'pro' via 'teacher_sponsored', got ${effectiveTier.tier} (${effectiveTier.source})`)
    }
    console.log('✅ Student successfully inherited Pro tier from Teacher!')

    // 6. Test Quota Check under Pro Tier (Pro tier has unlimited essays)
    console.log('\n--- 4. Testing Daily Essay Quota Enforcement ---')
    const quotaCheck = await checkDailyEssayQuota(studentSponsored._id)
    console.log(`   - Student Quota: ${quotaCheck.usedToday}/${quotaCheck.limit} used (canSubmit: ${quotaCheck.canSubmit})`)
    if (quotaCheck.limit !== 9999 || !quotaCheck.canSubmit) {
      throw new Error(`Expected quota limit to be 9999 for Pro tier, got ${quotaCheck.limit}`)
    }

    // Free student check
    const freeQuotaCheck = await checkDailyEssayQuota(studentFree._id)
    console.log(`   - Free Student Quota: ${freeQuotaCheck.usedToday}/${freeQuotaCheck.limit} used (canSubmit: ${freeQuotaCheck.canSubmit})`)
    if (freeQuotaCheck.limit !== 3 || !freeQuotaCheck.canSubmit) {
      throw new Error(`Expected quota limit to be 3 for Free tier, got ${freeQuotaCheck.limit}`)
    }

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED PERFECTLY!')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

runTest()
