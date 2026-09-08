import Vocabulary from '../models/Vocabulary.js'
import WordUsageEvidence from '../models/WordUsageEvidence.js'
import LearningSet from '../models/LearningSet.js'
import LearningSession from '../models/LearningSession.js'
import EssayRevision from '../models/EssayRevision.js'
import Class from '../models/Class.js'
import Essay from '../models/Essay.js'
import asyncHandler from '../utils/asyncHandler.js'
import { masteredPipeline } from '../services/wordEvidence.service.js'
import { fail, objectId, text, integer } from '../utils/learning.js'
export const getActiveVocabulary = asyncHandler(async (req, res) => {
  const student = req.user._id
  const [savedCount, retainedCount, mastered] = await Promise.all([
    Vocabulary.countDocuments({ student }),
    Vocabulary.countDocuments({
      student,
      reviewInterval: { $gte: 7 },
      reviewCount: { $gt: 0 },
    }),
    WordUsageEvidence.aggregate(masteredPipeline(student)),
  ])
  res.json({
    success: true,
    data: { savedCount, retainedCount, masteredCount: mastered.length },
  })
})
export const getWordEvidence = asyncHandler(async (req, res) => {
  const wordParam = req.params.word || req.query.word
  const page = integer(req.query.page, 1, 1, 100000),
    limit = integer(req.query.limit, 20, 1, 100)
  const query = { student: req.user._id, isVerifiedCorrect: true }
  if (wordParam) {
    query.word = text(wordParam, 'word', 100).toLowerCase()
  }
  const [evidence, total] = await Promise.all([
    WordUsageEvidence.find(query)
      .sort({ usedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    WordUsageEvidence.countDocuments(query),
  ])
  res.json({ success: true, data: evidence, total, page, limit })
})
export const gardenStage = (count) =>
  count === 0
    ? 'seed'
    : count <= 2
      ? 'sprout'
      : count <= 5
        ? 'leafy'
        : 'blooming'
export const getGardenStatus = asyncHandler(async (req, res) => {
  const [mastered, themes] = await Promise.all([
    WordUsageEvidence.aggregate(masteredPipeline(req.user._id)),
    LearningSession.distinct('theme', { student: req.user._id }),
  ])
  const counts = new Map(themes.filter(Boolean).map((t) => [t, 0]))
  for (const word of mastered)
    for (const theme of word.themes.filter(Boolean))
      counts.set(theme, (counts.get(theme) || 0) + 1)
  res.json({
    success: true,
    data: [...counts]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([theme, masteredCount]) => ({
        theme,
        masteredCount,
        stage: gardenStage(masteredCount),
      })),
  })
})
export const getLexicalErrors = asyncHandler(async (req, res) => {
  const classId = objectId(req.params.classId, 'classId')
  const cls = await Class.findOne({ _id: classId, teacher: req.user._id })
  if (!cls) fail('Class not found', 404)
  const limit = integer(req.query.limit, 20, 1, 100),
    page = integer(req.query.page, 1, 1, 100000)
  // Aggregate through essays so only work belonging to this class is visible.
  const rows = await Essay.aggregate([
    { $match: { class: classId, student: { $in: cls.students } } },
    {
      $lookup: {
        from: EssayRevision.collection.name,
        localField: '_id',
        foreignField: 'originalEssay',
        as: 'revisions',
      },
    },
    { $unwind: '$revisions' },
    { $match: { 'revisions.analysisStatus': 'succeeded' } },
    { $sort: { 'revisions.revisionNumber': -1 } },
    { $group: { _id: '$_id', revision: { $first: '$revisions' } } },
    { $unwind: '$revision.targetWordResults' },
    {
      $match: {
        'revision.targetWordResults.issueType': {
          $in: ['collocation', 'word_form'],
        },
        'revision.targetWordResults.status': {
          $in: ['incorrect', 'needs_improvement'],
        },
      },
    },
    {
      $group: {
        _id: {
          word: '$revision.targetWordResults.word',
          issueType: '$revision.targetWordResults.issueType',
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, '_id.word': 1 } },
    {
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ])
  res.json({
    success: true,
    data: (rows[0]?.data || []).map((r) => ({ ...r._id, count: r.count })),
    total: rows[0]?.total[0]?.count || 0,
    page,
    limit,
  })
})
export async function validateAssignmentLearningSet(value) {
  if (value === null) return null
  const id = objectId(value, 'learningSetId')
  if (!(await LearningSet.exists({ _id: id, status: 'published' })))
    fail('Published learning set not found', 404)
  return id
}
