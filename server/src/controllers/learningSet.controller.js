import LearningSet from '../models/LearningSet.js'
import AuditLog from '../models/AuditLog.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'

const parsePositiveInteger = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback
}

/**
 * @desc    Get published learning sets with optional filters and pagination
 * @route   GET /api/learning-sets
 * @access  Private
 */
export const getLearningSets = asyncHandler(async (req, res) => {
  const { category, level, page = 1, limit = 20 } = req.query
  const query = { status: 'published' }

  if (category) {
    query.category = category
  }
  if (level) {
    query.level = level
  }

  const pageNum = parsePositiveInteger(page, 1)
  const limitNum = parsePositiveInteger(limit, 20, 100)
  const skip = (pageNum - 1) * limitNum

  const sets = await LearningSet.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)

  const total = await LearningSet.countDocuments(query)

  res.status(200).json({
    success: true,
    data: sets,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  })
})

/**
 * @desc    Get a single published learning set by slug
 * @route   GET /api/learning-sets/:slug
 * @access  Private
 */
export const getLearningSetBySlug = asyncHandler(async (req, res) => {
  const learningSet = await LearningSet.findOne({
    slug: req.params.slug,
    status: 'published'
  })

  if (!learningSet) {
    throw new ErrorResponse('Learning set not found', 404)
  }

  res.status(200).json({
    success: true,
    data: learningSet
  })
})

/**
 * @desc    Create a new learning set
 * @route   POST /api/learning-sets
 * @access  Private (Admin)
 */
export const createLearningSet = asyncHandler(async (req, res) => {
  const { slug, title, description, level, category, status, items } = req.body

  if (!slug || !title || !description) {
    throw new ErrorResponse('Slug, title, and description are required', 400)
  }

  const normalizedSlug = slug.trim().toLowerCase()

  const existing = await LearningSet.findOne({ slug: normalizedSlug })
  if (existing) {
    throw new ErrorResponse(`Learning set with slug '${normalizedSlug}' already exists`, 400)
  }

  const newSet = await LearningSet.create({
    slug: normalizedSlug,
    title: title.trim(),
    description: description.trim(),
    level,
    category,
    status: status || 'draft',
    items: items || []
  })

  await AuditLog.create({
    user: req.user._id,
    action: 'CREATE_LEARNING_SET',
    targetType: 'LearningSet',
    targetId: newSet._id.toString(),
    details: { slug: normalizedSlug }
  })

  res.status(201).json({
    success: true,
    data: newSet
  })
})

/**
 * @desc    Update a learning set
 * @route   PUT /api/learning-sets/:slug
 * @access  Private (Admin)
 */
export const updateLearningSet = asyncHandler(async (req, res) => {
  const { title, description, level, category, status, items } = req.body

  let learningSet = await LearningSet.findOne({ slug: req.params.slug })
  if (!learningSet) {
    throw new ErrorResponse('Learning set not found', 404)
  }

  if (title !== undefined) learningSet.title = title.trim()
  if (description !== undefined) learningSet.description = description.trim()
  if (level !== undefined) learningSet.level = level
  if (category !== undefined) learningSet.category = category
  if (status !== undefined) learningSet.status = status
  if (items !== undefined) learningSet.items = items

  const updatedSet = await learningSet.save()

  await AuditLog.create({
    user: req.user._id,
    action: 'UPDATE_LEARNING_SET',
    targetType: 'LearningSet',
    targetId: updatedSet._id.toString(),
    details: {
      slug: req.params.slug,
      fieldsUpdated: Object.keys(req.body)
    }
  })

  res.status(200).json({
    success: true,
    data: updatedSet
  })
})

/**
 * @desc    Delete a learning set
 * @route   DELETE /api/learning-sets/:slug
 * @access  Private (Admin)
 */
export const deleteLearningSet = asyncHandler(async (req, res) => {
  const learningSet = await LearningSet.findOne({ slug: req.params.slug })
  if (!learningSet) {
    throw new ErrorResponse('Learning set not found', 404)
  }

  const setTitle = learningSet.title

  await learningSet.deleteOne()

  await AuditLog.create({
    user: req.user._id,
    action: 'DELETE_LEARNING_SET',
    targetType: 'LearningSet',
    targetId: req.params.slug,
    details: { slug: req.params.slug, title: setTitle }
  })

  res.status(200).json({
    success: true,
    message: `Learning set '${setTitle}' has been successfully deleted`
  })
})