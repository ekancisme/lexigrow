import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import api from '../../services/api.js'
import './Explore.css'

const LEXIGROW_EXPLORE_TOPICS = [
  {
    id: 'exp-1',
    slug: 'academic-writing',
    image: '/assets/lexigrow/writing-practice.webp',
    title: 'Academic Writing: Task 2 Essay Mastery',
    titleVi: 'Viết luận IELTS Task 2 & Cấu trúc luận điểm',
    instructor: 'LexiGrow AI Studio',
    desc: 'Master thesis statements, counterarguments, and cohesion criteria for high-scoring IELTS Task 2 essays.',
    descVi: 'Làm chủ câu chủ đề, luận điểm phản biện và tính liên kết chặt chẽ theo 4 tiêu chí chuẩn IELTS.',
    rating: 5.0,
    reviews: '2.4K',
    skill: 'Writing',
    category: 'Academic Writing',
    duration: '15 mins',
    level: 'B2',
    levelLabel: 'Intermediate B2',
    bestSeller: true,
    badgeText: 'IELTS Task 2',
    wordsCount: 16,
    words: [
      { word: 'thesis', meaning: 'Luận điểm chính' },
      { word: 'cohesion', meaning: 'Tính liên kết' },
      { word: 'counterargument', meaning: 'Ý kiến phản biện' },
    ],
  },
  {
    id: 'exp-2',
    slug: 'daily-life',
    image: '/assets/editorial/topics/daily-life.webp',
    title: 'Daily Routines, Commuting & Habit Building',
    titleVi: 'Sinh hoạt hằng ngày & Năng suất làm việc',
    instructor: 'LexiGrow Spaced Coach',
    desc: 'Essential collocations and natural structures for describing daily life, public transit, and time management.',
    descVi: 'Cụm từ thông dụng và mẫu câu tự nhiên miêu tả nhịp sống thường ngày, đi lại và quản lý quỹ thời gian.',
    rating: 4.9,
    reviews: '3.1K',
    skill: 'Vocabulary',
    category: 'Daily Communication',
    duration: '10 mins',
    level: 'A2',
    levelLabel: 'Beginner A2',
    bestSeller: true,
    badgeText: 'Spaced Repetition',
    wordsCount: 14,
    words: [
      { word: 'routine', meaning: 'Thói quen hằng ngày' },
      { word: 'commute', meaning: 'Đi lại làm việc/học' },
      { word: 'productive', meaning: 'Hiệu quả năng suất' },
    ],
  },
  {
    id: 'exp-3',
    slug: 'grammar-mastery',
    image: '/assets/lexigrow/tutor-guidance.webp',
    title: 'Grammar in Action: Complex Sentences & Cohesion',
    titleVi: 'Ngữ pháp thực hành & Cấu trúc câu phức',
    instructor: 'LexiGrow Grammar AI',
    desc: 'Hands-on practice with relative clauses, adverbial transitions, and active-passive voice transformations.',
    descVi: 'Thực hành mệnh đề quan hệ, liên từ chuyển ý và biến đổi câu chủ động - bị động linh hoạt.',
    rating: 4.9,
    reviews: '1.8K',
    skill: 'Grammar',
    category: 'Grammar & Skills',
    duration: '12 mins',
    level: 'B1',
    levelLabel: 'Intermediate B1',
    bestSeller: false,
    badgeText: 'Grammar Focus',
    wordsCount: 15,
    words: [
      { word: 'conditional', meaning: 'Câu điều kiện' },
      { word: 'subordinate', meaning: 'Mệnh đề phụ' },
      { word: 'cohesion', meaning: 'Mạch lạc logic' },
    ],
  },
  {
    id: 'exp-4',
    slug: 'technology',
    image: '/assets/editorial/topics/technology.webp',
    title: 'Technology & AI Impact on Modern Society',
    titleVi: 'Công nghệ số & Đổi mới sáng tạo AI',
    instructor: 'LexiGrow Tech Writer',
    desc: 'Explore high-band vocabulary discussing artificial intelligence, automation, data privacy, and digital ethics.',
    descVi: 'Mở rộng vốn từ vựng học thuật về trí tuệ nhân tạo, tự động hóa, quyền riêng tư dữ liệu và đạo đức số.',
    rating: 5.0,
    reviews: '2.9K',
    skill: 'Writing',
    category: 'Technology & AI',
    duration: '15 mins',
    level: 'B2',
    levelLabel: 'Intermediate B2',
    bestSeller: true,
    badgeText: 'Hot Topic',
    wordsCount: 18,
    words: [
      { word: 'innovation', meaning: 'Đổi mới sáng tạo' },
      { word: 'algorithm', meaning: 'Thuật toán tính toán' },
      { word: 'automation', meaning: 'Tự động hóa' },
    ],
  },
  {
    id: 'exp-5',
    slug: 'environment',
    image: '/assets/editorial/topics/environment.webp',
    title: 'Environment, Climate Action & Sustainability',
    titleVi: 'Môi trường & Phát triển bền vững',
    instructor: 'IELTS Academic Specialist',
    desc: 'Academic vocabulary for climate change essays, renewable energy debates, and global ecological initiatives.',
    descVi: 'Từ vựng học thuật chuẩn IELTS cho bài luận biến đổi khí hậu, năng lượng tái tạo và bảo tồn sinh thái.',
    rating: 4.9,
    reviews: '2.1K',
    skill: 'Writing',
    category: 'Environment',
    duration: '15 mins',
    level: 'B2',
    levelLabel: 'Intermediate B2',
    bestSeller: false,
    badgeText: 'IELTS Favorite',
    wordsCount: 16,
    words: [
      { word: 'sustainable', meaning: 'Phát triển bền vững' },
      { word: 'biodiversity', meaning: 'Đa dạng sinh học' },
      { word: 'ecosystem', meaning: 'Hệ sinh thái tự nhiên' },
    ],
  },
  {
    id: 'exp-6',
    slug: 'business-english',
    image: '/assets/lexigrow/study-group.webp',
    title: 'Business English: Workplace Negotiation & Emailing',
    titleVi: 'Tiếng Anh thương mại & Giao tiếp công sở',
    instructor: 'Corporate English Coach',
    desc: 'Professional communication, executive email etiquette, stakeholder alignment, and persuasive negotiation.',
    descVi: 'Giao tiếp chuyên nghiệp, kỹ năng viết email đàm phán, làm việc với đối tác và thuyết phục khách hàng.',
    rating: 4.8,
    reviews: '1.5K',
    skill: 'Business',
    category: 'Business English',
    duration: '15 mins',
    level: 'B2',
    levelLabel: 'Intermediate B2',
    bestSeller: true,
    badgeText: 'Career Boost',
    wordsCount: 15,
    words: [
      { word: 'negotiation', meaning: 'Đàm phán thương mại' },
      { word: 'consensus', meaning: 'Sự đồng thuận chung' },
      { word: 'deliverable', meaning: 'Kết quả bàn giao' },
    ],
  },
  {
    id: 'exp-7',
    slug: 'pronunciation-coach',
    image: '/assets/lexigrow/study-hero.webp',
    title: 'Clear Pronunciation, IPA & Spoken Intonation',
    titleVi: 'Phát âm chuẩn IPA & Ngữ điệu tự nhiên',
    instructor: 'Phonetics Specialist',
    desc: 'Systematic drill on English phonetic alphabet (IPA), stress patterns, sentence melody, and connected speech.',
    descVi: 'Luyện chuẩn âm IPA, trọng âm từ, ngữ điệu câu và nối âm tự nhiên giúp tự tin giao tiếp tiếng Anh.',
    rating: 4.9,
    reviews: '1.7K',
    skill: 'Speaking',
    category: 'Daily Communication',
    duration: '10 mins',
    level: 'A2',
    levelLabel: 'Beginner A2',
    bestSeller: false,
    badgeText: 'Speaking Boost',
    wordsCount: 12,
    words: [
      { word: 'intonation', meaning: 'Ngữ điệu câu nói' },
      { word: 'articulation', meaning: 'Phát âm rõ ràng' },
      { word: 'syllable', meaning: 'Âm tiết cấu thành' },
    ],
  },
  {
    id: 'exp-8',
    slug: 'ielts-problem-solution',
    image: '/assets/editorial/topics/auth-study.webp',
    title: 'IELTS Writing: Problem & Solution Essays',
    titleVi: 'Viết luận IELTS: Dạng bài Nguyên nhân & Giải pháp',
    instructor: 'Senior IELTS Examiner AI',
    desc: 'Structural frameworks and band 7.0+ linking phrases for cause-and-effect problem solving essays.',
    descVi: 'Khung bài viết chuẩn và liên từ nối Band 7.0+ cho dạng đề phân tích nguyên nhân và đề xuất giải pháp.',
    rating: 5.0,
    reviews: '2.6K',
    skill: 'IELTS',
    category: 'Academic Writing',
    duration: '18 mins',
    level: 'C1',
    levelLabel: 'Advanced C1',
    bestSeller: true,
    badgeText: 'Band 7.0+',
    wordsCount: 20,
    words: [
      { word: 'unprecedented', meaning: 'Chưa từng có' },
      { word: 'mitigate', meaning: 'Làm giảm nhẹ/khắc phục' },
      { word: 'repercussion', meaning: 'Hậu quả lâu dài' },
    ],
  },
  {
    id: 'exp-9',
    slug: 'travel',
    image: '/assets/editorial/topics/travel.webp',
    title: 'Culture, Global Travel & Heritage Exploration',
    titleVi: 'Văn hóa, Du lịch toàn cầu & Khám phá di sản',
    instructor: 'LexiGrow Explorer',
    desc: 'Vibrant vocabulary for discussing world cultures, historical landmarks, eco-tourism, and travel memoirs.',
    descVi: 'Từ vựng sống động miêu tả văn hóa thế giới, di sản lịch sử, du lịch sinh thái và trải nghiệm du lịch.',
    rating: 4.8,
    reviews: '1.9K',
    skill: 'Vocabulary',
    category: 'Daily Communication',
    duration: '10 mins',
    level: 'A2',
    levelLabel: 'Beginner A2',
    bestSeller: false,
    badgeText: 'Spaced Repetition',
    wordsCount: 14,
    words: [
      { word: 'itinerary', meaning: 'Lịch trình chuyến đi' },
      { word: 'heritage', meaning: 'Di sản văn hóa' },
      { word: 'hospitality', meaning: 'Lòng hiếu khách' },
    ],
  },
  {
    id: 'exp-10',
    slug: 'education-reform',
    image: '/assets/editorial/topics/auth-study.webp',
    title: 'Education Reform, Smart Classrooms & Digital Skills',
    titleVi: 'Đổi mới giáo dục & Kỹ năng số cho thế hệ mới',
    instructor: 'LexiGrow AI Studio',
    desc: 'Analyze contemporary educational challenges, blended learning models, and equitable access to knowledge.',
    descVi: 'Bình luận về chuyển đổi số giáo dục, mô hình học tập kết hợp và cơ hội tiếp cận tri thức bình đẳng.',
    rating: 4.9,
    reviews: '1.4K',
    skill: 'Writing',
    category: 'Academic Writing',
    duration: '15 mins',
    level: 'B2',
    levelLabel: 'Intermediate B2',
    bestSeller: false,
    badgeText: 'IELTS Task 2',
    wordsCount: 16,
    words: [
      { word: 'pedagogy', meaning: 'Phương pháp sư phạm' },
      { word: 'literacy', meaning: 'Năng lực học vấn' },
      { word: 'adaptive', meaning: 'Khả năng thích ứng' },
    ],
  },
  {
    id: 'exp-11',
    slug: 'hobbies',
    image: '/assets/editorial/topics/hobbies.webp',
    title: 'Creative Arts, Mental Wellness & Healthy Living',
    titleVi: 'Nghệ thuật sáng tạo, Tinh thần & Lối sống lành mạnh',
    instructor: 'Wellness English Guide',
    desc: 'Expressive vocabulary exploring mindfulness, creative hobbies, stress management, and emotional balance.',
    descVi: 'Vốn từ biểu cảm về sự tĩnh tâm, sở thích nghệ thuật, giảm căng thẳng và cân bằng cảm xúc trong cuộc sống.',
    rating: 4.9,
    reviews: '1.3K',
    skill: 'Vocabulary',
    category: 'Daily Communication',
    duration: '12 mins',
    level: 'B1',
    levelLabel: 'Intermediate B1',
    bestSeller: false,
    badgeText: 'Wellness',
    wordsCount: 15,
    words: [
      { word: 'recreation', meaning: 'Giải trí thư giãn' },
      { word: 'wellbeing', meaning: 'Sức khỏe toàn diện' },
      { word: 'enriching', meaning: 'Làm giàu tâm hồn' },
    ],
  },
  {
    id: 'exp-12',
    slug: 'advanced-collocations',
    image: '/assets/lexigrow/writing-practice.webp',
    title: 'Academic Collocations & Precision Phrasing',
    titleVi: 'Collocation học thuật & Diễn đạt chính xác',
    instructor: 'Band 8.0+ Lexical Coach',
    desc: 'High-level word pairings, academic discourse markers, and nuanced vocabulary to boost your lexical resource score.',
    descVi: 'Cụm từ học thuật nâng cao, liên từ chuyển mạch và phương pháp diễn đạt tinh tế giúp tối ưu điểm Lexical Resource.',
    rating: 5.0,
    reviews: '2.8K',
    skill: 'Writing',
    category: 'Grammar & Skills',
    duration: '18 mins',
    level: 'C1',
    levelLabel: 'Advanced C1',
    bestSeller: true,
    badgeText: 'Band 8.0+',
    wordsCount: 20,
    words: [
      { word: 'substantial', meaning: 'Đáng kể/To lớn' },
      { word: 'predominantly', meaning: 'Phần lớn/Chủ yếu' },
      { word: 'corroborate', meaning: 'Xác nhận/Chứng minh' },
    ],
  },
]

export default function Explore() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { language } = useLanguage()
  const { user } = useAuth()

  // Search query from header or URL param
  const queryParam = searchParams.get('q') || searchParams.get('query') || ''
  const [searchQuery, setSearchQuery] = useState(queryParam || '')

  // Filter state for genuine LexiGrow English features
  const [selectedSkill, setSelectedSkill] = useState('ALL')
  const [selectedLevel, setSelectedLevel] = useState('ALL')
  const [selectedDuration, setSelectedDuration] = useState('ALL')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedRating, setSelectedRating] = useState(0)
  const [sortBy, setSortBy] = useState('popular')
  const [currentPage, setCurrentPage] = useState(1)

  // Collapsible accordion sections
  const [featuresOpen, setFeaturesOpen] = useState(true)

  // Sync if query param changes (e.g. user searched in TopNav)
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam)
      setSelectedCategory('ALL')
      setSelectedSkill('ALL')
    }
  }, [queryParam])

  const handleClearFilters = () => {
    setSelectedRating(0)
    setSelectedSkill('ALL')
    setSelectedLevel('ALL')
    setSelectedDuration('ALL')
    setSelectedCategory('ALL')
    setSearchQuery('')
  }

  // Filtered course results
  const filteredCourses = LEXIGROW_EXPLORE_TOPICS.filter((course) => {
    if (selectedRating > 0 && course.rating < selectedRating) return false
    if (selectedSkill !== 'ALL' && course.skill !== selectedSkill) return false
    if (selectedLevel !== 'ALL' && course.level !== selectedLevel) return false
    if (selectedDuration !== 'ALL') {
      if (selectedDuration === '10 mins' && course.duration !== '10 mins') return false
      if (selectedDuration === '12-15 mins' && !['12 mins', '15 mins'].includes(course.duration)) return false
      if (selectedDuration === '18+ mins' && !['18 mins', '20 mins'].includes(course.duration)) return false
    }
    if (selectedCategory !== 'ALL' && course.category !== selectedCategory) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const inTitle = course.title.toLowerCase().includes(q)
      const inTitleVi = course.titleVi.toLowerCase().includes(q)
      const inCategory = course.category.toLowerCase().includes(q)
      const inSkill = course.skill.toLowerCase().includes(q)
      const inDesc = course.desc.toLowerCase().includes(q) || course.descVi.toLowerCase().includes(q)
      const inWords = course.words.some(
        (w) => w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)
      )
      if (!inTitle && !inTitleVi && !inCategory && !inSkill && !inDesc && !inWords) return false
    }
    return true
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating
    if (sortBy === 'newest') return b.id.localeCompare(a.id)
    if (sortBy === 'level') return a.level.localeCompare(b.level)
    return parseInt(b.reviews, 10) - parseInt(a.reviews, 10)
  })

  const resultsCount = filteredCourses.length.toString()
  const activeTerm = searchQuery
    ? `"${searchQuery}"`
    : selectedSkill !== 'ALL'
      ? selectedSkill
      : selectedCategory !== 'ALL'
        ? selectedCategory
        : (language === 'vi' ? 'Tất cả chủ đề học tập' : 'All Topics')

  return (
    <div className="figma-search-page">
      <div className="figma-search-layout">
        {/* ── Left Sidebar Filter (Figma Modern Layout) ── */}
        <aside className="figma-sidebar" aria-label="Filters">
          <div className="figma-sidebar__header">
            <h3>{language === 'vi' ? 'Bộ lọc học tập' : 'Learning Filters'}</h3>
            <button type="button" className="figma-sidebar__clear" onClick={handleClearFilters}>
              {language === 'vi' ? 'Xóa bộ lọc' : 'Clear All'}
            </button>
          </div>

          {/* 1. Skill & Focus */}
          <div className="figma-sidebar__group">
            <div className="figma-sidebar__group-header">
              <span className="figma-sidebar__group-title">
                {language === 'vi' ? 'Kỹ năng trọng tâm' : 'Skill & Focus'}
              </span>
              <span className="material-symbols-outlined figma-sidebar__chevron">expand_less</span>
            </div>
            <div className="figma-sidebar__options">
              {[
                { id: 'ALL', label: language === 'vi' ? 'Tất cả kỹ năng' : 'All Skills', count: '12' },
                { id: 'Writing', label: 'Academic Writing', count: '5' },
                { id: 'IELTS', label: 'IELTS Task 1 & 2', count: '2' },
                { id: 'Vocabulary', label: 'Vocabulary Mastery', count: '3' },
                { id: 'Grammar', label: 'Grammar in Action', count: '1' },
                { id: 'Speaking', label: 'Pronunciation (IPA)', count: '1' },
                { id: 'Business', label: 'Business English', count: '1' },
              ].map((item) => (
                <label key={item.id} className="figma-filter-item">
                  <input
                    type="radio"
                    name="filter-skill"
                    checked={selectedSkill === item.id}
                    onChange={() => setSelectedSkill(item.id)}
                  />
                  <span className="figma-custom-radio" />
                  <span className="figma-sidebar-label">{item.label}</span>
                  <span className="figma-sidebar-count">({item.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. CEFR English Level */}
          <div className="figma-sidebar__group">
            <div className="figma-sidebar__group-header">
              <span className="figma-sidebar__group-title">
                {language === 'vi' ? 'Trình độ CEFR' : 'CEFR Level'}
              </span>
              <span className="material-symbols-outlined figma-sidebar__chevron">expand_less</span>
            </div>
            <div className="figma-sidebar__options">
              {[
                { id: 'ALL', label: language === 'vi' ? 'Tất cả trình độ' : 'All Levels' },
                { id: 'A2', label: 'A1 - A2 (Beginner)' },
                { id: 'B1', label: 'B1 (Pre-Intermediate)' },
                { id: 'B2', label: 'B2 (Intermediate)' },
                { id: 'C1', label: 'C1 - C2 (Advanced)' },
              ].map((lvl) => (
                <label key={lvl.id} className="figma-filter-item">
                  <input
                    type="radio"
                    name="filter-level"
                    checked={selectedLevel === lvl.id}
                    onChange={() => setSelectedLevel(lvl.id)}
                  />
                  <span className="figma-custom-radio" />
                  <span className="figma-sidebar-label">{lvl.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Session Duration */}
          <div className="figma-sidebar__group">
            <div className="figma-sidebar__group-header">
              <span className="figma-sidebar__group-title">
                {language === 'vi' ? 'Thời lượng phiên học' : 'Session Duration'}
              </span>
              <span className="material-symbols-outlined figma-sidebar__chevron">expand_less</span>
            </div>
            <div className="figma-sidebar__options">
              {[
                { id: 'ALL', label: language === 'vi' ? 'Tất cả thời lượng' : 'Any Duration' },
                { id: '10 mins', label: language === 'vi' ? '10 phút (Khởi động)' : '10 mins (Quick Drill)' },
                { id: '12-15 mins', label: language === 'vi' ? '12 - 15 phút (Chuẩn)' : '12 - 15 mins (Standard)' },
                { id: '18+ mins', label: language === 'vi' ? '18+ phút (Chuyên sâu)' : '18+ mins (Deep Practice)' },
              ].map((dur) => (
                <label key={dur.id} className="figma-filter-item">
                  <input
                    type="radio"
                    name="filter-duration"
                    checked={selectedDuration === dur.id}
                    onChange={() => setSelectedDuration(dur.id)}
                  />
                  <span className="figma-custom-radio" />
                  <span className="figma-sidebar-label">{dur.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Topic Category */}
          <div className="figma-sidebar__group">
            <div className="figma-sidebar__group-header">
              <span className="figma-sidebar__group-title">
                {language === 'vi' ? 'Chủ đề thảo luận' : 'Topic Categories'}
              </span>
              <span className="material-symbols-outlined figma-sidebar__chevron">expand_less</span>
            </div>
            <div className="figma-sidebar__options">
              {[
                { id: 'Academic Writing', label: language === 'vi' ? 'Học thuật & IELTS' : 'Academic & IELTS' },
                { id: 'Daily Communication', label: language === 'vi' ? 'Sinh hoạt & Đời sống' : 'Daily Life & Social' },
                { id: 'Technology & AI', label: language === 'vi' ? 'Công nghệ số & AI' : 'Technology & Science' },
                { id: 'Environment', label: language === 'vi' ? 'Môi trường & Xã hội' : 'Environment & Ecology' },
                { id: 'Business English', label: language === 'vi' ? 'Kinh doanh & Công sở' : 'Business & Career' },
                { id: 'Grammar & Skills', label: language === 'vi' ? 'Kỹ năng & Ngữ pháp' : 'Grammar & Collocation' },
              ].map((cat) => (
                <label key={cat.id} className="figma-filter-item">
                  <input
                    type="checkbox"
                    checked={selectedCategory === cat.id}
                    onChange={() => setSelectedCategory(selectedCategory === cat.id ? 'ALL' : cat.id)}
                  />
                  <span className="figma-custom-control" />
                  <span className="figma-sidebar-label">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 5. AI Features Accordion */}
          <div className="figma-sidebar__group">
            <button
              type="button"
              className="figma-sidebar__group-header"
              onClick={() => setFeaturesOpen((prev) => !prev)}
            >
              <span className="figma-sidebar__group-title">
                {language === 'vi' ? 'Tính năng trợ lý AI' : 'AI Capabilities'}
              </span>
              <span className="material-symbols-outlined figma-sidebar__chevron">
                {featuresOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {featuresOpen && (
              <div className="figma-sidebar__options">
                {[
                  { labelVi: 'Chấm điểm IELTS 4 tiêu chí', labelEn: '4-Criteria IELTS AI Scoring' },
                  { labelVi: 'Lặp lại ngắt quãng (Spaced)', labelEn: 'Spaced Repetition Rounds' },
                  { labelVi: 'Sửa lỗi ngữ pháp & Từ vựng', labelEn: 'Grammar & Collocation Hints' },
                ].map((feat, idx) => (
                  <label key={idx} className="figma-filter-item">
                    <input type="checkbox" defaultChecked />
                    <span className="figma-custom-control" />
                    <span className="figma-sidebar-label">
                      {language === 'vi' ? feat.labelVi : feat.labelEn}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 6. Rating */}
          <div className="figma-sidebar__group">
            <div className="figma-sidebar__group-header">
              <span className="figma-sidebar__group-title">
                {language === 'vi' ? 'Đánh giá học viên' : 'Student Rating'}
              </span>
              <span className="material-symbols-outlined figma-sidebar__chevron">expand_less</span>
            </div>
            <div className="figma-sidebar__options">
              {[
                { val: 4.9, label: '4.9 & up', count: '10', stars: 5 },
                { val: 4.5, label: '4.5 & up', count: '12', stars: 5 },
              ].map((r) => (
                <label key={r.val} className="figma-filter-item">
                  <input
                    type="radio"
                    name="filter-rating"
                    checked={selectedRating === r.val}
                    onChange={() => setSelectedRating(selectedRating === r.val ? 0 : r.val)}
                  />
                  <span className="figma-custom-radio" />
                  <span className="figma-sidebar-stars">{'★'.repeat(r.stars)}</span>
                  <span className="figma-sidebar-label">{r.label}</span>
                  <span className="figma-sidebar-count">({r.count})</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main Content: Results & 3-Col Grid ── */}
        <main className="figma-content">
          <div className="figma-results-header">
            <div className="figma-results-count">
              <span>{language === 'vi' ? `Hiển thị ${resultsCount} chủ đề của ` : `Showing ${resultsCount} topics of `}</span>
              <strong>{activeTerm}</strong>
            </div>

            <select
              className="figma-sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort topics"
            >
              <option value="popular">{language === 'vi' ? 'Phổ biến nhất' : 'Most Popular'}</option>
              <option value="rating">{language === 'vi' ? 'Đánh giá cao nhất' : 'Highest Rated'}</option>
              <option value="level">{language === 'vi' ? 'Độ khó tăng dần' : 'Level: Easy to Hard'}</option>
              <option value="newest">{language === 'vi' ? 'Mới nhất' : 'Newest'}</option>
            </select>
          </div>

          {/* 3 Columns Grid (12 LexiGrow English Cards) */}
          {filteredCourses.length > 0 ? (
            <div className="figma-search-grid">
              {filteredCourses.map((course) => {
                const targetUrl = `/student/writing?set=${course.slug}`
                return (
                  <div
                    key={course.id}
                    className="figma-course-card"
                    onClick={() => navigate(targetUrl)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(targetUrl) }}
                  >
                    {/* Thumbnail wrap */}
                    <div className="figma-course-card__thumb-wrap">
                      <img src={course.image} alt={course.title} className="figma-course-card__thumb" />
                      <div className="figma-course-card__badges">
                        <span className={`figma-badge figma-badge--level-${course.level.toLowerCase()}`}>
                          {course.level}
                        </span>
                        {course.badgeText && (
                          <span className="figma-badge figma-badge--bestseller">
                            {course.badgeText}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="figma-course-card__body">
                      {/* Meta top bar */}
                      <div className="figma-course-card__meta-top">
                        <span className="figma-course-card__meta-item">
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>schedule</span>
                          {course.duration}
                        </span>
                        <span className="figma-course-card__meta-item">
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>style</span>
                          {course.wordsCount} {language === 'vi' ? 'từ vựng' : 'words'}
                        </span>
                        <span className="figma-course-card__ai-badge">
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>auto_awesome</span>
                          AI Scored
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="figma-course-card__title">
                        {language === 'vi' ? course.titleVi : course.title}
                      </h3>

                      {/* Mentor/Instructor */}
                      <div className="figma-course-card__instructor">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>psychology</span>
                        <span>{course.instructor}</span>
                      </div>

                      {/* Description */}
                      <p className="figma-course-card__desc">
                        {language === 'vi' ? course.descVi : course.desc}
                      </p>

                      {/* Vocabulary Chips Preview */}
                      <div className="figma-course-card__words" aria-label="Vocabulary preview">
                        {course.words.slice(0, 3).map((w) => (
                          <span key={w.word} className="figma-word-chip">
                            <strong>{w.word}</strong>: {w.meaning}
                          </span>
                        ))}
                      </div>

                      {/* Rating + Action Button Row */}
                      <div className="figma-course-card__action-row">
                        <div className="figma-course-card__rating">
                          <div className="figma-stars">{'★'.repeat(5)}</div>
                          <span className="figma-reviews">({course.reviews})</span>
                        </div>

                        <button
                          type="button"
                          className="figma-course-card__cta-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(targetUrl)
                          }}
                        >
                          <span>{language === 'vi' ? 'Luyện viết ngay' : 'Start Writing'}</span>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="figma-empty-results">
              <span className="material-symbols-outlined figma-empty-icon">search_off</span>
              <h3>{language === 'vi' ? 'Không tìm thấy chủ đề phù hợp' : 'No matching topics found'}</h3>
              <p>
                {language === 'vi'
                  ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bớt các bộ lọc đang chọn.'
                  : 'Try searching with different keywords or clearing some filters.'}
              </p>
              <button type="button" className="figma-cta-banner__btn" onClick={handleClearFilters}>
                {language === 'vi' ? 'Xóa toàn bộ lọc' : 'Clear All Filters'}
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredCourses.length > 0 && (
            <div className="figma-pagination" aria-label="Pagination">
              <button
                type="button"
                className="figma-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
              </button>
              <button
                type="button"
                className={`figma-page-btn ${currentPage === 1 ? 'is-active' : ''}`}
                onClick={() => setCurrentPage(1)}
              >
                1
              </button>
              <button
                type="button"
                className={`figma-page-btn ${currentPage === 2 ? 'is-active' : ''}`}
                onClick={() => setCurrentPage(2)}
              >
                2
              </button>
              <button
                type="button"
                className="figma-page-btn"
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
              </button>
            </div>
          )}

          {/* Bottom Modern LexiGrow CTA Banner */}
          <section className="figma-cta-banner">
            <div className="figma-cta-banner__copy">
              <h2>
                {language === 'vi'
                  ? 'Bứt phá kỹ năng tiếng Anh cùng LexiGrow AI'
                  : 'Accelerate Your English Mastery with LexiGrow AI'}
              </h2>
              <p>
                {language === 'vi'
                  ? 'Rèn luyện kỹ năng viết luận theo 4 tiêu chí chuẩn IELTS với hệ thống chấm chữa tức thì, kết hợp mở rộng vốn từ vựng khoa học theo phương pháp Spaced Repetition.'
                  : 'Master academic writing with real-time IELTS evaluation, expand vocabulary scientifically through Spaced Repetition, and track measurable growth every day.'}
              </p>
              <div className="figma-cta-banner__actions">
                <Link to={user ? '/student/writing' : '/register'} className="figma-cta-banner__btn">
                  <span>{language === 'vi' ? 'Bắt đầu học ngay' : 'Start Practicing Free'}</span>
                </Link>
                <Link to="/pricing" className="figma-cta-banner__btn figma-cta-banner__btn--outline">
                  <span>{language === 'vi' ? 'Xem các gói học' : 'View Pricing Plans'}</span>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
