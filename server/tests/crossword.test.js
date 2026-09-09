import { describe, it, expect } from 'vitest'
import {
  generateCrossword,
  STARTER_WORDS,
  prepareWords,
  questDay,
  wordCells,
} from '../src/services/crossword.service.js'

describe('daily crossword generator', () => {
  it('normalizes, deduplicates and masks answers without accepting phrases', () => {
    expect(
      prepareWords([
        { word: ' READ ', definition: 'Read a text.' },
        { word: 'read', definition: 'Duplicate' },
        { word: 'ice-cream', definition: 'Food' },
      ]),
    ).toMatchObject([{ answer: 'READ', clue: '_____ a text.' }])
  })
  it('uses the Vietnam calendar boundary', () => {
    expect(questDay(new Date('2026-09-09T16:59:59Z'))).toBe('2026-09-09')
    expect(questDay(new Date('2026-09-09T17:00:00Z'))).toBe('2026-09-10')
  })
  it('generates repeatable connected puzzles with no unintended words across seeds', () => {
    for (let seed = 0; seed < 30; seed++) {
      const puzzle = generateCrossword(STARTER_WORDS, String(seed))
      expect(puzzle).toEqual(generateCrossword(STARTER_WORDS, String(seed)))
      expect(puzzle.words.length).toBeGreaterThanOrEqual(5)
      expect(puzzle.rows).toBeLessThanOrEqual(11)
      expect(puzzle.cols).toBeLessThanOrEqual(11)
      const cells = new Map()
      for (const word of puzzle.words)
        wordCells(word).forEach((key, i) => {
          if (cells.has(key)) expect(cells.get(key)).toBe(word.answer[i])
          cells.set(key, word.answer[i])
        })
      for (const direction of ['across', 'down']) {
        for (const [key] of cells) {
          const [r, c] = key.split(',').map(Number),
            dr = direction === 'down' ? 1 : 0,
            dc = 1 - dr
          if (cells.has(`${r - dr},${c - dc}`)) continue
          let text = '',
            i = 0
          while (cells.has(`${r + dr * i},${c + dc * i}`))
            text += cells.get(`${r + dr * i},${c + dc * i++}`)
          if (text.length > 1)
            expect(
              puzzle.words.some(
                (w) => w.row === r && w.col === c && w.direction === direction && w.answer === text,
              ),
            ).toBe(true)
        }
      }
      const reached = new Set([puzzle.words[0].id])
      for (let i = 0; i < puzzle.words.length; i++)
        for (const w of puzzle.words) {
          if (
            puzzle.words.some(
              (other) =>
                reached.has(other.id) && wordCells(other).some((k) => wordCells(w).includes(k)),
            )
          )
            reached.add(w.id)
        }
      expect(reached.size).toBe(puzzle.words.length)
    }
  })
  it('handles empty and non-crossing inputs', () => {
    expect(generateCrossword([], 'x').words).toEqual([])
    expect(
      generateCrossword(
        [
          { word: 'aaa', definition: 'A' },
          { word: 'bbb', definition: 'B' },
        ],
        'x',
      ).words,
    ).toHaveLength(1)
  })
})
