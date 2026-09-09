import { getConfigValue } from './ai.service.js'
import cacheService from './cache.service.js'

/**
 * AI-powered recommendation service for personalized learning paths and daily quests.
 * Uses Groq/Llama to generate vocabulary recommendations based on student profile.
 */

/**
 * Generate personalized learning set recommendation using AI
 * @param {Object} student - User document with learningProfile
 * @param {Array} recentWords - Recent vocabulary words learned
 * @param {Array} weakWords - Words with low mastery scores
 * @param {Number} count - Number of words to recommend (default 10)
 * @returns {Promise<Array>} Array of recommended word objects
 */
export async function generateAILearningSetRecommendation(student, recentWords = [], weakWords = [], count = 10) {
  try {
    const Groq = (await import('groq-sdk')).default
    const apiKey = await getConfigValue('GROQ_API_KEY', process.env.GROQ_API_KEY)
    if (!apiKey || apiKey.startsWith('gsk_dummy_prefix_000000000000')) {
      throw new Error('Groq API key is not configured')
    }

    const groq = new Groq({ apiKey })
    const activeModel = await getConfigValue('DEFAULT_AI_MODEL', 'llama-3.3-70b-versatile')

    const level = student.learningProfile?.targetLevel || 'B1'
    const interests = student.learningProfile?.interests || ['general']
    const recentWordsList = recentWords.slice(0, 20).map(w => w.word).join(', ')
    const weakWordsList = weakWords.slice(0, 10).map(w => w.word).join(', ')

    const cacheKey = cacheService.hashKey('ai_rec:learn_set', {
      level,
      interests,
      recentWordsList,
      weakWordsList,
      count,
    })

    const cached = await cacheService.get(cacheKey)
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached
    }

    const prompt = `You are an expert English vocabulary tutor for the LexiGrow platform. Generate ${count} personalized vocabulary words for a student.

Student Profile:
- Target Level: ${level} (CEFR: A2, B1, B2, C1)
- Interests: ${interests.join(', ')}
- Recent words learned: ${recentWordsList || 'None'}
- Words needing improvement: ${weakWordsList || 'None'}

For each word, provide:
1. The word itself (English)
2. A clear definition in English (for the clue)
3. A Vietnamese translation (for Vietnamese learners)
4. An example sentence using the word
5. The CEFR level of the word (A2, B1, B2, C1)
6. The category/theme (match one of the student's interests if possible)

Return a JSON object with a key "words" containing an array of objects, each with:
{
  "word": "example",
  "definition": "A representative instance or illustration",
  "translation": "Ví dụ",
  "exampleSentence": "This is an example of how to use the word.",
  "cefr": "B1",
  "category": "education"
}

Important:
- Choose words appropriate for the student's CEFR level (slightly challenging but achievable)
- Vary parts of speech (nouns, verbs, adjectives, adverbs)
- Include some words related to the student's interests
- Avoid words the student has recently learned (given in recent words)
- Focus on words that would help the student improve (based on weak words)

Return ONLY valid JSON, no markdown formatting.`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a vocabulary recommendation AI. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      model: activeModel,
      response_format: { type: 'json_object' }
    })

    const responseText = chatCompletion.choices[0].message.content
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const result = JSON.parse(jsonStr)
    const words = result.words || []
    if (words.length > 0) {
      await cacheService.set(cacheKey, words, 3600) // 1 hour TTL
    }
    return words
  } catch (error) {
    console.error('AI Learning Set Recommendation Error:', error.message)
    // Return empty array on failure - fallback to rule-based
    return []
  }
}

/**
 * Generate personalized daily quest words using AI
 * @param {Object} student - User document with learningProfile
 * @param {Array} recentWords - Recent vocabulary words
 * @param {Array} dueWords - Words due for review
 * @param {Number} count - Number of words to include (default 6)
 * @param {String} seed - Seed for deterministic selection
 * @returns {Promise<Array>} Array of word objects for crossword
 */
export async function generateAIDailyQuestWords(student, recentWords = [], dueWords = [], count = 6, seed = '') {
  try {
    const Groq = (await import('groq-sdk')).default
    const apiKey = await getConfigValue('GROQ_API_KEY', process.env.GROQ_API_KEY)
    if (!apiKey || apiKey.startsWith('gsk_dummy_prefix_000000000000')) {
      throw new Error('Groq API key is not configured')
    }

    const groq = new Groq({ apiKey })
    const activeModel = await getConfigValue('DEFAULT_AI_MODEL', 'llama-3.3-70b-versatile')

    const level = student.learningProfile?.targetLevel || 'B1'
    const interests = student.learningProfile?.interests || ['general']
    const recentWordsList = recentWords.slice(0, 15).map(w => w.word).join(', ')
    const dueWordsList = dueWords.slice(0, 10).map(w => w.word).join(', ')

    const cacheKey = cacheService.hashKey('ai_rec:daily_quest', {
      level,
      interests,
      recentWordsList,
      dueWordsList,
      count,
      seed,
    })

    const cached = await cacheService.get(cacheKey)
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached
    }

    const prompt = `You are an expert English vocabulary tutor for LexiGrow's Daily Word Quest. Generate ${count} vocabulary words for today's crossword puzzle.

Student Profile:
- Target Level: ${level} (CEFR)
- Interests: ${interests.join(', ')}
- Words due for review: ${dueWordsList || 'None'}
- Recently learned: ${recentWordsList || 'None'}

For each word, provide:
1. The word itself (English, 3-10 letters)
2. A clear definition in English (for the clue)
3. A Vietnamese translation (for Vietnamese learners)
4. An example sentence showing the word in context

Return a JSON object with a key "words" containing an array of objects, each with:
{
  "word": "garden",
  "definition": "A place where flowers and vegetables grow",
  "translation": "Khu vườn",
  "exampleSentence": "We grow flowers in the garden."
}

Important:
- Mix of difficulty levels appropriate for the student's CEFR level
- Include a mix of words: some due for review, some new, some from interests
- Words should be 3-10 letters long (suitable for crossword)
- Prioritize words the student needs to review (dueWords) when possible
- Make it varied and engaging

Return ONLY valid JSON, no markdown formatting.`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a vocabulary recommendation AI for daily crossword puzzles. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      model: activeModel,
      response_format: { type: 'json_object' }
    })

    const responseText = chatCompletion.choices[0].message.content
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const result = JSON.parse(jsonStr)
    const words = result.words || []
    if (words.length > 0) {
      await cacheService.set(cacheKey, words, 3600) // 1 hour TTL
    }
    return words
  } catch (error) {
    console.error('AI Daily Quest Generation Error:', error.message)
    return []
  }
}

/**
 * Get personalized learning path recommendations
 * @param {Object} student - User document
 * @param {Object} options - Options for recommendation
 * @returns {Promise<Object>} Recommendations
 */
export async function getPersonalizedLearningPath(student, options = {}) {
  try {
    // Gather student data
    const recentWords = options.recentWords || []
    const weakWords = options.weakWords || []
    const completedSessions = options.completedSessions || 0

    const Groq = (await import('groq-sdk')).default
    const apiKey = await getConfigValue('GROQ_API_KEY', process.env.GROQ_API_KEY)
    if (!apiKey || apiKey.startsWith('gsk_dummy_prefix_000000000000')) {
      throw new Error('Groq API key is not configured')
    }

    const groq = new Groq({ apiKey })
    const activeModel = await getConfigValue('DEFAULT_AI_MODEL', 'llama-3.3-70b-versatile')

    const level = student.learningProfile?.targetLevel || 'B1'
    const interests = student.learningProfile?.interests || ['general']

    const prompt = `You are an expert learning path advisor for LexiGrow. Analyze the student's learning data and provide a personalized learning path recommendation.

Student Profile:
- Target Level: ${level} (CEFR)
- Interests: ${interests.join(', ')}
- Completed Sessions: ${completedSessions}
- Recent Words: ${recentWords.slice(0, 10).map(w => w.word).join(', ') || 'None'}
- Weak Words: ${weakWords.slice(0, 5).map(w => w.word).join(', ') || 'None'}

Return a JSON object with:
{
  "recommendedLevel": "B1", // Suggested CEFR level to focus on
  "focusAreas": ["vocabulary", "grammar", "writing"], // Areas to focus
  "suggestedTopics": ["technology", "environment", "business"], // Topics to study
  "dailyGoalMinutes": 15, // Recommended daily study time
  "nextMilestone": "Complete 5 more vocabulary sessions to reach B2 level", // Motivational milestone
  "learningPlan": "A brief paragraph describing the personalized learning path"
}

Return ONLY valid JSON, no markdown formatting.`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a learning path advisor AI. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      model: activeModel,
      response_format: { type: 'json_object' }
    })

    const responseText = chatCompletion.choices[0].message.content
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('AI Learning Path Recommendation Error:', error.message)
    return {
      recommendedLevel: student.learningProfile?.targetLevel || 'B1',
      focusAreas: ['vocabulary'],
      suggestedTopics: student.learningProfile?.interests || ['general'],
      dailyGoalMinutes: 15,
      nextMilestone: 'Continue your learning journey!',
      learningPlan: 'Continue building vocabulary through daily quests and learning sessions.'
    }
  }
}

export default {
  generateAILearningSetRecommendation,
  generateAIDailyQuestWords,
  getPersonalizedLearningPath
}