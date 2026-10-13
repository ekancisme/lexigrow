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
    rating: 5,
    price: '$49',
    title: 'Daily Life & Routines',
    titleVi: 'Nâng cao kỹ năng giao tiếp tiếng Anh tự tin mỗi ngày',
    level: 'A2',
    lessons: '24 Lessons',
    students: '4,800 Students',
    timeEstimate: '10 mins',
    desc: 'Master essential expressions for daily routines, commuting to work/school, and maintaining high productivity.',
    words: [
      { word: 'routine', meaning: 'Daily habits' },
      { word: 'commute', meaning: 'Travel to work/school' },
      { word: 'productive', meaning: 'High efficiency' },
      { word: 'efficient', meaning: 'Time-saving' }
    ]
  },
  {
    slug: 'pronunciation-coach',
    tag: 'Pronunciation',
    tagColor: 'teal',
    image: '/assets/lexigrow/writing-practice.webp',
    rating: 5,
    price: '$39',
    title: 'Clear English Pronunciation',
    titleVi: 'Làm chủ phát âm chuẩn quốc tế cùng hướng dẫn chuyên sâu',
    level: 'A2',
    lessons: '18 Lessons',
    students: '3,200 Students',
    timeEstimate: '10 mins',
    desc: 'Guided phonetics practice, intonation drills, and accent reduction coaching.',
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
    rating: 5,
    price: '$45',
    title: 'Grammar in Action',
    titleVi: 'Hệ thống hóa ngữ pháp tiếng Anh thực hành chuẩn xác',
    level: 'B1',
    lessons: '30 Lessons',
    students: '5,600 Students',
    timeEstimate: '12 mins',
    desc: 'Understand sentence clauses, complex verb tenses, and academic cohesion.',
    words: [
      { word: 'conditional', meaning: 'Hypothetical' },
      { word: 'passive', meaning: 'Subject receives action' },
      { word: 'clause', meaning: 'Grammar unit' }
    ]
  },
  {
    slug: 'academic-writing',
    tag: 'Writing',
    tagColor: 'teal',
    image: '/assets/lexigrow/writing-practice.webp',
    rating: 5,
    price: '$42',
    title: 'Academic Writing & Essays',
    titleVi: 'Luyện viết luận học thuật chuyên sâu và chấm sửa AI',
    level: 'B2',
    lessons: '20 Lessons',
    students: '2,750 Students',
    timeEstimate: '15 mins',
    desc: 'Structured essay templates, topic sentences, and instant 4-criteria IELTS evaluation.',
    words: [
      { word: 'thesis', meaning: 'Main statement' },
      { word: 'coherence', meaning: 'Logical flow' },
      { word: 'counterargument', meaning: 'Opposing view' }
    ]
  },
  {
    slug: 'technology',
    tag: 'Vocabulary',
    tagColor: 'teal',
    image: '/assets/lexigrow/study-group.webp',
    rating: 5,
    price: '$35',
    title: 'Technology & Innovation',
    titleVi: 'Mở rộng vốn từ vựng phản xạ với phương pháp ghi nhớ SRS',
    level: 'B1',
    lessons: '22 Lessons',
    students: '4,100 Students',
    timeEstimate: '10 mins',
    desc: 'Discuss technological innovation, remote collaboration, accessibility, and AI.',
    words: [
      { word: 'innovation', meaning: 'Groundbreaking' },
      { word: 'collaboration', meaning: 'Teamwork' },
      { word: 'accessible', meaning: 'Easy to reach' }
    ]
  },
  {
    slug: 'environment',
    tag: 'Business English',
    tagColor: 'green',
    image: '/assets/editorial/topics/environment.webp',
    rating: 5,
    price: '$55',
    title: 'Environment & Sustainability',
    titleVi: 'Tiếng Anh thương mại cho thuyết trình và đàm phán công việc',
    level: 'B2',
    lessons: '26 Lessons',
    students: '3,980 Students',
    timeEstimate: '12 mins',
    desc: 'Discuss biodiversity, climate action, fragile ecosystems, and corporate sustainability.',
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
      {/* ── BREADCRUMB HERO BANNER (Matching 03_courses.png) ── */}
      <section className="eduvia-page-hero">
        <h1 className="eduvia-page-hero__title">
          {language === 'vi' ? 'Chủ đề & Luyện viết thông minh' : 'Smart Writing & Topics'}
        </h1>
        <p className="eduvia-page-hero__desc">
          {language === 'vi'
            ? 'Chọn chủ đề bạn muốn rèn luyện, nắm vững từ vựng trọng tâm và chuyển tiếp ngay sang phòng viết luận cùng trợ lý AI LexiGrow.'
            : 'Select a topic to master target vocabulary and transition into AI-powered Smart Writing.'}
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
            <span className="eduvia-kicker eduvia-kicker--green">{language === 'vi' ? 'Chủ đề nổi bật' : 'Writing Topics'}</span>
            <h2 className="eduvia-section-title">{language === 'vi' ? 'Chọn chủ đề để học từ & viết luận' : 'Select A Topic To Learn & Write'}</h2>
          </div>
          <div className="eduvia-courses-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder={language === 'vi' ? 'Tìm bài học, chủ đề, từ vựng...' : 'Search courses, topics, vocabulary...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* ── 6 COURSES GRID ── */}
        <div className="eduvia-courses-grid">
          {filteredCourses.map(course => {
            const isDone = completedSlugs.has(course.slug)

            return (
              <article className="eduvia-course-card" key={course.slug}>
                <div className="eduvia-course-card__image-wrap">
                  <img src={course.image} alt="" className="eduvia-course-card__img" loading="lazy" />
                  <span className={`eduvia-course-card__tag eduvia-course-card__tag--${course.tagColor}`}>
                    {course.tag}
                  </span>
                </div>

                <div className="eduvia-course-card__body">
                  <div className="eduvia-course-card__meta-top">
                    <div className="eduvia-course-card__stars">★★★★★</div>
                    <div className="eduvia-course-card__price">{course.price}</div>
                  </div>

                  <h3 className="eduvia-course-card__title">
                    <Link to={`/student/writing?set=${course.slug}`}>
                      {language === 'vi' ? course.titleVi : course.title}
                    </Link>
                  </h3>

                  <div className="eduvia-course-card__details">
                    <span className="eduvia-course-card__detail-item">
                      <span className="material-symbols-outlined eduvia-icon-purple">menu_book</span>
                      <span>{language === 'vi' ? course.lessons.replace('Lessons', 'Bài học') : course.lessons}</span>
                    </span>
                    <span className="eduvia-course-card__detail-item">
                      <span className="material-symbols-outlined eduvia-icon-teal">person</span>
                      <span>{language === 'vi' ? course.students.replace('Students', 'Học viên') : course.students}</span>
                    </span>
                  </div>

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
                    {isDone ? (language === 'vi' ? 'Luyện viết lại' : 'Practice Writing Again') : (language === 'vi' ? 'Chọn chủ đề & Viết luận' : 'Select Topic & Write')}
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {/* ── VIDEO PLAYER BANNER (Matching 03_courses.png) ── */}
        <section className="eduvia-courses-video-section" style={{ marginTop: 80 }}>
          <div className="eduvia-video-container">
            <img src="/assets/lexigrow/writing-practice.webp" alt={language === 'vi' ? 'Học viên luyện viết tiếng Anh tại bàn học' : 'Learner practising English writing at a study desk'} className="eduvia-video-container__poster" />
            <button type="button" className="eduvia-video-container__play-btn" aria-label="Play video">
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
          </div>
        </section>

        {/* ── DARK CTA BANNER ── */}
        <section className="eduvia-dark-cta" style={{ marginTop: 80 }}>
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
