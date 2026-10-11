import ExperienceEvent from '../models/ExperienceEvent.js'

const VN_OFFSET_MS = 7 * 60 * 60 * 1000

export function learningDayKey(date, timezone = 'Asia/Ho_Chi_Minh') {
  const instant = date instanceof Date ? date : new Date(date)
  let parts
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(instant)
  } catch {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(instant)
  }
  const value = (type) => parts.find((part) => part.type === type).value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function currentVietnamWeekStart(now = new Date()) {
  const local = new Date(now.getTime() + VN_OFFSET_MS)
  const day = local.getUTCDay() || 7
  local.setUTCHours(0, 0, 0, 0)
  local.setUTCDate(local.getUTCDate() - day + 1)
  return new Date(local.getTime() - VN_OFFSET_MS)
}

export function getLevelProgress(totalXp = 0) {
  const xp = Math.max(0, Math.floor(Number(totalXp) || 0))
  let level = 1
  const threshold = (value) => 50 * (value - 1) * value
  while (threshold(level + 1) <= xp) level += 1
  const currentLevelXp = threshold(level)
  const nextLevelXp = threshold(level + 1)
  return {
    level,
    totalXp: xp,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel: xp - currentLevelXp,
    xpForNextLevel: nextLevelXp - currentLevelXp,
  }
}

async function insertOnce({ student, source, idempotencyKey, points, sourceRef = '', occurredAt = new Date() }) {
  try {
    await ExperienceEvent.create({ student, source, idempotencyKey, points, sourceRef, occurredAt })
    return true
  } catch (error) {
    if (error?.code === 11000) return false
    throw error
  }
}

// One daily SRS reward keeps retries and repeated ratings from farming XP.
export function awardDailySrsXp(student, dayKey, occurredAt = new Date()) {
  return insertOnce({
    student,
    source: 'srs_daily',
    idempotencyKey: `srs:${dayKey}`,
    points: 5,
    sourceRef: dayKey,
    occurredAt,
  })
}

// Daily quest completion is already verified and persisted by the quest API.
export function awardDailyQuestXp(student, questId, occurredAt = new Date()) {
  return insertOnce({
    student,
    source: 'daily_quest',
    idempotencyKey: `daily-quest:${questId}`,
    points: 20,
    sourceRef: String(questId),
    occurredAt,
  })
}

export async function getExperienceTotals(student, now = new Date()) {
  const weekStart = currentVietnamWeekStart(now)
  const [result] = await ExperienceEvent.aggregate([
    { $match: { student } },
    {
      $group: {
        _id: null,
        totalXp: { $sum: '$points' },
        weeklyXp: {
          $sum: { $cond: [{ $gte: ['$occurredAt', weekStart] }, '$points', 0] },
        },
      },
    },
  ])
  const totalXp = result?.totalXp || 0
  return {
    ...getLevelProgress(totalXp),
    weeklyXp: result?.weeklyXp || 0,
    weekStartsAt: weekStart,
    weekEndsAt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
  }
}

export async function getWeeklyLeaderboard({ studentIds, currentStudentId, now = new Date(), limit = 50 }) {
  const weekStart = currentVietnamWeekStart(now)
  const match = { occurredAt: { $gte: weekStart } }
  if (studentIds) match.student = { $in: studentIds }
  const User = (await import('../models/User.js')).default
  const activeStudentStages = [
    { $lookup: { from: User.collection.name, localField: '_id', foreignField: '_id', as: 'profile' } },
    { $unwind: '$profile' },
    { $match: { 'profile.role': 'student', 'profile.accountStatus': 'active' } },
  ]

  const rows = await ExperienceEvent.aggregate([
    { $match: match },
    { $group: { _id: '$student', weeklyXp: { $sum: '$points' } } },
    ...activeStudentStages,
    { $sort: { weeklyXp: -1, _id: 1 } },
    { $limit: Math.max(1, Math.min(100, Number(limit) || 50)) },
    { $project: { _id: 1, weeklyXp: 1, anonymousNickname: '$profile.anonymousNickname' } },
  ])

  let currentRank = null
  let currentWeeklyXp = 0
  if (currentStudentId) {
    const currentMatch = { ...match, student: currentStudentId }
    const [current] = await ExperienceEvent.aggregate([
      { $match: currentMatch },
      { $group: { _id: '$student', weeklyXp: { $sum: '$points' } } },
    ])
    if (current) {
      currentWeeklyXp = current.weeklyXp
      const [ahead] = await ExperienceEvent.aggregate([
        { $match: match },
        { $group: { _id: '$student', weeklyXp: { $sum: '$points' } } },
        ...activeStudentStages,
        { $match: { $or: [
          { weeklyXp: { $gt: current.weeklyXp } },
          { weeklyXp: current.weeklyXp, _id: { $lt: currentStudentId } },
        ] } },
        { $count: 'count' },
      ])
      currentRank = (ahead?.count || 0) + 1
    }
  }

  const userIds = [...rows.map((row) => row._id)]
  if (currentStudentId && currentRank && !userIds.some((id) => String(id) === String(currentStudentId))) {
    userIds.push(currentStudentId)
  }
  const users = await User.find({
    _id: { $in: userIds },
    role: 'student',
    accountStatus: 'active',
  }).select('_id anonymousNickname').lean()
  const usersById = new Map(users.map((user) => [String(user._id), user]))
  const leaderboard = rows
    .filter((row) => usersById.has(String(row._id)))
    .map((row, index) => {
      const user = usersById.get(String(row._id))
      return {
        rank: index + 1,
        anonymousNickname: row.anonymousNickname || user.anonymousNickname || `Learner ${String(user._id).slice(-4)}`,
        weeklyXp: row.weeklyXp,
        isCurrentUser: String(user._id) === String(currentStudentId),
      }
    })
  if (currentRank && !leaderboard.some((row) => row.isCurrentUser)) {
    const currentUser = usersById.get(String(currentStudentId))
    if (currentUser) leaderboard.push({
      rank: currentRank,
      anonymousNickname: currentUser.anonymousNickname || `Learner ${String(currentUser._id).slice(-4)}`,
      weeklyXp: currentWeeklyXp,
      isCurrentUser: true,
    })
  }

  return { leaderboard, currentRank, weekStartsAt: weekStart, weekEndsAt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) }
}
