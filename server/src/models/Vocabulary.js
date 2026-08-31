import mongoose from 'mongoose'

const vocabularySchema = new mongoose.Schema({
  word: {
    type: String,
    required: [true, 'Word is required'],
    trim: true,
    lowercase: true,
  },
  category: {
    type: String,
    enum: ['academic', 'business', 'scientific', 'daily'],
    default: 'daily',
  },
  theme: {
    type: String,
    default: 'General',
    trim: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  detectedInEssay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Essay',
  },
  masteryLevel: {
    type: String,
    enum: ['new', 'learning', 'mastered'],
    default: 'new',
  },
  ipa: {
    type: String,
    default: '',
    trim: true,
  },
  partOfSpeech: {
    type: String,
    default: '',
    trim: true,
  },
  definition: {
    type: String,
    default: '',
    trim: true,
  },
  exampleSentence: {
    type: String,
    default: '',
    trim: true,
  },
  synonyms: {
    type: [String],
    default: [],
  },
  antonyms: {
    type: [String],
    default: [],
  },

  // SRS (Spaced Repetition System) — SM-2 algorithm fields
  nextReviewDate: {
    type: Date,
    default: null, // null = never reviewed yet → always in due-today list
  },
  easeFactor: {
    type: Number,
    default: 2.5, // SM-2 default EF
    min: 1.3,     // SM-2 minimum EF floor
  },
  reviewInterval: {
    type: Number,
    default: 1,   // days until next review
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
})

// Compound index: each word is unique per student
vocabularySchema.index({ student: 1, word: 1 }, { unique: true })
vocabularySchema.index({ student: 1, category: 1 })
vocabularySchema.index({ student: 1, createdAt: -1 })
// Index for efficient due-today queries
vocabularySchema.index({ student: 1, nextReviewDate: 1 })

const Vocabulary = mongoose.model('Vocabulary', vocabularySchema)
export default Vocabulary
