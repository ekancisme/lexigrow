import mongoose from 'mongoose'
const schema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scope: { type: String, required: true },
    key: { type: String, required: true },
    fingerprint: { type: String, required: true },
    result: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
)
schema.index({ student: 1, scope: 1, key: 1 }, { unique: true })
export default mongoose.model('LearningOperation', schema)
