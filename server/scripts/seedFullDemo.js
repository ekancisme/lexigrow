import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

import connectDB from '../src/config/db.js'
import User from '../src/models/User.js'
import Class from '../src/models/Class.js'
import Assignment from '../src/models/Assignment.js'
import LearningSet from '../src/models/LearningSet.js'
import Vocabulary from '../src/models/Vocabulary.js'
import WordUsageEvidence from '../src/models/WordUsageEvidence.js'
import Essay from '../src/models/Essay.js'
import EssayRevision from '../src/models/EssayRevision.js'
import LearningSession from '../src/models/LearningSession.js'
import ParentStudentLink from '../src/models/ParentStudentLink.js'
import ReviewEvent from '../src/models/ReviewEvent.js'
import WeeklyGoal from '../src/models/WeeklyGoal.js'
import AIAnalysis from '../src/models/AIAnalysis.js'

async function seedFullDemo() {
  try {
    console.log('🚀 Connecting to MongoDB...')
    await connectDB()
    console.log('✅ Connected to MongoDB.')

    // 1. Learning Sets
    console.log('🌱 Seeding Learning Sets...')
    const learningSetsData = [
      {
        slug: 'daily-life',
        title: 'Daily Life & Productivity',
        description: 'Từ vựng thiết yếu về thói quen hàng ngày, quản lý thời gian và năng suất làm việc.',
        level: 'A2',
        category: 'Daily Life',
        status: 'published',
        items: [
          {
            word: 'routine',
            partOfSpeech: 'noun',
            definitionVi: 'thói quen, chu trình công việc hàng ngày',
            phonetic: '/ruːˈtiːn/',
            collocations: ['daily routine', 'morning routine', 'establish a routine'],
            exampleSentences: ['A consistent morning routine boosts my productivity.'],
            quizQuestions: [
              {
                type: 'multiple-choice',
                question: 'What does "routine" mean in Vietnamese?',
                options: ['thói quen', 'mục tiêu', 'kỹ năng', 'công việc'],
                correctAnswer: 'thói quen',
              },
            ],
          },
          {
            word: 'commute',
            partOfSpeech: 'verb',
            definitionVi: 'đi lại đều đặn giữa nơi ở và chỗ làm việc',
            phonetic: '/kəˈmjuːt/',
            collocations: ['daily commute', 'commute by train', 'long commute'],
            exampleSentences: ['I commute to the office by electric bus every morning.'],
            quizQuestions: [
              {
                type: 'multiple-choice',
                question: 'Choose the correct meaning of "commute":',
                options: ['đi lại đi làm hàng ngày', 'đi du lịch', 'chuyển nhà', 'tập thể dục'],
                correctAnswer: 'đi lại đi làm hàng ngày',
              },
            ],
          },
          {
            word: 'productive',
            partOfSpeech: 'adjective',
            definitionVi: 'năng suất, có hiệu quả cao',
            phonetic: '/prəˈdʌktɪv/',
            collocations: ['productive day', 'highly productive', 'productive meeting'],
            exampleSentences: ['Focusing on one task at a time helps me stay productive.'],
            quizQuestions: [],
          },
          {
            word: 'efficient',
            partOfSpeech: 'adjective',
            definitionVi: 'hiệu quả, tiết kiệm thời gian và tài nguyên',
            phonetic: '/ɪˈfɪʃnt/',
            collocations: ['efficient method', 'energy efficient', 'efficient workflow'],
            exampleSentences: ['We implemented a more efficient way to manage project tasks.'],
            quizQuestions: [],
          },
        ],
      },
      {
        slug: 'technology',
        title: 'Technology & Digital Era',
        description: 'Vốn từ công nghệ, chuyển đổi số và xu hướng công nghệ tương lai.',
        level: 'B1',
        category: 'Technology',
        status: 'published',
        items: [
          {
            word: 'innovation',
            partOfSpeech: 'noun',
            definitionVi: 'sự đổi mới, sáng kiến đột phá',
            phonetic: '/ˌɪnəˈveɪʃn/',
            collocations: ['technological innovation', 'drive innovation', 'foster innovation'],
            exampleSentences: ['Technological innovation has completely transformed education.'],
            quizQuestions: [
              {
                type: 'multiple-choice',
                question: 'What is the Vietnamese meaning of "innovation"?',
                options: ['sự đổi mới', 'sự đầu tư', 'sự suy thoái', 'sự bảo tồn'],
                correctAnswer: 'sự đổi mới',
              },
            ],
          },
          {
            word: 'collaboration',
            partOfSpeech: 'noun',
            definitionVi: 'sự cộng tác, làm việc nhóm cùng nhau',
            phonetic: '/kəˌlæbəˈreɪʃn/',
            collocations: ['cross-functional collaboration', 'close collaboration', 'online collaboration'],
            exampleSentences: ['Cloud software facilitates seamless team collaboration.'],
            quizQuestions: [],
          },
          {
            word: 'accessible',
            partOfSpeech: 'adjective',
            definitionVi: 'dễ tiếp cận, có thể sử dụng được',
            phonetic: '/əkˈsesəbl/',
            collocations: ['easily accessible', 'publicly accessible', 'make accessible'],
            exampleSentences: ['Online courses make quality education accessible to everyone.'],
            quizQuestions: [],
          },
          {
            word: 'revolutionize',
            partOfSpeech: 'verb',
            definitionVi: 'cách mạng hóa, thay đổi hoàn toàn',
            phonetic: '/ˌrevəˈluːʃənaɪz/',
            collocations: ['revolutionize the industry', 'completely revolutionize'],
            exampleSentences: ['Artificial intelligence will revolutionize how students write and learn.'],
            quizQuestions: [],
          },
        ],
      },
      {
        slug: 'environment',
        title: 'Environment & Sustainability',
        description: 'Từ vựng học thuật về môi trường, phát triển bền vững và bảo tồn thiên nhiên.',
        level: 'B2',
        category: 'Environment',
        status: 'published',
        items: [
          {
            word: 'sustainable',
            partOfSpeech: 'adjective',
            definitionVi: 'bền vững, thân thiện với môi trường lâu dài',
            phonetic: '/səˈsteɪnəbl/',
            collocations: ['sustainable development', 'sustainable energy', 'sustainable practices'],
            exampleSentences: ['Adopting sustainable habits helps protect our planet.'],
            quizQuestions: [],
          },
          {
            word: 'biodiversity',
            partOfSpeech: 'noun',
            definitionVi: 'đa dạng sinh học',
            phonetic: '/ˌbaɪoʊdaɪˈvɜːrsəti/',
            collocations: ['preserve biodiversity', 'loss of biodiversity', 'marine biodiversity'],
            exampleSentences: ['National parks are crucial for protecting global biodiversity.'],
            quizQuestions: [],
          },
          {
            word: 'ecosystem',
            partOfSpeech: 'noun',
            definitionVi: 'hệ sinh thái',
            phonetic: '/ˈiːkoʊsɪstəm/',
            collocations: ['fragile ecosystem', 'restore ecosystems', 'aquatic ecosystem'],
            exampleSentences: ['Forests form a delicate ecosystem supporting millions of species.'],
            quizQuestions: [],
          },
        ],
      },
    ]

    const learningSets = []
    for (const setData of learningSetsData) {
      const set = await LearningSet.findOneAndUpdate(
        { slug: setData.slug },
        { $set: setData },
        { upsert: true, returnDocument: 'after' }
      )
      learningSets.push(set)
    }
    console.log(`✅ Seeded ${learningSets.length} learning sets.`)

    // 2. Users (Student, Teacher, Parent, Admin)
    console.log('👤 Seeding Users...')

    // Student
    let student = await User.findOne({ email: 'student@lexigrow.com' })
    if (!student) {
      student = new User({
        name: 'Nguyễn Văn Minh',
        email: 'student@lexigrow.com',
        password: 'password_will_be_set_below',
        role: 'student',
        learningProfile: {
          interests: ['Technology', 'Environment', 'Daily Life'],
          targetLevel: 'B1',
          dailyGoalMinutes: 15,
          onboardingCompleted: true,
          timezone: 'Asia/Ho_Chi_Minh',
        },
        englishLevel: 'B1',
        anonymousNickname: 'MinhTech',
        accountStatus: 'active',
      })
    }
    student.name = 'Nguyễn Văn Minh'
    student.role = 'student'
    student.password = '123456'
    student.accountStatus = 'active'
    student.learningProfile = {
      interests: ['Technology', 'Environment', 'Daily Life'],
      targetLevel: 'B1',
      dailyGoalMinutes: 15,
      onboardingCompleted: true,
      timezone: 'Asia/Ho_Chi_Minh',
    }
    student.englishLevel = 'B1'
    await student.save()

    // Teacher
    let teacher = await User.findOne({ email: 'teacher@lexigrow.com' })
    if (!teacher) {
      teacher = new User({
        name: 'Cô Hoàng Mai',
        email: 'teacher@lexigrow.com',
        password: 'password_will_be_set_below',
        role: 'teacher',
        institution: 'Hanoi University of Foreign Studies',
        accountStatus: 'active',
      })
    }
    teacher.name = 'Cô Hoàng Mai'
    teacher.role = 'teacher'
    teacher.password = '123456'
    teacher.institution = 'Hanoi University of Foreign Studies'
    teacher.accountStatus = 'active'
    await teacher.save()

    // Parent
    let parent = await User.findOne({ email: 'parent@lexigrow.com' })
    if (!parent) {
      parent = new User({
        name: 'Bác Nguyễn Hùng',
        email: 'parent@lexigrow.com',
        password: 'password_will_be_set_below',
        role: 'parent',
        children: [student._id],
        accountStatus: 'active',
      })
    }
    parent.name = 'Bác Nguyễn Hùng'
    parent.role = 'parent'
    parent.password = '123456'
    parent.children = [student._id]
    parent.accountStatus = 'active'
    await parent.save()

    // Link parent & student
    student.parents = [parent._id]
    await student.save()

    await ParentStudentLink.findOneAndUpdate(
      { parent: parent._id, student: student._id },
      {
        parent: parent._id,
        student: student._id,
        relationship: 'father',
        status: 'active',
        linkedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      { upsert: true }
    )

    // Admin
    let admin = await User.findOne({ email: 'admin@lexigrow.com' })
    if (!admin) {
      admin = new User({
        name: 'Quản Trị Viên Hệ Thống',
        email: 'admin@lexigrow.com',
        password: 'password_will_be_set_below',
        role: 'admin',
        accountStatus: 'active',
      })
    }
    admin.name = 'Quản Trị Viên Hệ Thống'
    admin.role = 'admin'
    admin.password = '123456'
    admin.accountStatus = 'active'
    await admin.save()

    console.log('✅ Seeded/Updated 4 demo accounts: student, teacher, parent, admin (Password: 123456).')

    // 3. Classes
    console.log('🏫 Seeding Classes...')
    const class1 = await Class.findOneAndUpdate(
      { code: 'LEXI-101' },
      {
        name: 'IELTS Foundation & Academic Writing A2-B1',
        description: 'Lớp học nâng cao vốn từ vựng học thuật, viết luận chủ đề đời sống và công nghệ.',
        schedule: 'Thứ 2 - Thứ 4 - Thứ 6 (19:30 - 21:00)',
        status: 'active',
        teacher: teacher._id,
        students: [student._id],
        code: 'LEXI-101',
      },
      { upsert: true, returnDocument: 'after' }
    )

    const class2 = await Class.findOneAndUpdate(
      { code: 'LEXI-202' },
      {
        name: 'Tiếng Anh Thực Chiến & Diễn Đạt Tự Nhiên B1-B2',
        description: 'Rèn luyện kỹ năng viết câu phức, mở rộng collocation và phản xạ viết luận.',
        schedule: 'Thứ 3 - Thứ 5 - Thứ 7 (20:00 - 21:30)',
        status: 'active',
        teacher: teacher._id,
        students: [student._id],
        code: 'LEXI-202',
      },
      { upsert: true, returnDocument: 'after' }
    )
    console.log('✅ Seeded 2 classes: LEXI-101 & LEXI-202.')

    // 4. Assignments
    console.log('📝 Seeding Assignments...')
    const due1 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    const due2 = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
    const due3 = new Date(Date.now() + 18 * 24 * 60 * 60 * 1000)

    const assign1 = await Assignment.findOneAndUpdate(
      { classId: class1._id, title: 'Writing Task 1: My Daily Routine & Productivity' },
      {
        title: 'Writing Task 1: My Daily Routine & Productivity',
        description: 'Hãy viết một đoạn văn ngắn (120-180 từ) miêu tả thói quen hàng ngày của bạn và cách bạn tối ưu thời gian.',
        classId: class1._id,
        teacher: teacher._id,
        learningSetId: learningSets[0]._id,
        dueDate: due1,
        keywords: ['routine', 'commute', 'productive', 'efficient'],
        status: 'active',
      },
      { upsert: true, returnDocument: 'after' }
    )

    const assign2 = await Assignment.findOneAndUpdate(
      { classId: class1._id, title: 'Writing Task 2: Technology in Modern Education' },
      {
        title: 'Writing Task 2: Technology in Modern Education',
        description: 'Viết bài luận (150-220 từ) thảo luận về tác động của công nghệ số đến phương pháp học tập của học sinh.',
        classId: class1._id,
        teacher: teacher._id,
        learningSetId: learningSets[1]._id,
        dueDate: due2,
        keywords: ['innovation', 'collaboration', 'accessible', 'revolutionize'],
        status: 'active',
      },
      { upsert: true, returnDocument: 'after' }
    )

    const assign3 = await Assignment.findOneAndUpdate(
      { classId: class2._id, title: 'Writing Task 3: Preserving Green Spaces in Cities' },
      {
        title: 'Writing Task 3: Preserving Green Spaces in Cities',
        description: 'Trình bày giải pháp phát triển bền vững và bảo vệ hệ sinh thái trong các đô thị hiện đại (150-200 từ).',
        classId: class2._id,
        teacher: teacher._id,
        learningSetId: learningSets[2]._id,
        dueDate: due3,
        keywords: ['sustainable', 'biodiversity', 'ecosystem'],
        status: 'active',
      },
      { upsert: true, returnDocument: 'after' }
    )
    console.log('✅ Seeded 3 assignments.')

    // 5. Vocabularies for Student (Mastered, Learning, New)
    console.log('📚 Seeding Vocabularies...')
    const vocabList = [
      {
        word: 'routine',
        category: 'daily',
        theme: 'Daily Life',
        masteryLevel: 'mastered',
        ipa: '/ruːˈtiːn/',
        partOfSpeech: 'noun',
        definition: 'Thói quen, lịch trình đều đặn',
        exampleSentence: 'A healthy morning routine prepares you for a great day.',
        synonyms: ['habit', 'schedule', 'pattern'],
        reviewCount: 5,
        reviewInterval: 14,
        easeFactor: 2.6,
        nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        word: 'commute',
        category: 'daily',
        theme: 'Daily Life',
        masteryLevel: 'mastered',
        ipa: '/kəˈmjuːt/',
        partOfSpeech: 'verb',
        definition: 'Đi lại giữa nhà và nơi làm việc',
        exampleSentence: 'I commute by train to avoid traffic jams.',
        synonyms: ['travel', 'journey'],
        reviewCount: 4,
        reviewInterval: 10,
        easeFactor: 2.5,
        nextReviewDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        word: 'productive',
        category: 'academic',
        theme: 'Daily Life',
        masteryLevel: 'mastered',
        ipa: '/prəˈdʌktɪv/',
        partOfSpeech: 'adjective',
        definition: 'Năng suất, hiệu quả cao',
        exampleSentence: 'Good time management makes you more productive.',
        synonyms: ['fruitful', 'constructive', 'effective'],
        reviewCount: 6,
        reviewInterval: 21,
        easeFactor: 2.7,
        nextReviewDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      {
        word: 'efficient',
        category: 'academic',
        theme: 'Daily Life',
        masteryLevel: 'mastered',
        ipa: '/ɪˈfɪʃnt/',
        partOfSpeech: 'adjective',
        definition: 'Hiệu quả, tiết kiệm công sức',
        exampleSentence: 'Automating repetitive tasks is an efficient strategy.',
        synonyms: ['effective', 'competent'],
        reviewCount: 5,
        reviewInterval: 16,
        easeFactor: 2.6,
        nextReviewDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      },
      {
        word: 'innovation',
        category: 'academic',
        theme: 'Technology',
        masteryLevel: 'learning',
        ipa: '/ˌɪnəˈveɪʃn/',
        partOfSpeech: 'noun',
        definition: 'Sự đổi mới, sáng tạo đột phá',
        exampleSentence: 'Technological innovation drives human progress.',
        synonyms: ['novelty', 'breakthrough', 'modernization'],
        reviewCount: 2,
        reviewInterval: 2,
        easeFactor: 2.4,
        nextReviewDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // Due today!
      },
      {
        word: 'collaboration',
        category: 'academic',
        theme: 'Technology',
        masteryLevel: 'learning',
        ipa: '/kəˌlæbəˈreɪʃn/',
        partOfSpeech: 'noun',
        definition: 'Sự hợp tác làm việc nhóm',
        exampleSentence: 'Cross-border collaboration brings diverse perspectives.',
        synonyms: ['teamwork', 'cooperation', 'partnership'],
        reviewCount: 2,
        reviewInterval: 3,
        easeFactor: 2.5,
        nextReviewDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        word: 'accessible',
        category: 'academic',
        theme: 'Technology',
        masteryLevel: 'learning',
        ipa: '/əkˈsesəbl/',
        partOfSpeech: 'adjective',
        definition: 'Dễ tiếp cận, tiện lợi sử dụng',
        exampleSentence: 'Knowledge is now easily accessible online.',
        synonyms: ['available', 'obtainable', 'reachable'],
        reviewCount: 1,
        reviewInterval: 1,
        easeFactor: 2.5,
        nextReviewDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // Due today!
      },
      {
        word: 'revolutionize',
        category: 'scientific',
        theme: 'Technology',
        masteryLevel: 'learning',
        ipa: '/ˌrevəˈluːʃənaɪz/',
        partOfSpeech: 'verb',
        definition: 'Cách mạng hóa, thay đổi triệt để',
        exampleSentence: 'AI will revolutionize personalized learning.',
        synonyms: ['transform', 'overhaul'],
        reviewCount: 1,
        reviewInterval: 1,
        easeFactor: 2.5,
        nextReviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        word: 'sustainable',
        category: 'scientific',
        theme: 'Environment',
        masteryLevel: 'new',
        ipa: '/səˈsteɪnəbl/',
        partOfSpeech: 'adjective',
        definition: 'Bền vững, bảo vệ môi trường',
        exampleSentence: 'We must build sustainable cities for the future.',
        synonyms: ['eco-friendly', 'renewable'],
        reviewCount: 0,
        reviewInterval: 1,
        easeFactor: 2.5,
        nextReviewDate: null, // Due today!
      },
      {
        word: 'biodiversity',
        category: 'scientific',
        theme: 'Environment',
        masteryLevel: 'new',
        ipa: '/ˌbaɪoʊdaɪˈvɜːrsəti/',
        partOfSpeech: 'noun',
        definition: 'Đa dạng sinh học',
        exampleSentence: 'Protecting rainforests preserves global biodiversity.',
        synonyms: ['ecological diversity'],
        reviewCount: 0,
        reviewInterval: 1,
        easeFactor: 2.5,
        nextReviewDate: null, // Due today!
      },
      {
        word: 'ecosystem',
        category: 'scientific',
        theme: 'Environment',
        masteryLevel: 'new',
        ipa: '/ˈiːkoʊsɪstəm/',
        partOfSpeech: 'noun',
        definition: 'Hệ sinh thái tự nhiên',
        exampleSentence: 'Pollution harms fragile marine ecosystems.',
        synonyms: ['ecological community', 'environment'],
        reviewCount: 0,
        reviewInterval: 1,
        easeFactor: 2.5,
        nextReviewDate: null,
      },
    ]

    const seededVocabs = []
    for (const v of vocabList) {
      const vocabDoc = await Vocabulary.findOneAndUpdate(
        { student: student._id, word: v.word },
        {
          ...v,
          student: student._id,
        },
        { upsert: true, returnDocument: 'after' }
      )
      seededVocabs.push(vocabDoc)
    }
    console.log(`✅ Seeded ${seededVocabs.length} student vocabulary items.`)

    // 6. Seed Essays, Revisions, and WordUsageEvidence
    console.log('✍️ Seeding Essays, Revisions & Evidence...')

    // Essay 1: Daily Life Routine
    const essay1Content = `Establishing a healthy morning routine has completely transformed my daily life. Every day, I commute to my university by public transport, which gives me time to read and plan my schedule. In the afternoon, I organize my tasks to stay productive and avoid unnecessary stress. Using an efficient study workflow has enabled me to achieve better academic results while maintaining balanced mental well-being.`

    const essay1 = await Essay.findOneAndUpdate(
      { student: student._id, title: 'My Daily Routine and Academic Productivity' },
      {
        student: student._id,
        class: class1._id,
        assignment: assign1._id,
        title: 'My Daily Routine and Academic Productivity',
        content: essay1Content,
        theme: 'Daily Life',
        status: 'reviewed',
        wordCount: 71,
        paragraphCount: 1,
        sentenceCount: 4,
        readingTime: 1,
        submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        // For mastery: second essay for the same words on a different day
        isPractice: false,
      },
      { upsert: true, returnDocument: 'after' }
    )

    // Create a second essay for the same Daily Life theme to satisfy masteredPipeline (≥2 essays, ≥2 days)
    const essay1bContent = `My morning routine has become more efficient since I started commuting by bike. Being productive early in the day helps me maintain a healthy work-life balance. I also use a smart calendar to plan my commute and avoid traffic, making my daily routine smoother and more enjoyable.`
    const essay1b = await Essay.findOneAndUpdate(
      { student: student._id, title: 'My Improved Morning Routine with Smart Planning' },
      {
        student: student._id,
        class: class1._id,
        assignment: assign1._id,
        title: 'My Improved Morning Routine with Smart Planning',
        content: essay1bContent,
        theme: 'Daily Life',
        status: 'reviewed',
        wordCount: 45,
        paragraphCount: 1,
        sentenceCount: 3,
        readingTime: 1,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Different day
        isPractice: false,
      },
      { upsert: true, returnDocument: 'after' }
    )

    // Learning session for essay 1
    const session1 = await LearningSession.findOneAndUpdate(
      { student: student._id, learningSet: learningSets[0]._id },
      {
        student: student._id,
        learningSet: learningSets[0]._id,
        learningSetSlug: 'daily-life',
        theme: 'Daily Life',
        level: 'A2',
        assignment: assign1._id,
        targetWords: ['routine', 'commute', 'productive', 'efficient'],
        currentStep: 'completed',
        status: 'completed',
        startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000),
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        activeTimeSeconds: 1200,
        originalEssay: essay1._id,
      },
      { upsert: true, returnDocument: 'after' }
    )

    const rev1 = await EssayRevision.findOneAndUpdate(
      { originalEssay: essay1._id, revisionNumber: 1 },
      {
        originalEssay: essay1._id,
        student: student._id,
        session: session1._id,
        revisionNumber: 1,
        content: essay1Content,
        contentHash: 'hash_essay_1',
        wordCount: 71,
        targetWords: ['routine', 'commute', 'productive', 'efficient'],
        analysisStatus: 'succeeded',
        feedbackSummary: 'Bài viết rất mạch lạc, cấu trúc câu tự nhiên và vận dụng hoàn hảo 4 từ vựng mục tiêu trong đúng ngữ cảnh ngữ pháp!',
        analysis: {
          overallScore: 88,
          cefrLevel: 'B1',
          bandScores: {
            taskAchievement: 8.5,
            coherenceAndCohesion: 8.0,
            lexicalResource: 9.0,
            grammaticalRangeAndAccuracy: 8.5,
          },
          targetWordEvaluations: [
            { word: 'routine', used: true, isCorrect: true, confidenceScore: 0.96, feedback: 'Dùng chính xác collocations "morning routine".' },
            { word: 'commute', used: true, isCorrect: true, confidenceScore: 0.95, feedback: 'Sử dụng đúng giới từ "commute to... by...".' },
            { word: 'productive', used: true, isCorrect: true, confidenceScore: 0.94, feedback: 'Vận dụng đúng tính từ sau linking verb "stay productive".' },
            { word: 'efficient', used: true, isCorrect: true, confidenceScore: 0.97, feedback: 'Kết hợp từ tự nhiên "efficient study workflow".' },
          ],
          strengths: [
            'Sử dụng chính xác 100% từ vựng mục tiêu trong ngữ cảnh thực tế',
            'Cấu trúc ngữ pháp đa dạng: Mệnh đề quan hệ, phân từ hiện tại (maintaining...)',
          ],
          suggestions: [
            'Có thể mở rộng thêm một ví dụ cụ thể về ứng dụng hỗ trợ lập kế hoạch để bài viết thêm sinh động.',
          ],
        },
      },
      { upsert: true, returnDocument: 'after' }
    )

    // Create AIAnalysis for essay 1
    await AIAnalysis.findOneAndUpdate(
      { essay: essay1._id },
      {
        essay: essay1._id,
        overallScore: 88,
        scores: {
          vocabularyDiversity: 0.75,
          grammarAccuracy: 8.5,
          coherence: 8.0,
          complexityIndex: 7.5,
          lexicalDiversityHdd: 0.72,
          lexicalDiversityMtld: 45.0,
        },
        newWordsDetected: ['routine', 'commute', 'productive', 'efficient'],
        suggestions: [
          { type: 'strength', text: 'Sử dụng chính xác 100% từ vựng mục tiêu trong ngữ cảnh thực tế' },
          { type: 'strength', text: 'Cấu trúc ngữ pháp đa dạng: Mệnh đề quan hệ, phân từ hiện tại' },
          { type: 'improvement', text: 'Có thể mở rộng thêm một ví dụ cụ thể về ứng dụng hỗ trợ lập kế hoạch' },
        ],
        writingStats: {
          avgSentenceLength: 17.75,
          uniqueWords: 42,
        },
        nlpStats: {
          passiveVoiceCount: 1,
          subordinateClausesCount: 2,
          repeatedWords: [],
        },
        learningPatterns: {
          paddedSentences: false,
          plagiarismDetected: false,
          learningStatus: 'progressing',
          feedback: 'Học sinh đang tiến bộ tốt, từ vựng sử dụng đúng ngữ cảnh.',
        },
        nextEssaySuggestions: {
          transitionWords: ['therefore', 'moreover', 'in addition'],
          sentenceStructures: ['Câu phức với mệnh đề nhượng bộ', 'Câu điều kiện loại 1'],
          generalTips: 'Hãy thử đa dạng hóa cấu trúc mở đầu câu để tăng điểm Coherence.',
        },
        plagiarismDetails: {
          isPlagiarized: false,
          matchedEssay: null,
          similarityScore: 0,
          plagiarismType: 'none',
        },
        promptUsed: {
          name: 'Default System Prompt',
          promptId: null,
          isCustom: false,
        },
      },
      { upsert: true }
    )

    // Essay 2: Technology in Education
    const essay2Content = `Technological innovation is rapidly transforming modern classrooms. Through online platforms, high-quality learning resources are now accessible to students across geographical boundaries. Furthermore, digital tools foster seamless collaboration among peers during group assignments, breaking traditional barriers. As smart systems continue to evolve, they will definitely revolutionize individualized instruction for future generations.`

    const essay2 = await Essay.findOneAndUpdate(
      { student: student._id, title: 'How Technology Reshapes Modern Learning' },
      {
        student: student._id,
        class: class1._id,
        assignment: assign2._id,
        title: 'How Technology Reshapes Modern Learning',
        content: essay2Content,
        theme: 'Technology',
        status: 'submitted',
        wordCount: 65,
        paragraphCount: 1,
        sentenceCount: 4,
        readingTime: 1,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      { upsert: true, returnDocument: 'after' }
    )

    const session2 = await LearningSession.findOneAndUpdate(
      { student: student._id, learningSet: learningSets[1]._id },
      {
        student: student._id,
        learningSet: learningSets[1]._id,
        learningSetSlug: 'technology',
        theme: 'Technology',
        level: 'B1',
        assignment: assign2._id,
        targetWords: ['innovation', 'accessible', 'collaboration', 'revolutionize'],
        currentStep: 'completed',
        status: 'completed',
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        activeTimeSeconds: 1800,
        originalEssay: essay2._id,
      },
      { upsert: true, returnDocument: 'after' }
    )

    const rev2 = await EssayRevision.findOneAndUpdate(
      { originalEssay: essay2._id, revisionNumber: 1 },
      {
        originalEssay: essay2._id,
        student: student._id,
        session: session2._id,
        revisionNumber: 1,
        content: essay2Content,
        contentHash: 'hash_essay_2',
        wordCount: 65,
        targetWords: ['innovation', 'accessible', 'collaboration', 'revolutionize'],
        analysisStatus: 'succeeded',
        feedbackSummary: 'Lập luận xuất sắc, vốn từ học thuật B1-B2 phong phú và tính mạch lạc cao.',
        analysis: {
          overallScore: 92,
          cefrLevel: 'B2',
          bandScores: {
            taskAchievement: 9.0,
            coherenceAndCohesion: 9.0,
            lexicalResource: 9.5,
            grammaticalRangeAndAccuracy: 9.0,
          },
          targetWordEvaluations: [
            { word: 'innovation', used: true, isCorrect: true, confidenceScore: 0.98, feedback: 'Dùng từ học thuật chuẩn xác: "Technological innovation".' },
            { word: 'accessible', used: true, isCorrect: true, confidenceScore: 0.95, feedback: 'Cấu trúc "accessible to someone" chuẩn xác.' },
            { word: 'collaboration', used: true, isCorrect: true, confidenceScore: 0.96, feedback: 'Collocation tự nhiên "foster seamless collaboration".' },
            { word: 'revolutionize', used: true, isCorrect: true, confidenceScore: 0.97, feedback: 'Sử dụng ngoại động từ đúng "revolutionize individualized instruction".' },
          ],
          strengths: [
            'Từ vựng phong phú, sử dụng chính xác các liên từ kết nối (Furthermore, Through, As)',
            'Diễn đạt tự nhiên, chuẩn văn phong học thuật',
          ],
          suggestions: [],
        },
      },
      { upsert: true, returnDocument: 'after' }
    )

    // Create AIAnalysis for essay 2
    await AIAnalysis.findOneAndUpdate(
      { essay: essay2._id },
      {
        essay: essay2._id,
        overallScore: 92,
        scores: {
          vocabularyDiversity: 0.82,
          grammarAccuracy: 9.0,
          coherence: 9.0,
          complexityIndex: 8.5,
          lexicalDiversityHdd: 0.78,
          lexicalDiversityMtld: 52.0,
        },
        newWordsDetected: ['innovation', 'accessible', 'collaboration', 'revolutionize'],
        suggestions: [
          { type: 'strength', text: 'Từ vựng phong phú, sử dụng chính xác các liên từ kết nối' },
          { type: 'strength', text: 'Diễn đạt tự nhiên, chuẩn văn phong học thuật' },
        ],
        writingStats: {
          avgSentenceLength: 16.25,
          uniqueWords: 48,
        },
        nlpStats: {
          passiveVoiceCount: 0,
          subordinateClausesCount: 3,
          repeatedWords: [],
        },
        learningPatterns: {
          paddedSentences: false,
          plagiarismDetected: false,
          learningStatus: 'progressing',
          feedback: 'Học sinh có khả năng viết học thuật tốt, cấu trúc đa dạng.',
        },
        nextEssaySuggestions: {
          transitionWords: ['consequently', 'despite this', 'notably'],
          sentenceStructures: ['Câu chẻ (cleft sentence)', 'Mệnh đề trạng ngữ chỉ nhượng bộ'],
          generalTips: 'Hãy thử đưa ra phản biện để tăng tính thuyết phục.',
        },
        plagiarismDetails: {
          isPlagiarized: false,
          matchedEssay: null,
          similarityScore: 0,
          plagiarismType: 'none',
        },
        promptUsed: {
          name: 'Default System Prompt',
          promptId: null,
          isCustom: false,
        },
      },
      { upsert: true }
    )

    // 7. Word Usage Evidences (Populates Active Vocabulary & Growth Garden Tree)
    console.log('🌿 Seeding Word Usage Evidence...')
    const formatDate = (d) => d.toISOString().split('T')[0]

    // Create revision for essay1b (no AI analysis needed for evidence)
    const rev1b = await EssayRevision.findOneAndUpdate(
      { originalEssay: essay1b._id, revisionNumber: 1 },
      {
        originalEssay: essay1b._id,
        student: student._id,
        session: session1._id,
        revisionNumber: 1,
        content: essay1bContent,
        contentHash: 'hash_essay_1b',
        wordCount: 45,
        targetWords: ['routine', 'commute', 'productive', 'efficient'],
        analysisStatus: 'succeeded',
        feedbackSummary: 'Bài viết ngắn nhưng sử dụng tốt từ vựng mục tiêu.',
        analysis: {
          overallScore: 85,
          cefrLevel: 'B1',
          bandScores: {
            taskAchievement: 8.0,
            coherenceAndCohesion: 8.0,
            lexicalResource: 8.5,
            grammaticalRangeAndAccuracy: 8.0,
          },
          targetWordEvaluations: [
            { word: 'routine', used: true, isCorrect: true, confidenceScore: 0.95, feedback: 'Dùng chính xác.' },
            { word: 'commute', used: true, isCorrect: true, confidenceScore: 0.94, feedback: 'Sử dụng đúng.' },
            { word: 'productive', used: true, isCorrect: true, confidenceScore: 0.93, feedback: 'Vận dụng đúng.' },
            { word: 'efficient', used: true, isCorrect: true, confidenceScore: 0.96, feedback: 'Kết hợp từ tự nhiên.' },
          ],
          strengths: ['Từ vựng được sử dụng đúng ngữ cảnh.'],
          suggestions: ['Có thể mở rộng bài viết hơn.'],
        },
      },
      { upsert: true, returnDocument: 'after' }
    )

    const evidencesData = [
      // Essay 1 evidence (Day -4)
      {
        student: student._id,
        word: 'routine',
        contextSentence: 'Establishing a healthy morning routine has completely transformed my daily life.',
        essayId: essay1._id,
        revisionId: rev1._id,
        learningSet: learningSets[0]._id,
        theme: 'Daily Life',
        meaning: 'Thói quen hàng ngày',
        isVerifiedCorrect: true,
        assisted: false,
        aiConfidenceScore: 0.96,
        usedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        localDay: formatDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
      },
      {
        student: student._id,
        word: 'commute',
        contextSentence: 'Every day, I commute to my university by public transport, which gives me time to read.',
        essayId: essay1._id,
        revisionId: rev1._id,
        learningSet: learningSets[0]._id,
        theme: 'Daily Life',
        meaning: 'Đi lại làm việc/học tập',
        isVerifiedCorrect: true,
        assisted: false,
        aiConfidenceScore: 0.95,
        usedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        localDay: formatDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
      },
      {
        student: student._id,
        word: 'productive',
        contextSentence: 'In the afternoon, I organize my tasks to stay productive and avoid unnecessary stress.',
        essayId: essay1._id,
        revisionId: rev1._id,
        learningSet: learningSets[0]._id,
        theme: 'Daily Life',
        meaning: 'Năng suất, hiệu quả',
        isVerifiedCorrect: true,
        assisted: false,
        aiConfidenceScore: 0.94,
        usedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        localDay: formatDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
      },
      {
        student: student._id,
        word: 'efficient',
        contextSentence: 'Using an efficient study workflow has enabled me to achieve better academic results.',
        essayId: essay1._id,
        revisionId: rev1._id,
        learningSet: learningSets[0]._id,
        theme: 'Daily Life',
        meaning: 'Hiệu quả, tiết kiệm',
        isVerifiedCorrect: true,
        assisted: false,
        aiConfidenceScore: 0.97,
        usedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        localDay: formatDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
      },
      // Essay 1b evidence (Day -2) — for mastery (≥2 essays, ≥2 days)
      {
        student: student._id,
        word: 'routine',
        contextSentence: 'My morning routine has become more efficient since I started commuting by bike.',
        essayId: essay1b._id,
        revisionId: rev1b._id,
        learningSet: learningSets[0]._id,
        theme: 'Daily Life',
        meaning: 'Thói quen hàng ngày',
        isVerifiedCorrect: true,
        assisted: false,
        aiConfidenceScore: 0.95,
        usedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        localDay: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      },
      {
        student: student._id,
        word: 'commute',
        contextSentence: 'Being productive early in the day helps me maintain a healthy work-life balance.',
        essayId: essay1b._id,
        revisionId: rev1b._id,
        learningSet: learningSets[0]._id,
        theme: 'Daily Life',
        meaning: 'Đi lại làm việc/học tập',
        isVerifiedCorrect: true,
        assisted: false,
        aiConfidenceScore: 0.94,
        usedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        localDay: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      },
      {
        student: student._id,
        word: 'productive',
        contextSentence: 'I also use a smart calendar to plan my commute and avoid traffic, making my daily routine smoother.',
        essayId: essay1b._id,
        revisionId: rev1b._id,
        learningSet: learningSets[0]._id,
        theme: 'Daily Life',
        meaning: 'Năng suất, hiệu quả',
        isVerifiedCorrect: true,
        assisted: false,
        aiConfidenceScore: 0.93,
        usedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        localDay: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      },
      {
        student: student._id,
        word: 'efficient',
        contextSentence: 'My morning routine has become more efficient since I started commuting by bike.',
        essayId: essay1b._id,
        revisionId: rev1b._id,
        learningSet: learningSets[0]._id,
        theme: 'Daily Life',
        meaning: 'Hiệu quả, tiết kiệm',
        isVerifiedCorrect: true,
        assisted: false,
        aiConfidenceScore: 0.96,
        usedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        localDay: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      },
      // Essay 2 evidence (Day -2)
      {
        student: student._id,
        word: 'innovation',
        contextSentence: 'Technological innovation is rapidly transforming modern classrooms.',
        essayId: essay2._id,
        revisionId: rev2._id,
        learningSet: learningSets[1]._id,
        theme: 'Technology',
        meaning: 'Sáng kiến, đổi mới',
        isVerifiedCorrect: true,
        assisted: false,
        aiConfidenceScore: 0.98,
        usedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        localDay: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      },
      {
        student: student._id,
        word: 'accessible',
        contextSentence: 'High-quality learning resources are now accessible to students across geographical boundaries.',
        essayId: essay2._id,
        revisionId: rev2._id,
        learningSet: learningSets[1]._id,
        theme: 'Technology',
        meaning: 'Dễ tiếp cận',
        isVerifiedCorrect: true,
        assisted: false,
        aiConfidenceScore: 0.95,
        usedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        localDay: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      },
      {
        student: student._id,
        word: 'collaboration',
        contextSentence: 'Furthermore, digital tools foster seamless collaboration among peers during group assignments.',
        essayId: essay2._id,
        revisionId: rev2._id,
        learningSet: learningSets[1]._id,
        theme: 'Technology',
        meaning: 'Hợp tác nhóm',
        isVerifiedCorrect: true,
        assisted: false,
        aiConfidenceScore: 0.96,
        usedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        localDay: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      },
      {
        student: student._id,
        word: 'revolutionize',
        contextSentence: 'As smart systems continue to evolve, they will definitely revolutionize individualized instruction.',
        essayId: essay2._id,
        revisionId: rev2._id,
        learningSet: learningSets[1]._id,
        theme: 'Technology',
        meaning: 'Cách mạng hóa',
        isVerifiedCorrect: true,
        assisted: false,
        aiConfidenceScore: 0.97,
        usedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        localDay: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      },
    ]

    for (const evi of evidencesData) {
      await WordUsageEvidence.findOneAndUpdate(
        { student: evi.student, word: evi.word, contextSentence: evi.contextSentence },
        evi,
        { upsert: true }
      )
    }
    console.log(`✅ Seeded ${evidencesData.length} verified WordUsageEvidence items.`)

    // 8. Review Events (Activity history for streak & chart analytics)
    console.log('📈 Seeding Review Events & Learning Sessions...')
    const reviewHistory = [
      { daysAgo: 6, words: ['routine', 'commute'], rating: 4 },
      { daysAgo: 5, words: ['productive', 'efficient'], rating: 4 },
      { daysAgo: 4, words: ['routine', 'productive'], rating: 3 },
      { daysAgo: 3, words: ['innovation', 'collaboration'], rating: 3 },
      { daysAgo: 2, words: ['accessible', 'revolutionize'], rating: 4 },
      { daysAgo: 1, words: ['routine', 'commute', 'productive'], rating: 4 },
      { daysAgo: 0, words: ['innovation', 'accessible'], rating: 3 },
    ]

    // Clear old seeded review events for demo clean state
    await ReviewEvent.deleteMany({ student: student._id })

    for (const rh of reviewHistory) {
      const date = new Date(Date.now() - rh.daysAgo * 24 * 60 * 60 * 1000)
      for (const w of rh.words) {
        const vocab = seededVocabs.find((v) => v.word === w)
        if (vocab) {
          await ReviewEvent.create({
            student: student._id,
            vocabulary: vocab._id,
            rating: rh.rating,
            reviewedAt: date,
            easeFactor: vocab.easeFactor,
            intervalAfter: vocab.reviewInterval,
            repetition: vocab.reviewCount,
            requestId: `seed_req_${crypto.randomUUID()}`,
            source: 'self_rating',
          })
        }
      }
    }
    console.log('✅ Seeded 7 days of review history (Active 7-day Streak).')

    // 9. Weekly Goal
    console.log('🎯 Seeding Weekly Goal...')
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)) // Monday
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    await WeeklyGoal.findOneAndUpdate(
      { student: student._id, weekStart: startOfWeek },
      {
        student: student._id,
        weekStart: startOfWeek,
        weekEnd: endOfWeek,
        goals: [
          { label: 'Từ vựng mới', target: 15, current: 11, icon: 'book', color: 'primary' },
          { label: 'Bài viết luận', target: 2, current: 2, icon: 'edit', color: 'success' },
          { label: 'Thời gian học (phút)', target: 90, current: 75, icon: 'clock', color: 'amber' },
        ],
      },
      { upsert: true }
    )
    console.log('✅ Seeded Weekly Goal.')

    console.log('\n======================================================')
    console.log('🎉 FULL DEMO DATA SEEDED SUCCESSFULLY!')
    console.log('======================================================')
    console.log('👑 Admin:   admin@lexigrow.com   | Password: 123456')
    console.log('👨‍🏫 Teacher: teacher@lexigrow.com | Password: 123456')
    console.log('🎓 Student: student@lexigrow.com | Password: 123456')
    console.log('👨‍👩‍👦 Parent:  parent@lexigrow.com  | Password: 123456')
    console.log('======================================================\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error during database seed:', error)
    process.exit(1)
  }
}

seedFullDemo()
