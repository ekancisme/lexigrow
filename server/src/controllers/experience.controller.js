import mongoose from 'mongoose'
import Class from '../models/Class.js'
import { getExperienceTotals, getWeeklyLeaderboard } from '../services/experience.service.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'

export const getExperienceProfile = asyncHandler(async (req, res) => {
  const data = await getExperienceTotals(req.user._id)
  res.json({ success: true, data })
})

export const getExperienceLeaderboard = asyncHandler(async (req, res) => {
  const scope = req.query.scope || 'global'
  if (!['global', 'class'].includes(scope)) throw new ErrorResponse('Invalid leaderboard scope', 400)

  let studentIds
  if (scope === 'class') {
    const classId = String(req.query.classId || '')
    if (!mongoose.isValidObjectId(classId)) throw new ErrorResponse('A valid classId is required', 400)
    const cls = await Class.findOne({ _id: classId, students: req.user._id, status: 'active' }).select('students').lean()
    if (!cls) throw new ErrorResponse('Class leaderboard not found', 404)
    studentIds = cls.students
  }

  const data = await getWeeklyLeaderboard({
    studentIds,
    currentStudentId: req.user._id,
    limit: req.query.limit,
  })
  res.json({ success: true, data: { ...data, scope } })
})
