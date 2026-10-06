import { completeThroughRelay } from './aiRelayClient.service.js'
import { logAICompletion } from './aiGateway.service.js'
import { validateRecommendedWords } from './aiGuardrails.service.js'
import cacheService from './cache.service.js'
import { createLearningCache } from './learningCache.service.js'

const model = () => process.env.DEFAULT_AI_MODEL || 'llama-3.3-70b-versatile'
const learningPathCache = createLearningCache({ ttlMs: 30000, maxEntries: 100 })
async function completeLogged(options) {
  const started = Date.now()
  try {
    const result = await completeThroughRelay(options)
    await logAICompletion({ route: options.route, result, durationMs: Date.now() - started })
    return result
  } catch (error) {
    await logAICompletion({ route: options.route, error, durationMs: Date.now() - started })
    throw error
  }
}
const parseJson = (text) => {
  let value = String(text || '').trim()
  const match = value.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) value = match[1].trim()
  return JSON.parse(value)
}

async function generateWords({ route, prompt, count, crossword = false }) {
  const completion = await completeLogged({
    route,
    providerPreference: 'groq',
    model: model(),
    messages: [
      { role: 'system', content: 'You are a vocabulary recommendation AI. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    responseFormat: { type: 'json_object' },
    maxTokens: 3000,
    temperature: 0.2,
  })
  const parsed = parseJson(completion.text)
  const words = validateRecommendedWords(parsed, { count, crossword })
  if (!words) throw new Error('AI returned invalid vocabulary content')
  return words
}

export async function generateAILearningSetRecommendation(student, recentWords = [], weakWords = [], count = 10) {
  const level = student.learningProfile?.targetLevel || 'B1'
  const interests = student.learningProfile?.interests || ['general']
  const recentWordsList = recentWords.slice(0, 20).map((w) => w.word).join(', ')
  const weakWordsList = weakWords.slice(0, 10).map((w) => w.word).join(', ')
  const cacheKey = cacheService.hashKey('ai_rec:learn_set:v2', { level, interests, recentWordsList, weakWordsList, count, model: model() })
  const cached = await cacheService.get(cacheKey)
  if (cached && Array.isArray(cached) && cached.length > 0) return cached
  try {
    const words = await generateWords({
      route: 'learning_set_recommendation',
      count,
      prompt: `You are an expert English vocabulary tutor for LexiGrow. Generate exactly ${count} personalized vocabulary words for a student.

Student Profile:
- Target Level: ${level} (CEFR: A2, B1, B2, C1)
- Interests: ${interests.join(', ')}
- Recent words learned: ${recentWordsList || 'None'}
- Words needing improvement: ${weakWordsList || 'None'}

Return a JSON object with a key "words". Every item must include word, definition, translation, exampleSentence, cefr and category. Avoid recent words and keep the difficulty appropriate. Return ONLY valid JSON.`,
    })
    if (words.length > 0) await cacheService.set(cacheKey, words, 3600)
    return words
  } catch (error) {
    console.error('AI Learning Set Recommendation Error:', error.message)
    return []
  }
}

export async function generateAIDailyQuestWords(student, recentWords = [], dueWords = [], count = 6, seed = '') {
  const level = student.learningProfile?.targetLevel || 'B1'
  const interests = student.learningProfile?.interests || ['general']
  const recentWordsList = recentWords.slice(0, 15).map((w) => w.word).join(', ')
  const dueWordsList = dueWords.slice(0, 10).map((w) => w.word).join(', ')
  const cacheKey = cacheService.hashKey('ai_rec:daily_quest:v2', { level, interests, recentWordsList, dueWordsList, count, seed, model: model() })
  const cached = await cacheService.get(cacheKey)
  if (cached && Array.isArray(cached) && cached.length > 0) return cached
  try {
    const words = await generateWords({
      route: 'daily_quest',
      count,
      crossword: true,
      prompt: `You are an expert English vocabulary tutor for LexiGrow's Daily Word Quest. Generate exactly ${count} vocabulary words for a crossword.

Student CEFR: ${level}
Interests: ${interests.join(', ')}
Words due for review: ${dueWordsList || 'None'}
Recently learned: ${recentWordsList || 'None'}

Each word must be 3-10 letters, have a definition, Vietnamese translation, and exampleSentence. Return ONLY valid JSON with key "words".`,
    })
    if (words.length > 0) await cacheService.set(cacheKey, words, 3600)
    return words
  } catch (error) {
    console.error('AI Daily Quest Generation Error:', error.message)
    return []
  }
}

export async function getPersonalizedLearningPath(student, options = {}) {
  const recentWords = options.recentWords || []
  const weakWords = options.weakWords || []
  const completedSessions = options.completedSessions || 0
  const competencyVersion = options.competencyVersion || 1
  const level = student.learningProfile?.targetLevel || 'B1'
  const interests = student.learningProfile?.interests || ['general']
  const cacheKey = cacheService.hashKey('ai_rec:learning_path:v1', {
    studentId: String(student._id),
    competencyVersion,
    level,
    interests,
    completedSessions,
    recentWords: recentWords.slice(0, 10).map((word) => word.word),
    weakWords: weakWords.slice(0, 10).map((word) => word.word),
    model: model(),
  })
  const cached = await cacheService.get(cacheKey)
  if (cached) return { data: cached, meta: { source: 'cache', isFallback: false } }
  try {
    const data = await learningPathCache.get(cacheKey, () => cacheService.wrap(cacheKey, async () => {
      const completion = await completeLogged({
        route: 'learning_path',
        providerPreference: 'groq',
        model: model(),
        messages: [
          { role: 'system', content: 'You are a learning path advisor AI. Return only valid JSON.' },
          { role: 'user', content: `Analyze this deterministic student data and write a concise actionable learning path as JSON.
Target level: ${level}
Interests: ${interests.join(', ')}
Completed sessions: ${completedSessions}
Recent words: ${recentWords.slice(0, 10).map((w) => w.word).join(', ') || 'None'}
Due or weak words: ${weakWords.slice(0, 10).map((w) => w.word).join(', ') || 'None'}
Return exactly keys: recommendedLevel, focusAreas (array), suggestedTopics (array), dailyGoalMinutes (number), nextMilestone, learningPlan.`, },
        ],
        responseFormat: { type: 'json_object' },
        maxTokens: 1200,
        temperature: 0.2,
      })
      return parseJson(completion.text)
    }, 300))
    return { data, meta: { source: 'ai', isFallback: false } }
  } catch (error) {
    console.error('AI Learning Path Recommendation Error:', error.message)
    return {
      data: {
        recommendedLevel: level,
        focusAreas: ['vocabulary'],
        suggestedTopics: interests,
        dailyGoalMinutes: 15,
        nextMilestone: 'Continue your learning journey!',
        learningPlan: 'Continue building vocabulary through daily quests and learning sessions.',
      },
      meta: { source: 'offline_fallback', isFallback: true, errorCode: error.code || 'AI_RECOMMENDATION_FAILED' },
    }
  }
}

export default {
  generateAILearningSetRecommendation,
  generateAIDailyQuestWords,
  getPersonalizedLearningPath,
}
