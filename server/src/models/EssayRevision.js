import mongoose from 'mongoose'
const schema = new mongoose.Schema(
  {
    originalEssay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Essay',
      required: true,
      immutable: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningSession',
      required: true,
      immutable: true,
    },
    revisionNumber: { type: Number, required: true, immutable: true },
    content: {
      type: String,
      required: true,
      immutable: true,
      maxlength: 10000,
    },
    contentHash: { type: String, required: true, immutable: true },
    wordCount: { type: Number, required: true, immutable: true },
    targetWords: { type: [String], required: true, immutable: true },
    targetWordResults: { type: [mongoose.Schema.Types.Mixed], default: [] },
    feedbackSummary: { type: String, default: '' },
    analysis: mongoose.Schema.Types.Mixed,
    comparison: mongoose.Schema.Types.Mixed,
    analysisStatus: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed'],
      default: 'pending',
    },
    processingUntil: Date,
    processingToken: String,
    assisted: { type: Boolean, default: false, immutable: true },
    promptVersion: { type: String, default: 'vocabulary-v1' },
    errorCode: String,
  },
  { timestamps: true },
)
schema.index({ originalEssay: 1, revisionNumber: 1 }, { unique: true })
schema.index({ student: 1, createdAt: -1 })
export default mongoose.model('EssayRevision', schema)
