import mongoose from 'mongoose'

const comboCandidateSchema = new mongoose.Schema({
  model: { type: mongoose.Schema.Types.ObjectId, ref: 'AIProviderModel', required: true },
  order: { type: Number, min: 1, required: true },
  enabled: { type: Boolean, default: true },
}, { _id: false })

const aiModelComboSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  routes: { type: [String], default: [] },
  candidates: { type: [comboCandidateSchema], default: [] },
  enabled: { type: Boolean, default: true },
  active: { type: Boolean, default: false },
  maxAttempts: { type: Number, min: 1, max: 10, default: 3 },
  timeoutMs: { type: Number, min: 1000, max: 120000, default: 30000 },
  maxCostUsd: { type: Number, min: 0, default: null },
  version: { type: Number, min: 1, default: 1 },
}, { timestamps: true })

aiModelComboSchema.index({ routes: 1, active: 1, enabled: 1 })
aiModelComboSchema.index({ name: 1 }, { unique: true })

export default mongoose.model('AIModelCombo', aiModelComboSchema)
