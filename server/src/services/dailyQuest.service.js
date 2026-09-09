import ErrorResponse from '../utils/ErrorResponse.js'
import { wordCells } from './crossword.service.js'

export function publicQuest(quest, overrideCells = null) {
  const cells = overrideCells !== null
    ? overrideCells
    : (quest.cells instanceof Map ? Object.fromEntries(quest.cells) : quest.cells)
  return {
    id: String(quest._id),
    day: quest.day,
    timezone: 'Asia/Ho_Chi_Minh',
    version: quest.version,
    rows: quest.rows,
    cols: quest.cols,
    revision: quest.revision,
    cells: cells || {},
    solved: quest.solved,
    assisted: quest.assisted,
    startedAt: quest.startedAt,
    completedAt: quest.completedAt,
    reward: quest.reward,
    words: quest.words.map(
      ({ id, number, row, col, direction, answer, clue, clueVi, example, source }) => ({
        id,
        number,
        row,
        col,
        direction,
        length: answer.length,
        clue,
        clueVi,
        example,
        source,
        ...(quest.completedAt ? { answer } : {}),
      }),
    ),
  }
}

// All changes to a play session are persisted together with optimistic locking.
export function applyPlay(quest, body, now = new Date()) {
  if (!['save', 'check', 'hint'].includes(body.action) || !Number.isInteger(body.revision))
    throw new ErrorResponse('Invalid quest action', 400)
  if (!body.cells || typeof body.cells !== 'object' || Array.isArray(body.cells))
    throw new ErrorResponse('Invalid cells', 400)
  const allowed = new Set(quest.words.flatMap(wordCells))
  const cells = {}
  for (const [key, value] of Object.entries(body.cells)) {
    if (!allowed.has(key) || typeof value !== 'string' || !/^[A-Z]?$/.test(value))
      throw new ErrorResponse('Invalid cell value', 400)
    if (value) cells[key] = value
  }
  const solved = [...quest.solved],
    assisted = [...quest.assisted]
  for (const word of quest.words.filter((w) => solved.includes(w.id)))
    wordCells(word).forEach((key, i) => {
      cells[key] = word.answer[i]
    })
  let correct = null
  if (body.action !== 'save') {
    const word = quest.words.find((w) => w.id === body.wordId)
    if (!word) throw new ErrorResponse('Unknown clue', 400)
    if (body.action === 'hint' && !solved.includes(word.id)) {
      wordCells(word).forEach((key, i) => {
        cells[key] = word.answer[i]
      })
      if (!assisted.includes(word.id)) assisted.push(word.id)
    }
    correct =
      wordCells(word)
        .map((key) => cells[key] || '')
        .join('') === word.answer
    if (correct && !solved.includes(word.id)) solved.push(word.id)
  }
  const completed = solved.length === quest.words.length
  return {
    correct,
    update: {
      cells,
      solved,
      assisted,
      startedAt: quest.startedAt || now,
      checks: quest.checks + (body.action === 'check' ? 1 : 0),
      ...(completed ? { completedAt: now, reward: 1 } : {}),
    },
  }
}