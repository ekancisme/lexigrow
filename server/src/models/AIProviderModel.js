import mongoose from 'mongoose'

const aiProviderModelSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'AIProviderAccount', required: true },
  modelId: { type: String, required: true, trim: true, maxlength: 160 },
  displayName: { type: String, trim: true, maxlength: 160, default: '' },
  capabilities: {
    jsonMode: { type: Boolean, default: true },
    structuredSchema: { type: Boolean, default: false },
    text: { type: Boolean, default: true },
    vision: { type: Boolean, default: false },
  },
  inputCostPerMillionUsd: { type: Number, min: 0, default: null },
  outputCostPerMillionUsd: { type: Number, min: 0, default: null },
  enabled: { type: Boolean, default: true },
}, { timestamps: true })

aiProviderModelSchema.index({ account: 1, modelId: 1 }, { unique: true })
aiProviderModelSchema.index({ enabled: 1, modelId: 1 })

export default mongoose.model('AIProviderModel', aiProviderModelSchema)
