import Alert from '../models/Alert.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'

/**
 * @desc    Get alerts for teacher
 * @route   GET /api/alerts
 * @access  Private (teacher)
 */
export const getAlerts = asyncHandler(async (req, res) => {
  const { type, isRead, page = 1, limit = 20 } = req.query
  const query = { teacher: req.user._id }

  if (type) query.type = type
  if (isRead !== undefined) query.isRead = isRead === 'true'

  const alerts = await Alert.find(query)
    .populate('student', 'name email')
    .populate('class', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))

  const total = await Alert.countDocuments(query)

  res.status(200).json({
    success: true,
    count: alerts.length,
    total,
    page: Number(page),
    data: alerts,
  })
})

/**
 * @desc    Mark alert as read
 * @route   PATCH /api/alerts/:id/read
 * @access  Private (teacher)
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({ _id: req.params.id, teacher: req.user._id })
  if (!alert) throw new ErrorResponse('Alert not found', 404)

  alert.isRead = true
  await alert.save()
  res.status(200).json({ success: true, data: alert })
})

/**
 * @desc    Mark alert as resolved
 * @route   PATCH /api/alerts/:id/resolve
 * @access  Private (teacher)
 */
export const markAsResolved = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({ _id: req.params.id, teacher: req.user._id })
  if (!alert) throw new ErrorResponse('Alert not found', 404)

  alert.isResolved = true
  alert.isRead = true
  await alert.save()
  res.status(200).json({ success: true, data: alert })
})

/**
 * @desc    Get alert stats (count by type)
 * @route   GET /api/alerts/stats
 * @access  Private (teacher)
 */
export const getAlertStats = asyncHandler(async (req, res) => {
  const stats = await Alert.aggregate([
    { $match: { teacher: req.user._id, isResolved: false } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ])

  const unreadCount = await Alert.countDocuments({ teacher: req.user._id, isRead: false })

  const result = {
    critical: 0,
    warning: 0,
    info: 0,
    success: 0,
    unread: unreadCount,
  }

  stats.forEach(s => { result[s._id] = s.count })

  res.status(200).json({ success: true, data: result })
})
