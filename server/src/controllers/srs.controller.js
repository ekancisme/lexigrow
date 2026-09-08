import Vocabulary from '../models/Vocabulary.js'
import ReviewEvent from '../models/ReviewEvent.js'
import asyncHandler from '../utils/asyncHandler.js'
import { calculateSM2 } from '../services/srs.service.js'
import { transactIntent } from '../services/learningTransaction.service.js'
import {
  fail,
  objectId,
  requestKey,
  integer,
  dayBoundary,
} from '../utils/learning.js'
export const submitSrsReview = asyncHandler(async (req, res) => {
  const vocabularyId = objectId(req.body.vocabularyId, 'vocabularyId'),
    rating = req.body.rating,
    key = requestKey(req)
  if (![1, 2, 3, 4].includes(rating)) fail('Invalid rating')
  const out = await transactIntent(
    req.user._id,
    'srs',
    key,
    { vocabularyId: String(vocabularyId), rating },
    async (tx) => {
      const word = await Vocabulary.findOne({
        _id: vocabularyId,
        student: req.user._id,
      }).session(tx)
      if (!word) fail('Word not found', 404)
      const zone = req.user.learningProfile?.timezone || 'Asia/Ho_Chi_Minh',
        now = new Date()
      const before = word.reviewInterval
      const next = calculateSM2(
        {
          easeFactor: word.easeFactor,
          reviewInterval: word.reviewInterval,
          reviewCount: word.reviewCount,
        },
        rating,
        { now, timezone: zone, algorithm: 'sm2' },
      )
      Object.assign(word, next)
      await word.save({ session: tx })
      await ReviewEvent.create(
        [
          {
            student: req.user._id,
            vocabulary: word._id,
            rating,
            intervalBefore: before,
            intervalAfter: next.reviewInterval,
            repetition: next.reviewCount,
            easeFactor: next.easeFactor,
            reviewedAt: now,
            timezone: zone,
            requestId: key,
          },
        ],
        { session: tx },
      )
      return word.toObject()
    },
  )
  res.json({ success: true, data: out.result })
})
export const getSrsDue = asyncHandler(async (req, res) => {
  const limit = integer(req.query.limit, 20, 1, 100),
    page = integer(req.query.page, 1, 1, 100000)
  const zone = req.user.learningProfile?.timezone || 'Asia/Ho_Chi_Minh'
  const query = {
    student: req.user._id,
    $or: [
      { nextReviewDate: null },
      { nextReviewDate: { $lt: dayBoundary(new Date(), 1, zone) } },
    ],
  }
  const [words, total] = await Promise.all([
    Vocabulary.find(query)
      .sort({ nextReviewDate: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Vocabulary.countDocuments(query),
  ])
  res.json({
    success: true,
    data: words,
    count: words.length,
    total,
    page,
    limit,
    timezone: zone,
  })
})
