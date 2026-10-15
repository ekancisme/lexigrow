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
  const [statusTab, setStatusTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
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
    return matchesTag && matchesStatus && matchesSearch
  })

  const completedCount = Object.values(completedCounts).filter((count) => Number(count) > 0).length

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

      {/* ── PERSONALIZED ROADMAP HERO (When available) ── */}
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
              <p className="eduvia-roadmap-prompt">
                {userRoadmap.activeTopic.promptTopic}
              </p>
              {userRoadmap.activeTopic.words?.length > 0 && (
                <div className="eduvia-roadmap-words">
                  {userRoadmap.activeTopic.words.map((w) => (
                    <span key={w.word} className={`eduvia-roadmap-chip eduvia-roadmap-chip--${w.status || 'ready'}`}>
                      <strong>{w.word}</strong>
                      {w.definitionVi ? ` · ${w.definitionVi}` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="eduvia-roadmap-action">
              <div className="eduvia-roadmap-progress-wrap">
                <div className="eduvia-roadmap-progress-bar">
                  <div
                    className="eduvia-roadmap-progress-fill"
                    style={{ width: `${userRoadmap.activeTopic.progressPercent || 0}%` }}
                  />
                </div>
                <span className="eduvia-roadmap-progress-text">
                  {userRoadmap.activeTopic.progressPercent || 0}% {language === 'vi' ? 'hoàn thành' : 'completed'}
                </span>
              </div>

              <button
                type="button"
                className="btn-primary eduvia-roadmap-btn"
                onClick={() => navigate(`/student/writing?set=${userRoadmap.activeTopic.topicSlug}&roadmap=true`)}
              >
                <span className="material-symbols-outlined">play_arrow</span>
                <span>{language === 'vi' ? 'Học ngay chủ đề này' : 'Start Session Now'}</span>
              </button>
            </div>
          </div>

          {/* Up next topics preview */}
          {userRoadmap.topics?.filter((t) => t.status !== 'active').length > 0 && (
            <div className="eduvia-roadmap-upcoming">
              <span className="eduvia-upcoming-label">
                {language === 'vi' ? 'Chủ đề kế tiếp:' : 'Up next:'}
              </span>
              <div className="eduvia-upcoming-pills">
                {userRoadmap.topics
                  .filter((t) => t.status !== 'active')
                  .slice(0, 3)
                  .map((t) => (
                    <span key={t.topicSlug} className={`eduvia-upcoming-pill ${t.status === 'completed' ? 'eduvia-upcoming-pill--done' : ''}`}>
                      {t.status === 'completed' && <span className="material-symbols-outlined">check</span>}
                      <span>{language === 'vi' ? (t.titleVi || t.title) : t.title}</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </section>
      )}

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
        <div className="eduvia-courses-filter-pills" role="group" aria-label={language === 'vi' ? 'Lọc theo chuyên mục' : 'Filter by category'}>
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
              aria-pressed={selectedTag === tag.id}
              onClick={() => setSelectedTag(tag.id)}
            >
              {language === 'vi' ? tag.labelVi : tag.labelEn}
            </button>
          ))}
        </div>

        <div className="eduvia-courses-filter-pills eduvia-courses-filter-pills--status" role="group" aria-label={language === 'vi' ? 'Lọc theo tiến độ' : 'Filter by progress'}>
          <button type="button" className={`eduvia-filter-pill ${statusTab === 'all' ? 'active' : ''}`} aria-pressed={statusTab === 'all'} onClick={() => setStatusTab('all')}>
            {language === 'vi' ? 'Tất cả tiến độ' : 'All progress'}
          </button>
          <button type="button" className={`eduvia-filter-pill ${statusTab === 'completed' ? 'active' : ''}`} aria-pressed={statusTab === 'completed'} onClick={() => setStatusTab('completed')}>
            {language === 'vi' ? 'Đã hoàn thành' : 'Completed'}{completedCount > 0 ? ` (${completedCount})` : ''}
          </button>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="eduvia-courses-empty" role="status">
            <span className="material-symbols-outlined" aria-hidden="true">{statusTab === 'completed' && completedCount === 0 ? 'task_alt' : 'search_off'}</span>
            <h3>{statusTab === 'completed' && completedCount === 0
              ? (language === 'vi' ? 'Chưa có chủ đề hoàn thành' : 'No completed topics yet')
              : (language === 'vi' ? 'Không tìm thấy chủ đề phù hợp' : 'No matching topics found')}</h3>
            <p>{statusTab === 'completed' && completedCount === 0
              ? (language === 'vi' ? 'Hoàn thành một chủ đề để xem lại tiến độ tại đây.' : 'Complete a topic to see your progress here.')
              : (language === 'vi' ? 'Thử từ khóa khác hoặc chọn một chuyên mục khác.' : 'Try another search term or category.')}</p>
            {statusTab === 'completed' && <button type="button" className="eduvia-filter-pill active" onClick={() => setStatusTab('all')}>{language === 'vi' ? 'Xem tất cả chủ đề' : 'View all topics'}</button>}
          </div>
        ) : <div className="eduvia-courses-grid">
          {filteredCourses.map(course => {
            const isDone = course.isCompleted
            const targetRound = course.isNewRound ? `&round=${course.roundNumber}&forceSet=true` : ''
            const writingUrl = `/student/writing?set=${encodeURIComponent(course.slug)}${targetRound}`

            return (
              <article className="eduvia-course-card" key={course.slug}>
                <div className="eduvia-course-card__image-wrap">
                  <img src={course.image} alt={course.title} className="eduvia-course-card__img" loading="lazy" />
                  <span className={`eduvia-course-card__tag eduvia-course-card__tag--${course.tagColor}`}>
                    {language === 'vi' ? ({ Speaking: 'Giao tiếp', Pronunciation: 'Phát âm', Grammar: 'Ngữ pháp', Writing: 'Viết luận', Vocabulary: 'Từ vựng', 'Business English': 'Tiếng Anh thương mại' }[course.tag] || course.tag) : course.tag}
                  </span>
                  {course.isCompleted && <span className="eduvia-course-card__completed">{language === 'vi' ? 'Đã hoàn thành' : 'Completed'}</span>}
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
                      {course.displayWords.length} {language === 'vi' ? 'từ vựng' : 'words'}
                    </span>
                  </div>

                  <h3 className="eduvia-course-card__title">
                    <Link to={writingUrl}>
                      {language === 'vi' ? course.titleVi : course.title}
                    </Link>
                  </h3>

                  <p className="eduvia-course-card__desc">
                    {course.displayDesc}
                  </p>

                  {course.isNewRound && <span className="eduvia-course-card__round-badge">{language === 'vi' ? 'Bộ từ mới' : 'New words'} · {language === 'vi' ? 'Phiên' : 'Session'} {course.roundNumber}</span>}

                  {/* Vocabulary preview chips */}
                  <div className="eduvia-course-card__words">
                    {course.displayWords.slice(0, 3).map(w => (
                      <span key={w.word} className="eduvia-word-tag">
                        <strong>{w.word}</strong>: {w.meaning}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="eduvia-btn eduvia-btn--navy eduvia-btn--full"
                    onClick={() => navigate(statusTab === 'completed' ? `/student/writing?set=${encodeURIComponent(course.slug)}&forceSet=true` : writingUrl)}
                  >
                    <span>{statusTab === 'completed'
                      ? (language === 'vi' ? 'Luyện lại chủ đề' : 'Practice topic again')
                      : course.isNewRound
                        ? (language === 'vi' ? `Bắt đầu phiên ${course.roundNumber}` : `Start session ${course.roundNumber}`)
                        : isDone
                          ? (language === 'vi' ? 'Luyện viết lại' : 'Practice Writing Again')
                          : (language === 'vi' ? 'Chọn chủ đề & Viết luận' : 'Select Topic & Write')}</span>
                    <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                  </button>
                </div>
              </article>
            )
          })}
        </div>}

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
