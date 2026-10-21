import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import api from '../../services/api.js'
import './StudentHome.css'

const SLIDES_COUNT = 3

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
    coach: 'LexiGrow AI Studio',
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
    coach: 'LexiGrow AI Studio',
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

const FEATURE_PROMO_BANNERS = [
  {
    id: 'ai-writing',
    titleVi: 'Phòng Luyện Viết Thông Minh & Gemini AI',
    titleEn: 'Smart Writing Lab & Gemini AI',
    tagVi: 'CÔNG NGHỆ AI',
    tagEn: 'AI ENGINE',
    tagIcon: 'auto_awesome',
    badgeBg: 'rgba(59, 130, 246, 0.92)',
    badgeColor: '#ffffff',
    descVi: 'Viết luận ngắn, AI quét Heatmap ngữ cảnh và chấm điểm 4 trạng thái chuẩn xác tức thì.',
    descEn: 'Instant short-essay feedback with multi-state lexical heatmaps and CEFR-aligned scoring.',
    ctaVi: 'Thử viết ngay',
    ctaEn: 'Write Now',
    href: '/student/write-essay',
    gif: '/assets/banners/features/ai-writing.gif',
    fallbackImg: '/assets/banners/features/ai-writing.svg',
    metricIcon: 'verified',
    metricVi: 'AI chấm theo 4 mức',
    metricEn: '4-level AI Rubric',
    accentColor: '#3B82F6',
  },
  {
    id: 'growth-garden',
    titleVi: 'Khu Vườn Tri Thức Sinh Thái',
    titleEn: 'Ecological Growth Garden',
    tagVi: 'GAMIFICATION',
    tagEn: 'GAMIFICATION',
    tagIcon: 'potted_plant',
    badgeBg: 'rgba(16, 185, 129, 0.92)',
    badgeColor: '#ffffff',
    descVi: 'Trực quan hóa vốn từ chủ động (Mastered) qua mô hình cây xanh nảy mầm và nở hoa theo thời gian thực.',
    descEn: 'Watch your active vocabulary sprout and blossom in a living digital knowledge garden.',
    ctaVi: 'Vào khu vườn',
    ctaEn: 'Explore Garden',
    href: '/student/garden',
    gif: '/assets/banners/features/growth-garden.gif',
    fallbackImg: '/assets/banners/features/growth-garden.svg',
    metricIcon: 'eco',
    metricVi: 'Vốn từ chủ động',
    metricEn: 'Active Vocab Growth',
    accentColor: '#10B981',
  },
  {
    id: 'spaced-repetition',
    titleVi: 'Ôn Tập Thẻ Từ Spaced Repetition',
    titleEn: 'Spaced Repetition Flashcards',
    tagVi: 'KHOA HỌC NÃO BỘ',
    tagEn: 'NEUROSCIENCE',
    tagIcon: 'psychology',
    badgeBg: 'rgba(139, 92, 246, 0.92)',
    badgeColor: '#ffffff',
    descVi: 'Thuật toán lặp lại ngắt quãng SM-2 nhắc nhở đúng thời điểm vàng, ghi nhớ dài hạn không quên.',
    descEn: 'SM-2 spaced repetition schedules optimal reviews to convert short-term words into permanent recall.',
    ctaVi: 'Luyện thẻ ngay',
    ctaEn: 'Practice SRS',
    href: '/student/vocabulary/review',
    gif: '/assets/banners/features/spaced-repetition.gif',
    fallbackImg: '/assets/banners/features/spaced-repetition.svg',
    metricIcon: 'schedule',
    metricVi: 'Chu kỳ lặp SM-2',
    metricEn: 'SM-2 Smart Cycle',
    accentColor: '#8B5CF6',
  },
  {
    id: 'game-hub',
    titleVi: 'Đấu Trường 4 Mini-Games Luyện Từ',
    titleEn: '4 Gamified Word Arena Modes',
    tagVi: 'ĐẤU TRƯỜNG TỪ VỰNG',
    tagEn: 'WORD ARENA',
    tagIcon: 'sports_esports',
    badgeBg: 'rgba(245, 158, 11, 0.92)',
    badgeColor: '#ffffff',
    descVi: 'Ghép từ, điền câu ngữ cảnh, xếp chữ và săn từ vựng kịch tính giúp phản xạ từ tự nhiên.',
    descEn: 'Matching, Context Filler, Scramble, and Vocab Hunter for high-speed retention and fun.',
    ctaVi: 'Chơi ngay',
    ctaEn: 'Play Games',
    href: '/student/game',
    gif: '/assets/banners/features/game-hub.gif',
    fallbackImg: '/assets/banners/features/game-hub.svg',
    metricIcon: 'military_tech',
    metricVi: '4 chế độ tương tác',
    metricEn: '4 Interactive Modes',
    accentColor: '#F59E0B',
  },
]

function HeroParticles() {
  return (
    <div className="figma-hero__particles-layer" aria-hidden="true">
      {/* 3D Wireframe Geometric Shards & Crystal Fragments Motion Stream */}
      <video
        className="hero-shards-video"
        autoPlay
        loop
        muted
        playsInline
        poster="/assets/banners/geometry-shards-poster.png"
      >
        <source src="/assets/banners/geometry-shards-h.webm" type="video/webm" />
        <source src="/assets/banners/geometry-shards-h.mp4" type="video/mp4" />
      </video>

      <span className="hero-orb hero-orb--1" />
      <span className="hero-orb hero-orb--2" />
      <span className="hero-orb hero-orb--3" />
      <span className="hero-star hero-star--1" />
      <span className="hero-star hero-star--2" />
      <span className="hero-star hero-star--3" />
      <span className="hero-star hero-star--4" />
      <span className="hero-star hero-star--5" />
      <span className="hero-star hero-star--6" />
      <span className="hero-star hero-star--7" />
      <span className="hero-star hero-star--8" />
      <span className="hero-star hero-star--9" />
    </div>
  )
}

function HeroMascot({ modifier = '', alt = 'Monky D YunTeee Mascot' }) {
  return (
    <div className={`hero-mascot-media hero-mascot-media--${modifier}`}>
      <video
        className="hero-mascot-video"
        autoPlay
        loop
        muted
        playsInline
        poster="/assets/mascot/luffy-transparent.png"
      >
        <source src="/assets/mascot/luffy-animated.webm" type="video/webm" />
        <source src="/assets/mascot/luffy-animated.mov" type="video/quicktime" />
        <img
          src="/assets/mascot/luffy-animated.gif"
          alt={alt}
          className="hero-mascot-img"
        />
      </video>
    </div>
  )
}

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
  const [bannerImgSrc, setBannerImgSrc] = useState({})

  const handleBannerImgError = (id, fallback) => {
    setBannerImgSrc((prev) => {
      if (prev[id] === fallback) return prev
      return { ...prev, [id]: fallback }
    })
  }

  const isVi = language === 'vi'

  // Auto-advance banner carousel every 6s unless hovered
  useEffect(() => {
    if (isPaused) return undefined
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES_COUNT)
    }, 6000)
    return () => clearInterval(timer)
  }, [isPaused])

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? SLIDES_COUNT - 1 : prev - 1))
  }

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES_COUNT)
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

      {/* ── 1. Hero Spotlight Carousel (Fully Coded LexiGrow Slides - Fixed 3:1 Ratio) ── */}
      <section
        className="figma-hero"
        aria-label="Hero Spotlight"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="figma-hero__slider">
          {/* ── Slide 0: Vocabulary Retention & AI Flashcard ── */}
          <div
            className={`figma-hero__slide figma-hero__slide--vocab ${activeSlide === 0 ? 'is-active' : ''}`}
            aria-hidden={activeSlide !== 0}
          >
            <div className="figma-hero__ambient figma-hero__ambient--vocab" />
            <HeroParticles />
            <div className="figma-hero__inner">
              <div className="figma-hero__content">
                <div className="figma-hero__tag">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" />
                  </svg>
                  <span>{isVi ? 'Học từ vựng thông minh cùng AI' : 'AI-Powered Vocabulary Learning'}</span>
                </div>

                <h1 className="figma-hero__title">
                  {isVi ? 'Chinh phục từ vựng.' : 'Build Your Vocabulary.'}
                  <br />
                  <span className="figma-hero__highlight--mint">
                    {isVi ? 'Khai phá tiềm năng.' : 'Unlock Your Potential.'}
                  </span>
                </h1>

                <p className="figma-hero__subtitle">
                  {isVi
                    ? 'Học thông minh hơn cùng flashcard AI, ví dụ ngữ cảnh sinh động và phương pháp ghi nhớ dài hạn tối ưu.'
                    : 'Learn smarter with AI-powered flashcards, contextual examples, and personalized vocabulary practice designed for long-term retention.'}
                </p>

                <div className="figma-hero__actions">
                  <Link to="/student/explore" className="figma-hero__cta figma-hero__cta--white">
                    <span>{isVi ? 'Khám phá từ vựng' : 'Explore Vocabulary'}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                  <Link to="/student/my-words" className="figma-hero__cta figma-hero__cta--glass">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                    <span>{isVi ? 'Bắt đầu học ngay' : 'Start Learning'}</span>
                  </Link>
                </div>
              </div>

              <div className="figma-hero__showcase figma-hero__showcase--vocab">
                {/* 3D Layered Flashcard */}
                <div className="hero-flashcard-stack">
                  <div className="hero-flashcard-layer hero-flashcard-layer--back" />
                  <div className="hero-flashcard-layer hero-flashcard-layer--mid" />
                  <div className="hero-flashcard">
                    <div className="hero-flashcard__head">
                      <div>
                        <div className="hero-flashcard__word">resilience</div>
                        <div className="hero-flashcard__phonetic">/rɪˈzɪliəns/</div>
                      </div>
                      <span className="hero-flashcard__pos">noun</span>
                    </div>
                    <div className="hero-flashcard__sep" />
                    <p className="hero-flashcard__def">
                      The ability to recover quickly from difficulties.
                    </p>
                    <div className="hero-flashcard__example">
                      <span className="hero-flashcard__example-tag">Example</span>
                      <p className="hero-flashcard__example-sentence">
                        Her <mark className="hero-flashcard__highlight">resilience</mark> helped her overcome many challenges in life.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mascot Luffy Vocab Companion */}
                <div className="hero-mascot-companion hero-mascot-companion--vocab">
                  <div className="hero-mascot-bubble">
                    <div className="hero-mascot-bubble__name">
                      <span>Monky D YunTeee</span>
                      <span className="hero-mascot-verified">✓</span>
                    </div>
                    <p className="hero-mascot-bubble__text">
                      {isVi
                        ? 'Hôm nay cùng tớ nạp 3 từ mới nhé! Nhớ cực lâu với Spaced Repetition đấy! 📖'
                        : 'Ready to master 3 new words? Spaced Repetition locks them in! 📖'}
                    </p>
                  </div>
                  <HeroMascot modifier="vocab" alt="Monky D YunTeee Vocab Mascot" />
                  <div className="hero-mascot-badge hero-mascot-badge--srs">
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#10B981' }}>psychology</span>
                    <span>{isVi ? 'SRS Level 3: Ghi nhớ vĩnh viễn' : 'SRS Spaced Repetition'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Slide 1: Personalized Learning Journey ── */}
          <div
            className={`figma-hero__slide figma-hero__slide--journey ${activeSlide === 1 ? 'is-active' : ''}`}
            aria-hidden={activeSlide !== 1}
          >
            <div className="figma-hero__ambient figma-hero__ambient--journey" />
            <HeroParticles />
            <div className="figma-hero__inner">
              <div className="figma-hero__content">
                <div className="figma-hero__tag">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  <span>{isVi ? 'Lộ trình học tập cá nhân hóa' : 'Your Personalized Learning Journey'}</span>
                </div>

                <h1 className="figma-hero__title">
                  {isVi ? 'Mỗi bước tiến bộ.' : 'Every Step Forward.'}
                  <br />
                  <span className="figma-hero__highlight--mint">
                    {isVi ? 'Hoàn thiện chính mình.' : 'A Smarter You.'}
                  </span>
                </h1>

                <p className="figma-hero__subtitle">
                  {isVi
                    ? 'Theo dõi tiến độ, bám sát lộ trình cá nhân hóa và chinh phục mục tiêu trình độ tiếng Anh chuẩn CEFR.'
                    : 'Track your progress, follow personalized learning paths, and reach your English proficiency goals with intelligent CEFR-based guidance.'}
                </p>

                <div className="figma-hero__actions">
                  <Link to="/student/dashboard" className="figma-hero__cta figma-hero__cta--white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <span>{isVi ? 'Góc học tập của tôi' : 'My Learning Journey'}</span>
                  </Link>
                  <Link to="/student/explore" className="figma-hero__cta figma-hero__cta--glass">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    <span>{isVi ? 'Khám phá lộ trình học' : 'Explore Learning Paths'}</span>
                  </Link>
                </div>
              </div>

              <div className="figma-hero__showcase figma-hero__showcase--journey">
                {/* Laptop Dashboard Screen */}
                <div className="hero-laptop">
                  <div className="hero-laptop__screen">
                    <div className="hero-laptop__header">
                      <span>Your English Level</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.7 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </div>

                    <div className="hero-laptop__level-row">
                      <div className="hero-laptop__level">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        <div>
                          <strong>B1</strong>
                          <span>Current Level</span>
                        </div>
                      </div>
                      <span className="hero-laptop__arrow">»</span>
                      <div className="hero-laptop__level hero-laptop__level--target">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        <div>
                          <strong>B2</strong>
                          <span>Target Level</span>
                        </div>
                      </div>
                    </div>

                    <div className="hero-laptop__bar-container">
                      <div className="hero-laptop__progress">
                        <div className="hero-laptop__fill" style={{ width: '72%' }} />
                      </div>
                      <div className="hero-laptop__bar-sub">
                        <strong>72% Complete</strong>
                        <span>Keep going! You&apos;re on the right track.</span>
                      </div>
                    </div>

                    <div className="hero-laptop__activity">
                      <div className="hero-laptop__act-head">
                        <span>Weekly Learning Activity</span>
                        <span className="hero-laptop__badge">This Week ▾</span>
                      </div>
                      <div className="hero-laptop__bars">
                        {[
                          { d: 'Mon', h: '42%' },
                          { d: 'Tue', h: '60%' },
                          { d: 'Wed', h: '92%' },
                          { d: 'Thu', h: '50%' },
                          { d: 'Fri', h: '72%' },
                          { d: 'Sat', h: '35%' },
                          { d: 'Sun', h: '80%' },
                        ].map((item) => (
                          <div key={item.d} className="hero-act-col">
                            <div className="hero-act-bar" style={{ height: item.h }} />
                            <span>{item.d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hero-laptop__base" />
                </div>

                {/* Mascot Luffy Streak Companion */}
                <div className="hero-mascot-companion hero-mascot-companion--journey">
                  <div className="hero-mascot-bubble">
                    <div className="hero-mascot-bubble__name">
                      <span>Monky D YunTeee</span>
                      <span className="hero-mascot-verified">✓</span>
                    </div>
                    <p className="hero-mascot-bubble__text">
                      {isVi
                        ? 'Chào mừng bạn đến với LexiGrow! Giữ chuỗi 12 ngày Streak cùng tớ nhé! 🔥'
                        : 'Welcome to LexiGrow! Keep that 12-day streak burning with me! 🔥'}
                    </p>
                  </div>
                  <HeroMascot modifier="journey" alt="Monky D YunTeee Journey Mascot" />
                  <div className="hero-mascot-badges-row">
                    <div className="hero-mascot-badge hero-mascot-badge--fire">
                      <span>🔥 12 Days Streak</span>
                    </div>
                    <div className="hero-mascot-badge hero-mascot-badge--trophy">
                      <span>🏆 Top 5% Week</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Slide 2: AI Writing Assistant ── */}
          <div
            className={`figma-hero__slide figma-hero__slide--writing ${activeSlide === 2 ? 'is-active' : ''}`}
            aria-hidden={activeSlide !== 2}
          >
            <div className="figma-hero__ambient figma-hero__ambient--writing" />
            <HeroParticles />
            <div className="figma-hero__inner">
              <div className="figma-hero__content">
                <div className="figma-hero__tag figma-hero__tag--light">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>{isVi ? 'Trợ lý AI luyện viết thông minh' : 'Intelligent AI Writing Assistant'}</span>
                </div>

                <h1 className="figma-hero__title figma-hero__title--dark">
                  {isVi ? 'Tự tin viết luận.' : 'Write with Confidence.'}
                  <br />
                  <span className="figma-hero__highlight--teal">
                    {isVi ? 'Tiến bộ vượt bậc cùng AI.' : 'Improve with AI.'}
                  </span>
                </h1>

                <p className="figma-hero__subtitle figma-hero__subtitle--dark">
                  {isVi
                    ? 'Nhận phản hồi tức thì, sửa lỗi ngữ pháp, gợi ý từ vựng học thuật và đánh giá chuẩn 4 tiêu chí bài viết.'
                    : 'Get instant writing feedback, grammar corrections, vocabulary suggestions, and CEFR-aligned evaluations to strengthen your English writing skills.'}
                </p>

                <div className="figma-hero__actions">
                  <Link to="/student/writing" className="figma-hero__cta figma-hero__cta--emerald">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    <span>{isVi ? 'Luyện viết luận ngay' : 'Practice Writing'}</span>
                  </Link>
                  <Link to="/student/write-essay" className="figma-hero__cta figma-hero__cta--outline-dark">
                    <span>{isVi ? 'Trải nghiệm sửa bài AI' : 'Discover AI Feedback'}</span>
                  </Link>
                </div>
              </div>

              <div className="figma-hero__showcase figma-hero__showcase--writing">
                {/* Editor Laptop Mockup */}
                <div className="hero-laptop">
                  <div className="hero-laptop__screen hero-laptop__screen--editor">
                    <div className="hero-editor-bar">
                      <span className="hero-editor-mode">&lt;&gt; Essay</span>
                      <span className="hero-editor-counter">162 words ⏱️</span>
                    </div>
                    <div className="hero-editor-tools">
                      <span>Paragraph ▾</span>
                      <strong>B</strong>
                      <em>I</em>
                      <u>U</u>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    </div>
                    <div className="hero-editor-content">
                      <p>
                        In recent years, technology <span className="hero-err hero-err--active">have</span> significantly changed the way people communicate. While it <span className="hero-err">brings</span> many benefits...
                      </p>
                      <p>
                        <mark className="hero-hl">In my opinion</mark>, the key is to use technology in a <mark className="hero-hl">responsible manner</mark>...
                      </p>
                    </div>

                    {/* Grammar Correction Popover */}
                    <div className="hero-grammar-box">
                      <div className="hero-grammar-box__head">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>Grammar correction</span>
                      </div>
                      <div className="hero-grammar-box__diff">
                        <span className="hero-grammar-del">have</span>
                        <span>→</span>
                        <span className="hero-grammar-add">has</span>
                      </div>
                      <p className="hero-grammar-box__desc">
                        The subject &quot;technology&quot; is singular, so the correct form is &apos;has&apos;.
                      </p>
                      <button type="button" className="hero-grammar-box__btn">Apply</button>
                    </div>
                  </div>
                  <div className="hero-laptop__base hero-laptop__base--light" />
                </div>

                {/* Mascot Luffy AI Writing Tutor */}
                <div className="hero-mascot-companion hero-mascot-companion--writing">
                  <div className="hero-mascot-bubble hero-mascot-bubble--ai">
                    <div className="hero-mascot-bubble__name">
                      <span>Monky D YunTeee · AI Coach</span>
                      <span className="hero-mascot-verified">✓</span>
                    </div>
                    <p className="hero-mascot-bubble__text">
                      {isVi
                        ? 'Tớ phát hiện 1 lỗi ngữ pháp nhỏ! Sửa thành "has" là chuẩn Band 7.5 IELTS ngay! ✍️'
                        : 'Quick fix detected! Changing to "has" levels your essay to Band 7.5! ✍️'}
                    </p>
                  </div>
                  <HeroMascot modifier="writing" alt="Monky D YunTeee AI Writing Mascot" />
                  <div className="hero-mascot-badge hero-mascot-badge--score">
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#059669' }}>auto_awesome</span>
                    <span>{isVi ? 'Chấm điểm 4 tiêu chí CEFR' : 'CEFR 4-Criteria Rubric'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              className={`figma-hero__dot ${idx === activeSlide ? 'is-active' : ''}`}
              onClick={() => setActiveSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
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

      {/* ── 5. LexiGrow Ecosystem Feature Showcase (Animated Promo Banners) ── */}
      <section className="figma-section" aria-labelledby="heading-promo-banners">
        <div className="figma-section__header">
          <div>
            <div className="figma-section__eyebrow-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>campaign</span>
              <span>{isVi ? 'TÍNH NĂNG NỔI BẬT' : 'FEATURE SHOWCASE'}</span>
            </div>
            <h2 id="heading-promo-banners" className="figma-section__title">
              {isVi ? 'Khám Phá Hệ Sinh Thái Học Tập LexiGrow' : 'Explore the LexiGrow Learning Ecosystem'}
            </h2>
            <p className="figma-section__subtitle">
              {isVi
                ? 'Từ phòng viết ứng dụng AI, khu vườn sinh thái tri thức đến đấu trường game hóa giúp bạn làm chủ từ vựng mỗi ngày.'
                : 'From AI-powered writing labs and the Growth Garden to gamified drills engineered for active vocabulary mastery.'}
            </p>
          </div>
        </div>

        <div className="figma-promo-grid">
          {FEATURE_PROMO_BANNERS.map((banner) => (
            <div
              key={banner.id}
              className={`figma-promo-card figma-promo-card--${banner.id}`}
              onClick={() => navigate(banner.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(banner.href)
                }
              }}
              aria-label={isVi ? banner.titleVi : banner.titleEn}
              style={{ '--promo-accent': banner.accentColor }}
            >
              {/* Media Visual Area (supports GIF / Animated SVG fallback) */}
              <div className="figma-promo-card__media">
                <img
                  src={bannerImgSrc[banner.id] || banner.gif}
                  alt={isVi ? banner.titleVi : banner.titleEn}
                  className="figma-promo-card__gif"
                  loading="lazy"
                  onError={() => handleBannerImgError(banner.id, banner.fallbackImg)}
                />
                <div
                  className="figma-promo-card__badge"
                  style={{ backgroundColor: banner.badgeBg, color: banner.badgeColor }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{banner.tagIcon}</span>
                  <span>{isVi ? banner.tagVi : banner.tagEn}</span>
                </div>
                <div className="figma-promo-card__live-indicator">
                  <span className="figma-promo-card__pulse-dot" />
                  <span>PROMO</span>
                </div>
              </div>

              {/* Content Area */}
              <div className="figma-promo-card__body">
                <h3 className="figma-promo-card__title">
                  {isVi ? banner.titleVi : banner.titleEn}
                </h3>
                <p className="figma-promo-card__desc">
                  {isVi ? banner.descVi : banner.descEn}
                </p>

                <div className="figma-promo-card__footer">
                  <div className="figma-promo-card__metric">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{banner.metricIcon}</span>
                    <span>{isVi ? banner.metricVi : banner.metricEn}</span>
                  </div>

                  <span className="figma-promo-card__cta">
                    <span>{isVi ? banner.ctaVi : banner.ctaEn}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
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
