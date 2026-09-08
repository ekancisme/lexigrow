import mongoose from 'mongoose'
const schema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningSession',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    word: { type: String, required: true },
    wordId: { type: String, required: true },
    questionType: {
      type: String,
      enum: ['multiple_choice', 'fill_in_blank'],
      required: true,
    },
    questionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    selectedAnswer: { type: String, required: true, maxlength: 500 },
    timeSpentMs: { type: Number, min: 0, max: 3600000, default: 0 },
    requestId: { type: String, required: true },
    usedHint: { type: Boolean, default: false },
  },
  { timestamps: true },
)
schema.index({ student: 1, requestId: 1 }, { unique: true })
schema.index({ session: 1, student: 1, wordId: 1 })
export default mongoose.model('PracticeAttempt', schema)
