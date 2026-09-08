import { describe, it, expect, vi } from 'vitest'
vi.mock('../src/models/AILog.js', () => ({ default: { create: vi.fn() } }))
import {
  validateAnalysis,
  analyzeVocabulary,
  compareRevisions,
} from '../src/services/vocabularyAnalysis.service.js'
import AILog from '../src/models/AILog.js'
const result = (extra = {}) => ({
  summary: 'Tốt',
  strengths: ['Từ đúng'],
  priorities: [],
  lexicalSuggestions: [],
  targetWordResults: [
    {
      word: 'routine',
      found: true,
      matchedText: 'daily routine',
      status: 'correct',
      issueType: null,
      explanationVi: 'Đúng',
      suggestedUpgrade: null,
      ...extra,
    },
  ],
})
describe('Vocabulary AI boundary', () => {
  it('keeps verified exact quotes and offsets', () => {
    const r = validateAnalysis(result(), 'My daily routine is simple.', [
      'routine',
    ])
    expect(r.targetWordResults[0]).toMatchObject({
      quoteVerified: true,
      start: 3,
      end: 16,
    })
  })
  it('rejects hallucinated quotes before evidence can be saved', () => {
    expect(() =>
      validateAnalysis(result(), 'I go to work.', ['routine']),
    ).toThrow()
  })
  it('rejects quoting unrelated text as the target word', () => {
    expect(() =>
      validateAnalysis(result({ matchedText: 'go to work' }), 'I go to work.', [
        'routine',
      ]),
    ).toThrow()
  })
  it('rejects missing, extra and duplicate targets', () => {
    expect(() =>
      validateAnalysis(result(), 'My daily routine.', ['routine', 'commute']),
    ).toThrow()
    const r = result()
    r.targetWordResults.push(r.targetWordResults[0])
    expect(() =>
      validateAnalysis(r, 'My daily routine.', ['routine']),
    ).toThrow()
  })
  it('does not turn not-used into correct evidence', () => {
    const r = validateAnalysis(
      result({ found: false, matchedText: '', status: 'not_used' }),
      'I go to work.',
      ['routine'],
    )
    expect(r.targetWordResults[0].quoteVerified).toBe(false)
  })
  it('rejects invalid output types', () => {
    expect(() =>
      validateAnalysis({ ...result(), strengths: 'bad' }, 'My daily routine.', [
        'routine',
      ]),
    ).toThrow()
  })
  it('records provider usage without logging essay text', async () => {
    const generate = vi
      .fn()
      .mockResolvedValue({
        response: {
          text: () => JSON.stringify(result()),
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 20,
            totalTokenCount: 30,
          },
        },
      })
    await analyzeVocabulary('My daily routine.', ['routine'], {
      generate,
      model: 'test-gemini',
    })
    expect(AILog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tokensUsed: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        status: 'success',
      }),
    )
    expect(JSON.stringify(AILog.create.mock.calls)).not.toContain(
      'My daily routine',
    )
  })
  it('logs failed calls and surfaces malformed provider JSON', async () => {
    const generate = vi
      .fn()
      .mockResolvedValue({ response: { text: () => '{bad' } })
    await expect(
      analyzeVocabulary('My daily routine.', ['routine'], {
        generate,
        model: 'test',
      }),
    ).rejects.toMatchObject({ statusCode: 502 })
  })
  it('compares improvement by target, not array position', () => {
    expect(
      compareRevisions(result({ status: 'incorrect' }), result()).resolvedWords,
    ).toEqual(['routine'])
  })
})
