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
    default: null,
  },
  pricingSource: { type: String, default: 'unknown' },
  route: { type: String, default: '' },
  provider: { type: String, default: '' },
  providerAccount: { type: String, default: '' },
  requestId: { type: String, default: '' },
  providerRequestId: { type: String, default: '' },
  attempts: { type: Array, default: [] },
  statusCode: { type: Number, default: null },
  failoverReason: { type: String, default: '' },
  source: { type: String, enum: ['ai', 'offline_fallback', 'curated_template', ''], default: 'ai' },
  isFallback: { type: Boolean, default: false },
}, {
  timestamps: true,
})

const AILog = mongoose.model('AILog', aiLogSchema)
export default AILog
