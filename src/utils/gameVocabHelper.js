import { TOPIC_VOCABULARY_ROUNDS } from '../data/topicVocabularyRounds.js'

export const GAME_CURATED_TOPICS = [
  { slug: 'all', title: 'Tất cả chủ đề', icon: 'auto_awesome', category: 'daily' },
  { slug: 'daily-life', title: 'Daily Life & Routines', icon: 'wb_sunny', category: 'daily' },
  { slug: 'travel', title: 'Travel & Exploration', icon: 'flight_takeoff', category: 'daily' },
  { slug: 'hobbies', title: 'Hobbies & Creative Arts', icon: 'palette', category: 'daily' },
  { slug: 'technology', title: 'Technology & Digital Era', icon: 'smart_toy', category: 'academic' },
  { slug: 'environment', title: 'Environment & Nature', icon: 'eco', category: 'scientific' },
]

/**
 * Extract curated topic words from TOPIC_VOCABULARY_ROUNDS
 * @param {string} slug - topic slug or 'all'
 * @returns {Array} normalized word objects suitable for games
 */
export function getCuratedTopicWords(slug = 'all') {
  if (slug && slug !== 'all' && TOPIC_VOCABULARY_ROUNDS[slug]) {
    const rounds = TOPIC_VOCABULARY_ROUNDS[slug] || []
    return rounds.flatMap((r) =>
      (r.words || []).map((w) => normalizeGameWord(w, slug))
    )
  }

  // All topics
  return Object.entries(TOPIC_VOCABULARY_ROUNDS).flatMap(([s, rounds]) =>
    rounds.flatMap((r) => (r.words || []).map((w) => normalizeGameWord(w, s)))
  )
}

function normalizeGameWord(w, topicSlug) {
  const categoryMap = {
    technology: 'academic',
    environment: 'scientific',
    'daily-life': 'daily',
    travel: 'daily',
    hobbies: 'daily',
  }

  return {
    _id: w._id || `topic_${w.word}`,
    word: w.word,
    ipa: w.ipa || '',
    partOfSpeech: w.partOfSpeech || 'noun',
    definition: w.meaningVi || w.meaning || '',
    exampleSentence: w.exampleSentence || '',
    examples: [w.exampleSentence].filter(Boolean),
    theme: topicSlug || 'General',
    category: categoryMap[topicSlug] || 'daily',
    isCurated: true,
  }
}
