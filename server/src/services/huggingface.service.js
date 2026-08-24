/**
 * Service to detect AI writing using Hugging Face Inference API
 * with local heuristic fallback.
 */
import Config from '../models/Config.js'


// Heuristic word list commonly overused by ChatGPT / LLMs
const MARKER_WORDS = [
  /\bdelve\b/g,
  /\btestament\b/g,
  /\btapestry\b/g,
  /\bmoreover\b/g,
  /\bfurthermore\b/g,
  /\bultimately\b/g,
  /\bbeacon\b/g,
  /\bdemystify\b/g,
  /\bnot only\b/g,
  /\bbut also\b/g,
  /\bit is crucial\b/g,
  /\bplays a vital role\b/g,
  /\bcomprehensive\b/g,
  /\bin conclusion\b/g,
  /\bhence\b/g,
  /\btherefore\b/g
]

/**
 * Local heuristic classifier to estimate AI writing probability
 * @param {string} text 
 * @returns {{isAI: boolean, score: number}}
 */
const runLocalAIHeuristics = (text) => {
  if (!text || text.trim().length < 50) {
    return { isAI: false, score: 0 }
  }

  const cleanText = text.toLowerCase()
  const words = cleanText.match(/[a-z']+/g) || []
  const wordCount = words.length

  if (wordCount < 10) return { isAI: false, score: 0 }

  // 1. Check for ChatGPT marker words frequency
  let markerMatchCount = 0
  let uniqueMarkerCount = 0

  MARKER_WORDS.forEach(regex => {
    const matches = cleanText.match(regex)
    if (matches) {
      markerMatchCount += matches.length
      uniqueMarkerCount++
    }
  })

  const markerDensity = markerMatchCount / wordCount

  // 2. Compute Burstiness (sentence length standard deviation)
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0)
  let burstinessScore = 0
  
  if (sentences.length >= 3) {
    const sentenceLengths = sentences.map(s => (s.match(/[a-z']+/gi) || []).length)
    const avgLen = sentenceLengths.reduce((a, b) => a + b, 0) / sentences.length
    
    // Variance
    const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLen, 2), 0) / sentences.length
    const stdDev = Math.sqrt(variance)

    // Lower standard deviation (uniform sentence length) is typical for AI.
    // If stdDev is very low (e.g., < 4.0 words), it indicates high likelihood of AI text.
    if (stdDev < 4.0) {
      burstinessScore = 0.4
    } else if (stdDev < 6.0) {
      burstinessScore = 0.2
    }
  }

  // Combine heuristic scores
  let aiScore = 0

  // Marker density contribution
  if (markerDensity > 0.04) {
    aiScore += 0.5 // High density of transitional words
  } else if (markerDensity > 0.02) {
    aiScore += 0.3
  }

  // Unique marker counts contribution
  if (uniqueMarkerCount >= 4) {
    aiScore += 0.3
  } else if (uniqueMarkerCount >= 2) {
    aiScore += 0.15
  }

  aiScore += burstinessScore

  // Cap score between 0 and 0.95 (heuristics shouldn't output 100% confidence)
  aiScore = Math.min(0.95, Math.max(0, aiScore))

  // Threshold of 0.75 for heuristics
  return {
    isAI: aiScore >= 0.75,
    score: Math.round(aiScore * 100) / 100
  }
}

/**
 * Detect AI-generated writing in a text using Hugging Face Inference API
 * Falls back to local heuristics if API token is missing or if the API call fails.
 * @param {string} text 
 * @returns {Promise<{isAI: boolean, score: number}>}
 */
export const detectAIWriting = async (text) => {
  let token = ''
  try {
    const config = await Config.findOne({ key: 'HF_API_TOKEN' })
    token = config ? config.value : (globalThis.process.env.HF_API_TOKEN || '')
  } catch (error) {
    console.error('[AI Detection] Error reading HF_API_TOKEN config:', error.message)
    token = globalThis.process.env.HF_API_TOKEN || ''
  }

  console.log('[AI Detection Debug] Read HF_API_TOKEN:', token ? `${token.substring(0, 6)}... (len: ${token.length})` : 'undefined/null');
  
  if (!token || token.startsWith('your_hf_token') || token.trim() === '') {
    console.log('[AI Detection] No Hugging Face token found. Using local heuristic fallback.')
    return runLocalAIHeuristics(text)
  }

  try {
    // Model Hello-SimpleAI/chatgpt-detector-roberta is a robust open-source detector
    const response = await globalThis.fetch(
      'https://router.huggingface.co/hf-inference/models/Hello-SimpleAI/chatgpt-detector-roberta',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-wait-for-model': 'true'
        },
        body: JSON.stringify({ inputs: text })
      }
    )

    if (!response.ok) {
      const errorMsg = await response.text()
      console.warn(`[AI Detection] Hugging Face API returned error: ${response.status}. Falling back to heuristics. Detail:`, errorMsg)
      return runLocalAIHeuristics(text)
    }

    const result = await response.json()

    // Response structure is typically: [[{label: "Human", score: X}, {label: "ChatGPT", score: Y}]]
    // or sometimes direct array of dicts if the API returns single list.
    const predictions = Array.isArray(result) && Array.isArray(result[0]) 
      ? result[0] 
      : (Array.isArray(result) ? result : [])

    if (predictions.length === 0) {
      console.warn('[AI Detection] Hugging Face API returned empty predictions. Falling back to heuristics.')
      return runLocalAIHeuristics(text)
    }

    // Find the ChatGPT class score
    const chatGptPrediction = predictions.find(p => 
      p && typeof p.label === 'string' && (p.label.toLowerCase() === 'chatgpt' || p.label.toLowerCase() === 'ai')
    )

    if (!chatGptPrediction) {
      console.warn('[AI Detection] Could not find class label for ChatGPT/AI. Full response was:', JSON.stringify(result))
      return runLocalAIHeuristics(text)
    }

    const aiScore = chatGptPrediction.score || 0
    const isAI = aiScore >= 0.70 // 70% threshold is generally reliable

    return {
      isAI,
      score: Math.round(aiScore * 100) / 100
    }
  } catch (err) {
    console.error('[AI Detection] Hugging Face API request failed:', err.message)
    console.log('[AI Detection] Falling back to local heuristics...')
    return runLocalAIHeuristics(text)
  }
}
