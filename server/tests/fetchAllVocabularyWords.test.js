import { describe, expect, it, vi } from 'vitest'
import { fetchAllVocabularyWords } from '../../src/utils/fetchAllVocabularyWords.js'

describe('fetchAllVocabularyWords', () => {
  it('loads and combines all pages while retaining filters', async () => {
    const api = {
      get: vi.fn()
        .mockResolvedValueOnce({
          data: [{ word: 'first' }, { word: 'second' }],
          page: 1,
          pages: 2,
        })
        .mockResolvedValueOnce({
          data: [{ word: 'third' }],
          page: 2,
          pages: 2,
        }),
    }

    const words = await fetchAllVocabularyWords(api, { category: 'daily life' }, 2)

    expect(words.map(({ word }) => word)).toEqual(['first', 'second', 'third'])
    expect(api.get).toHaveBeenCalledTimes(2)
    expect(api.get.mock.calls.map(([path]) => path)).toEqual([
      '/vocabulary?category=daily+life&page=1&limit=2',
      '/vocabulary?category=daily+life&page=2&limit=2',
    ])
  })

  it('supports a nested response shape and stops on an empty final page', async () => {
    const api = {
      get: vi.fn()
        .mockResolvedValueOnce({ data: { data: [{ word: 'word' }] } })
        .mockResolvedValueOnce({ data: { data: [] } }),
    }

    await expect(fetchAllVocabularyWords(api, {}, 1)).resolves.toEqual([{ word: 'word' }])
    expect(api.get).toHaveBeenCalledTimes(2)
  })
})
