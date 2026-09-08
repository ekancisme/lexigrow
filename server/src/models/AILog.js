import mongoose from 'mongoose'

const aiLogSchema = new mongoose.Schema({
  usageAvailable: { type: Boolean, default: false },
  model: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  tokensUsed: {
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
  },
  processingTimeMs: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true,
  },
  errorMessage: {
    type: String,
  },
  costEstimate: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
})

const AILog = mongoose.model('AILog', aiLogSchema)
export default AILog
