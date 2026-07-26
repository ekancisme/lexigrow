/* global process */
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import AIAnalysis from '../models/AIAnalysis.js'
import Vocabulary from '../models/Vocabulary.js'
import Config from '../models/Config.js'
import AILog from '../models/AILog.js'

/**
 * Retrieve configuration value from database
 */
const getConfigValue = async (key, defaultValue) => {
  try {
    const config = await Config.findOne({ key })
    return config ? config.value : defaultValue
  } catch (err) {
    console.error(`Error fetching config key ${key}:`, err.message)
    return defaultValue
  }
}

/**
 * Log AI service calls
 */
const logAICall = async ({ model, action, duration, status, usage, errorMessage }) => {
  try {
    const promptTokens = usage?.prompt_tokens || usage?.promptTokens || 0
    const completionTokens = usage?.completion_tokens || usage?.completionTokens || 0
    const totalTokens = usage?.total_tokens || usage?.totalTokens || 0
    
    let costEstimate = 0
    if (status === 'success') {
      if (model && model.includes('70b')) {
        costEstimate = (promptTokens * 0.59 / 1000000) + (completionTokens * 0.79 / 1000000)
      } else {
        costEstimate = (totalTokens * 0.20 / 1000000)
      }
    }

    await AILog.create({
      model: model || 'unknown',
      action,
      tokensUsed: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
      processingTimeMs: duration,
      status,
      errorMessage,
      costEstimate,
    })
  } catch (err) {
    console.error('Failed to save AI log:', err.message)
  }
}

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
export const DEFAULT_ANALYSIS_PROMPT = `You are an advanced English writing analysis AI for the LexiGrow platform.
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
  },
  "learningPatterns": {
    "paddedSentences": <true | false>,
    "plagiarismDetected": <true | false>,
    "learningStatus": "progressing" | "plateau" | "regression" | "stable",
    "feedback": "<detailed English feedback explaining word padding, copy-paste flags, and learning status trajectory compared to past history>"
  },
  "nextEssaySuggestions": {
    "transitionWords": [<array of 3-5 advanced transition words/phrases recommended to connect ideas in their next essay, e.g. "On the other hand", "Furthermore", "Consequently">],
    "sentenceStructures": [<array of 2-3 sentence structures/patterns they should try next, e.g. "Relative clauses", "Conditional sentences (Type 3)", "Inversion">],
    "generalTips": "<detailed English tips/advice on how they can improve cohesive flow and grammatical variety in their next essay>"
  }
}

Rules:
- vocabularyDiversity (TTR) = unique words / total words, rounded to 2 decimal places
- newWordsDetected should include academic, technical, or B2+ level words
- Provide at least 2 strengths and 2 improvements in suggestions
- For learningPatterns:
  * paddedSentences: set to true if the student repeats synonyms or writes long, repetitive, meaningless sentences to inflate word count.
  * plagiarismDetected: set to true if there is a high likelihood of plagiarism or copy-pasting (unnatural flow transitions, vocabulary far exceeding typical student level, or rigid structures).
  * learningStatus: Compare current essay performance with the student's past performance history (if provided in the user request). Choose "progressing" if scores/vocabulary have improved, "plateau" if there is no significant change over time, "regression" if there is a decrease, or "stable" if they remain consistent at a high level.
  * feedback: Write a detailed summary in English explaining the findings for these patterns.
- Return ONLY valid JSON, no markdown formatting`

/**
 * Analyze essay using Gemini AI
 */
export const analyzeEssay = async (essayContent, customPrompt, pastScoresSummary = '') => {
  const defaultPrompt = await getConfigValue('SYSTEM_ANALYSIS_PROMPT', DEFAULT_ANALYSIS_PROMPT)
  const activeModel = await getConfigValue('DEFAULT_AI_MODEL', 'llama-3.3-70b-versatile')
  const apiKey = await getConfigValue('GROQ_API_KEY', process.env.GROQ_API_KEY)

  /**
   * Hybrid Prompt Strategy:
   * - If teacher has a custom prompt: inject it as "TEACHER'S ADDITIONAL INSTRUCTIONS"
   *   BEFORE the JSON format rules in the default prompt.
   *   This preserves the required output JSON structure while allowing
   *   teacher to customize tone, focus areas, scoring emphasis, etc.
   * - If no custom prompt: use the default prompt as-is.
   *
   * Example result when teacher has custom prompt:
   *   [Default base instructions about being an AI analyzer...]
   *   TEACHER'S ADDITIONAL INSTRUCTIONS FOR THIS CLASS:
   *   [Teacher's text...]
   *   [Default JSON format rules...]
   */
  let prompt
  if (customPrompt && customPrompt.trim()) {
    // Split default prompt into "intro" and "Rules/JSON section"
    // We inject teacher instructions right before the "Rules:" section
    const rulesIndex = defaultPrompt.indexOf('\nRules:')
    if (rulesIndex !== -1) {
      const introPart = defaultPrompt.slice(0, rulesIndex)
      const rulesPart = defaultPrompt.slice(rulesIndex)
      prompt = `${introPart}\n\n--- TEACHER'S ADDITIONAL INSTRUCTIONS FOR THIS CLASS ---\n${customPrompt.trim()}\n--- END OF TEACHER INSTRUCTIONS ---${rulesPart}`
    } else {
      // Fallback: append teacher instructions before the end
      prompt = `${defaultPrompt}\n\n--- TEACHER'S ADDITIONAL INSTRUCTIONS FOR THIS CLASS ---\n${customPrompt.trim()}`
    }
  } else {
    prompt = defaultPrompt
  }


  const startTime = Date.now()
  let usage = null

  try {
    const Groq = (await import('groq-sdk')).default
    if (!apiKey || apiKey.startsWith('gsk_dummy_prefix_000000000000')) {
      throw new Error('Groq API key is not configured or is the default placeholder')
    }

    const groq = new Groq({ apiKey })

    const userMessageContent = `ESSAY TO ANALYZE:\n\n${essayContent}${pastScoresSummary ? `\n\nSTUDENT'S HISTORICAL PERFORMANCE SCORES:\n${pastScoresSummary}` : ''}`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userMessageContent }
      ],
      model: activeModel,
      response_format: { type: 'json_object' }
    })

    usage = chatCompletion.usage
    const responseText = chatCompletion.choices[0].message.content

    // Extract JSON from response (handle markdown code blocks if any)
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const analysis = JSON.parse(jsonStr)

    await logAICall({
      model: activeModel,
      action: 'essay_analysis',
      duration: Date.now() - startTime,
      status: 'success',
      usage
    })

    return analysis
  } catch (error) {
    console.error('AI Analysis Error (Groq):', error.message)

    await logAICall({
      model: activeModel,
      action: 'essay_analysis',
      duration: Date.now() - startTime,
      status: 'failure',
      errorMessage: error.message
    })

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
  const divStats = calculateLexicalDiversity(content)

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
    overallScore: Math.min(10, Math.round(divStats.ttr * 10 + 2)),
    scores: {
      vocabularyDiversity: divStats.ttr,
      lexicalDiversityHdd: divStats.hdd,
      lexicalDiversityMtld: divStats.mtld,
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
    learningPatterns: {
      paddedSentences: false,
      plagiarismDetected: false,
      learningStatus: 'stable',
      feedback: 'The learning pattern detection system is running in fallback mode. The learning patterns are evaluated as stable.'
    },
    nextEssaySuggestions: {
      transitionWords: ['Therefore', 'Moreover', 'In addition', 'However'],
      sentenceStructures: ['Relative clauses', 'Conditional sentence (Type 2)', 'Passive voice variation'],
      generalTips: 'Practice connecting your ideas with diverse transition words and experimenting with complex sentence structures.'
    }
  }
}

/**
 * Generate advanced synonym suggestions for a list of repeated words using Groq AI
 */
export const generateSynonymsForRepeatedWords = async (repeatedWordsList, essayContent) => {
  if (!repeatedWordsList || repeatedWordsList.length === 0) return {}

  const activeModel = await getConfigValue('DEFAULT_AI_MODEL', 'llama-3.3-70b-versatile')
  const apiKey = await getConfigValue('GROQ_API_KEY', process.env.GROQ_API_KEY)
  const startTime = Date.now()
  let usage = null

  try {
    const Groq = (await import('groq-sdk')).default
    if (!apiKey || apiKey.startsWith('gsk_dummy_prefix_000000000000')) {
      throw new Error('Groq API key is not configured or is the default placeholder')
    }

    const groq = new Groq({ apiKey })

    const prompt = `You are an expert English writing tutor. The student's essay contains the following overused/repeated words: ${repeatedWordsList.join(', ')}.
Analyze the essay context:
"${essayContent}"

For each repeated word, suggest 3-5 advanced, higher-level vocabulary words (synonyms) that can replace it in the context of the essay to improve lexical diversity.
Return a JSON object where the keys are the original lowercase repeated words, and the values are arrays of advanced replacement suggestions (strings).
Example format:
{
  "very": ["extremely", "exceptionally", "profoundly"],
  "good": ["superb", "excellent", "exemplary"]
}

Return ONLY valid JSON, no markdown formatting.`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'user', content: prompt }
      ],
      model: activeModel,
      response_format: { type: 'json_object' }
    })

    usage = chatCompletion.usage
    const responseText = chatCompletion.choices[0].message.content
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const result = JSON.parse(jsonStr)

    await logAICall({
      model: activeModel,
      action: 'synonym_generation',
      duration: Date.now() - startTime,
      status: 'success',
      usage
    })

    return result
  } catch (error) {
    console.error('Error generating synonyms for repeated words:', error.message)

    await logAICall({
      model: activeModel,
      action: 'synonym_generation',
      duration: Date.now() - startTime,
      status: 'failure',
      errorMessage: error.message
    })
    // Fallback static list of common overused words and synonyms
    const fallbacks = {
      'very': ['extremely', 'exceptionally', 'profoundly', 'exceedingly'],
      'good': ['excellent', 'superb', 'exemplary', 'commendable', 'outstanding'],
      'bad': ['detrimental', 'adverse', 'deplorable', 'unsatisfactory', 'dreadful'],
      'happy': ['elated', 'ecstatic', 'jubilant', 'delighted', 'cheerful'],
      'sad': ['melancholy', 'desolate', 'gloomy', 'dejected', 'sorrowful'],
      'nice': ['pleasant', 'amiable', 'delightful', 'courteous', 'gracious'],
      'like': ['appreciate', 'admire', 'favor', 'cherish', 'esteem'],
      'get': ['obtain', 'acquire', 'procure', 'attain', 'derive'],
      'make': ['construct', 'create', 'generate', 'formulate', 'establish'],
      'think': ['believe', 'consider', 'deem', 'postulate', 'deliberate'],
      'so': ['consequently', 'therefore', 'thus', 'accordingly', 'hence'],
      'really': ['genuinely', 'indeed', 'veritably', 'undeniably', 'sincerely'],
      'great': ['magnificent', 'wonderful', 'prominent', 'significant', 'extraordinary'],
      'many': ['numerous', 'copious', 'abundant', 'myriad', 'plentiful'],
      'much': ['substantial', 'considerable', 'significant', 'abundant'],
      'more': ['additional', 'furthermore', 'supplementary'],
      'always': ['constantly', 'consistently', 'perpetually', 'invariably'],
      'never': ['at no point', 'by no means', 'under no circumstances']
    }
    
    const result = {}
    repeatedWordsList.forEach(w => {
      const lower = w.toLowerCase()
      result[lower] = fallbacks[lower] || ['alternative_synonym_1', 'alternative_synonym_2']
    })
    return result
  }
}

export const processEssayAnalysis = async (essayId, studentId, essayContent, customPrompt, promptMeta = null) => {
  const Essay = (await import('../models/Essay.js')).default
  const essayDoc = await Essay.findById(essayId)
  const essayTheme = essayDoc?.theme || 'General'

  // Fetch student's past reviewed essay analyses to detect learning patterns/trajectories
  let pastScoresSummary = ''
  try {
    const studentEssays = await Essay.find({ student: studentId, _id: { $ne: essayId } }).select('_id')
    const pastAnalyses = await AIAnalysis.find({ essay: { $in: studentEssays } })
      .sort({ createdAt: -1 })
      .limit(4)
    
    if (pastAnalyses.length > 0) {
      pastScoresSummary = pastAnalyses.map((a, idx) => 
        `Essay #${idx + 1}: Overall Score ${a.overallScore}/10, Grammar Accuracy ${a.scores?.grammarAccuracy || 'N/A'}/10, Vocabulary Diversity TTR ${a.scores?.vocabularyDiversity || 'N/A'}/1.0`
      ).join('\n')
    }
  } catch (err) {
    console.error('Error fetching past analyses for pattern detection:', err.message)
  }

  // Run both Gemini AI and spaCy Python NLP analysis concurrently
  const [analysisData, nlpData] = await Promise.all([
    analyzeEssay(essayContent, customPrompt, pastScoresSummary),
    runNLPAnalysis(essayContent)
  ])

  let nlpStats;
  if (nlpData) {
    nlpStats = {
      passiveVoiceCount: nlpData.passiveVoiceCount || 0,
      subordinateClausesCount: nlpData.subordinateClausesCount || 0,
      repeatedWords: nlpData.repeatedWords || []
    }
  } else {
    // JavaScript fallback for NLP statistics (especially repeated words) when Python/spaCy is unavailable
    const words = essayContent.toLowerCase().match(/[a-z']+/g) || []
    const wordCount = words.length
    
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 
      'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 
      'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 
      'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 
      'year', 'your', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 
      'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 
      'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 
      'am', 'are', 'was', 'were', 'been', 'has', 'had', 'did', 'does', 'done', 'went', 'gone', 'here',
      'another', 'such', 'same', 'both', 'either', 'neither', 'own'
    ])
    
    const allowedStops = new Set([
      'very', 'really', 'so', 'good', 'great', 'many', 'much', 'more', 'most', 'always', 'never', 'often', 'sometimes'
    ])
    
    const wordFreqs = {}
    words.forEach(w => {
      if (w.length >= 3 && (!stopWords.has(w) || allowedStops.has(w))) {
        wordFreqs[w] = (wordFreqs[w] || 0) + 1
      }
    })
    
    const repeatedWords = []
    Object.keys(wordFreqs).forEach(w => {
      const count = wordFreqs[w]
      const percentage = (count / wordCount) * 100
      if (count >= 4 && percentage >= 1.5) {
        repeatedWords.push({ word: w, count })
      }
    })
    
    repeatedWords.sort((a, b) => b.count - a.count)
    
    const passiveRegex = /\b(am|is|are|was|were|be|been|being)\s+(?:[a-z]+ly\s+)?(written|done|taken|seen|known|made|met|built|chosen|drawn|driven|eaten|fallen|given|grown|held|kept|lost|paid|sent|shown|told|understood|worn|[a-z]+ed)\b/gi
    const passiveVoiceCount = (essayContent.match(passiveRegex) || []).length

    const subordinateRegex = /\b(although|because|since|unless|while|whereas|if|though)\b/gi
    const subordinateClausesCount = (essayContent.match(subordinateRegex) || []).length

    nlpStats = {
      passiveVoiceCount,
      subordinateClausesCount,
      repeatedWords
    }
  }

  const lexicalDiversity = (nlpData && nlpData.lexicalDiversity)
    ? nlpData.lexicalDiversity
    : calculateLexicalDiversity(essayContent)

  // Generate advanced suggestions and synonyms for repeated words if any exist
  if (nlpStats && nlpStats.repeatedWords && nlpStats.repeatedWords.length > 0) {
    try {
      const repeatedWordsList = nlpStats.repeatedWords.map(item => item.word)
      const synonymsMap = await getSynonymsForRepeatedWords(repeatedWordsList, essayContent)
      nlpStats.repeatedWords = nlpStats.repeatedWords.map(item => {
        const lowerWord = item.word.toLowerCase()
        const wordSynonyms = synonymsMap[lowerWord] || synonymsMap[item.word] || []
        return {
          word: item.word,
          count: item.count,
          suggestions: wordSynonyms,
          synonyms: wordSynonyms
        }
      })
    } catch (err) {
      console.error('Failed to populate synonym suggestions for repeated words:', err.message)
    }
  }

  // Save or update AIAnalysis document
  const analysis = await AIAnalysis.findOneAndUpdate(
    { essay: essayId },
    {
      essay: essayId,
      overallScore: analysisData.overallScore,
      scores: {
        ...analysisData.scores,
        vocabularyDiversity: lexicalDiversity.ttr,
        lexicalDiversityHdd: lexicalDiversity.hdd,
        lexicalDiversityMtld: lexicalDiversity.mtld
      },
      newWordsDetected: analysisData.newWordsDetected || [],
      suggestions: analysisData.suggestions || [],
      writingStats: {
        ...analysisData.writingStats,
        uniqueWords: nlpData ? nlpData.uniqueWordCount : (analysisData.writingStats?.uniqueWords || 0)
      },
      nlpStats,
      learningPatterns: analysisData.learningPatterns || {
        paddedSentences: false,
        plagiarismDetected: false,
        learningStatus: 'stable',
        feedback: 'Insufficient historical data to analyze detailed progress trajectory.'
      },
      nextEssaySuggestions: analysisData.nextEssaySuggestions || {
        transitionWords: ['Therefore', 'Moreover', 'In addition', 'However'],
        sentenceStructures: ['Relative clauses', 'Conditional sentence (Type 2)', 'Passive voice variation'],
        generalTips: 'Practice connecting your ideas with diverse transition words and experimenting with complex sentence structures.'
      },
      // Track which prompt was used for this analysis
      promptUsed: promptMeta
        ? { name: promptMeta.name, promptId: promptMeta.promptId, isCustom: true }
        : { name: 'Default System Prompt', promptId: null, isCustom: false },
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
  const activeModel = await getConfigValue('DEFAULT_AI_MODEL', 'llama-3.3-70b-versatile')
  const apiKey = await getConfigValue('GROQ_API_KEY', process.env.GROQ_API_KEY)
  const startTime = Date.now()
  let usage = null

  try {
    const Groq = (await import('groq-sdk')).default
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
      model: activeModel,
      response_format: { type: 'json_object' }
    })

    usage = chatCompletion.usage
    const responseText = chatCompletion.choices[0].message.content
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }
    
    const responseObj = JSON.parse(jsonStr)

    await logAICall({
      model: activeModel,
      action: 'topic_generation',
      duration: Date.now() - startTime,
      status: 'success',
      usage
    })

    if (responseObj && Array.isArray(responseObj.topics)) {
      return responseObj.topics
    }
    if (Array.isArray(responseObj)) {
      return responseObj
    }
    return Object.values(responseObj)[0] || []
  } catch (error) {
    console.error('AI Topic Generation Error (Groq):', error.message)

    await logAICall({
      model: activeModel,
      action: 'topic_generation',
      duration: Date.now() - startTime,
      status: 'failure',
      errorMessage: error.message
    })
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

  const activeModel = await getConfigValue('DEFAULT_AI_MODEL', 'llama-3.3-70b-versatile')
  const apiKey = await getConfigValue('GROQ_API_KEY', process.env.GROQ_API_KEY)
  const startTime = Date.now()
  let usage = null

  try {
    const Groq = (await import('groq-sdk')).default
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
      model: activeModel,
      response_format: { type: 'json_object' }
    })

    usage = chatCompletion.usage
    const responseText = chatCompletion.choices[0].message.content
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const result = JSON.parse(jsonStr)

    await logAICall({
      model: activeModel,
      action: 'vocabulary_enrichment',
      duration: Date.now() - startTime,
      status: 'success',
      usage
    })

    return result.enrichedWords || []
  } catch (error) {
    console.error('AI Vocab Enrichment Error (Groq):', error.message)

    await logAICall({
      model: activeModel,
      action: 'vocabulary_enrichment',
      duration: Date.now() - startTime,
      status: 'failure',
      errorMessage: error.message
    })
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

  const activeModel = await getConfigValue('DEFAULT_AI_MODEL', 'llama-3.3-70b-versatile')
  const apiKey = await getConfigValue('GROQ_API_KEY', process.env.GROQ_API_KEY)
  const startTime = Date.now()
  let usage = null

  try {
    const Groq = (await import('groq-sdk')).default
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
      model: activeModel,
      response_format: { type: 'json_object' }
    })

    usage = chatCompletion.usage
    const responseText = chatCompletion.choices[0].message.content
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const responseObj = JSON.parse(jsonStr)

    await logAICall({
      model: activeModel,
      action: 'translation',
      duration: Date.now() - startTime,
      status: 'success',
      usage
    })

    return responseObj.translation || ''
  } catch (error) {
    console.error('AI Translation Error:', error.message)

    await logAICall({
      model: activeModel,
      action: 'translation',
      duration: Date.now() - startTime,
      status: 'failure',
      errorMessage: error.message
    })
    return `[Lỗi dịch: ${error.message}]`
  }
}

/**
 * Get synonyms for repeated words in context using Groq AI
 */
export const getSynonymsForRepeatedWords = async (words, essayContent) => {
  if (!words || words.length === 0) return {}

  const activeModel = await getConfigValue('DEFAULT_AI_MODEL', 'llama-3.3-70b-versatile')
  const apiKey = await getConfigValue('GROQ_API_KEY', process.env.GROQ_API_KEY)
  const startTime = Date.now()
  let usage = null

  try {
    const Groq = (await import('groq-sdk')).default
    if (!apiKey || apiKey.startsWith('gsk_dummy_prefix_000000000000')) {
      throw new Error('Groq API key is not configured or is the default placeholder')
    }

    const groq = new Groq({ apiKey })

    const prompt = `You are an English writing tutor. The student's essay contains some overused/repeated words.
For each repeated word in the list, provide 3 to 4 advanced/alternative synonyms that fit the context of the essay.
Return a JSON object containing a key "synonymsMap" where keys are the repeated words (lowercase) and values are arrays of strings (the suggested synonyms).

Example structure:
{
  "synonymsMap": {
    "very": ["extremely", "highly", "exceptionally"],
    "good": ["beneficial", "advantageous", "excellent"]
  }
}

Return ONLY valid JSON, no markdown formatting.

Repeated words list:
${words.join(', ')}

Essay context:
"${essayContent}"`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'user', content: prompt }
      ],
      model: activeModel,
      response_format: { type: 'json_object' }
    })

    usage = chatCompletion.usage
    const responseText = chatCompletion.choices[0].message.content
    let jsonStr = responseText.trim()
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const result = JSON.parse(jsonStr)

    await logAICall({
      model: activeModel,
      action: 'synonym_recommendation',
      duration: Date.now() - startTime,
      status: 'success',
      usage
    })

    return result.synonymsMap || {}
  } catch (error) {
    console.error('AI Synonym Recommendation Error:', error.message)

    await logAICall({
      model: activeModel,
      action: 'synonym_recommendation',
      duration: Date.now() - startTime,
      status: 'failure',
      errorMessage: error.message
    })
    // Fallback synonyms
    const fallbacks = {
      'very': ['extremely', 'exceptionally', 'remarkably', 'highly'],
      'good': ['excellent', 'beneficial', 'superb', 'splendid'],
      'bad': ['detrimental', 'unfavorable', 'adverse', 'harmful'],
      'happy': ['delighted', 'elated', 'joyful', 'content'],
      'sad': ['gloomy', 'melancholy', 'sorrowful', 'dejected'],
      'many': ['numerous', 'abundant', 'myriad', 'plentiful'],
      'people': ['individuals', 'citizens', 'the public', 'society'],
      'make': ['create', 'generate', 'construct', 'produce'],
      'think': ['believe', 'deem', 'consider', 'maintain'],
      'say': ['state', 'assert', 'claim', 'declare'],
      'important': ['crucial', 'essential', 'vital', 'significant']
    }
    const map = {}
    words.forEach(w => {
      map[w] = fallbacks[w.toLowerCase()] || []
    })
    return map
  }
}

/**
 * Calculate vocabulary and lexical diversity metrics (TTR, HD-D, MTLD) programmatically
 */
export const calculateLexicalDiversity = (text) => {
  const tokens = (text || '').toLowerCase().match(/[a-z']+/g) || []
  const tokenCount = tokens.length

  if (tokenCount < 10) {
    const ttr = tokenCount > 0 ? new Set(tokens).size / tokenCount : 0
    return { ttr: Math.round(ttr * 100) / 100, hdd: Math.round(ttr * 100) / 100, mtld: 0 }
  }

  // 1. TTR
  const uniqueTypes = new Set(tokens)
  const ttr = uniqueTypes.size / tokenCount

  // 2. MTLD (Measure of Textual Lexical Diversity)
  const mtldThreshold = 0.72

  const computeMtldDirectional = (tokenList) => {
    let factorCount = 0
    let startIndex = 0
    let uniqueInSegment = new Set()
    
    for (let i = 0; i < tokenList.length; i++) {
      uniqueInSegment.add(tokenList[i])
      const segmentLength = i - startIndex + 1
      const currentTtr = uniqueInSegment.size / segmentLength
      
      if (currentTtr < mtldThreshold && segmentLength > 1) {
        factorCount++
        uniqueInSegment.clear()
        startIndex = i + 1
      }
    }
    
    // Incomplete final factor
    const finalSegmentLength = tokenList.length - startIndex
    if (finalSegmentLength > 0) {
      const finalUnique = new Set(tokenList.slice(startIndex))
      const finalTtr = finalUnique.size / finalSegmentLength
      if (finalTtr < 1.0) {
        const fraction = (1.0 - finalTtr) / (1.0 - mtldThreshold)
        factorCount += fraction
      }
    }
    
    return factorCount > 0 ? tokenList.length / factorCount : tokenList.length
  }

  const mtldForward = computeMtldDirectional(tokens)
  const mtldBackward = computeMtldDirectional([...tokens].reverse())
  const mtld = (mtldForward + mtldBackward) / 2

  // 3. HD-D index (N = 42 draws)
  const sampleSize = 42
  let hdd = 0

  if (tokenCount >= sampleSize) {
    const frequencies = {}
    tokens.forEach(t => {
      frequencies[t] = (frequencies[t] || 0) + 1
    })

    let expectedUnique = 0
    Object.keys(frequencies).forEach(type => {
      const c = frequencies[type]
      let combinationRatio = 1.0
      for (let i = 0; i < sampleSize; i++) {
        combinationRatio *= (tokenCount - c - i) / (tokenCount - i)
      }
      expectedUnique += (1.0 - combinationRatio)
    })
    
    hdd = expectedUnique / sampleSize
  } else {
    hdd = ttr
  }

  return {
    ttr: Math.round(ttr * 100) / 100,
    hdd: Math.round(hdd * 100) / 100,
    mtld: Math.round(mtld * 10) / 10
  }
}

