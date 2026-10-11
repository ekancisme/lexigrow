import mongoose from 'mongoose'
import Announcement from '../models/Announcement.js'
import AnnouncementDismissal from '../models/AnnouncementDismissal.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'

const ROLES = ['student', 'teacher', 'parent', 'admin']
const STATUSES = ['draft', 'published', 'archived']

function cleanText(value, label, max, required = false) {
  if (typeof value !== 'string') throw new ErrorResponse(`${label} must be text`, 400)
  const clean = value.replace(/\r\n?/g, '\n').trim()
  if (required && !clean) throw new ErrorResponse(`${label} is required`, 400)
  if (clean.length > max) throw new ErrorResponse(`${label} is too long`, 400)
  return clean
}

function safeMediaUrl(value, label) {
  const clean = cleanText(value || '', label, 2048)
  if (!clean) return ''
  if (clean.startsWith('/') && !clean.startsWith('//') && !clean.includes('\\')) return clean
  let parsed
  try { parsed = new URL(clean) } catch { throw new ErrorResponse(`${label} must be a secure image URL`, 400) }
  if (parsed.protocol !== 'https:') throw new ErrorResponse(`${label} must use HTTPS`, 400)
  return parsed.toString()
}

function safeActionUrl(value) {
  const clean = cleanText(value || '', 'Action URL', 2048)
  if (!clean) return ''
  if (!clean.startsWith('/') || clean.startsWith('//') || clean.includes('\\')) {
    throw new ErrorResponse('Action URL must be a same-site path', 400)
  }
  return clean
}

function normalizePayload(body, actorId, previous = {}) {
  const audience = body.audience ?? previous.audience ?? ['student']
  if (!Array.isArray(audience) || !audience.length || audience.some((role) => !ROLES.includes(role))) {
    throw new ErrorResponse('Select at least one valid audience role', 400)
  }
  const status = body.status ?? previous.status ?? 'draft'
  if (!STATUSES.includes(status)) throw new ErrorResponse('Invalid announcement status', 400)

  const startsAt = new Date(body.startsAt ?? previous.startsAt ?? Date.now())
  const endsAtValue = body.endsAt ?? previous.endsAt ?? null
  const endsAt = endsAtValue ? new Date(endsAtValue) : null
  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) {
    throw new ErrorResponse('Invalid publication dates', 400)
  }
  if (endsAt && endsAt <= startsAt) throw new ErrorResponse('End time must be later than start time', 400)

  const priority = Number(body.priority ?? previous.priority ?? 0)
  if (!Number.isInteger(priority) || priority < 0 || priority > 100) {
    throw new ErrorResponse('Priority must be an integer from 0 to 100', 400)
  }

  const get = (key, label, max, required = false) => cleanText(body[key] ?? previous[key] ?? '', label, max, required)
  const actionUrl = safeActionUrl(body.actionUrl ?? previous.actionUrl ?? '')
  const actionLabelEn = get('actionLabelEn', 'English action label', 80)
  const actionLabelVi = get('actionLabelVi', 'Vietnamese action label', 80)
  const hasAnyActionLabel = Boolean(actionLabelEn || actionLabelVi)
  if (Boolean(actionUrl) !== hasAnyActionLabel || (hasAnyActionLabel && (!actionLabelEn || !actionLabelVi))) {
    throw new ErrorResponse('Provide an action URL and both localized action labels, or leave all three empty', 400)
  }

  return {
    titleEn: get('titleEn', 'English title', 140, true),
    titleVi: get('titleVi', 'Vietnamese title', 140, true),
    bodyEn: get('bodyEn', 'English message', 10000, true),
    bodyVi: get('bodyVi', 'Vietnamese message', 10000, true),
    bannerUrl: safeMediaUrl(body.bannerUrl ?? previous.bannerUrl ?? '', 'Banner URL'),
    imageUrl: safeMediaUrl(body.imageUrl ?? previous.imageUrl ?? '', 'Image URL'),
    imageAltEn: get('imageAltEn', 'English image description', 250),
    imageAltVi: get('imageAltVi', 'Vietnamese image description', 250),
    actionLabelEn,
    actionLabelVi,
    actionUrl,
    audience: [...new Set(audience)],
    status,
    startsAt,
    endsAt,
    priority,
    updatedBy: actorId,
  }
}

export const listAnnouncements = asyncHandler(async (req, res) => {
  const data = await Announcement.find().sort({ updatedAt: -1 }).limit(200).lean()
  res.json({ success: true, data })
})

export const createAnnouncement = asyncHandler(async (req, res) => {
  const payload = normalizePayload(req.body, req.user._id)
  const data = await Announcement.create({ ...payload, createdBy: req.user._id })
  res.status(201).json({ success: true, data })
})

export const updateAnnouncement = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ErrorResponse('Announcement not found', 404)
  const announcement = await Announcement.findById(req.params.id)
  if (!announcement) throw new ErrorResponse('Announcement not found', 404)
  Object.assign(announcement, normalizePayload(req.body, req.user._id, announcement.toObject()))
  await announcement.save()
  res.json({ success: true, data: announcement })
})

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ErrorResponse('Announcement not found', 404)
  const deleted = await Announcement.findByIdAndDelete(req.params.id)
  if (!deleted) throw new ErrorResponse('Announcement not found', 404)
  await AnnouncementDismissal.deleteMany({ announcement: deleted._id })
  res.json({ success: true })
})

export const getActiveAnnouncements = asyncHandler(async (req, res) => {
  const now = new Date()
  const dismissed = await AnnouncementDismissal.find({
    user: req.user._id,
    suppressedUntil: { $gt: now },
  }).distinct('announcement')
  const data = await Announcement.find({
    status: 'published',
    audience: req.user.role,
    startsAt: { $lte: now },
    $or: [{ endsAt: null }, { endsAt: { $gt: now } }],
    _id: { $nin: dismissed },
  }).sort({ priority: -1, startsAt: -1, createdAt: -1 }).limit(10).select(
    'titleEn titleVi bodyEn bodyVi bannerUrl imageUrl imageAltEn imageAltVi actionLabelEn actionLabelVi actionUrl priority startsAt endsAt'
  ).lean()
  res.json({ success: true, data })
})

export const suppressAnnouncementForDay = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ErrorResponse('Announcement not found', 404)
  const now = new Date()
  const announcement = await Announcement.findOne({
    _id: req.params.id,
    status: 'published',
    audience: req.user.role,
    startsAt: { $lte: now },
    $or: [{ endsAt: null }, { endsAt: { $gt: now } }],
  }).select('_id')
  if (!announcement) throw new ErrorResponse('Announcement not found', 404)

  const filter = { user: req.user._id, announcement: announcement._id }
  const update = { $set: { suppressedUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000) } }
  try {
    await AnnouncementDismissal.updateOne(filter, update, { upsert: true })
  } catch (error) {
    if (error?.code !== 11000) throw error
    await AnnouncementDismissal.updateOne(filter, update)
  }
  res.json({ success: true, suppressedUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000) })
})
