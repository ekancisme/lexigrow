import LearningSession from '../models/LearningSession.js'
import PracticeAttempt from '../models/PracticeAttempt.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  fail,
  objectId,
  text,
  integer,
  requestKey,
  normalizeAnswer,
} from '../utils/learning.js'
import { transactIntent } from '../services/learningTransaction.service.js'
export const submitPractice = asyncHandler(async (req, res) => {
  const b = req.body,
    sessionId = objectId(b.sessionId, 'sessionId'),
    wordId = text(b.wordId, 'wordId', 100)
  const answer = text(b.answer ?? b.selectedAnswer, 'answer'),
    key = requestKey(req)
  if (!['multiple_choice', 'fill_in_blank'].includes(b.questionType))
    fail('Invalid questionType')
  const questionIndex = integer(b.questionIndex, 0, 0, 20)
  if (b.usedHint !== undefined && typeof b.usedHint !== 'boolean')
    fail('Invalid usedHint')
  const payload = {
    sessionId: String(sessionId),
    wordId,
    answer,
    questionType: b.questionType,
    questionIndex,
    timeSpentMs: integer(b.timeSpentMs, 0, 0, 3600000),
    usedHint: b.usedHint === true,
  }
  const out = await transactIntent(
    req.user._id,
    'practice',
    key,
    payload,
    async (tx) => {
      const session = await LearningSession.findOne({
        _id: sessionId,
        student: req.user._id,
      }).session(tx)
      if (!session) fail('Session not found', 404)
      if (
        session.status !== 'in_progress' ||
        session.currentStep !== 'practice'
      )
        fail('Session is not in practice step', 409)
      const word = session.targetWords.find((w) => w.wordId === wordId)
      const question = word?.quizQuestions?.filter(
        (q) => q.type === b.questionType.replaceAll('_', '-'),
      )[questionIndex]
      if (!question) fail('Question not found', 404)
      if (
        question.type === 'multiple-choice' &&
        !question.options.includes(answer)
      )
        fail('Answer is not an option')
      const [attempt] = await PracticeAttempt.create(
        [
          {
            ...payload,
            session: sessionId,
            student: req.user._id,
            word: word.word,
            selectedAnswer: answer,
            isCorrect:
              normalizeAnswer(answer) ===
              normalizeAnswer(question.correctAnswer),
            requestId: key,
          },
        ],
        { session: tx },
      )
      // A write to the session serializes submissions with step transitions.
      session.markModified('updatedAt')
      session.updatedAt = new Date()
      await session.save({ session: tx })
      return { ...attempt.toObject(), correctAnswer: question.correctAnswer }
    },
  )
  res.status(out.replayed ? 200 : 201).json({ success: true, data: out.result })
})
