import mongoose from 'mongoose'
const schema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    word: { type: String, required: true, lowercase: true },
    contextSentence: { type: String, required: true },
    essayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Essay',
      required: true,
    },
    revisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EssayRevision',
      required: true,
    },
    learningSet: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningSet' },
    theme: String,
    meaning: String,
    isVerifiedCorrect: { type: Boolean, default: false },
    aiConfidenceScore: { type: Number, min: 0, max: 1, default: null },
    assisted: { type: Boolean, default: false },
    usedAt: { type: Date, default: Date.now },
    localDay: { type: String, required: true },
  },
  { timestamps: true },
)
schema.index({ student: 1, word: 1, contextSentence: 1 }, { unique: true })
schema.index({
  student: 1,
  isVerifiedCorrect: 1,
  assisted: 1,
  word: 1,
  localDay: 1,
  essayId: 1,
})
schema.index({ revisionId: 1 })
export default mongoose.model('WordUsageEvidence', schema)
