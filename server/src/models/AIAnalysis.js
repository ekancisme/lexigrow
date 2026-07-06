import mongoose from 'mongoose'

const suggestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['improvement', 'strength'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
}, { _id: false })

const aiAnalysisSchema = new mongoose.Schema({
  essay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Essay',
    required: true,
    unique: true,
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
  },
  scores: {
    vocabularyDiversity: { type: Number, min: 0, max: 1, default: 0 },   // TTR (0-1)
    grammarAccuracy: { type: Number, min: 0, max: 10, default: 0 },
    coherence: { type: Number, min: 0, max: 10, default: 0 },
    complexityIndex: { type: Number, min: 0, max: 10, default: 0 },
  },
  newWordsDetected: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  suggestions: [suggestionSchema],
  writingStats: {
    avgSentenceLength: { type: Number, default: 0 },
    uniqueWords: { type: Number, default: 0 },
  },
  nlpStats: {
    passiveVoiceCount: { type: Number, default: 0 },
    subordinateClausesCount: { type: Number, default: 0 },
    repeatedWords: [{
      word: { type: String, trim: true },
      count: { type: Number, default: 0 },
      suggestions: [{ type: String, trim: true }]
    }]
  },
}, {
  timestamps: true,
})

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema)
export default AIAnalysis
