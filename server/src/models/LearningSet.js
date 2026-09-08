import mongoose from 'mongoose'

const quizQuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['multiple-choice', 'fill-in-blank'],
    required: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String],
    default: [],
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false })

const learningItemSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
    trim: true,
  },
  partOfSpeech: {
    type: String,
    required: true,
    trim: true,
  },
  definitionVi: {
    type: String,
    required: true,
    trim: true,
  },
  phonetic: {
    type: String,
    default: '',
    trim: true,
  },
  collocations: {
    type: [String],
    default: [],
  },
  exampleSentences: {
    type: [String],
    default: [],
  },
  quizQuestions: {
    type: [quizQuestionSchema],
    default: [],
  },
}, { _id: false })

const learningSetSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  level: {
    type: String,
    enum: ['A2', 'B1', 'B2'],
    required: true,
    default: 'B1',
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'draft',
  },
  items: {
    type: [learningItemSchema],
    default: [],
  },
}, {
  timestamps: true,
})

// Indexes (slug unique index is declared via `unique: true` on the field)
learningSetSchema.index({ category: 1 })
learningSetSchema.index({ level: 1 })
learningSetSchema.index({ status: 1 })

const LearningSet = mongoose.model('LearningSet', learningSetSchema)
export default LearningSet