import Notification from '../models/Notification.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import User from '../models/User.js'
import sendEmail from '../utils/sendEmail.js'

/**
 * @desc    Lấy danh sách thông báo của user đang đăng nhập
 * @route   GET /api/notifications
 * @access  Private (student, parent, teacher)
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query

  const query = { recipient: req.user._id }
  if (unreadOnly === 'true') query.isRead = false

  const notifications = await Notification.find(query)
    .populate('sender', 'name role')
    .populate('alert', 'type metric detail')
    .sort({ createdAt: -1 })
    .skip((page - 1) * Number(limit))
    .limit(Number(limit))

  const total = await Notification.countDocuments(query)
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  })

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    unreadCount,
    page: Number(page),
    data: notifications,
  })
})

/**
 * @desc    Đánh dấu một thông báo đã đọc
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  })

  if (!notification) {
    throw new ErrorResponse('Notification not found', 404)
  }

  notification.isRead = true
  await notification.save()

  res.status(200).json({ success: true, data: notification })
})

/**
 * @desc    Đánh dấu TẤT CẢ thông báo chưa đọc của user đã đọc
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  )

  res.status(200).json({ success: true, message: 'All notifications marked as read' })
})

/**
 * @desc    Lấy số lượng thông báo chưa đọc (dùng để hiển thị badge)
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  })

  res.status(200).json({ success: true, data: { count } })
})

// ─────────────────────────────────────────────────────────────
// POST /api/notifications/:id/respond-parent-request
// ─────────────────────────────────────────────────────────────
export const respondParentRequest = asyncHandler(async (req, res) => {
  const { action } = req.body // 'approve' or 'reject'
  if (!['approve', 'reject'].includes(action)) {
    throw new ErrorResponse('Vui lòng chọn hành động approve hoặc reject', 400)
  }

  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  })

  if (!notification) {
    throw new ErrorResponse('Thông báo không tìm thấy', 404)
  }

  if (notification.type !== 'parent_notice' || !notification.relatedUser) {
    throw new ErrorResponse('Thông báo này không hỗ trợ hành động này', 400)
  }

  const parent = await User.findById(notification.relatedUser)
  if (!parent) {
    throw new ErrorResponse('Không tìm thấy phụ huynh tương ứng', 404)
  }

  if (action === 'approve') {
    if (parent.accountStatus !== 'pending_approval') {
      throw new ErrorResponse('Tài khoản phụ huynh không ở trạng thái chờ duyệt', 400)
    }

    parent.accountStatus = 'active'
    parent.statusNote = `Approved via student ${req.user.name} (${req.user.email}) confirmation on ${new Date().toISOString()}`
    await parent.save()

    // Send email to parent
    try {
      await sendEmail({
        email: parent.email,
        subject: '[LexiGrow] Tài khoản của bạn đã được phê duyệt thành công!',
        message: `Xin chào ${parent.name}, tài khoản phụ huynh của bạn đã được học sinh ${req.user.name} phê duyệt thành công. Bạn có thể đăng nhập ngay bây giờ.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e0e7ff;border-radius:12px">
            <h2 style="color:#005bbf;text-align:center">✅ Tài khoản đã được duyệt!</h2>
            <p>Xin chào <strong>${parent.name}</strong>,</p>
            <p>Tài khoản <strong>phụ huynh</strong> của bạn trên hệ thống <strong>LexiGrow</strong> đã được học sinh <strong>${req.user.name}</strong> phê duyệt thành công.</p>
            <p>Bạn có thể đăng nhập và bắt đầu theo dõi tiến trình học tập của con ngay bây giờ.</p>
            <div style="text-align:center;margin:24px 0">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" 
                 style="background:#005bbf;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">
                Đăng nhập ngay
              </a>
            </div>
            <hr style="border:0;border-top:1px solid #eee;margin:20px 0"/>
            <p style="color:#999;font-size:12px;text-align:center">LexiGrow © 2026 - Measured Writing Growth</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('[Notification] Failed to send parent approval email:', emailErr.message)
    }

    notification.message = `You approved the linking request from parent ${parent.name} (${parent.email}).`
  } else {
    // action === 'reject'
    parent.accountStatus = 'rejected'
    parent.statusNote = `Rejected via student ${req.user.name} (${req.user.email}) confirmation on ${new Date().toISOString()}`
    await parent.save()

    notification.message = `You declined the linking request from parent ${parent.name} (${parent.email}).`
  }

  // Mark notification as read and save updated message
  notification.isRead = true
  await notification.save()

  console.log(`[Notification] Student ${req.user.email} ${action}d parent ${parent.email} request`)

  res.status(200).json({ success: true, data: notification })
})
