import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['critical', 'warning', 'info', 'success'],
    required: true,
  },
  metric: {
    type: String,
    required: true,
  },
  detail: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: 'info',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isResolved: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

alertSchema.index({ teacher: 1, isRead: 1, createdAt: -1 })
alertSchema.index({ teacher: 1, type: 1 })

const Alert = mongoose.model('Alert', alertSchema)
export default Alert
