import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'
import { fail, timezone } from '../utils/learning.js'
export const getLearningProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user.learningProfile || {
      interests: [],
      targetLevel: 'B1',
      dailyGoalMinutes: 10,
      onboardingCompleted: false,
      timezone: 'Asia/Ho_Chi_Minh',
    },
  })
})
export const updateLearningProfile = asyncHandler(async (req, res) => {
  const allowed = [
    'interests',
    'targetLevel',
    'dailyGoalMinutes',
    'onboardingCompleted',
    'timezone',
  ]
  if (!req.body || Object.keys(req.body).some((k) => !allowed.includes(k)))
    fail('Unknown learning profile field')
  const b = req.body,
    updates = {}
  if (b.interests !== undefined) {
    if (
      !Array.isArray(b.interests) ||
      b.interests.length > 10 ||
      b.interests.some(
        (s) => typeof s !== 'string' || !s.trim() || s.length > 60,
      )
    )
      fail('Invalid interests')
    updates['learningProfile.interests'] = [
      ...new Set(b.interests.map((s) => s.trim())),
    ]
  }
  if (
    b.targetLevel !== undefined &&
    !['A2', 'B1', 'B2', 'C1'].includes(b.targetLevel)
  )
    fail('Invalid targetLevel')
  if (
    b.dailyGoalMinutes !== undefined &&
    ![5, 10, 15, 20].includes(b.dailyGoalMinutes)
  )
    fail('Invalid dailyGoalMinutes')
  if (
    b.onboardingCompleted !== undefined &&
    typeof b.onboardingCompleted !== 'boolean'
  )
    fail('Invalid onboardingCompleted')
  if (b.timezone !== undefined) timezone(b.timezone)
  for (const k of allowed.filter((k) => k !== 'interests'))
    if (b[k] !== undefined) updates['learningProfile.' + k] = b[k]
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { returnDocument: 'after', runValidators: true },
  )
  res.json({ success: true, data: user.learningProfile })
})
