import AIAnalysis from '../models/AIAnalysis.js'
import Vocabulary from '../models/Vocabulary.js'

/**
 * Default system prompt for essay analysis
 */
const DEFAULT_ANALYSIS_PROMPT = `You are an advanced English writing analysis AI for the LexiGrow platform.
Analyze the student's essay and return a JSON response with EXACTLY this structure:

{
  "overallScore": <number 0-10>,
  "scores": {
    "vocabularyDiversity": <number 0-1, this is the Type-Token Ratio>,
    "grammarAccuracy": <number 0-10>,
    "coherence": <number 0-10>,
    "complexityIndex": <number 0-10>
  },
  "newWordsDetected": [<list of advanced/uncommon English words used>],
  "suggestions": [
    {"type": "strength", "text": "<what the student did well>"},
    {"type": "improvement", "text": "<what could be improved>"}
  ],
  "writingStats": {
    "avgSentenceLength": <number>,
    "uniqueWords": <number>
  }
}

Rules:
- vocabularyDiversity (TTR) = unique words / total words, rounded to 2 decimal places
- newWordsDetected should include academic, technical, or B2+ level words
- Provide at least 2 strengths and 2 improvements in suggestions
- Return ONLY valid JSON, no markdown formatting`

/**
 * Analyze essay using Gemini AI
 */
export const analyzeEssay = async (essayContent, customPrompt) => {
  const prompt = customPrompt || DEFAULT_ANALYSIS_PROMPT

  try {
    // Dynamic import to avoid issues if API key is not set
    const { GoogleGenerativeAI } = await import('@google/generative-ai')

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent([
      { text: prompt },
      { text: `\n\nESSAY TO ANALYZE:\n\n${essayContent}` },
    ])

    const responseText = result.response.text()

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = responseText
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const analysis = JSON.parse(jsonStr)
    return analysis
  } catch (error) {
    console.error('AI Analysis Error:', error.message)

    // Return fallback analysis if AI fails
    return generateFallbackAnalysis(essayContent)
  }
}

/**
 * Generate a basic fallback analysis when AI is unavailable
 */
function generateFallbackAnalysis(content) {
  const words = content.trim().split(/\s+/)
  const totalWords = words.length
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean))
  const sentences = content.split(/[.!?]+/).filter(Boolean)
  const ttr = Math.round((uniqueWords.size / totalWords) * 100) / 100

  return {
    overallScore: Math.min(10, Math.round(ttr * 10 + 2)),
    scores: {
      vocabularyDiversity: ttr,
      grammarAccuracy: 6.0,
      coherence: 5.5,
      complexityIndex: Math.min(10, Math.round(totalWords / 100)),
    },
    newWordsDetected: [],
    suggestions: [
      { type: 'strength', text: 'Essay was submitted and analyzed.' },
      { type: 'improvement', text: 'AI analysis was unavailable. Please configure GEMINI_API_KEY for full analysis.' },
    ],
    writingStats: {
      avgSentenceLength: sentences.length > 0 ? Math.round(totalWords / sentences.length) : 0,
      uniqueWords: uniqueWords.size,
    },
  }
}

/**
 * Process and save AI analysis results for an essay
 */
export const processEssayAnalysis = async (essayId, studentId, essayContent, customPrompt) => {
  const analysisData = await analyzeEssay(essayContent, customPrompt)

  // Save or update AIAnalysis document
  const analysis = await AIAnalysis.findOneAndUpdate(
    { essay: essayId },
    {
      essay: essayId,
      overallScore: analysisData.overallScore,
      scores: analysisData.scores,
      newWordsDetected: analysisData.newWordsDetected || [],
      suggestions: analysisData.suggestions || [],
      writingStats: analysisData.writingStats || {},
    },
    { upsert: true, new: true, runValidators: true }
  )

  // Save new words to vocabulary
  if (analysisData.newWordsDetected && analysisData.newWordsDetected.length > 0) {
    const vocabOps = analysisData.newWordsDetected.map(word => ({
      updateOne: {
        filter: { student: studentId, word: word.toLowerCase() },
        update: {
          $setOnInsert: {
            word: word.toLowerCase(),
            student: studentId,
            detectedInEssay: essayId,
            category: categorizeWord(word),
            masteryLevel: 'new',
          },
        },
        upsert: true,
      },
    }))

    await Vocabulary.bulkWrite(vocabOps)
  }

  // Update essay status to reviewed so the client stops polling and displays the analysis
  const Essay = (await import('../models/Essay.js')).default
  await Essay.findByIdAndUpdate(essayId, { status: 'reviewed' })

  return analysis
}

/**
 * Simple word categorization heuristic
 */
function categorizeWord(word) {
  const academic = ['paradigm', 'hypothesis', 'methodology', 'synthesis', 'analysis', 'framework', 'discourse', 'empirical', 'phenomenon', 'theoretical', 'conceptual', 'fundamental']
  const scientific = ['algorithm', 'infrastructure', 'telemedicine', 'prognostic', 'diagnostic', 'genomic', 'molecular', 'quantum', 'neural', 'biodiversity']
  const business = ['scalable', 'streamline', 'stakeholder', 'leverage', 'optimize', 'benchmark', 'synergy', 'revenue', 'portfolio', 'acquisition']

  const lower = word.toLowerCase()
  if (academic.some(w => lower.includes(w))) return 'academic'
  if (scientific.some(w => lower.includes(w))) return 'scientific'
  if (business.some(w => lower.includes(w))) return 'business'
  return 'daily'
}
