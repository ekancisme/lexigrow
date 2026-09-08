import mongoose from 'mongoose'
const schema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    learningSet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningSet',
      required: true,
    },
    learningSetSlug: String,
    theme: String,
    level: String,
    setVersion: Date,
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      default: null,
    },
    targetWords: { type: [mongoose.Schema.Types.Mixed], required: true },
    currentStep: {
      type: String,
      enum: ['lesson', 'practice', 'writing', 'feedback', 'completed'],
      default: 'lesson',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    activeTimeSeconds: { type: Number, min: 0, default: 0 },
    originalEssay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Essay',
      default: null,
    },
  },
  { timestamps: true, optimisticConcurrency: true },
)
schema.index(
  { student: 1 },
  { unique: true, partialFilterExpression: { status: 'in_progress' } },
)
schema.index({ student: 1, createdAt: -1 })
export default mongoose.model('LearningSession', schema)
