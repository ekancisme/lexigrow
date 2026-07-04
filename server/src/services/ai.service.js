/* global process */
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import AIAnalysis from '../models/AIAnalysis.js'
import Vocabulary from '../models/Vocabulary.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Run spaCy Python NLP script on text
 */
export const runNLPAnalysis = (text) => {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(__dirname, '../utils/nlp_processor.py')
    const pythonProcess = spawn('python', [scriptPath])
    
    let stdoutData = ''
    let stderrData = ''
    
    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString()
    })
    
    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python NLP script failed with code ${code}. Stderr: ${stderrData}`)
        return resolve(null)
      }
      try {
        const result = JSON.parse(stdoutData.trim())
        resolve(result)
      } catch (err) {
        console.error('Failed to parse Python script output:', err.message, 'Output was:', stdoutData)
        resolve(null)
      }
    })
    
    pythonProcess.stdin.write(text)
    pythonProcess.stdin.end()
  })
}

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
    const Groq = (await import('groq-sdk')).default
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey.startsWith('gsk_dummy_prefix_000000000000')) {
      throw new Error('Groq API key is not configured or is the default placeholder')
    }

    const groq = new Groq({ apiKey })

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `ESSAY TO ANALYZE:\n\n${essayContent}` }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    })

    const responseText = chatCompletion.choices[0].message.content

    // Extract JSON from response (handle markdown code blocks if any)
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const analysis = JSON.parse(jsonStr)
    return analysis
  } catch (error) {
    console.error('AI Analysis Error (Groq):', error.message)

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

  const commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 
    'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 
    'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 
    'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 
    'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 
    'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 
    'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 
    'am', 'are', 'was', 'were', 'been', 'has', 'had', 'did', 'does', 'done', 'went', 'gone', 'here', 'very', 
    'many', 'much', 'some', 'any', 'every', 'each', 'other', 'another', 'such', 'same', 'both', 'few', 'little',
    'more', 'most', 'all', 'both', 'either', 'neither', 'own', 'other', 'another', 'such', 'platforms', 'allows',
    'provide', 'browse'
  ])

  const newWords = Array.from(uniqueWords).filter(w => w.length >= 6 && !commonWords.has(w)).slice(0, 10)

  return {
    overallScore: Math.min(10, Math.round(ttr * 10 + 2)),
    scores: {
      vocabularyDiversity: ttr,
      grammarAccuracy: 6.0,
      coherence: 5.5,
      complexityIndex: Math.min(10, Math.round(totalWords / 100)),
    },
    newWordsDetected: newWords,
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

export const processEssayAnalysis = async (essayId, studentId, essayContent, customPrompt) => {
  const Essay = (await import('../models/Essay.js')).default
  const essayDoc = await Essay.findById(essayId)
  const essayTheme = essayDoc?.theme || 'General'

  // Run both Gemini AI and spaCy Python NLP analysis concurrently
  const [analysisData, nlpData] = await Promise.all([
    analyzeEssay(essayContent, customPrompt),
    runNLPAnalysis(essayContent)
  ])

  const nlpStats = nlpData ? {
    passiveVoiceCount: nlpData.passiveVoiceCount || 0,
    subordinateClausesCount: nlpData.subordinateClausesCount || 0,
    repeatedWords: nlpData.repeatedWords || []
  } : undefined

  // Save or update AIAnalysis document
  const analysis = await AIAnalysis.findOneAndUpdate(
    { essay: essayId },
    {
      essay: essayId,
      overallScore: analysisData.overallScore,
      scores: analysisData.scores,
      newWordsDetected: analysisData.newWordsDetected || [],
      suggestions: analysisData.suggestions || [],
      writingStats: {
        ...analysisData.writingStats,
        uniqueWords: nlpData ? nlpData.uniqueWordCount : (analysisData.writingStats?.uniqueWords || 0)
      },
      nlpStats
    },
    { upsert: true, new: true, runValidators: true }
  )

  // Save new words to vocabulary
  if (analysisData.newWordsDetected && analysisData.newWordsDetected.length > 0) {
    const lowerWords = analysisData.newWordsDetected.map(word => word.toLowerCase())
    
    try {
      // Find existing vocabulary words to avoid duplicate AI requests
      const existingVocab = await Vocabulary.find({
        student: studentId,
        word: { $in: lowerWords }
      }).select('word')
      
      const existingWordsSet = new Set(existingVocab.map(v => v.word))
      const wordsToEnrich = lowerWords.filter(w => !existingWordsSet.has(w))

      let enrichedMap = new Map()
      if (wordsToEnrich.length > 0) {
        const enrichedList = await enrichWordsList(wordsToEnrich, essayContent)
        enrichedList.forEach(item => {
          if (item && item.word) {
            enrichedMap.set(item.word.toLowerCase(), item)
          }
        })
      }

      const vocabOps = lowerWords.map(word => {
        const enriched = enrichedMap.get(word) || {}
        return {
          updateOne: {
            filter: { student: studentId, word: word },
            update: {
              $setOnInsert: {
                word: word,
                student: studentId,
                detectedInEssay: essayId,
                category: categorizeWord(word),
                theme: essayTheme,
                masteryLevel: 'new',
                ipa: enriched.ipa || '',
                partOfSpeech: enriched.partOfSpeech || '',
                definition: enriched.definition || '',
                exampleSentence: enriched.exampleSentence || '',
                synonyms: enriched.synonyms || [],
                antonyms: enriched.antonyms || [],
              },
            },
            upsert: true,
          },
        }
      })

      await Vocabulary.bulkWrite(vocabOps)
    } catch (err) {
      console.error('Error enriching words in processEssayAnalysis:', err)
    }
  }

  // Update essay status to reviewed so the client stops polling and displays the analysis
  if (essayDoc) {
    essayDoc.status = 'reviewed'
    await essayDoc.save()
  }

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

/**
 * Generate 4 essay topics by theme using Gemini AI
 */
export const generateTopicsByTheme = async (theme, excludeTopics = []) => {
  try {
    const Groq = (await import('groq-sdk')).default
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey.startsWith('gsk_dummy_prefix_000000000000')) {
      throw new Error('Groq API key is not configured or is the default placeholder')
    }

    const groq = new Groq({ apiKey })

    const exclusionInstruction = excludeTopics && excludeTopics.length > 0
      ? `\nCRITICAL: Do NOT suggest any topics that are identical or highly similar to these existing topics already written by the student: ${JSON.stringify(excludeTopics)}.`
      : ''

    const prompt = `You are an English writing tutor. Suggest exactly 4 interesting, specific essay topics/prompts for the theme/subject area: "${theme}".${exclusionInstruction}
Return a JSON object with a key "topics" containing the list of 4 topics, for example:
{
  "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"]
}`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    })

    const responseText = chatCompletion.choices[0].message.content
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }
    
    const responseObj = JSON.parse(jsonStr)
    if (responseObj && Array.isArray(responseObj.topics)) {
      return responseObj.topics
    }
    if (Array.isArray(responseObj)) {
      return responseObj
    }
    return Object.values(responseObj)[0] || []
  } catch (error) {
    console.error('AI Topic Generation Error (Groq):', error.message)
    // Fallback topics if AI fails
    const defaultTopics = [
      `The role of ${theme} in modern society`,
      `How ${theme} is changing the way we live`,
      `The future prospects of ${theme}`,
      `Key challenges and opportunities in ${theme}`
    ]
    // Filter fallback topics if any matches exclusions
    return defaultTopics.filter(t => !excludeTopics.some(e => e.toLowerCase() === t.toLowerCase()))
  }
}

/**
 * Enrich a list of vocabulary words using Groq/Llama AI.
 * Returns an array of objects containing ipa, partOfSpeech, definition, exampleSentence, synonyms, antonyms.
 */
export const enrichWordsList = async (words, contextText = '') => {
  if (!words || words.length === 0) return []

  try {
    const Groq = (await import('groq-sdk')).default
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey.startsWith('gsk_dummy_prefix_000000000000')) {
      throw new Error('Groq API key is not configured or is the default placeholder')
    }

    const groq = new Groq({ apiKey })

    const prompt = `You are a professional lexicographer and English dictionary AI. 
For each word in the list below, generate its phonetic pronunciation in IPA format, grammatical part of speech, a clear definition in English, an example sentence, a list of up to 4 synonyms, and a list of up to 4 antonyms.

If the user provides context, try to adapt the example sentence so that it fits or refers to the provided context.

Return a JSON object containing a single key "enrichedWords" which is an array of objects. Each object must have EXACTLY this structure:
{
  "word": "<the word, lowercase>",
  "ipa": "<IPA phonetic spelling, e.g. /hʌɪˈpɒθɪsɪs/>",
  "partOfSpeech": "<Noun | Verb | Adjective | Adverb | etc.>",
  "definition": "<simple English definition>",
  "exampleSentence": "<example sentence using the word>",
  "synonyms": ["<synonym1>", "<synonym2>", ...],
  "antonyms": ["<antonym1>", "<antonym2>", ...]
}

Return ONLY valid JSON, no markdown formatting.

Word List:
${words.join(', ')}
${contextText ? `\nContext (from essay):\n"${contextText}"` : ''}`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    })

    const responseText = chatCompletion.choices[0].message.content
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const result = JSON.parse(jsonStr)
    return result.enrichedWords || []
  } catch (error) {
    console.error('AI Vocab Enrichment Error (Groq):', error.message)
    // Fallback dictionary values if AI fails
    return words.map(w => ({
      word: w.toLowerCase(),
      ipa: '',
      partOfSpeech: 'Unknown',
      definition: 'AI lookup was unavailable. Please try again later.',
      exampleSentence: '',
      synonyms: [],
      antonyms: []
    }))
  }
}

/**
 * Translate a block of text into Vietnamese using Groq
 */
export const translateTextToVietnamese = async (text) => {
  if (!text || !text.trim()) return ''

  try {
    const Groq = (await import('groq-sdk')).default
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey.startsWith('gsk_dummy_prefix_000000000000')) {
      throw new Error('Groq API key is not configured or is the default placeholder')
    }

    const groq = new Groq({ apiKey })

    const prompt = `You are a professional English to Vietnamese translator. 
Translate the following English text to natural, accurate Vietnamese. 
Return a JSON object containing a single key "translation", for example:
{
  "translation": "<Vietnamese translation here>"
}

Return ONLY valid JSON, no markdown formatting.

Text to translate:
"${text}"`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    })

    const responseText = chatCompletion.choices[0].message.content
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const responseObj = JSON.parse(jsonStr)
    return responseObj.translation || ''
  } catch (error) {
    console.error('AI Translation Error:', error.message)
    return `[Lỗi dịch: ${error.message}]`
  }
}


