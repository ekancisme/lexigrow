import Vocabulary from '../models/Vocabulary.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * @desc    Get student's vocabulary library
 * @route   GET /api/vocabulary
 * @access  Private (student)
 */
export const getVocabulary = asyncHandler(async (req, res) => {
  const { category, mastery, theme, search, page = 1, limit = 50 } = req.query
  const query = { student: req.user._id }

  if (category) query.category = category
  if (mastery) query.masteryLevel = mastery
  if (theme) query.theme = { $regex: theme, $options: 'i' }
  if (search) query.word = { $regex: search, $options: 'i' }

  const words = await Vocabulary.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))

  const total = await Vocabulary.countDocuments(query)

  res.status(200).json({
    success: true,
    count: words.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: words,
  })
})

/**
 * @desc    Add new vocabulary manually
 * @route   POST /api/vocabulary
 * @access  Private (student)
 */
export const createVocabulary = asyncHandler(async (req, res) => {
  const { word, category, theme, masteryLevel } = req.body

  if (!word) {
    throw new (await import('../utils/ErrorResponse.js')).default('Please provide a word', 400)
  }

  const normalizedWord = word.trim().toLowerCase()

  // Check if word already exists for this student
  let existing = await Vocabulary.findOne({ student: req.user._id, word: normalizedWord })
  if (existing) {
    throw new (await import('../utils/ErrorResponse.js')).default('Word already exists in your library', 400)
  }

  // Check if this word was already enriched by ANY student in the system to save AI tokens
  const existingEnriched = await Vocabulary.findOne({
    word: normalizedWord,
    definition: { $ne: '' }
  }).select('ipa partOfSpeech definition exampleSentence synonyms antonyms')

  let enriched = {}
  if (existingEnriched) {
    enriched = {
      ipa: existingEnriched.ipa,
      partOfSpeech: existingEnriched.partOfSpeech,
      definition: existingEnriched.definition,
      exampleSentence: existingEnriched.exampleSentence,
      synonyms: existingEnriched.synonyms,
      antonyms: existingEnriched.antonyms,
    }
  } else {
    // Call Groq Llama to enrich
    const { enrichWordsList } = await import('../services/ai.service.js')
    const enrichedList = await enrichWordsList([normalizedWord])
    if (enrichedList && enrichedList.length > 0) {
      enriched = enrichedList[0]
    }
  }

  const newWord = await Vocabulary.create({
    word: normalizedWord,
    student: req.user._id,
    category: category || 'daily',
    theme: theme || 'General',
    masteryLevel: masteryLevel || 'new',
    ipa: enriched.ipa || '',
    partOfSpeech: enriched.partOfSpeech || '',
    definition: enriched.definition || '',
    exampleSentence: enriched.exampleSentence || '',
    synonyms: enriched.synonyms || [],
    antonyms: enriched.antonyms || [],
  })

  res.status(201).json({ success: true, data: newWord })
})

/**
 * @desc    Get vocabulary stats by category
 * @route   GET /api/vocabulary/stats
 * @access  Private (student)
 */
export const getVocabStats = asyncHandler(async (req, res) => {
  const stats = await Vocabulary.aggregate([
    { $match: { student: req.user._id } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        mastered: { $sum: { $cond: [{ $eq: ['$masteryLevel', 'mastered'] }, 1, 0] } },
      },
    },
  ])

  const total = await Vocabulary.countDocuments({ student: req.user._id })

  // Format as category objects
  const categories = ['academic', 'business', 'scientific', 'daily'].map(cat => {
    const found = stats.find(s => s._id === cat)
    return {
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      category: cat,
      count: found ? found.count : 0,
      mastered: found ? found.mastered : 0,
      progress: total > 0 && found ? Math.round((found.count / total) * 100) : 0,
    }
  })

  // Aggregate mastery distribution stats
  const masteryStats = await Vocabulary.aggregate([
    { $match: { student: req.user._id } },
    {
      $group: {
        _id: '$masteryLevel',
        count: { $sum: 1 }
      }
    }
  ])

  const masteryDistribution = {
    new: 0,
    learning: 0,
    mastered: 0
  }
  masteryStats.forEach(s => {
    if (s._id && ['new', 'learning', 'mastered'].includes(s._id)) {
      masteryDistribution[s._id] = s.count
    }
  })

  res.status(200).json({ success: true, total, data: categories, masteryDistribution })
})

/**
 * @desc    Get vocabulary growth data over time
 * @route   GET /api/vocabulary/growth
 * @access  Private (student)
 */
export const getVocabGrowth = asyncHandler(async (req, res) => {
  const { period = 'weekly' } = req.query
  const now = new Date()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (period === 'monthly') {
    // Last 6 months
    const dates = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(now.getMonth() - i)
      // Set to end of the month
      d.setDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())
      d.setHours(23, 59, 59, 999)
      dates.push({
        date: d,
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`
      })
    }

    const data = await Promise.all(
      dates.map(async (item) => {
        const count = await Vocabulary.countDocuments({
          student: req.user._id,
          createdAt: { $lte: item.date }
        })
        return {
          label: item.label,
          count
        }
      })
    )

    res.status(200).json({ success: true, data })
  } else {
    // Weekly (default): last 4 weeks
    const dates = []
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i * 7)
      d.setHours(23, 59, 59, 999)
      dates.push({
        date: d,
        label: i === 0 ? `${monthNames[d.getMonth()]} ${d.getDate()} (Today)` : `${monthNames[d.getMonth()]} ${d.getDate()}`
      })
    }

    const data = await Promise.all(
      dates.map(async (item) => {
        const count = await Vocabulary.countDocuments({
          student: req.user._id,
          createdAt: { $lte: item.date }
        })
        return {
          label: item.label,
          count
        }
      })
    )

    res.status(200).json({ success: true, data })
  }
})

/**
 * @desc    Update vocabulary mastery level
 * @route   PATCH /api/vocabulary/:id
 * @access  Private (student)
 */
export const updateMastery = asyncHandler(async (req, res) => {
  const word = await Vocabulary.findOne({ _id: req.params.id, student: req.user._id })

  if (!word) {
    throw new (await import('../utils/ErrorResponse.js')).default('Word not found', 404)
  }

  word.masteryLevel = req.body.masteryLevel || word.masteryLevel
  await word.save()

  res.status(200).json({ success: true, data: word })
})
