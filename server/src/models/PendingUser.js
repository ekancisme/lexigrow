import mongoose from 'mongoose'

const pendingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'parent'],
    default: 'student',
  },
  englishLevel: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', ''],
    default: '',
  },
  institution: {
    type: String,
    trim: true,
    default: '',
  },
  childEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: '',
  },
  verificationCode: {
    type: String,
    required: true,
  },
  verificationCodeExpire: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
})

// Auto-delete expired entries after 15 minutes (900 seconds)
pendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 })

const PendingUser = mongoose.model('PendingUser', pendingUserSchema)
export default PendingUser
