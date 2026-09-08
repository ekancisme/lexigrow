import WordUsageEvidence from '../models/WordUsageEvidence.js'
import { dayKey } from '../utils/learning.js'
export function contextSentence(content, start, end) {
  const left =
    Math.max(
      content.lastIndexOf('.', start - 1),
      content.lastIndexOf('!', start - 1),
      content.lastIndexOf('?', start - 1),
      content.lastIndexOf('\n', start - 1),
    ) + 1
  const after = content.slice(end).search(/[.!?\n]/)
  return content
    .slice(left, after < 0 ? content.length : end + after + 1)
    .trim()
}
export async function recordEvidence(revision, session, analysis, zone, tx) {
  for (const r of analysis.targetWordResults) {
    if (r.status !== 'correct' || !r.quoteVerified) continue
    const sentence = contextSentence(revision.content, r.start, r.end)
    const filter = {
      student: revision.student,
      word: r.word,
      contextSentence: sentence,
    }
    // Same sentence is not independent evidence. Preserve earliest independent use.
    const existing = await WordUsageEvidence.findOne(filter).session(tx)
    if (existing) continue
    await WordUsageEvidence.create(
      [
        {
          ...filter,
          essayId: revision.originalEssay,
          revisionId: revision._id,
          learningSet: session.learningSet,
          theme: session.theme,
          meaning:
            session.targetWords.find((w) => w.word === r.word)?.definitionVi ||
            '',
          isVerifiedCorrect: true,
          assisted: revision.assisted,
          aiConfidenceScore: null,
          usedAt: revision.createdAt,
          localDay: dayKey(revision.createdAt, zone),
        },
      ],
      { session: tx },
    )
  }
}
export const masteredPipeline = (student) => [
  { $match: { student, isVerifiedCorrect: true, assisted: false } },
  {
    $group: {
      _id: { word: '$word', meaning: '$meaning' },
      essays: { $addToSet: '$essayId' },
      days: { $addToSet: '$localDay' },
      themes: { $addToSet: '$theme' },
    },
  },
  {
    $match: {
      $expr: {
        $and: [
          { $gte: [{ $size: '$essays' }, 2] },
          { $gte: [{ $size: '$days' }, 2] },
        ],
      },
    },
  },
  { $group: { _id: '$_id.word', themes: { $push: '$themes' } } },
  {
    $project: {
      _id: 1,
      themes: {
        $reduce: {
          input: '$themes',
          initialValue: [],
          in: { $setUnion: ['$$value', '$$this'] },
        },
      },
    },
  },
]
