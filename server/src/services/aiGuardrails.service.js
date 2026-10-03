const cleanText = (value, max = 500) => typeof value === 'string' && value.trim().length > 0 && value.length <= max
const normalizeWord = (value) => String(value || '').trim().toLowerCase()

export function validateRecommendedWords(value, { count, crossword = false } = {}) {
  if (!value || !Array.isArray(value.words) || value.words.length !== count) return null
  const seen = new Set()
  const words = []
  for (const item of value.words) {
    const word = normalizeWord(item.word)
    if (!/^[a-z][a-z -]{2,49}$/.test(word) || seen.has(word)) return null
    if (crossword && (word.includes(' ') || word.length < 3 || word.length > 10)) return null
    if (!cleanText(item.definition, 1000) || !cleanText(item.translation, 500) || !cleanText(item.exampleSentence, 1000)) return null
    if (item.cefr !== undefined && !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(item.cefr)) return null
    seen.add(word)
    words.push({
      word,
      definition: item.definition.trim(),
      translation: item.translation.trim(),
      exampleSentence: item.exampleSentence.trim(),
      ...(item.cefr ? { cefr: item.cefr } : {}),
      ...(item.category ? { category: String(item.category).trim().slice(0, 80) } : {}),
    })
  }
  return words
}

export function validateTopics(value, count = 4) {
  const topics = Array.isArray(value) ? value : value?.topics
  if (!Array.isArray(topics) || topics.length !== count) return null
  const cleaned = topics.map((topic) => String(topic || '').trim()).filter((topic) => topic.length >= 10 && topic.length <= 300)
  return cleaned.length === count && new Set(cleaned.map((topic) => topic.toLowerCase())).size === count ? cleaned : null
}

export function validateQuizQuestion(question, targetWord = '') {
  if (!question || !cleanText(question.question, 500)) return null
  const options = Array.isArray(question.options) ? question.options.map((option) => String(option).trim()).filter(Boolean) : []
  const correctAnswer = String(question.correctAnswer || '').trim()
  if (options.length < 2 || options.length > 6 || !correctAnswer || !options.includes(correctAnswer)) return null
  if (targetWord && !`${question.question} ${options.join(' ')}`.toLowerCase().includes(normalizeWord(targetWord))) return null
  return {
    type: question.type === 'fill-in-blank' ? 'fill-in-blank' : 'multiple-choice',
    question: question.question.trim(),
    options,
    correctAnswer,
  }
}

export function validateEnrichedWords(value, expectedWords = []) {
  if (!value || !Array.isArray(value.enrichedWords)) return null
  const expected = new Set(expectedWords.map(normalizeWord))
  const seen = new Set()
  const result = []
  for (const item of value.enrichedWords) {
    const word = normalizeWord(item.word)
    if (!expected.has(word) || seen.has(word)) return null
    if (!cleanText(item.ipa, 100) || !cleanText(item.partOfSpeech, 80) || !cleanText(item.definition, 1000) || !cleanText(item.exampleSentence, 1000)) return null
    if (!Array.isArray(item.synonyms) || item.synonyms.length > 4 || !Array.isArray(item.antonyms) || item.antonyms.length > 4) return null
    seen.add(word)
    result.push({
      word,
      ipa: item.ipa.trim(),
      partOfSpeech: item.partOfSpeech.trim(),
      definition: item.definition.trim(),
      exampleSentence: item.exampleSentence.trim(),
      synonyms: item.synonyms.map((item) => String(item).trim()).filter(Boolean).slice(0, 4),
      antonyms: item.antonyms.map((item) => String(item).trim()).filter(Boolean).slice(0, 4),
    })
  }
  return seen.size === expected.size ? result : null
}
