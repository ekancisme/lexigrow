import mongoose from 'mongoose'
const schema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vocabulary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vocabulary',
      required: true,
    },
    rating: { type: Number, enum: [1, 2, 3, 4], required: true },
    intervalBefore: Number,
    intervalAfter: Number,
    repetition: Number,
    easeFactor: Number,
    reviewedAt: { type: Date, default: Date.now },
    timezone: { type: String, default: 'UTC' },
    requestId: { type: String, required: true },
    source: { type: String, default: 'self_rating' },
  },
  { timestamps: true },
)
schema.index({ student: 1, requestId: 1 }, { unique: true })
schema.index({ student: 1, vocabulary: 1, reviewedAt: -1 })
export default mongoose.model('ReviewEvent', schema)
