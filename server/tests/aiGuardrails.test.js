import { describe, expect, it } from 'vitest'
import {
  validateRecommendedWords,
  validateTopics,
  validateQuizQuestion,
  validateEnrichedWords,
} from '../src/services/aiGuardrails.service.js'
import { classifyProviderError } from '../src/services/aiGateway.service.js'

describe('AI output guardrails', () => {
  it('accepts only bounded unique crossword words', () => {
    expect(validateRecommendedWords({ words: [
      { word: 'garden', definition: 'A place to grow plants', translation: 'Khu vườn', exampleSentence: 'The garden is green.' },
    ] }, { count: 1, crossword: true })).toHaveLength(1)
    expect(validateRecommendedWords({ words: [
      { word: 'two words', definition: 'x', translation: 'x', exampleSentence: 'x' },
    ] }, { count: 1, crossword: true })).toBeNull()
  })

  it('rejects duplicate or incomplete recommendations', () => {
    const item = { word: 'garden', definition: 'A place', translation: 'Vườn', exampleSentence: 'A garden.' }
    expect(validateRecommendedWords({ words: [item, item] }, { count: 2 })).toBeNull()
    expect(validateRecommendedWords({ words: [{ ...item, definition: '' }] }, { count: 1 })).toBeNull()
  })

  it('validates topic count and duplicate content', () => {
    expect(validateTopics({ topics: ['A meaningful topic about schools', 'A meaningful topic about climate', 'A meaningful topic about travel', 'A meaningful topic about books'] })).toHaveLength(4)
    expect(validateTopics({ topics: ['same topic here', 'same topic here', 'another topic here', 'fourth topic here'] })).toBeNull()
  })

  it('requires the correct answer to be one of the options', () => {
    const valid = validateQuizQuestion({ question: 'Choose garden', options: ['garden', 'river'], correctAnswer: 'garden' })
    expect(valid.correctAnswer).toBe('garden')
    expect(validateQuizQuestion({ question: 'Choose garden', options: ['river', 'field'], correctAnswer: 'garden' })).toBeNull()
  })

  it('requires enrichment output to cover exactly the requested words', () => {
    const item = { word: 'garden', ipa: '/g/', partOfSpeech: 'noun', definition: 'A place', exampleSentence: 'A garden.', synonyms: [], antonyms: [] }
    expect(validateEnrichedWords({ enrichedWords: [item] }, ['garden'])).toHaveLength(1)
    expect(validateEnrichedWords({ enrichedWords: [] }, ['garden'])).toBeNull()
  })
})

describe('provider error classification', () => {
  it('marks quota and transport failures retryable', () => {
    expect(classifyProviderError({ status: 429, message: 'rate limit' })).toMatchObject({ code: 'RATE_LIMITED', retryable: true })
    expect(classifyProviderError(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })).retryable).toBe(true)
  })

  it('does not retry malformed requests', () => {
    expect(classifyProviderError({ status: 400, message: 'invalid schema' })).toMatchObject({ code: 'AI_REQUEST_ERROR', retryable: false })
  })
})
