import Notification from '../models/Notification.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'

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
