import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

import connectDB from '../src/config/db.js'
import LearningSet from '../src/models/LearningSet.js'

const seedData = [
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

async function seedLearningSets() {
  try {
    await connectDB()
    console.log('Connected to MongoDB')

    let insertedCount = 0
    let skippedCount = 0
    let updatedCount = 0

    for (const setData of seedData) {
      const existing = await LearningSet.findOne({ slug: setData.slug })
      if (existing) {
        // Idempotency: update existing set if needed (skip by default to avoid overwriting changes)
        // But we can update items if desired. For now, we'll skip to be safe.
        console.log(`Set "${setData.slug}" already exists. Skipping.`)
        skippedCount++
        continue
      }

      // Insert new set
      const newSet = new LearningSet(setData)
      await newSet.save()
      insertedCount++
      console.log(`Inserted set "${setData.slug}"`)
    }

    console.log(`Seed completed: ${insertedCount} inserted, ${skippedCount} skipped, ${updatedCount} updated.`)
    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

seedLearningSets()