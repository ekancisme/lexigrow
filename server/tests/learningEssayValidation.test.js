import { describe, expect, it } from 'vitest'
import { isValidLearningEssayWordCount } from '../../src/utils/learningEssay.js'

describe('learning-session essay word limits', () => {
  it.each([
    [0, false],
    [59, false],
    [60, true],
    [100, true],
    [101, false],
    [60.5, false],
  ])('validates %i words as %s', (wordCount, expected) => {
    expect(isValidLearningEssayWordCount(wordCount)).toBe(expected)
  })
})
