import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'
import sendEmail from '../utils/sendEmail.js'
import { createNotification } from './notification.service.js'

/**
 * Check for subscriptions expiring soon and send reminders
 * Runs daily via cron
 */
export const checkExpiringSubscriptions = async () => {
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)

  // Find active subscriptions expiring in 3 days
  const expiringIn3Days = await Subscription.find({
    status: 'active',
    endDate: {
      $gte: threeDaysFromNow,
      $lt: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000),
    },
  }).populate('user', 'name email role')

  // Find active subscriptions expiring in 1 day
  const expiringIn1Day = await Subscription.find({
    status: 'active',
    endDate: {
      $gte: oneDayFromNow,
      $lt: new Date(oneDayFromNow.getTime() + 24 * 60 * 60 * 1000),
    },
  }).populate('user', 'name email role')

  // Find subscriptions expiring today (expired today)
  const expiringToday = await Subscription.find({
    status: 'active',
    endDate: {
      $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      $gte: now,
    },
  }).populate('user', 'name email role')

  // Send reminders for 3-day and 1-day expirations
  const allExpiring = [...expiringIn3Days, ...expiringIn1Day, ...expiringToday]

  // Deduplicate by subscription ID
  const seen = new Set()
  const uniqueSubscriptions = allExpiring.filter(sub => {
    const key = sub._id.toString()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  for (const sub of uniqueSubscriptions) {
    const user = sub.user
    if (!user) continue

    const daysLeft = Math.ceil((sub.endDate - now) / (24 * 60 * 60 * 1000))
    const planName = sub.tier ? `${sub.tier.toUpperCase()} Plan` : 'Gói cước'
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

    // Determine reminder type
    let reminderType = 'expiring_soon'
    let title = 'Gói cước sắp hết hạn'
    let message = `Gói ${planName} của bạn sẽ hết hạn sau ${daysLeft} ngày. Vui lòng gia hạn để tiếp tục sử dụng.`

    if (daysLeft <= 0) {
      reminderType = 'expired_today'
      title = 'Gói cước đã hết hạn'
      message = `Gói ${planName} của bạn đã hết hạn hôm nay. Vui lòng gia hạn ngay để không bị gián đoạn.`
    } else if (daysLeft === 1) {
      reminderType = 'expiring_tomorrow'
      title = 'Gói cước hết hạn vào ngày mai'
      message = `Gói ${planName} của bạn sẽ hết hạn vào ngày mai. Vui lòng gia hạn ngay.`
    }

    // Send in-app notification
    await createNotification({
      recipient: user._id,
      sender: null,
      title,
      message,
      type: 'system',
      link: '/pricing',
    })

    // Send email reminder
    try {
      await sendEmail({
        email: user.email,
        subject: `[LexiGrow] ${title}`,
        message: message + `\n\nGia hạn ngay tại: ${clientUrl}/pricing`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e0e7ff;border-radius:12px">
            <h2 style="color:#005bbf;text-align:center">${title}</h2>
            <p>Xin chào <strong>${user.name}</strong>,</p>
            <p>${message}</p>
            <p><strong>Thông tin gói cước:</strong></p>
            <ul>
              <li><strong>Gói:</strong> ${planName}</li>
              <li><strong>Ngày hết hạn:</strong> ${sub.endDate.toLocaleDateString('vi-VN')}</li>
            </ul>
            <div style="text-align:center;margin:24px 0">
              <a href="${clientUrl}/pricing"
                 style="background:#005bbf;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">
                Gia hạn ngay
              </a>
            </div>
            <hr style="border:0;border-top:1px solid #eee;margin:20px 0"/>
            <p style="color:#999;font-size:12px;text-align:center">LexiGrow © 2026 - Measured Writing Growth</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('[Subscription Reminder] Failed to send email to', user.email, emailErr.message)
    }
  }

  // Also handle expired subscriptions: mark them as expired
  const expiredSubs = await Subscription.find({
    status: 'active',
    endDate: { $lt: now },
  })

  for (const sub of expiredSubs) {
    sub.status = 'expired'
    await sub.save()
    console.log(`[Subscription Reminder] Marked subscription ${sub._id} as expired`)
  }

  return {
    remindersSent: uniqueSubscriptions.length,
    expiredMarked: expiredSubs.length,
  }
}

/**
 * Schedule the subscription reminder check
 * Runs every day at 09:00 local time
 */
export const scheduleSubscriptionReminders = () => {
  // Run once immediately on server start
  checkExpiringSubscriptions().then(result => {
    console.log('[Subscription Reminder] Initial check completed:', result)
  }).catch(err => {
    console.error('[Subscription Reminder] Initial check failed:', err)
  })

  // Schedule daily at 09:00
  const cronPattern = '0 9 * * *'
  // For simplicity, we use setInterval with a daily check (24 hours)
  // In production, use node-cron for precise scheduling
  setInterval(() => {
    checkExpiringSubscriptions().then(result => {
      console.log('[Subscription Reminder] Daily check completed:', result)
    }).catch(err => {
      console.error('[Subscription Reminder] Daily check failed:', err)
    })
  }, 24 * 60 * 60 * 1000)

  console.log('[Subscription Reminder] Scheduled daily at 09:00 (interval: 24h)')
}