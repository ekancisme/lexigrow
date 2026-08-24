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
    lexicalDiversityHdd: { type: Number, default: 0 },                    // HD-D (0-1)
    lexicalDiversityMtld: { type: Number, default: 0 }                    // MTLD (0-120+)
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
      synonyms: [{ type: String }],
      suggestions: [{ type: String, trim: true }]
    }]
  },
  learningPatterns: {
    paddedSentences: { type: Boolean, default: false },
    plagiarismDetected: { type: Boolean, default: false },
    learningStatus: {
      type: String,
      enum: ['progressing', 'plateau', 'regression', 'stable', 'unknown'],
      default: 'unknown'
    },
    feedback: { type: String, default: '' }
  },
  nextEssaySuggestions: {
    transitionWords: [{ type: String, trim: true }],
    sentenceStructures: [{ type: String, trim: true }],
    generalTips: { type: String, default: '' }
  },
  plagiarismDetails: {
    isPlagiarized: { type: Boolean, default: false },
    matchedEssay: { type: mongoose.Schema.Types.ObjectId, ref: 'Essay', default: null },
    similarityScore: { type: Number, default: 0 },
    plagiarismType: { 
      type: String, 
      enum: ['ai_generated', 'cross_student', 'both', 'none'], 
      default: 'none' 
    }
  },
  // Track which system prompt was used for this analysis
  promptUsed: {
    name: { type: String, default: 'Default System Prompt' },
    promptId: { type: mongoose.Schema.Types.ObjectId, ref: 'SystemPrompt', default: null },
    isCustom: { type: Boolean, default: false },
  }
}, {
  timestamps: true,
})

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema)
export default AIAnalysis
