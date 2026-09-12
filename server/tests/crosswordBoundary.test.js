import { describe, expect, it } from 'vitest'
import { prepareWords } from '../src/services/crossword.service.js'

describe('crossword word-boundary masking (LG-40)', () => {
  it('does not mask a substring inside a longer word', () => {
    const [entry] = prepareWords([
      { word: 'cat', definition: 'CONCATENATE means to link things together.' },
    ])
    expect(entry.clue).toContain('CONCATENATE')
    expect(entry.clue).not.toContain('_____')
  })

  it('masks a standalone occurrence of the answer', () => {
    const [entry] = prepareWords([
      { word: 'cat', definition: 'A cat is a small animal. Concatenate joins strings.' },
    ])
    expect(entry.clue).toContain('_____')
    expect(entry.clue).toContain('Concatenate')
  })
})