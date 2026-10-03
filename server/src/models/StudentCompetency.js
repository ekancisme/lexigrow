import mongoose from 'mongoose'

const wordStateSchema = new mongoose.Schema({
  word: { type: String, required: true, lowercase: true },
  vocabularyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', default: null },
  state: { type: String, enum: ['due', 'struggling', 'mastered', 'learning', 'new', 'unseen'], required: true },
  nextReviewDate: { type: Date, default: null },
  latestRating: { type: Number, default: null },
  reviewCount: { type: Number, default: 0 },
  evidenceCount: { type: Number, default: 0 },
  definition: { type: String, default: '' },
  definitionVi: { type: String, default: '' },
  partOfSpeech: { type: String, default: 'other' },
  phonetic: { type: String, default: '' },
  exampleSentences: { type: [String], default: [] },
  quizQuestions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  theme: { type: String, default: 'Adaptive Learning' },
}, { _id: false })

const studentCompetencySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  computedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 },
  level: { type: String, default: 'B1' },
  interests: { type: [String], default: [] },
  summary: {
    due: { type: Number, default: 0 },
    struggling: { type: Number, default: 0 },
    mastered: { type: Number, default: 0 },
    unseen: { type: Number, default: 0 },
    learning: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  words: { type: [wordStateSchema], default: [] },
}, { timestamps: true })

studentCompetencySchema.index({ student: 1, computedAt: -1 })
export default mongoose.model('StudentCompetency', studentCompetencySchema)
