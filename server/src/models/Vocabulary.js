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
}, {
  timestamps: true,
})

// Compound index: each word is unique per student
vocabularySchema.index({ student: 1, word: 1 }, { unique: true })
vocabularySchema.index({ student: 1, category: 1 })
vocabularySchema.index({ student: 1, createdAt: -1 })

const Vocabulary = mongoose.model('Vocabulary', vocabularySchema)
export default Vocabulary
