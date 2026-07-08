import mongoose from 'mongoose'

/**
 * Notification Model
 * Dùng để gửi thông báo tới Học sinh hoặc Phụ huynh
 * khi Giáo viên xử lý (resolve) một Cảnh báo sớm.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = hệ thống tự tạo
    },
    alert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['academic_alert', 'feedback', 'system', 'parent_notice', 'assignment'],
      default: 'academic_alert',
    },
    // Đường dẫn frontend để điều hướng khi click vào thông báo
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

// Index để query nhanh theo recipient
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification
