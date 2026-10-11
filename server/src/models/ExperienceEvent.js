import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, enum: ['srs_daily', 'daily_quest'], required: true },
  idempotencyKey: { type: String, required: true, maxlength: 160 },
  points: { type: Number, required: true, min: 1, max: 100 },
  occurredAt: { type: Date, required: true, default: Date.now },
  sourceRef: { type: String, default: '' },
}, { timestamps: true })

schema.index({ student: 1, idempotencyKey: 1 }, { unique: true })
schema.index({ occurredAt: -1, student: 1 })
schema.index({ student: 1, occurredAt: -1 })

export default mongoose.model('ExperienceEvent', schema)
