import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  essay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Essay',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Index for fetching chronological comments for an essay efficiently
commentSchema.index({ essay: 1, createdAt: 1 })

const Comment = mongoose.model('Comment', commentSchema)
export default Comment
