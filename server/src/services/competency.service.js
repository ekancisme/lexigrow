import StudentCompetency from '../models/StudentCompetency.js'
import Vocabulary from '../models/Vocabulary.js'
import ReviewEvent from '../models/ReviewEvent.js'
import WordUsageEvidence from '../models/WordUsageEvidence.js'
import GlobalVocabulary from '../models/GlobalVocabulary.js'
import { masteredPipeline } from './wordEvidence.service.js'

const SNAPSHOT_TTL_MS = 5 * 60 * 1000
const normalize = (word) => String(word || '').trim().toLowerCase()

export async function rebuildCompetencySnapshot(student, { force = true } = {}) {
  const studentId = student?._id || student
  const profile = student?.learningProfile || {}
  const now = new Date()
  if (!force) {
    const cached = await StudentCompetency.findOne({ student: studentId }).lean()
    if (cached && now - new Date(cached.computedAt) < SNAPSHOT_TTL_MS) return cached
  }

  const [vocabulary, reviews, evidence, mastered] = await Promise.all([
    Vocabulary.find({ student: studentId }).sort({ createdAt: -1 }).lean(),
    ReviewEvent.find({ student: studentId }).sort({ reviewedAt: -1, _id: -1 }).lean(),
    WordUsageEvidence.aggregate([
      { $match: { student: studentId, isVerifiedCorrect: true } },
      { $group: { _id: '$word', evidenceCount: { $sum: 1 }, essays: { $addToSet: '$essayId' }, days: { $addToSet: '$localDay' } } },
    ]),
    WordUsageEvidence.aggregate(masteredPipeline(studentId)),
  ])

  const latestReviews = new Map()
  for (const review of reviews) {
    const vocabularyId = String(review.vocabulary)
    if (!latestReviews.has(vocabularyId)) latestReviews.set(vocabularyId, review)
  }
  const evidenceByWord = new Map(evidence.map((row) => [normalize(row._id), row]))
  const masteredWords = new Set(mastered.map((row) => normalize(row._id)))
  const words = vocabulary.map((item) => {
    const word = normalize(item.word)
    const latest = latestReviews.get(String(item._id))
    const due = !item.nextReviewDate || new Date(item.nextReviewDate) <= now
    const state = masteredWords.has(word)
      ? 'mastered'
      : due
        ? 'due'
        : latest?.rating <= 2
          ? 'struggling'
          : item.masteryLevel === 'learning'
            ? 'learning'
            : 'new'
    const row = evidenceByWord.get(word)
    return {
      word,
      vocabularyId: item._id,
      state,
      nextReviewDate: item.nextReviewDate || null,
      latestRating: latest?.rating ?? null,
      reviewCount: item.reviewCount || 0,
      evidenceCount: row?.evidenceCount || 0,
      definition: item.definition || '',
      definitionVi: item.definitionVi || item.definition || '',
      partOfSpeech: item.partOfSpeech || 'other',
      phonetic: item.ipa || item.phonetic || '',
      exampleSentences: item.exampleSentence ? [item.exampleSentence] : [],
      quizQuestions: item.quizQuestions || [],
      theme: item.theme || 'Adaptive Learning',
    }
  })

  const seen = new Set(words.map((item) => item.word))
  const globalWords = await GlobalVocabulary.find({ cefr: profile.targetLevel || 'B1', word: { $nin: [...seen] } })
    .sort({ word: 1 })
    .limit(200)
    .lean()
  for (const item of globalWords) {
    words.push({
      word: normalize(item.word),
      vocabularyId: null,
      state: 'unseen',
      nextReviewDate: null,
      latestRating: null,
      reviewCount: 0,
      evidenceCount: 0,
      definition: item.definition || '',
      definitionVi: item.definition || '',
      partOfSpeech: item.partOfSpeech || 'other',
      phonetic: item.ipa || '',
      exampleSentences: [],
      quizQuestions: [],
      theme: 'Adaptive Learning',
    })
  }

  const summary = {
    due: words.filter((item) => item.state === 'due').length,
    struggling: words.filter((item) => item.latestRating <= 2 || item.state === 'struggling').length,
    mastered: words.filter((item) => item.state === 'mastered').length,
    unseen: words.filter((item) => item.state === 'unseen').length,
    learning: words.filter((item) => item.state === 'learning' || item.state === 'new').length,
    total: words.length,
  }
  const cleanWords = words
  return StudentCompetency.findOneAndUpdate(
    { student: studentId },
    {
      student: studentId,
      computedAt: now,
      $inc: { version: 1 },
      level: profile.targetLevel || 'B1',
      interests: Array.isArray(profile.interests) ? profile.interests.slice(0, 20) : [],
      summary,
      words: cleanWords,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean()
}

export async function getCompetencySnapshot(student, options = {}) {
  return rebuildCompetencySnapshot(student, { force: options.force ?? false })
}

function toTarget(item, index, theme = 'Adaptive Learning') {
  const word = normalize(item.word)
  const definition = item.definitionVi || item.definition || `Practice using the word “${word}” in context.`
  return {
    word,
    wordId: item.vocabularyId ? String(item.vocabularyId) : `adaptive:${word}:${index}`,
    partOfSpeech: item.partOfSpeech || 'other',
    definitionVi: definition,
    definition,
    phonetic: item.phonetic || '',
    exampleSentences: item.exampleSentences || [],
    quizQuestions: item.quizQuestions || [],
    theme: item.theme || theme,
    competencyState: item.state,
  }
}

export async function selectAdaptiveTargets(student, { count = 5, theme = 'Adaptive Learning', requestedWords = [] } = {}) {
  const snapshot = await getCompetencySnapshot(student, { force: false })
  const requested = new Set(Array.isArray(requestedWords) ? requestedWords.map(normalize) : [])
  const byPriority = ['due', 'struggling', 'unseen', 'learning', 'new']
  const selected = []
  for (const state of byPriority) {
    for (const item of snapshot?.words || []) {
      if (selected.some((word) => word.word === item.word)) continue
      if (requested.size && !requested.has(item.word)) continue
      if (item.state !== state) continue
      selected.push(toTarget(item, selected.length, theme))
      if (selected.length >= count) return { snapshot, targets: selected }
    }
  }
  return { snapshot, targets: selected }
}

export async function invalidateCompetencySnapshot(studentId) {
  await StudentCompetency.updateOne({ student: studentId }, { $set: { computedAt: new Date(0) } })
}
