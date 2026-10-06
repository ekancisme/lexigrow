import { completeThroughRelay } from './aiRelayClient.service.js'
import { logAICompletion } from './aiGateway.service.js'
import { validateRecommendedWords } from './aiGuardrails.service.js'
import cacheService from './cache.service.js'

const model = () => process.env.DEFAULT_AI_MODEL || 'llama-3.3-70b-versatile'
const learningPathRequests = new Map()
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
  const cacheKey = cacheService.hashKey('ai_rec:learning_path:v2', {
    studentId: String(student._id),
    competencyVersion,
    level,
    interests,
    dailyGoalMinutes: student.learningProfile?.dailyGoalMinutes || 15,
    pace: student.learningProfile?.pace || 'standard',
    completedSessions,
    recentWords: recentWords.slice(0, 10).map((word) => word.word),
    weakWords: weakWords.slice(0, 10).map((word) => word.word),
    model: model(),
  })
  const fallback = (errorCode, source = 'offline_fallback') => ({
    data: {
      recommendedLevel: level,
      focusAreas: ['vocabulary'],
      suggestedTopics: interests,
      dailyGoalMinutes: student.learningProfile?.dailyGoalMinutes || 15,
      nextMilestone: 'Continue your learning journey!',
      learningPlan: 'Continue building vocabulary through daily quests and learning sessions.',
    },
    meta: { source, isFallback: true, errorCode },
  })
  const asCached = (result) => ({
    data: result.data,
    meta: { ...result.meta, source: result.meta.isFallback ? 'offline_fallback_cache' : 'cache' },
  })
  const cached = await cacheService.get(cacheKey)
  if (cached) return asCached(cached)
  if (learningPathRequests.has(cacheKey)) return structuredClone(await learningPathRequests.get(cacheKey))

  const request = (async () => {
    const release = await cacheService.acquireLease(cacheKey)
    if (!release) return fallback('RECOMMENDATION_PENDING', 'pending')
    try {
      // Another process may have filled the cache before we acquired its lease.
      const shared = await cacheService.get(cacheKey)
      if (shared) return asCached(shared)
      const completion = await completeLogged({
        route: 'learning_path',
        providerPreference: 'groq',
        model: model(),
        messages: [
          { role: 'system', content: 'You are a learning path advisor AI. Return only valid JSON.' },
          { role: 'user', content: `Analyze this deterministic student data and write a concise actionable learning path as JSON.
Target level: ${level}
Interests: ${interests.join(', ')}
Daily goal minutes: ${student.learningProfile?.dailyGoalMinutes || 15}
Learning pace: ${student.learningProfile?.pace || 'standard'}
Completed sessions: ${completedSessions}
Recent words: ${recentWords.slice(0, 10).map((w) => w.word).join(', ') || 'None'}
Due or weak words: ${weakWords.slice(0, 10).map((w) => w.word).join(', ') || 'None'}
Return exactly keys: recommendedLevel, focusAreas (array), suggestedTopics (array), dailyGoalMinutes (number), nextMilestone, learningPlan.`, },
        ],
        responseFormat: { type: 'json_object' },
        maxTokens: 1200,
        temperature: 0.2,
      })
      const data = parseJson(completion.text)
      if (!data || typeof data.learningPlan !== 'string' || !data.learningPlan.trim()
        || typeof data.recommendedLevel !== 'string' || !Array.isArray(data.focusAreas)
        || !Array.isArray(data.suggestedTopics) || !Number.isFinite(data.dailyGoalMinutes)
        || typeof data.nextMilestone !== 'string') {
        throw new Error('Invalid learning path response')
      }
      const result = { data, meta: { source: 'ai', isFallback: false } }
      await cacheService.set(cacheKey, result, 300)
      return result
    } catch (error) {
      console.error('AI Learning Path Recommendation Error:', error.message)
      const result = fallback(error.code || 'AI_RECOMMENDATION_FAILED')
      const transient = error.name === 'AbortError' || error.status === 408 || error.status === 429
        || error.status >= 500 || ['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMITED', 'UPSTREAM_ERROR',
          'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND'].includes(error.code)
      // A short negative cache protects the provider during outages. Invalid
      // content/configuration is not cached, so fixing it takes effect at once.
      if (transient) await cacheService.set(cacheKey, result, 20)
      return result
    } finally {
      await release()
    }
  })()
  learningPathRequests.set(cacheKey, request)
  try {
    return structuredClone(await request)
  } finally {
    learningPathRequests.delete(cacheKey)
  }
}
