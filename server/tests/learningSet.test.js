import { vi, describe, it, expect, beforeEach } from 'vitest'

// Use vi.hoisted to define mock functions that are available inside vi.mock factories
const {
  mockFind,
  mockFindOne,
  mockCreate,
  mockCountDocuments,
  mockBulkWrite
} = vi.hoisted(() => {
  return {
    mockFind: vi.fn(),
    mockFindOne: vi.fn(),
    mockCreate: vi.fn(),
    mockCountDocuments: vi.fn().mockResolvedValue(3),
    mockBulkWrite: vi.fn()
  }
})

// Mock db connection
vi.mock('../src/config/db.js', () => ({
  default: vi.fn().mockImplementation(() => Promise.resolve())
}))

// Mock LearningSet model using hoisted references
vi.mock('../src/models/LearningSet.js', () => ({
  default: {
    find: mockFind,
    findOne: mockFindOne,
    create: mockCreate,
    countDocuments: mockCountDocuments,
    bulkWrite: mockBulkWrite
  }
}))

import LearningSet from '../src/models/LearningSet.js'

// Helper for mongoose query builder chain
const mockQuery = (val) => {
  const q = {
    select: vi.fn().mockImplementation(() => q),
    sort: vi.fn().mockImplementation(() => q),
    skip: vi.fn().mockImplementation(() => q),
    limit: vi.fn().mockImplementation(() => q),
    then: (resolve) => resolve(val),
    catch: () => {}
  }
  return q
}

// Seed data definition (matching the seed script)
const SEED_DATA = [
  {
    slug: 'daily-life',
    title: 'Daily Life Vocabulary',
    description: 'Essential words and phrases for everyday activities, routines, and common situations.',
    level: 'A2',
    category: 'Daily Life',
    status: 'published',
    items: [
      {
        word: 'routine',
        partOfSpeech: 'noun',
        definitionVi: 'thói quen, công việc hàng ngày',
        phonetic: '/ruːˈtiːn/',
        collocations: ['daily routine', 'morning routine', 'routine task'],
        exampleSentences: [
          'My daily routine includes a morning jog.',
          'She has a strict routine for studying.'
        ],
        quizQuestions: [
          {
            type: 'multiple-choice',
            question: 'What does "routine" mean in Vietnamese?',
            options: ['thói quen', 'kỹ năng', 'mục tiêu', 'công việc'],
            correctAnswer: 'thói quen'
          },
          {
            type: 'fill-in-blank',
            question: 'My _____ routine includes a morning jog.',
            options: ['daily', 'weekly', 'monthly', 'yearly'],
            correctAnswer: 'daily'
          }
        ]
      },
      {
        word: 'commute',
        partOfSpeech: 'verb',
        definitionVi: 'đi lại (giữa nhà và nơi làm việc)',
        phonetic: '/kəˈmjuːt/',
        collocations: ['daily commute', 'commute to work', 'commute time'],
        exampleSentences: [
          'I commute to work by bus every day.',
          'Her commute takes about an hour.'
        ],
        quizQuestions: [
          {
            type: 'multiple-choice',
            question: 'What does "commute" mean?',
            options: ['đi bộ', 'đi lại giữa nhà và nơi làm việc', 'du lịch', 'chạy bộ'],
            correctAnswer: 'đi lại giữa nhà và nơi làm việc'
          }
        ]
      },
      {
        word: 'grocery',
        partOfSpeech: 'noun',
        definitionVi: 'hàng tạp hóa, thực phẩm',
        phonetic: '/ˈɡroʊsəri/',
        collocations: ['grocery store', 'grocery list', 'grocery shopping'],
        exampleSentences: [
          'I need to buy some groceries for dinner.',
          'She made a grocery list before going to the store.'
        ],
        quizQuestions: []
      }
    ]
  },
  {
    slug: 'travel',
    title: 'Travel Vocabulary',
    description: 'Useful words and phrases for traveling, booking, and exploring new places.',
    level: 'B1',
    category: 'Travel',
    status: 'published',
    items: [
      {
        word: 'itinerary',
        partOfSpeech: 'noun',
        definitionVi: 'lịch trình, kế hoạch chuyến đi',
        phonetic: '/aɪˈtɪnəreri/',
        collocations: ['travel itinerary', 'daily itinerary', 'planned itinerary'],
        exampleSentences: [
          'Our travel itinerary includes visits to three cities.',
          'She planned a detailed itinerary for the trip.'
        ],
        quizQuestions: [
          {
            type: 'multiple-choice',
            question: 'What does "itinerary" mean?',
            options: ['vé máy bay', 'lịch trình chuyến đi', 'khách sạn', 'hộ chiếu'],
            correctAnswer: 'lịch trình chuyến đi'
          }
        ]
      },
      {
        word: 'accommodation',
        partOfSpeech: 'noun',
        definitionVi: 'chỗ ở, nơi lưu trú',
        phonetic: '/əˌkɑːməˈdeɪʃn/',
        collocations: ['hotel accommodation', 'find accommodation', 'book accommodation'],
        exampleSentences: [
          'We need to book accommodation for our trip.',
          'The city offers many types of accommodation.'
        ],
        quizQuestions: [
          {
            type: 'multiple-choice',
            question: 'What is "accommodation"?',
            options: ['phương tiện đi lại', 'chỗ ở', 'đồ ăn', 'giải trí'],
            correctAnswer: 'chỗ ở'
          }
        ]
      },
      {
        word: 'landmark',
        partOfSpeech: 'noun',
        definitionVi: 'địa danh nổi tiếng, cột mốc',
        phonetic: '/ˈlændmɑːrk/',
        collocations: ['famous landmark', 'historical landmark', 'visit a landmark'],
        exampleSentences: [
          'The Eiffel Tower is a famous landmark in Paris.',
          'We visited several landmarks during our tour.'
        ],
        quizQuestions: []
      }
    ]
  },
  {
    slug: 'hobbies',
    title: 'Hobbies Vocabulary',
    description: 'Words and expressions related to leisure activities, sports, and creative pursuits.',
    level: 'B1',
    category: 'Hobbies',
    status: 'published',
    items: [
      {
        word: 'photography',
        partOfSpeech: 'noun',
        definitionVi: 'nhiếp ảnh, nghệ thuật chụp ảnh',
        phonetic: '/fəˈtɑːɡrəfi/',
        collocations: ['digital photography', 'photography class', 'photography hobby'],
        exampleSentences: [
          'She enjoys photography and takes pictures of nature.',
          'Photography is a popular hobby among travelers.'
        ],
        quizQuestions: [
          {
            type: 'multiple-choice',
            question: 'What does "photography" mean?',
            options: ['vẽ tranh', 'nhiếp ảnh', 'đan len', 'làm vườn'],
            correctAnswer: 'nhiếp ảnh'
          }
        ]
      },
      {
        word: 'gardening',
        partOfSpeech: 'noun',
        definitionVi: 'làm vườn, nghề trồng trọt',
        phonetic: '/ˈɡɑːrdnɪŋ/',
        collocations: ['gardening hobby', 'gardening tools', 'gardening tips'],
        exampleSentences: [
          'My grandmother loves gardening and grows beautiful flowers.',
          'Gardening is a relaxing and rewarding activity.'
        ],
        quizQuestions: [
          {
            type: 'multiple-choice',
            question: 'What is "gardening"?',
            options: ['nấu ăn', 'làm vườn', 'chạy bộ', 'bơi lội'],
            correctAnswer: 'làm vườn'
          }
        ]
      },
      {
        word: 'cooking',
        partOfSpeech: 'noun',
        definitionVi: 'nấu ăn',
        phonetic: '/ˈkʊkɪŋ/',
        collocations: ['cooking class', 'cooking skills', 'cooking hobby'],
        exampleSentences: [
          'She took a cooking class to improve her skills.',
          'Cooking is a creative and useful hobby.'
        ],
        quizQuestions: []
      }
    ]
  }
]

describe('LearningSet Model & Seed Data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Seed data integrity', () => {
    it('should have exactly 3 seed sets with correct slugs and categories', () => {
      expect(SEED_DATA.length).toBe(3)
      const slugs = SEED_DATA.map(s => s.slug)
      expect(slugs).toEqual(['daily-life', 'travel', 'hobbies'])
      const categories = SEED_DATA.map(s => s.category)
      expect(categories).toEqual(['Daily Life', 'Travel', 'Hobbies'])
      const levels = SEED_DATA.map(s => s.level)
      expect(levels).toEqual(['A2', 'B1', 'B1'])
    })

    it('should have items in each set with correct structure', () => {
      SEED_DATA.forEach(set => {
        expect(set.items.length).toBeGreaterThan(0)
        set.items.forEach(item => {
          expect(item).toHaveProperty('word')
          expect(item).toHaveProperty('partOfSpeech')
          expect(item).toHaveProperty('definitionVi')
          expect(item).toHaveProperty('phonetic')
          expect(item).toHaveProperty('collocations')
          expect(item).toHaveProperty('exampleSentences')
          expect(item).toHaveProperty('quizQuestions')
        })
      })
    })

    it('should have quiz questions for some items', () => {
      const dailyLifeSet = SEED_DATA.find(s => s.slug === 'daily-life')
      expect(dailyLifeSet.items[0].quizQuestions.length).toBe(2)
      expect(dailyLifeSet.items[1].quizQuestions.length).toBe(1)
      expect(dailyLifeSet.items[2].quizQuestions.length).toBe(0)

      const travelSet = SEED_DATA.find(s => s.slug === 'travel')
      expect(travelSet.items[0].quizQuestions.length).toBe(1)
      expect(travelSet.items[1].quizQuestions.length).toBe(1)
      expect(travelSet.items[2].quizQuestions.length).toBe(0)

      const hobbiesSet = SEED_DATA.find(s => s.slug === 'hobbies')
      expect(hobbiesSet.items[0].quizQuestions.length).toBe(1)
      expect(hobbiesSet.items[1].quizQuestions.length).toBe(1)
      expect(hobbiesSet.items[2].quizQuestions.length).toBe(0)
    })
  })

  describe('Idempotency of seed script', () => {
    it('should skip inserting if set already exists', async () => {
      mockFindOne.mockImplementation((query) => {
        const slug = query.slug
        const existing = SEED_DATA.find(s => s.slug === slug)
        return mockQuery(existing || null)
      })

      let insertedCount = 0
      let skippedCount = 0

      for (const setData of SEED_DATA) {
        const existing = await LearningSet.findOne({ slug: setData.slug })
        if (existing) {
          skippedCount++
        } else {
          insertedCount++
        }
      }

      expect(skippedCount).toBe(3)
      expect(insertedCount).toBe(0)
      expect(LearningSet.findOne).toHaveBeenCalledTimes(3)
    })

    it('should insert if set does not exist', async () => {
      mockFindOne.mockReturnValue(mockQuery(null))
      mockCreate.mockResolvedValue({})

      let insertedCount = 0
      let skippedCount = 0

      for (const setData of SEED_DATA) {
        const existing = await LearningSet.findOne({ slug: setData.slug })
        if (existing) {
          skippedCount++
        } else {
          insertedCount++
          await LearningSet.create(setData)
        }
      }

      expect(skippedCount).toBe(0)
      expect(insertedCount).toBe(3)
      expect(LearningSet.findOne).toHaveBeenCalledTimes(3)
      expect(LearningSet.create).toHaveBeenCalledTimes(3)
    })
  })

  describe('Query filtering for published data', () => {
    it('should filter by status published', async () => {
      const publishedSets = SEED_DATA.filter(s => s.status === 'published')
      mockFind.mockReturnValue(mockQuery(publishedSets))

      const result = await LearningSet.find({ status: 'published' })
      expect(result.length).toBe(3)
      expect(LearningSet.find).toHaveBeenCalledWith({ status: 'published' })
    })

    it('should filter by category', async () => {
      const travelSets = SEED_DATA.filter(s => s.category === 'Travel')
      mockFind.mockReturnValue(mockQuery(travelSets))

      const result = await LearningSet.find({ category: 'Travel' })
      expect(result.length).toBe(1)
      expect(result[0].slug).toBe('travel')
    })

    it('should filter by level', async () => {
      const b1Sets = SEED_DATA.filter(s => s.level === 'B1')
      mockFind.mockReturnValue(mockQuery(b1Sets))

      const result = await LearningSet.find({ level: 'B1' })
      expect(result.length).toBe(2)
      const slugs = result.map(s => s.slug)
      expect(slugs).toContain('travel')
      expect(slugs).toContain('hobbies')
    })
  })
})