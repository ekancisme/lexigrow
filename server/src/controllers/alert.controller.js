import Alert from '../models/Alert.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import Class from '../models/Class.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'

/**
 * @desc    Get alerts for teacher
 * @route   GET /api/alerts
 * @access  Private (teacher)
 */
export const getAlerts = asyncHandler(async (req, res) => {
  const { type, isRead, page = 1, limit = 20 } = req.query

  // Find all classes taught by this teacher
  const teacherClasses = await Class.find({ teacher: req.user._id })
  const studentIds = teacherClasses.flatMap(c => c.students)

  const query = { 
    teacher: req.user._id,
    student: { $in: studentIds }
  }

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
 * @desc    Mark alert as resolved + gửi thông báo cho Học sinh & Phụ huynh
 * @route   PATCH /api/alerts/:id/resolve
 * @access  Private (teacher)
 */
export const markAsResolved = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({ _id: req.params.id, teacher: req.user._id })
    .populate('student', 'name parents')
    .populate('class', 'name')

  if (!alert) throw new ErrorResponse('Alert not found', 404)

  alert.isResolved = true
  alert.isRead = true
  await alert.save()

  const teacher = req.user
  const student = alert.student

  if (student) {
    // ── 1. Thông báo cho Học sinh ──────────────────────────────────────
    await Notification.create({
      recipient: student._id,
      sender: teacher._id,
      alert: alert._id,
      title: 'Giáo viên đã gửi phản hồi cho bạn',
      message: `Giáo viên ${teacher.name} vừa xem xét và phản hồi cảnh báo học tập của bạn (${alert.metric}). Hãy kiểm tra tiến trình và ôn tập lại nhé!`,
      type: 'academic_alert',
      link: '/student/progress',
    })

    // ── 2. Thông báo cho từng Phụ huynh ───────────────────────────────
    if (student.parents && student.parents.length > 0) {
      const parentNotifications = student.parents.map((parentId) => ({
        recipient: parentId,
        sender: teacher._id,
        alert: alert._id,
        title: 'Thông báo học tập từ giáo viên',
        message: `Giáo viên ${teacher.name} vừa can thiệp hỗ trợ con bạn — ${student.name} — do phát hiện cảnh báo về chỉ số "${alert.metric}". Chi tiết: ${alert.detail}`,
        type: 'parent_notice',
        link: '',
      }))
      await Notification.insertMany(parentNotifications)
    }
  }

  res.status(200).json({ success: true, data: alert })
})

/**
 * @desc    Get alert stats (count by type)
 * @route   GET /api/alerts/stats
 * @access  Private (teacher)
 */
export const getAlertStats = asyncHandler(async (req, res) => {
  // Find all classes taught by this teacher
  const teacherClasses = await Class.find({ teacher: req.user._id })
  const studentIds = teacherClasses.flatMap(c => c.students)

  const stats = await Alert.aggregate([
    { $match: { teacher: req.user._id, student: { $in: studentIds }, isResolved: false } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ])

  const unreadCount = await Alert.countDocuments({ 
    teacher: req.user._id, 
    student: { $in: studentIds }, 
    isRead: false 
  })

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
