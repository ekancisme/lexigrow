import { vi, describe, it, expect, beforeEach } from 'vitest'
import { checkCrossStudentPlagiarism } from '../src/services/plagiarism.service.js'
import { detectAIWriting } from '../src/services/huggingface.service.js'
import Essay from '../src/models/Essay.js'

// Mock Essay model
vi.mock('../src/models/Essay.js', () => {
  const mockFind = vi.fn()
  return {
    default: {
      find: mockFind
    }
  }
})

describe('Plagiarism Service - 3-Grams Jaccard Similarity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should flag plagiarism if Jaccard similarity of 3-grams is >= 0.25', async () => {
    const essayText = 'In this essay, I will delve into the tapestry of human history. The beacon of hope shines bright in the cradle of civilization.'
    
    // Matched essay with slight changes
    const matchedEssayContent = 'In this essay, I will delve into the tapestry of human history. The beacon of hope shines bright in the cradle of civilization and love.'
    
    const mockEssays = [
      {
        _id: 'matched_essay_id',
        title: 'Matched Essay',
        content: matchedEssayContent
      },
      {
        _id: 'different_essay_id',
        title: 'Different Essay',
        content: 'This is a completely different text talking about technology and algorithms in science.'
      }
    ]

    const mockSelect = vi.fn().mockResolvedValue(mockEssays)
    Essay.find.mockReturnValue({
      select: mockSelect
    })

    const result = await checkCrossStudentPlagiarism('new_essay_id', essayText)

    expect(Essay.find).toHaveBeenCalledWith({
      _id: { $ne: 'new_essay_id' },
      status: { $in: ['submitted', 'reviewed'] }
    })
    expect(result.isPlagiarized).toBe(true)
    expect(result.similarityScore).toBeGreaterThanOrEqual(0.25)
    expect(result.matchedEssay).toBe('matched_essay_id')
  })

  it('should not flag plagiarism if texts are completely different', async () => {
    const essayText = 'In this essay, I will discuss the benefits of learning foreign languages in the modern globalized world.'
    
    const mockEssays = [
      {
        _id: 'other_essay_id',
        title: 'Other Essay',
        content: 'This is a completely different text talking about biology, cells, photosynthesis and plant growth.'
      }
    ]

    const mockSelect = vi.fn().mockResolvedValue(mockEssays)
    Essay.find.mockReturnValue({
      select: mockSelect
    })

    const result = await checkCrossStudentPlagiarism('new_essay_id', essayText)

    expect(result.isPlagiarized).toBe(false)
    expect(result.similarityScore).toBeLessThan(0.25)
    expect(result.matchedEssay).toBeNull()
  })
})

describe('AI Writing Detection Service - Local Heuristics Fallback', () => {
  it('should not flag AI writing on normal natural text', async () => {
    const text = 'Yesterday, I walked to the park and met my friends. We sat on the grass, talked about our childhood memories, and had some delicious ice cream. It was a very pleasant day.'
    
    const result = await detectAIWriting(text)
    // Heuristic score should be low
    expect(result.isAI).toBe(false)
    expect(result.score).toBeLessThan(0.75)
  })

  it('should flag AI writing if too many ChatGPT marker words and low burstiness exist', async () => {
    // Text packed with transitional markers and repetitive structure typical of AI
    const aiText = 'Furthermore, we must delve into the tapestry of life. Moreover, it is crucial to analyze this phenomenon. Ultimately, this plays a vital role in our understanding. Therefore, in conclusion, this demystifies the beacon of hope.'
    
    const result = await detectAIWriting(aiText)
    
    expect(result.isAI).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(0.75)
  })
})

// Mock AIAnalysis model to prevent OverwriteModelError on dynamic re-import
vi.mock('../src/models/AIAnalysis.js', () => ({
  default: {
    findOneAndUpdate: vi.fn(),
    find: vi.fn()
  }
}))

// Mock Vocabulary model to prevent OverwriteModelError on dynamic re-import
vi.mock('../src/models/Vocabulary.js', () => ({
  default: {
    find: vi.fn(),
    bulkWrite: vi.fn()
  }
}))

// Mock Config model
vi.mock('../src/models/Config.js', () => {
  return {
    default: {
      findOne: vi.fn().mockResolvedValue({ value: 'gsk_valid_mock_key_for_testing' })
    }
  }
})

// Mock AILog model
vi.mock('../src/models/AILog.js', () => {
  return {
    default: {
      create: vi.fn().mockResolvedValue({})
    }
  }
})

// Mock groq-sdk
vi.mock('groq-sdk', () => {
  const mockCreate = vi.fn().mockImplementation(async (options) => {
    if (options.response_format && options.response_format.type === 'json_object') {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                errors: [
                  {
                    error: 'he go',
                    correction: 'he went',
                    explanation: 'Should use past tense.'
                  }
                ]
              })
            }
          }
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20 }
      }
    }
    return {
      choices: [
        {
          message: {
            content: 'He went to school yesterday.'
          }
        }
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20 }
    }
  })

  return {
    default: class MockGroq {
      constructor() {
        this.chat = {
          completions: {
            create: mockCreate
          }
        }
      }
    }
  }
})

describe('AI Helper Service', () => {
  it('should process spellcheck and return error objects', async () => {
    // Mock groq-sdk at the module level before importing the service
    vi.doMock('groq-sdk', () => {
      const mockCreate = vi.fn().mockImplementation(async (options) => {
        if (options.response_format && options.response_format.type === 'json_object') {
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    errors: [
                      { error: 'he go', correction: 'he went', explanation: 'Should use past tense.' }
                    ]
                  })
                }
              }
            ],
            usage: { prompt_tokens: 10, completion_tokens: 20 }
          }
        }
        return {
          choices: [
            {
              message: {
                content: 'He went to school yesterday.'
              }
            }
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20 }
        }
      })

      return {
        default: class MockGroq {
          constructor() {
            this.chat = {
              completions: {
                create: mockCreate
              }
            }
          }
        }
      }
    })

    // Reset module cache and dynamically import the service after mock
    vi.resetModules()
    const { runAIHelperService } = await import('../src/services/ai.service.js')
    const text = 'he go to school yesterday'
    const result = await runAIHelperService(text, 'spellcheck')
    expect(result).toBeInstanceOf(Array)
    expect(result[0].error).toBe('he go')
    expect(result[0].correction).toBe('he went')
  })

  it('should process improve and return polished text', async () => {
    // Mock groq-sdk at the module level before importing the service
    vi.doMock('groq-sdk', () => {
      const mockCreate = vi.fn().mockImplementation(async (options) => {
        if (options.response_format && options.response_format.type === 'json_object') {
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    errors: [
                      { error: 'he go', correction: 'he went', explanation: 'Should use past tense.' }
                    ]
                  })
                }
              }
            ],
            usage: { prompt_tokens: 10, completion_tokens: 20 }
          }
        }
        return {
          choices: [
            {
              message: {
                content: 'He went to school yesterday.'
              }
            }
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20 }
        }
      })

      return {
        default: class MockGroq {
          constructor() {
            this.chat = {
              completions: {
                create: mockCreate
              }
            }
          }
        }
      }
    })

    // Reset module cache and dynamically import the service after mock
    vi.resetModules()
    const { runAIHelperService } = await import('../src/services/ai.service.js')
    const text = 'he go to school yesterday'
    const result = await runAIHelperService(text, 'improve')
    expect(result).toBe('He went to school yesterday.')
  })
})
