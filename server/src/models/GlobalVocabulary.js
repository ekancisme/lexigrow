import mongoose from 'mongoose'

const globalVocabularySchema = new mongoose.Schema({
  word: {
    type: String,
    required: [true, 'Word is required'],
    trim: true,
    lowercase: true,
    unique: true
  },
  ipa: {
    type: String,
    default: '',
    trim: true
  },
  partOfSpeech: {
    type: String,
    enum: ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'phrase', 'other'],
    default: 'noun',
    trim: true
  },
  definition: {
    type: String,
    required: [true, 'Definition is required'],
    trim: true
  },
  cefr: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    default: 'B1'
  },
  awl: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
})

// Indexes for fast searching and filtering
globalVocabularySchema.index({ word: 1 }, { unique: true })
globalVocabularySchema.index({ cefr: 1 })
globalVocabularySchema.index({ awl: 1 })

const GlobalVocabulary = mongoose.model('GlobalVocabulary', globalVocabularySchema)
export default GlobalVocabulary
