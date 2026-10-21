import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import api from '../../services/api.js'
import './StudentHome.css'

const HERO_BANNERS = [
  {
    id: 'banner-vocab',
    image: '/assets/banners/banner-vocab.png',
    alt: 'Build Your Vocabulary. Unlock Your Potential.',
    primaryHref: '/student/explore',
    primaryLabel: 'Explore Vocabulary',
    secondaryHref: '/student/my-words',
    secondaryLabel: 'Start Learning',
  },
  {
    id: 'banner-journey',
    image: '/assets/banners/banner-journey.png',
    alt: 'Every Step Forward. A Smarter You.',
    primaryHref: '/student/dashboard',
    primaryLabel: 'My Learning Journey',
    secondaryHref: '/student/explore',
    secondaryLabel: 'Explore Learning Paths',
  },
  {
    id: 'banner-writing',
    image: '/assets/banners/banner-writing.png',
    alt: 'Write with Confidence. Improve with AI.',
    primaryHref: '/student/writing',
    primaryLabel: 'Practice Writing',
    secondaryHref: '/student/explore',
    secondaryLabel: 'Discover AI Feedback',
  },
]

const CATEGORY_PILLS = [
  { id: 'all', labelVi: 'Tất cả gợi ý', labelEn: 'All Recommendations' },
  { id: 'writing', labelVi: 'Luyện viết học thuật', labelEn: 'Academic Writing' },
  { id: 'ielts', labelVi: 'Luyện thi IELTS', labelEn: 'IELTS Task 1 & 2' },
  { id: 'daily', labelVi: 'Giao tiếp hằng ngày', labelEn: 'Daily Communication' },
  { id: 'tech', labelVi: 'Công nghệ & AI', labelEn: 'Tech & Innovation' },
  { id: 'business', labelVi: 'Tiếng Anh công sở', labelEn: 'Business English' },
  { id: 'environment', labelVi: 'Môi trường sinh thái', labelEn: 'Environment & Climate' },
  { id: 'culture', labelVi: 'Văn hóa & Đời sống', labelEn: 'Culture & Society' },
]

const STUDIO_TOPICS = [
  {
    id: 'studio-1',
    category: 'writing',
    image: '/assets/lexigrow/writing-practice.webp',
    title: 'Academic Writing: Task 2 Essay Mastery',
    titleVi: 'Viết luận IELTS Task 2 & Cấu trúc luận điểm',
    level: 'B2',
    duration: '15 mins',
    wordsCount: 16,
    coach: 'LexiGrow AI Mentor',
    desc: 'Master thesis statements, counterarguments, and cohesion criteria for high-scoring IELTS Task 2 essays.',
    descVi: 'Làm chủ câu chủ đề, luận điểm phản biện và tính liên kết chặt chẽ theo 4 tiêu chí chuẩn IELTS.',
    rating: 5.0,
    reviews: '2.4K',
    badgeText: 'IELTS Task 2',
    words: [
      { word: 'thesis', meaning: 'Luận điểm' },
      { word: 'cohesion', meaning: 'Liên kết' },
      { word: 'counterargument', meaning: 'Phản biện' },
    ],
    href: '/student/explore',
  },
  {
    id: 'studio-2',
    category: 'daily',
    image: '/assets/editorial/topics/daily-life.webp',
    title: 'Daily Routines, Commuting & Habit Building',
    titleVi: 'Sinh hoạt thường nhật & Năng suất làm việc',
    level: 'A2',
    duration: '10 mins',
    wordsCount: 14,
    coach: 'LexiGrow Spaced Coach',
    desc: 'Essential collocations and natural structures for describing daily life, public transit, and time management.',
    descVi: 'Cụm từ thông dụng và mẫu câu tự nhiên miêu tả nhịp sống hằng ngày, thói quen và quản lý thời gian.',
    rating: 4.9,
    reviews: '3.1K',
    badgeText: 'Spaced Repetition',
    words: [
      { word: 'routine', meaning: 'Thói quen' },
      { word: 'commute', meaning: 'Đi lại' },
      { word: 'productive', meaning: 'Năng suất' },
    ],
    href: '/student/explore',
  },
  {
    id: 'studio-3',
    category: 'tech',
    image: '/assets/editorial/topics/technology.webp',
    title: 'Technology & AI Impact on Modern Society',
    titleVi: 'Công nghệ số & Tác động của Trí tuệ nhân tạo',
    level: 'B2',
    duration: '15 mins',
    wordsCount: 18,
    coach: 'LexiGrow Tech Writer',
    desc: 'Explore high-band vocabulary discussing artificial intelligence, automation, data privacy, and digital ethics.',
    descVi: 'Mở rộng vốn từ vựng học thuật về chuyển đổi số, trí tuệ nhân tạo, tự động hóa và đạo đức công nghệ.',
    rating: 4.9,
    reviews: '2.9K',
    badgeText: 'Hot Topic',
    words: [
      { word: 'innovation', meaning: 'Đổi mới' },
      { word: 'algorithm', meaning: 'Thuật toán' },
      { word: 'automation', meaning: 'Tự động hóa' },
    ],
    href: '/student/explore',
  },
  {
    id: 'studio-4',
    category: 'environment',
    image: '/assets/editorial/topics/environment.webp',
    title: 'Climate Change, Ecology & Renewable Energy',
    titleVi: 'Biến đổi khí hậu & Năng lượng tái tạo',
    level: 'B2',
    duration: '12 mins',
    wordsCount: 15,
    coach: 'LexiGrow Ecology Lead',
    desc: 'Advanced lexical resources for environmental challenges, biodiversity loss, sustainability, and renewable power.',
    descVi: 'Hệ thống từ vựng chuyên sâu về khủng hoảng khí hậu, đa dạng sinh học và phát triển bền vững.',
    rating: 4.8,
    reviews: '1.8K',
    badgeText: 'IELTS Favorite',
    words: [
      { word: 'sustainable', meaning: 'Bền vững' },
      { word: 'biodiversity', meaning: 'Đa dạng sinh học' },
      { word: 'emissions', meaning: 'Khí thải' },
    ],
    href: '/student/explore',
  },
]

const TRENDING_TOPICS = [
  {
    id: 'trend-1',
    category: 'business',
    image: '/assets/editorial/home/study-hero.jpg',
    title: 'Business English: Global Trade & Negotiations',
    titleVi: 'Tiếng Anh thương mại: Đàm phán & Hợp tác quốc tế',
    level: 'C1',
    duration: '15 mins',
    wordsCount: 20,
    coach: 'LexiGrow Corporate Coach',
    desc: 'High-stakes negotiation terminology, contract collocations, and cross-cultural communication frameworks.',
    descVi: 'Thuật ngữ đàm phán hợp đồng, đối tác quốc tế và kỹ năng giao tiếp chuyên nghiệp trong môi trường đa quốc gia.',
    rating: 5.0,
    reviews: '2.1K',
    badgeText: 'Band 7.5+',
    words: ['negotiation', 'partnership', 'consensus'],
    href: '/student/explore',
  },
  {
    id: 'trend-2',
    category: 'writing',
    image: '/assets/lexigrow/study-group.webp',
    title: 'Education & Future Skills in Digital Era',
    titleVi: 'Giáo dục hiện đại & Kỹ năng tương lai',
    level: 'B1',
    duration: '12 mins',
    wordsCount: 16,
    coach: 'LexiGrow Academic Lead',
    desc: 'Discussing distance learning, lifelong education, curriculum reform, and modern pedagogy.',
    descVi: 'Từ vựng bàn luận về học trực tuyến, cải cách giáo trình và trang bị kỹ năng thiết yếu cho tương lai.',
    rating: 4.9,
    reviews: '1.9K',
    badgeText: 'Most Popular',
    words: ['pedagogy', 'curriculum', 'digital literacy'],
    href: '/student/explore',
  },
  {
    id: 'trend-3',
    category: 'culture',
    image: '/assets/editorial/topics/travel.webp',
    title: 'Culture, Heritage & Global Tourism Impact',
    titleVi: 'Bảo tồn văn hóa & Xu hướng du lịch bền vững',
    level: 'B2',
    duration: '12 mins',
    wordsCount: 15,
    coach: 'LexiGrow Cultural Guide',
    desc: 'Lexical repertoire for cultural assimilation, architectural preservation, and ecotourism debates.',
    descVi: 'Vốn từ miêu tả di sản lịch sử, bảo tồn văn hóa truyền thống và ảnh hưởng của du lịch sinh thái.',
    rating: 4.8,
    reviews: '2.7K',
    badgeText: 'IELTS Task 2',
    words: ['heritage', 'preservation', 'ecotourism'],
    href: '/student/explore',
  },
  {
    id: 'trend-4',
    category: 'daily',
    image: '/assets/editorial/topics/hobbies.webp',
    title: 'Health, Wellness & Healthcare Systems',
    titleVi: 'Sức khỏe, Lối sống lành mạnh & Y tế công cộng',
    level: 'A2',
    duration: '10 mins',
    wordsCount: 14,
    coach: 'LexiGrow Life Coach',
    desc: 'Vocabulary for physical fitness, mental well-being, nutrition habits, and healthcare access.',
    descVi: 'Từ vựng thiết thực về rèn luyện thể chất, cân bằng sức khỏe tinh thần và dinh dưỡng khoa học.',
    rating: 4.9,
    reviews: '3.4K',
    badgeText: 'Essential A2',
    words: ['wellness', 'nutrition', 'mindfulness'],
    href: '/student/explore',
  },
  {
    id: 'trend-5',
    category: 'writing',
    image: '/assets/editorial/home/technology.jpg',
    title: 'Urban Development & Smart Cities of Tomorrow',
    titleVi: 'Quy hoạch đô thị & Thành phố thông minh',
    level: 'B2',
    duration: '15 mins',
    wordsCount: 17,
    coach: 'LexiGrow Urban Fellow',
    desc: 'Analyze metropolitan expansion, public transit infrastructure, and sustainable smart city designs.',
    descVi: 'Phân tích xu hướng phát triển hạ tầng đô thị, giao thông công cộng và thành phố sinh thái tương lai.',
    rating: 4.9,
    reviews: '1.6K',
    badgeText: 'IELTS Task 2',
    words: ['infrastructure', 'metropolitan', 'density'],
    href: '/student/explore',
  },
  {
    id: 'trend-6',
    category: 'writing',
    image: '/assets/editorial/home/environment.jpg',
    title: 'Psychology, Emotion & Social Well-being',
    titleVi: 'Tâm lý học, Cảm xúc & Hòa nhập xã hội',
    level: 'C1',
    duration: '15 mins',
    wordsCount: 19,
    coach: 'LexiGrow Psychology Coach',
    desc: 'Explore nuanced terms for emotional resilience, cognitive empathy, stress management, and human behavior.',
    descVi: 'Hệ thống thuật ngữ nâng cao về khả năng phục hồi tâm lý, thấu cảm xã hội và hành vi con người.',
    rating: 5.0,
    reviews: '2.2K',
    badgeText: 'Advanced C1',
    words: ['resilience', 'empathy', 'cognitive'],
    href: '/student/explore',
  },
  {
    id: 'trend-7',
    category: 'daily',
    image: '/assets/lexigrow/writing-practice.webp',
    title: 'Media Literacy & Critical Thinking in News',
    titleVi: 'Tư duy phản biện & Tiếp nhận thông tin truyền thông',
    level: 'B2',
    duration: '12 mins',
    wordsCount: 16,
    coach: 'LexiGrow Media Mentor',
    desc: 'Evaluating misinformation, sensationalism, journalistic ethics, and critical argument formulation.',
    descVi: 'Đánh giá thông tin đa chiều, phân tích góc nhìn báo chí và xây dựng lập luận phản biện vững chắc.',
    rating: 4.9,
    reviews: '1.5K',
    badgeText: 'Critical Thinking',
    words: ['credibility', 'perspective', 'objectivity'],
    href: '/student/explore',
  },
  {
    id: 'trend-8',
    category: 'ielts',
    image: '/assets/editorial/home/study-hero-v2.jpg',
    title: 'IELTS Task 1: Data Trends & Comparative Analysis',
    titleVi: 'IELTS Task 1: Phân tích biểu đồ & Xu hướng số liệu',
    level: 'B1',
    duration: '12 mins',
    wordsCount: 15,
    coach: 'LexiGrow IELTS Specialist',
    desc: 'Key reporting verbs, proportion expressions, and chronological overview structures for Task 1 charts.',
    descVi: 'Cụm từ mô tả xu hướng tăng giảm, tỷ lệ phần trăm và cấu trúc câu tổng quan chuẩn band 7+ Task 1.',
    rating: 4.9,
    reviews: '2.8K',
    badgeText: 'IELTS Task 1',
    words: ['fluctuate', 'proportion', 'upward trend'],
    href: '/student/explore',
  },
]

const POPULAR_MENTORS = [
  {
    name: 'Alexander Vance',
    role: 'Trưởng ban Học thuật · IELTS 8.5',
    roleEn: 'Head of Academic Assessment · IELTS 8.5',
    image: '/assets/editorial/instructors/alexander.png',
    studentsVi: '12,400+ học viên',
    studentsEn: '12,400+ learners',
    rating: 4.9,
    specialty: 'IELTS Writing Task 2 & Cohesion',
  },
  {
    name: 'Sarah Jenkins',
    role: 'Chuyên gia Ngôn ngữ học · Cambridge Fellow',
    roleEn: 'Linguistic Coach · Cambridge Fellow',
    image: '/assets/editorial/instructors/sarasvati.png',
    studentsVi: '9,800+ học viên',
    studentsEn: '9,800+ learners',
    rating: 5.0,
    specialty: 'Lexical Resource & Academic Collocations',
  },
  {
    name: 'Jonathan Davies',
    role: 'Giảng viên Viết học thuật · Oxford Alum',
    roleEn: 'Academic Writing Lecturer · Oxford Alum',
    image: '/assets/editorial/instructors/jonathan.png',
    studentsVi: '8,200+ học viên',
    studentsEn: '8,200+ learners',
    rating: 4.9,
    specialty: 'Essay Architecture & Logic Structures',
  },
  {
    name: 'Dr. Catherine Labie',
    role: 'Cố vấn Phương pháp Từ vựng (SRS)',
    roleEn: 'Lexical Acquisition & SRS Specialist',
    image: '/assets/editorial/instructors/labie.png',
    studentsVi: '11,100+ học viên',
    studentsEn: '11,100+ learners',
    rating: 5.0,
    specialty: 'Spaced Repetition & Contextual Retention',
  },
]

export default function StudentHome() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeSlide, setActiveSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [announcements, setAnnouncements] = useState([])
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState('')

  const isVi = language === 'vi'

  // Auto-advance banner carousel every 6s unless hovered
  useEffect(() => {
    if (isPaused) return undefined
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_BANNERS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isPaused])

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? HERO_BANNERS.length - 1 : prev - 1))
  }

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % HERO_BANNERS.length)
  }

  useEffect(() => {
    let current = true
    if (!user) return undefined
    api.get('/announcements/active')
      .then(({ data }) => {
        if (current) setAnnouncements(Array.isArray(data?.data) ? data.data : [])
      })
      .catch(() => {
        if (current) setAnnouncements([])
      })
    return () => { current = false }
  }, [user])

  const filteredStudio = selectedCategory === 'all'
    ? STUDIO_TOPICS
    : STUDIO_TOPICS.filter(c => c.category === selectedCategory)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!subscribeEmail) return
    setSubscribeStatus(isVi ? 'Đã đăng ký thành công! Cảm ơn bạn đã tham gia cộng đồng LexiGrow.' : 'Successfully subscribed! Welcome to the LexiGrow learning community.')
    setSubscribeEmail('')
  }

  return (
    <div className="student-home-figma">
      {/* ── Optional Announcement Bar ── */}
      {announcements.length > 0 && announcements[0] && (
        <div className="figma-announcement-bar">
          <span className="material-symbols-outlined">campaign</span>
          <span>{isVi ? announcements[0].titleVi : announcements[0].titleEn}</span>
          {announcements[0].actionUrl && (
            <Link to={announcements[0].actionUrl} className="figma-announcement-link">
              {isVi ? 'Xem ngay' : 'View now'} →
            </Link>
          )}
        </div>
      )}

      {/* ── 1. Hero Spotlight Carousel (Custom LexiGrow AI Banners - Fixed 3:1 Ratio) ── */}
      <section
        className="figma-hero"
        aria-label="Hero Spotlight"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="figma-hero__slider">
          {HERO_BANNERS.map((banner, index) => {
            const isActive = index === activeSlide
            return (
              <div
                key={banner.id}
                className={`figma-hero__slide ${isActive ? 'is-active' : ''}`}
                aria-hidden={!isActive}
              >
                <img
                  src={banner.image}
                  alt={banner.alt}
                  className="figma-hero__banner-graphic"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />

                {/* Clickable Action Hotspots over Banner CTA Buttons */}
                <div className="figma-hero__hotspots" aria-label={banner.title}>
                  <Link
                    to={banner.primaryHref}
                    className="figma-hero__hotspot figma-hero__hotspot--primary"
                    aria-label={banner.primaryLabel}
                    title={banner.primaryLabel}
                  />
                  <Link
                    to={banner.secondaryHref}
                    className="figma-hero__hotspot figma-hero__hotspot--secondary"
                    aria-label={banner.secondaryLabel}
                    title={banner.secondaryLabel}
                  />
                </div>
              </div>
            )
          })}

          {/* Slider Arrow Controls */}
          <button
            type="button"
            className="figma-hero__arrow figma-hero__arrow--prev"
            onClick={handlePrevSlide}
            aria-label="Previous Slide"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="figma-hero__arrow figma-hero__arrow--next"
            onClick={handleNextSlide}
            aria-label="Next Slide"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Carousel Dots */}
        <div className="figma-hero__dots">
          {HERO_BANNERS.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              className={`figma-hero__dot ${index === activeSlide ? 'is-active' : ''}`}
              onClick={() => setActiveSlide(index)}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── 2. Category Filter Pills ── */}
      <section className="figma-category-bar" aria-label="Course Categories">
        <div className="figma-category-list">
          {CATEGORY_PILLS.map((pill) => {
            const label = isVi ? pill.labelVi : pill.labelEn
            const isActive = selectedCategory === pill.id
            return (
              <button
                key={pill.id}
                type="button"
                className={`figma-pill ${isActive ? 'figma-pill--active' : ''}`}
                onClick={() => setSelectedCategory(pill.id)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── 3. Featured Topics from LexiGrow Studio ── */}
      <section className="figma-section" aria-labelledby="heading-studio">
        <div className="figma-section__header">
          <div>
            <h2 id="heading-studio" className="figma-section__title">
              {isVi ? 'Chủ đề nổi bật từ LexiGrow Studio' : 'Featured Topics from LexiGrow Studio'}
            </h2>
            <p className="figma-section__subtitle">
              {isVi
                ? 'Các bộ từ vựng và dàn ý bài viết chuẩn CEFR được biên soạn độc quyền bởi hội đồng học thuật.'
                : 'Curated vocabulary and essay frameworks designed by our senior linguistic faculty.'}
            </p>
          </div>
          <Link to="/student/explore" className="figma-section__more-link">
            <span>{isVi ? 'Xem tất cả chủ đề' : 'View all topics'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </Link>
        </div>

        <div className="figma-card-grid">
          {filteredStudio.map((topic) => (
            <div
              key={topic.id}
              className="figma-course-card"
              onClick={() => navigate(topic.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(topic.href) }}
            >
              <div className="figma-course-card__thumb-wrap">
                <img
                  src={topic.image}
                  alt={isVi ? topic.titleVi : topic.title}
                  className="figma-course-card__thumb"
                />
                <div className="figma-course-card__badges">
                  <span className="figma-badge figma-badge--cefr">{topic.level}</span>
                  <span className="figma-badge figma-badge--category">{topic.badgeText}</span>
                </div>
              </div>

              <div className="figma-course-card__body">
                <div className="figma-course-card__meta">
                  <span className="figma-course-card__meta-item">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>schedule</span>
                    <span>{topic.duration}</span>
                  </span>
                  <span className="figma-course-card__meta-item">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>menu_book</span>
                    <span>{topic.wordsCount} {isVi ? 'từ vựng' : 'words'}</span>
                  </span>
                </div>

                <h3 className="figma-course-card__title">
                  {isVi ? topic.titleVi : topic.title}
                </h3>

                <p className="figma-course-card__desc">
                  {isVi ? topic.descVi : topic.desc}
                </p>

                {/* Key Vocab Chips */}
                <div className="figma-course-card__chips">
                  {topic.words?.map((w) => (
                    <span key={w.word} className="figma-vocab-chip" title={w.meaning}>
                      {w.word}
                    </span>
                  ))}
                </div>

                <div className="figma-course-card__footer">
                  <div className="figma-course-card__rating">
                    <div className="figma-stars" aria-label={`Rating ${topic.rating}`}>
                      {'★'.repeat(5)}
                    </div>
                    <span className="figma-reviews">({topic.reviews})</span>
                  </div>

                  <span className="figma-course-card__action-btn">
                    <span>{isVi ? 'Luyện viết ngay' : 'Practice Now'}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Trending Learning Topics ── */}
      <section className="figma-section" aria-labelledby="heading-trending">
        <div className="figma-section__header">
          <div>
            <h2 id="heading-trending" className="figma-section__title">
              {isVi ? 'Chủ đề đang thịnh hành & Được học nhiều nhất' : 'Trending Learning Topics'}
            </h2>
            <p className="figma-section__subtitle">
              {isVi
                ? 'Khám phá các chủ đề từ vựng và bài luận được hàng ngàn học viên lựa chọn trong tuần.'
                : 'Explore the most active vocabulary sets and essay practices chosen by learners this week.'}
            </p>
          </div>
          <Link to="/student/explore" className="figma-section__more-link">
            <span>{isVi ? 'Xem toàn bộ thư viện' : 'Explore full library'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </Link>
        </div>

        <div className="figma-card-grid">
          {TRENDING_TOPICS.map((topic) => (
            <div
              key={topic.id}
              className="figma-course-card"
              onClick={() => navigate(topic.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(topic.href) }}
            >
              <div className="figma-course-card__thumb-wrap">
                <img
                  src={topic.image}
                  alt={isVi ? topic.titleVi : topic.title}
                  className="figma-course-card__thumb"
                />
                <div className="figma-course-card__badges">
                  <span className="figma-badge figma-badge--cefr">{topic.level}</span>
                  <span className="figma-badge figma-badge--category">{topic.badgeText}</span>
                </div>
              </div>

              <div className="figma-course-card__body">
                <div className="figma-course-card__meta">
                  <span className="figma-course-card__meta-item">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>schedule</span>
                    <span>{topic.duration}</span>
                  </span>
                  <span className="figma-course-card__meta-item">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>menu_book</span>
                    <span>{topic.wordsCount} {isVi ? 'từ vựng' : 'words'}</span>
                  </span>
                </div>

                <h3 className="figma-course-card__title">
                  {isVi ? topic.titleVi : topic.title}
                </h3>

                <p className="figma-course-card__desc">
                  {isVi ? topic.descVi : topic.desc}
                </p>

                {/* Key Vocab Chips */}
                <div className="figma-course-card__chips">
                  {topic.words?.map((w) => (
                    <span key={w} className="figma-vocab-chip">
                      {w}
                    </span>
                  ))}
                </div>

                <div className="figma-course-card__footer">
                  <div className="figma-course-card__rating">
                    <div className="figma-stars" aria-label={`Rating ${topic.rating}`}>
                      {'★'.repeat(5)}
                    </div>
                    <span className="figma-reviews">({topic.reviews})</span>
                  </div>

                  <span className="figma-course-card__action-btn">
                    <span>{isVi ? 'Bắt đầu học' : 'Start Learning'}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Popular Academic Mentors ── */}
      <section className="figma-section" aria-labelledby="heading-mentors">
        <div className="figma-section__header">
          <div>
            <h2 id="heading-mentors" className="figma-section__title">
              {isVi ? 'Đội ngũ Cố vấn Học thuật LexiGrow' : 'LexiGrow Academic Faculty & Mentors'}
            </h2>
            <p className="figma-section__subtitle">
              {isVi
                ? 'Các chuyên gia khảo thí, giảng viên IELTS và chuyên gia ngôn ngữ học đồng hành cùng bạn.'
                : 'Certified Cambridge examiners, IELTS specialists, and linguistic scholars supporting your journey.'}
            </p>
          </div>
        </div>

        <div className="figma-instructors-grid">
          {POPULAR_MENTORS.map((mentor) => (
            <div key={mentor.name} className="figma-instructor-card">
              <img src={mentor.image} alt={mentor.name} className="figma-instructor-card__img" />
              <div className="figma-instructor-card__overlay">
                <h3 className="figma-instructor-card__name">{mentor.name}</h3>
                <p className="figma-instructor-card__role">{isVi ? mentor.role : mentor.roleEn}</p>
                <div className="figma-instructor-card__extra">
                  <span className="figma-instructor-card__specialty">{mentor.specialty}</span>
                  <span className="figma-instructor-card__students">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>group</span>
                    <span>{isVi ? mentor.studentsVi : mentor.studentsEn}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Newsletter / Academic Community CTA ── */}
      <section className="figma-newsletter-banner" aria-label="Academic Newsletter">
        <div className="figma-newsletter-banner__content">
          <span className="figma-newsletter-banner__eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>mark_email_unread</span>
            <span>{isVi ? 'Bản tin học thuật LexiGrow' : 'LexiGrow Academic Dispatch'}</span>
          </span>
          <h2 className="figma-newsletter-banner__title">
            {isVi
              ? 'Nhận chiến lược nâng band điểm IELTS và bộ từ vựng mới hằng tuần'
              : 'Get Weekly High-Band Vocabulary & IELTS Essay Strategies'}
          </h2>
          <p className="figma-newsletter-banner__subtitle">
            {isVi
              ? 'Gia nhập hơn 25,000 học viên nhận phân tích bài viết mẫu, collocations học thuật và thông báo ưu đãi độc quyền từ LexiGrow.'
              : 'Join over 25,000 learners receiving expert essay breakdowns, lexical insights, and exclusive subscriber perks.'}
          </p>

          <form onSubmit={handleSubscribe} className="figma-newsletter-banner__form">
            <div className="figma-newsletter-banner__input-wrap">
              <span className="material-symbols-outlined figma-newsletter-banner__search-icon">mail</span>
              <input
                type="email"
                placeholder={isVi ? 'Nhập email của bạn (vd: student@lexigrow.com)...' : 'Enter your email (e.g., student@lexigrow.com)...'}
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="figma-newsletter-banner__submit">
              {isVi ? 'Đăng ký nhận tin' : 'Subscribe'}
            </button>
          </form>

          {subscribeStatus && (
            <p className="figma-newsletter-banner__status">{subscribeStatus}</p>
          )}
        </div>
      </section>
    </div>
  )
}
