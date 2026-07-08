import GlobalVocabulary from '../models/GlobalVocabulary.js'
import AuditLog from '../models/AuditLog.js'
import asyncHandler from '../utils/asyncHandler.js'
import ErrorResponse from '../utils/ErrorResponse.js'

/**
 * @desc    Get global vocabulary library with search, filter, and pagination
 * @route   GET /api/admin/global-vocabulary
 * @access  Private (Admin)
 */
export const getGlobalVocabularies = asyncHandler(async (req, res) => {
  const { search, cefr, awl, page = 1, limit = 10 } = req.query
  const query = {}

  // Filters
  if (cefr) {
    query.cefr = cefr
  }
  if (awl) {
    if (awl === 'yes') {
      query.awl = { $ne: '' }
    } else if (awl === 'no') {
      query.awl = ''
    } else {
      query.awl = { $regex: awl, $options: 'i' }
    }
  }
  if (search) {
    query.$or = [
      { word: { $regex: search, $options: 'i' } },
      { definition: { $regex: search, $options: 'i' } }
    ]
  }

  const pageNum = parseInt(page, 10) || 1
  const limitNum = parseInt(limit, 10) || 10
  const skip = (pageNum - 1) * limitNum

  const words = await GlobalVocabulary.find(query)
    .sort({ word: 1 })
    .skip(skip)
    .limit(limitNum)

  const total = await GlobalVocabulary.countDocuments(query)

  // Get statistics for the dashboard/widget
  const totalCount = await GlobalVocabulary.countDocuments()
  const cefrStats = await GlobalVocabulary.aggregate([
    { $group: { _id: '$cefr', count: { $sum: 1 } } }
  ])
  const awlCount = await GlobalVocabulary.countDocuments({ awl: { $ne: '' } })

  const cefrMap = cefrStats.reduce((acc, curr) => {
    acc[curr._id] = curr.count
    return acc
  }, { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 })

  res.status(200).json({
    success: true,
    data: words,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    },
    stats: {
      totalCount,
      awlCount,
      cefr: cefrMap
    }
  })
})

/**
 * @desc    Get a single global vocabulary by ID
 * @route   GET /api/admin/global-vocabulary/:id
 * @access  Private (Admin)
 */
export const getGlobalVocabularyById = asyncHandler(async (req, res) => {
  const word = await GlobalVocabulary.findById(req.params.id)

  if (!word) {
    throw new ErrorResponse('Word not found in global vocabulary', 404)
  }

  res.status(200).json({
    success: true,
    data: word
  })
})

/**
 * @desc    Create a new global vocabulary word
 * @route   POST /api/admin/global-vocabulary
 * @access  Private (Admin)
 */
export const createGlobalVocabulary = asyncHandler(async (req, res) => {
  const { word, ipa, partOfSpeech, definition, cefr, awl } = req.body

  if (!word || !definition) {
    throw new ErrorResponse('Word and definition are required', 400)
  }

  const normalizedWord = word.trim().toLowerCase()

  // Check if exists
  const existing = await GlobalVocabulary.findOne({ word: normalizedWord })
  if (existing) {
    throw new ErrorResponse('Word already exists in global vocabulary database', 400)
  }

  const newWord = await GlobalVocabulary.create({
    word: normalizedWord,
    ipa: ipa ? ipa.trim() : '',
    partOfSpeech: partOfSpeech || 'noun',
    definition: definition.trim(),
    cefr: cefr || 'B1',
    awl: awl ? awl.trim() : ''
  })

  // Create Audit Log
  await AuditLog.create({
    user: req.user._id,
    action: 'CREATE_GLOBAL_VOCABULARY',
    targetType: 'GlobalVocabulary',
    targetId: newWord._id.toString(),
    details: { word: normalizedWord }
  })

  res.status(201).json({
    success: true,
    data: newWord
  })
})

/**
 * @desc    Update a global vocabulary word
 * @route   PUT /api/admin/global-vocabulary/:id
 * @access  Private (Admin)
 */
export const updateGlobalVocabulary = asyncHandler(async (req, res) => {
  const { word, ipa, partOfSpeech, definition, cefr, awl } = req.body

  let vocabulary = await GlobalVocabulary.findById(req.params.id)
  if (!vocabulary) {
    throw new ErrorResponse('Word not found in global vocabulary', 404)
  }

  const oldWord = vocabulary.word
  const normalizedWord = word ? word.trim().toLowerCase() : vocabulary.word

  // Check if new word name clashes with another word
  if (normalizedWord !== oldWord) {
    const existing = await GlobalVocabulary.findOne({ word: normalizedWord })
    if (existing) {
      throw new ErrorResponse('New word name already exists in database', 400)
    }
  }

  vocabulary.word = normalizedWord
  vocabulary.ipa = ipa !== undefined ? ipa.trim() : vocabulary.ipa
  vocabulary.partOfSpeech = partOfSpeech || vocabulary.partOfSpeech
  vocabulary.definition = definition !== undefined ? definition.trim() : vocabulary.definition
  vocabulary.cefr = cefr || vocabulary.cefr
  vocabulary.awl = awl !== undefined ? awl.trim() : vocabulary.awl

  const updatedWord = await vocabulary.save()

  // Create Audit Log
  await AuditLog.create({
    user: req.user._id,
    action: 'UPDATE_GLOBAL_VOCABULARY',
    targetType: 'GlobalVocabulary',
    targetId: updatedWord._id.toString(),
    details: {
      oldWord,
      newWord: normalizedWord,
      fieldsUpdated: Object.keys(req.body)
    }
  })

  res.status(200).json({
    success: true,
    data: updatedWord
  })
})

/**
 * @desc    Delete a global vocabulary word
 * @route   DELETE /api/admin/global-vocabulary/:id
 * @access  Private (Admin)
 */
export const deleteGlobalVocabulary = asyncHandler(async (req, res) => {
  const vocabulary = await GlobalVocabulary.findById(req.params.id)
  if (!vocabulary) {
    throw new ErrorResponse('Word not found in global vocabulary', 404)
  }

  const wordName = vocabulary.word

  await vocabulary.deleteOne()

  // Create Audit Log
  await AuditLog.create({
    user: req.user._id,
    action: 'DELETE_GLOBAL_VOCABULARY',
    targetType: 'GlobalVocabulary',
    targetId: req.params.id,
    details: { word: wordName }
  })

  res.status(200).json({
    success: true,
    message: `Word '${wordName}' has been successfully deleted`
  })
})

/**
 * @desc    Import global vocabulary from a JSON array (batch upsert)
 * @route   POST /api/admin/global-vocabulary/import
 * @access  Private (Admin)
 */
export const importGlobalVocabularies = asyncHandler(async (req, res) => {
  const { words } = req.body

  if (!words || !Array.isArray(words)) {
    throw new ErrorResponse('Please provide an array of words to import', 400)
  }

  if (words.length === 0) {
    return res.status(200).json({
      success: true,
      createdCount: 0,
      updatedCount: 0,
      message: 'No words to process'
    })
  }

  // Pre-validate & format data, keeping track of errors
  const validOps = []
  const errors = []

  const allowedPartsOfSpeech = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'phrase', 'other']
  const allowedCefr = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

  words.forEach((item, index) => {
    const lineNum = index + 1
    const rawWord = item.word || item.Word
    const rawDef = item.definition || item.Definition
    const rawIpa = item.ipa || item.IPA || ''
    const rawPos = item.partOfSpeech || item.partOfSpeechVal || item['Part of Speech'] || 'noun'
    const rawCefr = item.cefr || item.CEFR || 'B1'
    const rawAwl = item.awl || item.AWL || ''

    if (!rawWord || !rawWord.trim()) {
      errors.push({ line: lineNum, message: 'Từ vựng (Word) không được để trống' })
      return
    }

    if (!rawDef || !rawDef.trim()) {
      errors.push({ line: lineNum, word: rawWord, message: 'Định nghĩa (Definition) không được để trống' })
      return
    }

    const word = rawWord.trim().toLowerCase()
    const definition = rawDef.trim()
    const ipa = rawIpa.trim()
    const partOfSpeech = rawPos.trim().toLowerCase()
    const cefr = rawCefr.trim().toUpperCase()
    const awl = rawAwl.trim()

    // Validate POS
    if (!allowedPartsOfSpeech.includes(partOfSpeech)) {
      errors.push({ line: lineNum, word, message: `Từ loại '${partOfSpeech}' không hợp lệ. Phải là một trong: ${allowedPartsOfSpeech.join(', ')}` })
      return
    }

    // Validate CEFR
    if (!allowedCefr.includes(cefr)) {
      errors.push({ line: lineNum, word, message: `Cấp độ CEFR '${cefr}' không hợp lệ. Phải là một trong: ${allowedCefr.join(', ')}` })
      return
    }

    validOps.push({
      word,
      ipa,
      partOfSpeech,
      definition,
      cefr,
      awl
    })
  })

  // Perform bulk upsert operations
  let createdCount = 0
  let updatedCount = 0

  if (validOps.length > 0) {
    const bulkOps = validOps.map(op => ({
      updateOne: {
        filter: { word: op.word },
        update: { $set: op },
        upsert: true
      }
    }))

    const result = await GlobalVocabulary.bulkWrite(bulkOps)
    
    // In bulkWrite result, upsertedCount is newly created docs, 
    // modifiedCount (or matchedCount - upsertedCount) is updated docs.
    createdCount = result.upsertedCount
    // If it's upserted, it matches the filter but gets created.
    // If it's modified, it existed and was updated. If it matched but wasn't modified (same content),
    // we can still count it as updated or unchanged. Let's count modifiedCount + upsertedCount.
    updatedCount = result.modifiedCount || (result.matchedCount - result.upsertedCount)
    if (updatedCount < 0) updatedCount = 0

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'IMPORT_GLOBAL_VOCABULARY',
      targetType: 'GlobalVocabulary',
      details: {
        totalImported: validOps.length,
        createdCount,
        updatedCount,
        errorsCount: errors.length
      }
    })
  }

  res.status(200).json({
    success: true,
    createdCount,
    updatedCount,
    errors,
    message: `Đã xử lý xong. Thêm mới: ${createdCount}, Cập nhật: ${updatedCount}, Lỗi: ${errors.length}`
  })
})

/**
 * @desc    Export all global vocabulary words to a CSV file
 * @route   GET /api/admin/global-vocabulary/export
 * @access  Private (Admin)
 */
export const exportGlobalVocabularies = asyncHandler(async (req, res) => {
  const vocabularies = await GlobalVocabulary.find().sort({ word: 1 })

  // Build CSV content
  let csvContent = '\ufeffsep=,\nWord,IPA,Part of Speech,Definition,CEFR,AWL\n'
  
  vocabularies.forEach(v => {
    const word = `"${v.word.replace(/"/g, '""')}"`
    const ipa = `"${(v.ipa || '').replace(/"/g, '""')}"`
    const partOfSpeech = `"${(v.partOfSpeech || '').replace(/"/g, '""')}"`
    const definition = `"${(v.definition || '').replace(/"/g, '""')}"`
    const cefr = `"${(v.cefr || '').replace(/"/g, '""')}"`
    const awl = `"${(v.awl || '').replace(/"/g, '""')}"`

    csvContent += `${word},${ipa},${partOfSpeech},${definition},${cefr},${awl}\n`
  })

  // Create Audit Log
  await AuditLog.create({
    user: req.user._id,
    action: 'EXPORT_GLOBAL_VOCABULARY',
    targetType: 'GlobalVocabulary',
    details: { totalWordsExported: vocabularies.length }
  })

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename=global_vocabulary.csv')
  res.status(200).send(csvContent)
})
