import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
import { TOPIC_VOCABULARY_ROUNDS, getTopicRound } from '../../data/topicVocabularyRounds.js'
import './Explore.css'

const EDUVIA_COURSES = [
  {
    slug: 'daily-life',
    tag: 'Speaking',
    tagColor: 'green',
    image: '/assets/lexigrow/study-hero.webp',
    title: 'Daily Life & Routines',
    titleVi: 'Sinh hoạt & Giao tiếp hằng ngày',
    level: 'A2',
    timeEstimate: '10 mins',
    desc: 'Master essential expressions for daily routines, commuting to work/school, and organizing daily life.',
    descVi: 'Nắm vững các mẫu câu và từ vựng thông dụng cho sinh hoạt, đi lại và sắp xếp công việc thường ngày.',
    words: [
      { word: 'routine', meaning: 'Daily habits' },
      { word: 'commute', meaning: 'Travel to work/school' },
      { word: 'productive', meaning: 'High efficiency' },
      { word: 'schedule', meaning: 'Daily plan' }
    ],
    rating: 4.8,
    reviews: '1.2K',
    price: '$24.92',
    originalPrice: '$32.90',
  },
  {
    slug: 'pronunciation-coach',
    tag: 'Pronunciation',
    tagColor: 'teal',
    image: '/assets/lexigrow/writing-practice.webp',
    title: 'Clear English Pronunciation',
    titleVi: 'Phát âm chuẩn & Ngữ điệu tự nhiên',
    level: 'A2',
    timeEstimate: '10 mins',
    desc: 'Guided phonetics practice, syllable stress patterns, and natural spoken intonation coaching.',
    descVi: 'Luyện phát âm chuẩn bảng ký hiệu IPA, nhấn trọng âm và ngữ điệu tự nhiên khi giao tiếp.',
    words: [
      { word: 'intonation', meaning: 'Pitch modulation' },
      { word: 'articulation', meaning: 'Clear pronunciation' },
      { word: 'syllable', meaning: 'Sound unit' }
    ],
    rating: 4.9,
    reviews: '850',
    price: '$24.92',
    originalPrice: '$32.90',
  },
  {
    slug: 'grammar-mastery',
    tag: 'Grammar',
    tagColor: 'green',
    image: '/assets/lexigrow/tutor-guidance.webp',
    title: 'Grammar in Action & Cohesion',
    titleVi: 'Ngữ pháp thực hành & Cấu trúc câu',
    level: 'B1',
    timeEstimate: '12 mins',
    desc: 'Understand sentence clauses, complex verb tenses, and logical cohesion in writing.',
    descVi: 'Hệ thống hóa ngữ pháp tiếng Anh qua các tình huống thực tế và bài tập viết câu mạch lạc.',
    words: [
      { word: 'conditional', meaning: 'Hypothetical' },
      { word: 'passive', meaning: 'Subject receives action' },
      { word: 'cohesion', meaning: 'Logical flow' }
    ],
    rating: 5.0,
    reviews: '1.4K',
    price: '$24.92',
    originalPrice: '$32.90',
  },
  {
    slug: 'academic-writing',
    tag: 'Writing',
    tagColor: 'teal',
    image: '/assets/lexigrow/writing-practice.webp',
    title: 'Academic Writing & IELTS Essays',
    titleVi: 'Viết luận học thuật & Chấm điểm IELTS',
    level: 'B2',
    timeEstimate: '15 mins',
    desc: 'Structured essay templates, topic sentences, and instant 4-criteria IELTS evaluation by AI.',
    descVi: 'Rèn luyện kỹ năng viết luận theo 4 tiêu chí chuẩn IELTS với sự chấm chữa tức thì từ trợ lý AI.',
    words: [
      { word: 'thesis', meaning: 'Main proposition' },
      { word: 'coherence', meaning: 'Logical connection' },
      { word: 'counterargument', meaning: 'Opposing perspective' }
    ],
    rating: 5.0,
    reviews: '2.1K',
    price: '$24.92',
    originalPrice: '$32.90',
  },
  {
    slug: 'technology',
    tag: 'Vocabulary',
    tagColor: 'teal',
    image: '/assets/lexigrow/study-group.webp',
    title: 'Technology & Digital Life',
    titleVi: 'Công nghệ & Đổi mới sáng tạo',
    level: 'B1',
    timeEstimate: '10 mins',
    desc: 'Discuss technological innovation, digital transformation, accessibility, and practical AI.',
    descVi: 'Mở rộng vốn từ vựng về trí tuệ nhân tạo, thiết bị số và xu hướng công nghệ tương lai.',
    words: [
      { word: 'innovation', meaning: 'Groundbreaking idea' },
      { word: 'collaboration', meaning: 'Teamwork' },
      { word: 'accessible', meaning: 'Easy to reach' }
    ],
    rating: 4.9,
    reviews: '1.5K',
    price: '$24.92',
    originalPrice: '$32.90',
  },
  {
    slug: 'environment',
    tag: 'Business English',
    tagColor: 'green',
    image: '/assets/editorial/topics/environment.webp',
    title: 'Environment & Sustainability',
    titleVi: 'Môi trường & Phát triển bền vững',
    level: 'B2',
    timeEstimate: '12 mins',
    desc: 'Discuss biodiversity, climate action, ecosystems, and corporate environmental responsibility.',
    descVi: 'Học ngôn ngữ học thuật về biến đổi khí hậu, bảo tồn hệ sinh thái và phát triển bền vững.',
    words: [
      { word: 'sustainable', meaning: 'Eco-friendly' },
      { word: 'biodiversity', meaning: 'Biological variety' },
      { word: 'ecosystem', meaning: 'Living network' }
    ],
    rating: 4.8,
    reviews: '910',
    price: '$24.92',
    originalPrice: '$32.90',
  }
]

export default function Explore() {
  const navigate = useNavigate()
  const { language } = useLanguage()

  const [selectedTag, setSelectedTag] = useState('ALL')
  const [selectedLevel, setSelectedLevel] = useState('ALL')
  const [selectedRating, setSelectedRating] = useState(0)
  const [statusTab, setStatusTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [currentPage, setCurrentPage] = useState(1)

  const [topicSets, setTopicSets] = useState(EDUVIA_COURSES)
  const [completedCounts, setCompletedCounts] = useState({})
  const [recentSessions, setRecentSessions] = useState([])
  const [userRoadmap, setUserRoadmap] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function loadExploreData() {
      const [setsResult, historyResult, roadmapResult] = await Promise.allSettled([
        api.get('/learning-sets'),
        api.get('/sessions/history'),
        api.get('/roadmap'),
      ])
      if (!isMounted) return

      if (roadmapResult.status === 'fulfilled') {
        const rData = roadmapResult.value?.data?.data
        if (rData) setUserRoadmap(rData)
      }

      if (setsResult.status === 'fulfilled') {
        const responseData = setsResult.value?.data
        const rawSets = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.data) ? responseData.data : []
        if (rawSets.length) {
          const serverCourses = rawSets.map((set) => {
            const preset = EDUVIA_COURSES.find((course) => course.slug === set.slug)
            const words = (set.items || []).map((item) => ({
              word: item.word,
              meaning: item.definitionVi || item.meaningVi || item.definition || item.meaning || '',
            })).filter((item) => item.word)
            const categoryText = `${set.category || ''} ${set.title || ''} ${set.slug || ''}`.toLowerCase()
            const tag = preset?.tag || (
              /pronunciation|phonetic|phát âm/.test(categoryText) ? 'Pronunciation' :
              /grammar|ngữ pháp/.test(categoryText) ? 'Grammar' :
              /business|thương mại/.test(categoryText) ? 'Business English' :
              /writing|essay|viết/.test(categoryText) ? 'Writing' :
              /vocabulary|từ vựng/.test(categoryText) ? 'Vocabulary' : 'Speaking'
            )
            return {
              ...(preset || {}),
              slug: set.slug,
              tag,
              tagColor: preset?.tagColor || (['Speaking', 'Grammar'].includes(tag) ? 'green' : 'teal'),
              title: set.title || preset?.title || set.slug,
              titleVi: preset?.titleVi || set.titleVi || set.title || set.slug,
              level: set.level || preset?.level || 'B1',
              desc: set.description || preset?.desc || '',
              descVi: set.descriptionVi || preset?.descVi || set.description || '',
              words: words.length ? words : (preset?.words || []),
              timeEstimate: preset?.timeEstimate || '10 mins',
              rating: preset?.rating || 4.9,
              reviews: preset?.reviews || '1.1K',
              price: '$24.92',
              originalPrice: '$32.90',
            }
          })
          const serverCoursesBySlug = new Map(serverCourses.map((course) => [course.slug, course]))
          const featuredCourses = EDUVIA_COURSES.map((course) => serverCoursesBySlug.get(course.slug) || course)
          const featuredSlugs = new Set(featuredCourses.map((course) => course.slug))
          setTopicSets([...featuredCourses, ...serverCourses.filter((course) => !featuredSlugs.has(course.slug))])
        }
      }

      if (historyResult.status === 'fulfilled') {
        const historyData = historyResult.value?.data?.data || historyResult.value?.data || {}
        const counts = historyData.completedSlugCounts || {}
        if (Object.keys(counts).length) {
          setCompletedCounts(counts)
        } else {
          const recentCounts = {}
          ;(historyData.recentSessions || []).forEach((session) => {
            if (session.learningSetSlug) recentCounts[session.learningSetSlug] = (recentCounts[session.learningSetSlug] || 0) + 1
          })
          setCompletedCounts(recentCounts)
        }
        setRecentSessions(historyData.recentSessions || [])
      }
    }
    loadExploreData()
    return () => { isMounted = false }
  }, [])

  const coursesWithProgress = topicSets.map((course) => {
    const completedCount = Number(completedCounts[course.slug] || 0)
    const isCompleted = completedCount > 0
    const rounds = TOPIC_VOCABULARY_ROUNDS[course.slug]
    const roundNumber = rounds?.length ? (completedCount % rounds.length) + 1 : completedCount + 1
    const roundData = isCompleted ? getTopicRound(course.slug, roundNumber) : null
    const learnedWords = new Set(recentSessions
      .filter((session) => session.learningSetSlug === course.slug)
      .flatMap((session) => session.targetWords || [])
      .map((word) => (typeof word === 'string' ? word : word.word || '').toLowerCase()))
    const freshWords = roundData?.words?.map((word) => ({
      word: word.word,
      meaning: word.meaningVi || word.meaning || '',
    })) || course.words.filter((word) => !learnedWords.has(word.word.toLowerCase()))
    return {
      ...course,
      isCompleted,
      completedCount,
      roundNumber,
      isNewRound: isCompleted && statusTab !== 'completed',
      displayWords: isCompleted && statusTab !== 'completed' && freshWords.length ? freshWords : course.words,
      displayDesc: roundData?.promptTopic || (language === 'vi' ? course.descVi : course.desc),
    }
  })

  const filteredCourses = coursesWithProgress.filter(course => {
    const matchesTag = selectedTag === 'ALL' || course.tag.toLowerCase() === selectedTag.toLowerCase()
    const matchesLevel = selectedLevel === 'ALL' || course.level.toUpperCase() === selectedLevel.toUpperCase()
    const matchesRating = selectedRating === 0 || (course.rating || 5) >= selectedRating
    const matchesStatus = statusTab === 'all' || course.isCompleted
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch = !query ||
      course.title.toLowerCase().includes(query) ||
      course.titleVi.toLowerCase().includes(query) ||
      course.tag.toLowerCase().includes(query) ||
      course.desc.toLowerCase().includes(query) ||
      course.descVi.toLowerCase().includes(query) ||
      course.level.toLowerCase().includes(query) ||
      course.displayWords.some(w => `${w.word} ${w.meaning}`.toLowerCase().includes(query))
    return matchesTag && matchesLevel && matchesRating && matchesStatus && matchesSearch
  })

  const handleClearFilters = () => {
    setSelectedTag('ALL')
    setSelectedLevel('ALL')
    setSelectedRating(0)
    setStatusTab('all')
    setSearchQuery('')
  }

  const activeCategoryLabel = selectedTag === 'ALL'
    ? (language === 'vi' ? 'Tất cả chuyên mục' : 'All Categories')
    : selectedTag

  return (
    <div className="figma-search-page">
      {/* ── Optional Roadmap Banner ── */}
      {userRoadmap?.activeTopic && (
        <section className="eduvia-roadmap-banner" aria-label="Personalized Learning Roadmap">
          <div className="eduvia-roadmap-badge">
            <span className="material-symbols-outlined">auto_awesome</span>
            <span>{language === 'vi' ? 'Lộ trình AI cá nhân hóa' : 'Your Personalized AI Roadmap'}</span>
            <span className="eduvia-roadmap-level">CEFR: {userRoadmap.targetLevel || 'B1'}</span>
          </div>

          <div className="eduvia-roadmap-content">
            <div className="eduvia-roadmap-main">
              <span className="eduvia-roadmap-label">
                {language === 'vi' ? 'Chủ đề đang học' : 'Current Active Topic'}
              </span>
              <h2 className="eduvia-roadmap-title">
                {language === 'vi' ? (userRoadmap.activeTopic.titleVi || userRoadmap.activeTopic.title) : userRoadmap.activeTopic.title}
              </h2>
              <p className="eduvia-roadmap-prompt">{userRoadmap.activeTopic.promptTopic}</p>
            </div>

            <div className="eduvia-roadmap-action">
              <button
                type="button"
                className="figma-btn-teal"
                onClick={() => navigate(`/student/writing?set=${userRoadmap.activeTopic.topicSlug}&roadmap=true`)}
              >
                <span className="material-symbols-outlined">play_arrow</span>
                <span>{language === 'vi' ? 'Học ngay chủ đề này' : 'Start Session Now'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Main Figma Search 2-Column Layout ── */}
      <div className="figma-search-layout">
        {/* ── Left Sidebar Filter ── */}
        <aside className="figma-sidebar">
          <div className="figma-sidebar__header">
            <h3>{language === 'vi' ? 'Bộ lọc' : 'Filter'}</h3>
            <button type="button" className="figma-sidebar__clear" onClick={handleClearFilters}>
              {language === 'vi' ? 'Xóa lọc' : 'Clear'}
            </button>
          </div>

          {/* Rating Section */}
          <div className="figma-sidebar__group">
            <h4 className="figma-sidebar__group-title">{language === 'vi' ? 'Đánh giá' : 'Rating'}</h4>
            <div className="figma-sidebar__options">
              {[
                { val: 4.5, label: '4.5 & up', count: '5.8K' },
                { val: 3.5, label: '3.5 & up', count: '1.2K' },
                { val: 3.0, label: '3.0 & up', count: '867' },
              ].map(r => (
                <label key={r.val} className="figma-radio-label">
                  <input
                    type="radio"
                    name="filter-rating"
                    checked={selectedRating === r.val}
                    onChange={() => setSelectedRating(selectedRating === r.val ? 0 : r.val)}
                  />
                  <span className="figma-radio-custom" />
                  <span className="figma-sidebar-stars">{'★'.repeat(Math.floor(r.val))}</span>
                  <span className="figma-sidebar-label">{r.label}</span>
                  <span className="figma-sidebar-count">({r.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category Section */}
          <div className="figma-sidebar__group">
            <h4 className="figma-sidebar__group-title">{language === 'vi' ? 'Chuyên mục' : 'Categories'}</h4>
            <div className="figma-sidebar__options">
              {[
                { id: 'ALL', labelVi: 'Tất cả chuyên mục', labelEn: 'All Categories' },
                { id: 'Writing', labelVi: 'Viết luận học thuật', labelEn: 'Academic Writing' },
                { id: 'Vocabulary', labelVi: 'Từ vựng trọng tâm', labelEn: 'Vocabulary' },
                { id: 'Grammar', labelVi: 'Ngữ pháp & Cấu trúc câu', labelEn: 'Grammar' },
                { id: 'Speaking', labelVi: 'Giao tiếp hàng ngày', labelEn: 'Speaking' },
                { id: 'Pronunciation', labelVi: 'Phát âm chuẩn', labelEn: 'Pronunciation' },
                { id: 'Business English', labelVi: 'Tiếng Anh thương mại', labelEn: 'Business English' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`figma-category-item ${selectedTag === cat.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedTag(cat.id)}
                >
                  <span>{language === 'vi' ? cat.labelVi : cat.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Level Section */}
          <div className="figma-sidebar__group">
            <h4 className="figma-sidebar__group-title">{language === 'vi' ? 'Trình độ CEFR' : 'Level'}</h4>
            <div className="figma-sidebar__options">
              {[
                { id: 'ALL', label: 'All Levels' },
                { id: 'A2', label: 'Beginner (A1 - A2)' },
                { id: 'B1', label: 'Intermediate (B1)' },
                { id: 'B2', label: 'Upper Intermediate (B2)' },
                { id: 'C1', label: 'Advanced (C1)' },
              ].map(lvl => (
                <label key={lvl.id} className="figma-radio-label">
                  <input
                    type="radio"
                    name="filter-level"
                    checked={selectedLevel === lvl.id}
                    onChange={() => setSelectedLevel(lvl.id)}
                  />
                  <span className="figma-radio-custom" />
                  <span className="figma-sidebar-label">{lvl.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Progress Status */}
          <div className="figma-sidebar__group">
            <h4 className="figma-sidebar__group-title">{language === 'vi' ? 'Tiến độ học tập' : 'Progress'}</h4>
            <div className="figma-sidebar__options">
              <label className="figma-radio-label">
                <input
                  type="radio"
                  name="filter-status"
                  checked={statusTab === 'all'}
                  onChange={() => setStatusTab('all')}
                />
                <span className="figma-radio-custom" />
                <span className="figma-sidebar-label">{language === 'vi' ? 'Tất cả bài học' : 'All Lessons'}</span>
              </label>
              <label className="figma-radio-label">
                <input
                  type="radio"
                  name="filter-status"
                  checked={statusTab === 'completed'}
                  onChange={() => setStatusTab('completed')}
                />
                <span className="figma-radio-custom" />
                <span className="figma-sidebar-label">{language === 'vi' ? 'Đã hoàn thành' : 'Completed Lessons'}</span>
              </label>
            </div>
          </div>
        </aside>

        {/* ── Right Content Area ── */}
        <main className="figma-content">
          {/* Header Results Bar */}
          <div className="figma-results-header">
            <div className="figma-results-count">
              <span>{language === 'vi' ? `Hiển thị ${filteredCourses.length} kết quả cho ` : `Showing ${filteredCourses.length} results of `}</span>
              <strong>"{searchQuery || activeCategoryLabel}"</strong>
            </div>

            <div className="figma-sort-dropdown-wrap">
              <select
                className="figma-sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort courses"
              >
                <option value="popular">{language === 'vi' ? 'Phổ biến nhất' : 'Most Popular'}</option>
                <option value="rating">{language === 'vi' ? 'Đánh giá cao nhất' : 'Highest Rated'}</option>
                <option value="newest">{language === 'vi' ? 'Mới nhất' : 'Newest'}</option>
              </select>
            </div>
          </div>

          {/* Grid of Course Cards (3 Columns) */}
          {filteredCourses.length === 0 ? (
            <div className="figma-empty-state">
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#94A3B8' }}>search_off</span>
              <h3>{language === 'vi' ? 'Không tìm thấy kết quả phù hợp' : 'No matching results found'}</h3>
              <p>{language === 'vi' ? 'Thử xóa bộ lọc hoặc tìm kiếm với từ khóa khác.' : 'Try clearing your filters or searching with a different term.'}</p>
              <button type="button" className="figma-btn-teal" onClick={handleClearFilters}>
                {language === 'vi' ? 'Xóa toàn bộ bộ lọc' : 'Clear all filters'}
              </button>
            </div>
          ) : (
            <div className="figma-search-grid">
              {filteredCourses.map((course) => {
                const targetRound = course.isNewRound ? `&round=${course.roundNumber}&forceSet=true` : ''
                const writingUrl = `/student/writing?set=${encodeURIComponent(course.slug)}${targetRound}`

                return (
                  <div
                    key={course.slug}
                    className="figma-course-card"
                    onClick={() => navigate(writingUrl)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(writingUrl) }}
                  >
                    <div className="figma-course-card__thumb-wrap">
                      <img src={course.image} alt={course.title} className="figma-course-card__thumb" />
                      <div className="figma-course-card__badges">
                        <span className="figma-badge figma-badge--bestseller">Best Seller</span>
                        <span className="figma-badge figma-badge--discount">20% OFF</span>
                        {course.isCompleted && (
                          <span className="figma-badge" style={{ background: '#00DDC0', color: '#FFFFFF' }}>Done</span>
                        )}
                      </div>
                    </div>

                    <div className="figma-course-card__body">
                      <h3 className="figma-course-card__title">
                        {language === 'vi' ? course.titleVi : course.title}
                      </h3>
                      <div className="figma-course-card__instructor">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
                        <span>LexiGrow Studio · Level {course.level}</span>
                      </div>
                      <p className="figma-course-card__desc">{course.displayDesc}</p>

                      <div className="figma-course-card__rating">
                        <div className="figma-stars">{'★'.repeat(5)}</div>
                        <span className="figma-reviews">({course.reviews || '1.2K'})</span>
                      </div>

                      <div className="figma-course-card__price-row">
                        <span className="figma-price-current">{course.price || '$24.92'}</span>
                        <span className="figma-price-original">{course.originalPrice || '$32.90'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination Controls (Figma Style) */}
          <div className="figma-pagination" aria-label="Pagination">
            <button
              type="button"
              className="figma-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              aria-label="Previous Page"
            >
              <span className="material-symbols-outlined">chevron_left</span>
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
              className={`figma-page-btn ${currentPage === 3 ? 'is-active' : ''}`}
              onClick={() => setCurrentPage(3)}
            >
              3
            </button>
            <span className="figma-page-dots">…</span>
            <button
              type="button"
              className="figma-page-btn"
              onClick={() => setCurrentPage(98)}
            >
              98
            </button>
            <button
              type="button"
              className="figma-page-btn"
              onClick={() => setCurrentPage(prev => prev + 1)}
              aria-label="Next Page"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          {/* Bottom Figma CTA Banner */}
          <div className="figma-cta-banner">
            <div className="figma-cta-banner__copy">
              <h2>{language === 'vi' ? 'Tham gia LexiGrow ngay hôm nay để nhận ưu đãi 35%' : 'Join LexiGrow now to get 35% off'}</h2>
              <p>
                {language === 'vi'
                  ? 'Được đồng hành cùng trợ lý AI phân tích ngữ pháp, từ vựng và bài luận chuẩn quốc tế.'
                  : 'With our responsive themes and mobile and desktop apps, enjoy a seamless learning experience.'}
              </p>
              <Link to="/register" className="figma-btn-teal">
                <span>{language === 'vi' ? 'Tham gia ngay' : 'Join LexiGrow'}</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
