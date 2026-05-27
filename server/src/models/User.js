import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please add a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student',
  },
  // Student-specific fields
  englishLevel: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', ''],
    default: '',
  },
  // Teacher-specific fields
  institution: {
    type: String,
    trim: true,
    default: '',
  },
  // Shared fields
  avatar: {
    type: String,
    default: '',
  },
  googleId: {
    type: String,
    default: '',
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    weekly: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
})

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

const User = mongoose.model('User', userSchema)
export default User
