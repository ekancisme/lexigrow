import mongoose from 'mongoose'
import { createHash } from 'node:crypto'
import ErrorResponse from './ErrorResponse.js'
export const fail = (message, status = 400) => {
  throw new ErrorResponse(message, status)
}
export const objectId = (id, label = 'id') => {
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id))
    fail('Invalid ' + label)
  return new mongoose.Types.ObjectId(id)
}
export const text = (value, label, max = 500) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    fail('Invalid ' + label)
  return value.trim()
}
export const integer = (value, fallback, min, max) => {
  if (value === undefined) return fallback
  const n =
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value
  if (!Number.isSafeInteger(n) || n < min || n > max) fail('Invalid integer')
  return n
}
export const timezone = (value) => {
  if (typeof value !== 'string') fail('Invalid timezone')
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format()
  } catch {
    fail('Invalid timezone')
  }
  return value
}
export const dayKey = (date, zone = 'UTC') => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type).value
  return get('year') + '-' + get('month') + '-' + get('day')
}
// Binary search the first UTC millisecond belonging to the requested local day;
// handles non-hour UTC offsets and daylight-saving transitions.
export const dayBoundary = (now, days = 0, zone = 'UTC') => {
  const targetDate = new Date(dayKey(now, zone) + 'T12:00:00Z')
  targetDate.setUTCDate(targetDate.getUTCDate() + days)
  const target = targetDate.toISOString().slice(0, 10)
  let lo = targetDate.getTime() - 48 * 3600000,
    hi = targetDate.getTime() + 48 * 3600000
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    if (dayKey(new Date(mid), zone) < target) lo = mid
    else hi = mid
  }
  return new Date(hi)
}
export const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')
export const requestKey = (req) =>
  text(req.get('Idempotency-Key') || req.body.requestId, 'Idempotency-Key', 128)
export const publicLearning = (value) => {
  const data = JSON.parse(
    JSON.stringify(value?.toObject ? value.toObject() : value),
  )
  const strip = (obj) => {
    if (!obj || typeof obj !== 'object') return
    delete obj.correctAnswer
    delete obj.answer
    for (const v of Object.values(obj)) strip(v)
  }
  strip(data)
  return data
}
export const normalizeAnswer = (answer) =>
  answer.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')
