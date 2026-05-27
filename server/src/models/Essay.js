import mongoose from 'mongoose'

const essaySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an essay title'],
    trim: true,
    maxlength: [300, 'Title cannot be more than 300 characters'],
  },
  content: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed'],
    default: 'draft',
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  // Auto-calculated stats
  wordCount: {
    type: Number,
    default: 0,
  },
  paragraphCount: {
    type: Number,
    default: 0,
  },
  sentenceCount: {
    type: Number,
    default: 0,
  },
  readingTime: {
    type: Number,  // in minutes
    default: 1,
  },
  submittedAt: {
    type: Date,
  },
}, {
  timestamps: true,
})

// Calculate text stats before saving
essaySchema.pre('save', function (next) {
  if (this.isModified('content') && this.content) {
    const text = this.content.trim()
    this.wordCount = text ? text.split(/\s+/).length : 0
    this.paragraphCount = text ? text.split(/\n\n+/).filter(Boolean).length : 0
    this.sentenceCount = text ? text.split(/[.!?]+/).filter(Boolean).length : 0
    this.readingTime = Math.max(1, Math.ceil(this.wordCount / 200))
  }
  next()
})

// Index for querying essays by student
essaySchema.index({ student: 1, createdAt: -1 })
essaySchema.index({ student: 1, status: 1 })

const Essay = mongoose.model('Essay', essaySchema)
export default Essay
