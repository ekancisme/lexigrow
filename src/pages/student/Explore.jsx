import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import api from '../../services/api.js'
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  }
]

export default function Explore() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [selectedTag, setSelectedTag] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [completedSlugs, setCompletedSlugs] = useState(new Set())

  useEffect(() => {
    let isMounted = true
    async function loadHistory() {
      try {
        const historyRes = await api.get('/sessions/history')
        if (!isMounted) return
        const historyData = historyRes.data?.data || historyRes.data
        const completed = new Set()
        if (historyData?.completedSlugCounts) {
          Object.keys(historyData.completedSlugCounts).forEach(slug => completed.add(slug))
        } else if (historyData?.recentSessions) {
          historyData.recentSessions.forEach(s => {
            if (s.learningSetSlug) completed.add(s.learningSetSlug)
          })
        }
        setCompletedSlugs(completed)
      } catch {
        // Fallback gracefully
      }
    }
    loadHistory()
    return () => { isMounted = false }
  }, [])

  const filteredCourses = EDUVIA_COURSES.filter(course => {
    const matchesTag = selectedTag === 'ALL' || course.tag.toUpperCase() === selectedTag || course.level === selectedTag
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch = !query ||
      course.title.toLowerCase().includes(query) ||
      course.titleVi.toLowerCase().includes(query) ||
      course.tag.toLowerCase().includes(query) ||
      course.words.some(w => w.word.toLowerCase().includes(query))
    return matchesTag && matchesSearch
  })

  return (
    <div className="eduvia-courses-page">
      {/* ── BREADCRUMB HERO BANNER ── */}
      <section className="eduvia-page-hero">
        <h1 className="eduvia-page-hero__title">
          {language === 'vi' ? 'Chủ đề & Luyện viết thông minh' : 'Smart Writing & Topics'}
        </h1>
        <p className="eduvia-page-hero__desc">
          {language === 'vi'
            ? 'Chọn chủ đề bạn muốn rèn luyện, nắm vững từ vựng trọng tâm và chuyển tiếp ngay sang phòng viết luận cùng trợ lý AI LexiGrow.'
            : 'Select a topic to master target vocabulary and transition directly into AI-powered Smart Writing.'}
        </p>
        <div className="eduvia-breadcrumbs">
          <Link to="/student/home">{language === 'vi' ? 'Trang chủ' : 'Home'}</Link>
          <span className="eduvia-breadcrumbs__sep">·</span>
          <span>{language === 'vi' ? 'Chủ đề luyện viết' : 'Writing Topics'}</span>
        </div>
      </section>

      <div className="eduvia-courses-container">
        {/* ── SECTION HEADER & SEARCH ── */}
        <div className="eduvia-section-header">
          <div>
            <span className="eduvia-kicker eduvia-kicker--green">
              {language === 'vi' ? 'Chủ đề nổi bật' : 'Writing Topics'}
            </span>
            <h2 className="eduvia-section-title">
              {language === 'vi' ? 'Chọn chủ đề để học từ & viết luận' : 'Select A Topic To Learn & Write'}
            </h2>
          </div>
          <div className="eduvia-courses-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder={language === 'vi' ? 'Tìm bài học, chủ đề, từ vựng...' : 'Search courses, topics, vocabulary...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={language === 'vi' ? 'Tìm kiếm chủ đề' : 'Search topics'}
            />
          </div>
        </div>

        {/* ── CATEGORY FILTER PILLS ── */}
        <div className="eduvia-courses-filter-pills" role="tablist">
          {[
            { id: 'ALL', labelVi: 'Tất cả chủ đề', labelEn: 'All Topics' },
            { id: 'Speaking', labelVi: 'Giao tiếp', labelEn: 'Speaking' },
            { id: 'Pronunciation', labelVi: 'Phát âm', labelEn: 'Pronunciation' },
            { id: 'Grammar', labelVi: 'Ngữ pháp', labelEn: 'Grammar' },
            { id: 'Writing', labelVi: 'Viết luận', labelEn: 'Writing' },
            { id: 'Vocabulary', labelVi: 'Từ vựng', labelEn: 'Vocabulary' },
            { id: 'Business English', labelVi: 'Tiếng Anh thương mại', labelEn: 'Business English' },
          ].map(tag => (
            <button
              key={tag.id}
              type="button"
              className={`eduvia-filter-pill ${selectedTag === tag.id ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag.id)}
            >
              {language === 'vi' ? tag.labelVi : tag.labelEn}
            </button>
          ))}
        </div>

        {/* ── 6 TOPICS GRID ── */}
        <div className="eduvia-courses-grid">
          {filteredCourses.map(course => {
            const isDone = completedSlugs.has(course.slug)

            return (
              <article className="eduvia-course-card" key={course.slug}>
                <div className="eduvia-course-card__image-wrap">
                  <img src={course.image} alt={course.title} className="eduvia-course-card__img" loading="lazy" />
                  <span className={`eduvia-course-card__tag eduvia-course-card__tag--${course.tagColor}`}>
                    {course.tag}
                  </span>
                  <span className="eduvia-course-card__level-badge">
                    {course.level}
                  </span>
                </div>

                <div className="eduvia-course-card__body">
                  <div className="eduvia-course-card__meta-top">
                    <span className="eduvia-course-card__badge-time">
                      <span className="material-symbols-outlined">schedule</span>
                      {course.timeEstimate}
                    </span>
                    <span className="eduvia-course-card__badge-words">
                      <span className="material-symbols-outlined">style</span>
                      {course.words.length} {language === 'vi' ? 'từ vựng' : 'words'}
                    </span>
                  </div>

                  <h3 className="eduvia-course-card__title">
                    <Link to={`/student/writing?set=${course.slug}`}>
                      {language === 'vi' ? course.titleVi : course.title}
                    </Link>
                  </h3>

                  <p className="eduvia-course-card__desc">
                    {language === 'vi' ? course.descVi : course.desc}
                  </p>

                  {/* Vocabulary preview chips */}
                  <div className="eduvia-course-card__words">
                    {course.words.slice(0, 3).map(w => (
                      <span key={w.word} className="eduvia-word-tag">
                        <strong>{w.word}</strong>: {w.meaning}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="eduvia-btn eduvia-btn--navy eduvia-btn--full"
                    onClick={() => navigate(`/student/writing?set=${course.slug}`)}
                  >
                    <span>{isDone ? (language === 'vi' ? 'Luyện viết lại' : 'Practice Writing Again') : (language === 'vi' ? 'Chọn chủ đề & Viết luận' : 'Select Topic & Write')}</span>
                    <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {/* ── VIDEO PLAYER BANNER ── */}
        <section className="eduvia-courses-video-section">
          <div className="eduvia-video-container">
            <img src="/assets/lexigrow/writing-practice.webp" alt={language === 'vi' ? 'Học viên luyện viết tiếng Anh tại bàn học' : 'Learner practising English writing at a study desk'} className="eduvia-video-container__poster" />
            <button type="button" className="eduvia-video-container__play-btn" aria-label="Play video">
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
          </div>
        </section>

        {/* ── DARK CTA BANNER ── */}
        <section className="eduvia-dark-cta">
          <div className="eduvia-dark-cta__inner">
            <span className="eduvia-dark-cta__kicker">{language === 'vi' ? 'Tại sao chọn LexiGrow' : 'Why Choose LexiGrow'}</span>
            <h2>{language === 'vi' ? 'Bắt đầu hành trình bứt phá tiếng Anh cùng LexiGrow' : 'Begin Your English Journey With Confidence'}</h2>
            <p>
              {language === 'vi'
                ? 'Nâng cao khả năng sử dụng tiếng Anh toàn diện với phương pháp Spaced Repetition khoa học và hệ thống phản hồi bài viết thời gian thực của LexiGrow.'
                : 'Advance your English skills with proven Spaced Repetition methods and real-time writing feedback on LexiGrow.'}
            </p>
            <div className="eduvia-dark-cta__actions">
              <Link to="/register" className="eduvia-btn eduvia-btn--lime">
                {language === 'vi' ? 'Bắt đầu ngay' : 'Get Started'}
              </Link>
              <Link to="/pricing" className="eduvia-btn eduvia-btn--mint">
                {language === 'vi' ? 'Xem gói học' : 'Choose Plan'}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
