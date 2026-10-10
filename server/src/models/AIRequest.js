import mongoose from 'mongoose'

const aiRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true, maxlength: 128 },
  fingerprint: { type: String, required: true },
  state: { type: String, enum: ['processing', 'completed', 'possibly_processed', 'failed'], required: true },
  leaseUntil: { type: Date, default: null },
  result: { type: mongoose.Schema.Types.Mixed, default: null },
  expiresAt: { type: Date, default: null },
}, { timestamps: true })

aiRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const AIRequest = mongoose.model('AIRequest', aiRequestSchema)
export default AIRequest
