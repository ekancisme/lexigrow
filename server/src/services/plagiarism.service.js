import Essay from '../models/Essay.js'

/**
 * Clean text and tokenize it
 * @param {string} text 
 * @returns {string[]}
 */
const tokenize = (text) => {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, '') // remove punctuation except single quotes
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * Generate N-Grams from tokens list
 * @param {string[]} tokens 
 * @param {number} n 
 * @returns {Set<string>}
 */
const getNGrams = (tokens, n = 3) => {
  const nGrams = new Set()
  for (let i = 0; i <= tokens.length - n; i++) {
    nGrams.add(tokens.slice(i, i + n).join(' '))
  }
  return nGrams
}

/**
 * Compute Jaccard Similarity between two sets
 * @param {Set<any>} setA 
 * @param {Set<any>} setB 
 * @returns {number}
 */
const computeJaccard = (setA, setB) => {
  if (setA.size === 0 || setB.size === 0) return 0
  
  let intersectionCount = 0
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++
    }
  }
  
  const unionSize = setA.size + setB.size - intersectionCount
  return unionSize > 0 ? intersectionCount / unionSize : 0
}

/**
 * Check if the essay content matches any other submitted or reviewed essay
 * @param {string} newEssayId 
 * @param {string} text 
 * @returns {Promise<{isPlagiarized: boolean, similarityScore: number, matchedEssay: string|null}>}
 */
export const checkCrossStudentPlagiarism = async (newEssayId, text) => {
  try {
    const newTokens = tokenize(text)
    if (newTokens.length < 5) {
      return { isPlagiarized: false, similarityScore: 0, matchedEssay: null }
    }

    const new3Grams = getNGrams(newTokens, 3)
    if (new3Grams.size === 0) {
      return { isPlagiarized: false, similarityScore: 0, matchedEssay: null }
    }

    // Find all other essays (not drafts) in database
    const otherEssays = await Essay.find({
      _id: { $ne: newEssayId },
      status: { $in: ['submitted', 'reviewed'] }
    }).select('_id title content')

    let highestScore = 0
    let bestMatch = null

    for (const essay of otherEssays) {
      const tokens = tokenize(essay.content)
      const grams = getNGrams(tokens, 3)
      
      const similarity = computeJaccard(new3Grams, grams)
      if (similarity > highestScore) {
        highestScore = similarity
        bestMatch = essay
      }
    }

    // A 3-gram Jaccard similarity of >= 0.25 (25%) indicates high likelihood of plagiarism / direct copying
    const threshold = 0.25
    const isPlagiarized = highestScore >= threshold

    return {
      isPlagiarized,
      similarityScore: Math.round(highestScore * 100) / 100, // round to 2 decimals
      matchedEssay: isPlagiarized && bestMatch ? bestMatch._id : null
    }
  } catch (err) {
    console.error('Error checking cross-student plagiarism:', err.message)
    return { isPlagiarized: false, similarityScore: 0, matchedEssay: null }
  }
}
