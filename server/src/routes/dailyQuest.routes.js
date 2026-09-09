import { Router } from 'express'
import mongoose from 'mongoose'
import { rateLimit } from 'express-rate-limit'
import { protect, authorize } from '../middleware/auth.middleware.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'
import DailyQuest from '../models/DailyQuest.js'
import Vocabulary from '../models/Vocabulary.js'
import GlobalVocabulary from '../models/GlobalVocabulary.js'
import { generateCrossword, STARTER_WORDS, questDay } from '../services/crossword.service.js'
import { applyPlay, publicQuest } from '../services/dailyQuest.service.js'

const router = Router()
router.use(protect, authorize('student'))
router.use(
  rateLimit({
    windowMs: 60_000,
    limit: 180,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user._id),
    message: { error: 'Too many quest requests. Please try again shortly.' },
  }),
)

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const [today, fireflies] = await Promise.all([
      DailyQuest.findOne({ student: req.user._id, day: questDay() })
        .select('startedAt completedAt solved words')
        .lean(),
      DailyQuest.countDocuments({ student: req.user._id, reward: 1 }),
    ])
    res.json({
      success: true,
      data: {
        fireflies,
        status: today?.completedAt ? 'completed' : today?.startedAt ? 'playing' : 'new',
        solved: today?.solved.length || 0,
        total: today?.words.length || 6,
      },
    })
  }),
)

router.post(
  '/today',
  asyncHandler(async (req, res) => {
    const day = questDay(),
      filter = { student: req.user._id, day }
    let quest = await DailyQuest.findOne(filter).lean()
    if (!quest) {
      const now = new Date()
      const [due, recent, global] = await Promise.all([
        Vocabulary.find({
          student: req.user._id,
          $or: [{ nextReviewDate: null }, { nextReviewDate: { $lte: now } }],
        })
          .sort({ nextReviewDate: 1, createdAt: -1 })
          .limit(40)
          .lean(),
        Vocabulary.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(30).lean(),
        GlobalVocabulary.find({ cefr: req.user.learningProfile?.targetLevel || 'B1' })
          .sort({ word: 1 })
          .limit(30)
          .lean(),
      ])
      const candidates = [
        ...due,
        ...recent,
        ...global.map((w) => ({ ...w, source: 'library' })),
        ...STARTER_WORDS,
      ]
      let puzzle = generateCrossword(candidates, `${req.user._id}:${day}`)
      if (puzzle.words.length < 5)
        puzzle = generateCrossword(STARTER_WORDS, `${req.user._id}:${day}`)
      try {
        quest = (await DailyQuest.create({ ...filter, ...puzzle })).toObject({ flattenMaps: true })
      } catch (error) {
        if (error.code !== 11000) throw error
        quest = await DailyQuest.findOne(filter).lean()
      }
    }
    res.json({ success: true, data: publicQuest(quest) })
  }),
)

router.post(
  '/:id/play',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ErrorResponse('Quest not found', 404)
    const filter = { _id: req.params.id, student: req.user._id }
    const quest = await DailyQuest.findOne(filter).lean()
    if (!quest) throw new ErrorResponse('Quest not found', 404)
    // A lost completion response can be retried without another reward.
    if (quest.completedAt)
      return res.json({ success: true, data: publicQuest(quest), correct: true })
    if (quest.day !== questDay())
      return res
        .status(410)
        .json({ error: 'This quest has ended. Open today’s quest.', code: 'QUEST_EXPIRED' })
    if (req.body.revision !== quest.revision)
      return res
        .status(409)
        .json({
          error: 'Quest changed on another tab. Reload to continue.',
          code: 'QUEST_CONFLICT',
        })
    const { update, correct } = applyPlay(quest, req.body)
    const updated = await DailyQuest.findOneAndUpdate(
      { ...filter, revision: quest.revision, completedAt: { $exists: false } },
      { $set: update, $inc: { revision: 1 } },
      { returnDocument: 'after' },
    ).lean()
    if (!updated)
      return res
        .status(409)
        .json({
          error: 'Quest changed on another tab. Reload to continue.',
          code: 'QUEST_CONFLICT',
        })
    res.json({ success: true, data: publicQuest(updated), correct })
  }),
)

export default router
