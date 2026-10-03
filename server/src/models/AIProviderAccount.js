import mongoose from 'mongoose'

const aiProviderAccountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  provider: {
    type: String,
    enum: ['groq', 'gemini', 'openai-compatible'],
    required: true,
  },
  model: { type: String, required: true, trim: true, maxlength: 160 },
  baseUrl: { type: String, trim: true, maxlength: 300, default: '' },
  encryptedApiKey: { type: String, required: true, select: false },
  enabled: { type: Boolean, default: true },
  priority: { type: Number, min: 0, max: 1000, default: 100 },
  routes: { type: [String], default: [] },
  cooldownUntil: { type: Date, default: null },
  consecutiveFailures: { type: Number, min: 0, default: 0 },
  lastUsedAt: { type: Date, default: null },
  lastErrorCode: { type: String, default: '' },
  lastErrorAt: { type: Date, default: null },
}, { timestamps: true })

aiProviderAccountSchema.index({ enabled: 1, provider: 1, priority: 1 })
aiProviderAccountSchema.index({ routes: 1, enabled: 1, priority: 1 })

export default mongoose.model('AIProviderAccount', aiProviderAccountSchema)
