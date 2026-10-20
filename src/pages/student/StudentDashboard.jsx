import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import useDashboardResource from '../../hooks/useDashboardResource.js'
import StatCard from '../../components/common/StatCard'
import AnimatedCounter from '../../components/common/AnimatedCounter'
import CircularProgress from '../../components/common/CircularProgress'
import VocabGrowthChart from '../../components/charts/VocabGrowthChart'
import Card, { CardHeader, CardTitle } from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { formatDate } from '../../utils/formatters.js'
import { getLearningPathRecommendationCacheKey } from '../../utils/learningPathRecommendationCache.js'
import './StudentDashboard.css'

function ResourceNotice({ resource, label }) {
  const { language } = useLanguage()
  const isVi = language === 'vi'
  if (!resource.loading && !resource.error) return null
  return (
    <div className="dash-notice-box" role="status" aria-live="polite">
      <p>
        {resource.loading
          ? (isVi ? `Đang tải ${label}…` : `Loading ${label}…`)
          : resource.error?.code === 'TIMEOUT'
            ? (isVi ? `Tải ${label} quá lâu. Vui lòng thử lại.` : `Loading ${label} timed out. Please retry.`)
            : (isVi ? `Chưa tải được ${label}.` : `Could not load ${label}.`)}
      </p>
      {resource.error && (
        <Button variant="secondary" size="sm" onClick={resource.retry}>
          {isVi ? 'Thử lại' : 'Retry'}
        </Button>
      )}
    </div>
  )
}

// Built-in courses catalog reflecting Figma frames 543:687 and 625:10616
const INITIAL_COURSES = [
  {
    id: 'c1',
    title: 'IELTS Academic Writing & Lexical Mastery',
    category: 'Academic Writing',
    instructor: 'Alexander Hamilton',
    level: 'B2 - C1',
    lessonsTotal: 10,
    lessonsCompleted: 4,
    status: 'in-progress',
    rating: 4.9,
    reviewsCount: '1.2k',
    price: '$24.92',
    originalPrice: '$32.90',
    isBestSeller: true,
    discountBadge: '20% OFF',
    thumbnail: '/assets/editorial/courses/vue-course.png',
    link: '/student/writing?slug=academic',
    wishlisted: true,
  },
  {
    id: 'c2',
    title: 'Technology & AI Debate Writing',
    category: 'Technology & Innovation',
    instructor: 'Kitani Studio',
    level: 'B1 - B2',
    lessonsTotal: 8,
    lessonsCompleted: 0,
    status: 'not-started',
    rating: 4.8,
    reviewsCount: '980',
    price: '$24.92',
    originalPrice: '$32.90',
    isBestSeller: true,
    discountBadge: '20% OFF',
    thumbnail: '/assets/editorial/courses/mobile-dev.png',
    link: '/student/writing?slug=technology',
    wishlisted: false,
  },
  {
    id: 'c3',
    title: 'Advanced Environmental & Science Essays',
    category: 'Environment',
    instructor: 'Sarasvati Devi',
    level: 'B2 - C1',
    lessonsTotal: 12,
    lessonsCompleted: 12,
    status: 'completed',
    rating: 5.0,
    reviewsCount: '1.4k',
    price: '$29.99',
    originalPrice: '$39.90',
    isBestSeller: false,
    discountBadge: '25% OFF',
    thumbnail: '/assets/editorial/courses/uber-clone.png',
    link: '/student/writing?slug=environment',
    wishlisted: true,
  },
  {
    id: 'c4',
    title: 'Daily Life & Natural Conversational English',
    category: 'Daily Life',
    instructor: 'Jonathan Doe',
    level: 'A2 - B1',
    lessonsTotal: 8,
    lessonsCompleted: 8,
    status: 'completed',
    rating: 4.9,
    reviewsCount: '2.1k',
    price: '$19.99',
    originalPrice: '$28.00',
    isBestSeller: true,
    discountBadge: '30% OFF',
    thumbnail: '/assets/editorial/courses/website-zero.png',
    link: '/student/writing?slug=daily-life',
    wishlisted: false,
  },
  {
    id: 'c5',
    title: 'Creative Storytelling & Descriptive Prose',
    category: 'Creative Arts',
    instructor: 'Labie Vance',
    level: 'B1 - B2',
    lessonsTotal: 10,
    lessonsCompleted: 0,
    status: 'not-started',
    rating: 4.7,
    reviewsCount: '640',
    price: '$24.92',
    originalPrice: '$32.90',
    isBestSeller: false,
    discountBadge: '20% OFF',
    thumbnail: '/assets/editorial/courses/swift-dev.png',
    link: '/student/explore',
    wishlisted: false,
  },
  {
    id: 'c6',
    title: 'UI Design & Visual Communication Vocabulary',
    category: 'Design & Media',
    instructor: 'Kitani Studio',
    level: 'A2 - B2',
    lessonsTotal: 10,
    lessonsCompleted: 3,
    status: 'in-progress',
    rating: 4.8,
    reviewsCount: '890',
    price: '$24.92',
    originalPrice: '$32.90',
    isBestSeller: true,
    discountBadge: '20% OFF',
    thumbnail: '/assets/editorial/courses/ui-design.png',
    link: '/student/explore',
    wishlisted: true,
  },
  {
    id: 'c7',
    title: 'Modern Business & Financial Writing',
    category: 'Business English',
    instructor: 'Alexander Hamilton',
    level: 'B2 - C2',
    lessonsTotal: 14,
    lessonsCompleted: 0,
    status: 'not-started',
    rating: 4.9,
    reviewsCount: '1.5k',
    price: '$34.00',
    originalPrice: '$45.00',
    isBestSeller: true,
    discountBadge: '20% OFF',
    thumbnail: '/assets/editorial/courses/desk-notes.png',
    link: '/student/explore',
    wishlisted: false,
  },
  {
    id: 'c8',
    title: 'Academic Research & Literature Analysis',
    category: 'Academic Writing',
    instructor: 'Sarasvati Devi',
    level: 'C1 - C2',
    lessonsTotal: 12,
    lessonsCompleted: 12,
    status: 'completed',
    rating: 5.0,
    reviewsCount: '780',
    price: '$29.99',
    originalPrice: '$39.90',
    isBestSeller: false,
    discountBadge: '25% OFF',
    thumbnail: '/assets/editorial/courses/modern-art.png',
    link: '/student/explore',
    wishlisted: false,
  },
]

export default function StudentDashboard() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const isVi = language === 'vi'
  const navigate = useNavigate()

  // Dynamic API Resources
  const overviewResource = useDashboardResource('/progress/overview')
  const goalsResource = useDashboardResource('/goals')
  const essaysResource = useDashboardResource('/essays')
  const sessionResource = useDashboardResource('/sessions/current')
  const vocabularyResource = useDashboardResource('/vocabulary/due-today')
  const recommendationResource = useDashboardResource('/sessions/recommendation', 40000, {
    key: getLearningPathRecommendationCacheKey(user?._id),
    ttlMs: 30 * 60 * 1000,
  })

  const overview = overviewResource.response?.data
  const weeklyGoal = goalsResource.response?.data
  const recentEssays = essaysResource.response?.data?.slice(0, 5) || []
  const currentSession = sessionResource.response?.data
  const dueSrsCount = vocabularyResource.response?.count ?? vocabularyResource.response?.data?.length ?? 0
  const recommendation = recommendationResource.response?.data

  // Weekly goals calculations
  const wordsGoal = weeklyGoal?.goals?.find((g) => g.label === 'New Words')
  const lengthGoal = weeklyGoal?.goals?.find((g) => g.label?.includes('Length'))
  const complexityGoal = weeklyGoal?.goals?.find((g) => g.label?.includes('Complexity'))

  const wordsPercentage = wordsGoal && wordsGoal.target > 0 ? Math.min(100, Math.round((wordsGoal.current / wordsGoal.target) * 100)) : 0
  const lengthPercentage = lengthGoal && lengthGoal.target > 0 ? Math.min(100, Math.round((lengthGoal.current / lengthGoal.target) * 100)) : 0
  const complexityPercentage = complexityGoal && complexityGoal.target > 0 ? Math.min(100, Math.round((complexityGoal.current / complexityGoal.target) * 100)) : 0

  // State management for Figma tabs & filters
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'in-progress' | 'completed' | 'wishlist' | 'metrics'
  const [ratingFilter, setRatingFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [coursesList, setCoursesList] = useState(INITIAL_COURSES)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Toggle wishlist state
  const handleToggleWishlist = (courseId, e) => {
    e.preventDefault()
    e.stopPropagation()
    setCoursesList((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, wishlisted: !c.wishlisted } : c))
    )
  }

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    return coursesList.filter((course) => {
      if (activeTab === 'in-progress' && course.status !== 'in-progress') return false
      if (activeTab === 'completed' && course.status !== 'completed') return false
      if (activeTab === 'wishlist' && !course.wishlisted) return false

      if (ratingFilter === '5' && course.rating < 5.0) return false
      if (ratingFilter === '4' && course.rating < 4.8) return false

      return true
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'popular') return parseInt(b.reviewsCount) - parseInt(a.reviewsCount)
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      return 0
    })
  }, [coursesList, activeTab, ratingFilter, sortBy])

  const wishlistCount = coursesList.filter((c) => c.wishlisted).length

  return (
    <div className="figma-mycourses animate-fade-in">
      {/* ── 1. TOP HERO BANNER (Figma Frame 543:687) ── */}
      <section className="figma-hero-spotlight">
        <div className="figma-hero-spotlight__content">
          <h1 className="figma-hero-spotlight__title">
            {isVi ? 'Học điều mới mỗi ngày.' : 'Learn something new everyday.'}
          </h1>
          <p className="figma-hero-spotlight__subtitle">
            {recommendation?.rationale ||
              (isVi
                ? 'Trở thành người học chuyên nghiệp và sẵn sàng vươn ra thế giới.'
                : 'Become professionals and ready to join the world.')}
          </p>

          <div className="figma-hero-spotlight__actions">
            <Button
              variant="white"
              size="lg"
              className="figma-pill-cta"
              onClick={() =>
                navigate(
                  recommendation?.targetWords?.length
                    ? '/student/writing?adaptive=true'
                    : '/student/writing'
                )
              }
            >
              {currentSession
                ? (isVi ? 'Tiếp tục phiên học' : 'Resume Learning Session')
                : (isVi ? 'Bắt đầu phiên học ngay' : 'Start Session (10 mins)')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="figma-pill-outline"
              onClick={() => navigate('/student/explore')}
            >
              {isVi ? 'Khám phá khoá học' : 'Explore Courses'}
            </Button>
          </div>
        </div>

        {/* Creator badge bottom right of hero */}
        <div className="figma-hero-spotlight__creator">
          <img
            src="/assets/editorial/instructors/alexander.png"
            alt="Lead Instructor"
            className="figma-creator-avatar"
          />
          <div>
            <div className="figma-creator-name">Jane LexiGrow</div>
            <div className="figma-creator-role">{isVi ? 'Giảng viên IELTS 8.5' : 'Senior Academic Mentor'}</div>
            <div className="figma-creator-awards">{isVi ? 'Top 1% LexiGrow 2026' : 'Winner Best Tutor 2026'}</div>
          </div>
        </div>
      </section>

      {/* ── 2. SECTION HEADER & TABS (Figma Frame 543:687 & 625:10616) ── */}
      <div className="figma-dash-header">
        <div className="figma-dash-header__left">
          <h2 className="figma-dash-title">{isVi ? 'Khoá Học Của Tôi' : 'My Course'}</h2>
          <p className="figma-dash-subtitle">
            {isVi ? 'Danh sách các chủ đề và khoá học đã đăng ký' : 'List of your courses and writing topics'}
          </p>
        </div>

        {/* Tab row */}
        <div className="figma-dash-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`figma-dash-tab ${activeTab === 'all' ? 'figma-dash-tab--active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {isVi ? 'Tất cả khoá học' : 'All Courses'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'in-progress'}
            className={`figma-dash-tab ${activeTab === 'in-progress' ? 'figma-dash-tab--active' : ''}`}
            onClick={() => setActiveTab('in-progress')}
          >
            {isVi ? 'Đang học' : 'Courses'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'wishlist'}
            className={`figma-dash-tab ${activeTab === 'wishlist' ? 'figma-dash-tab--active' : ''}`}
            onClick={() => setActiveTab('wishlist')}
          >
            {isVi ? 'Yêu thích' : 'Wishlist'}
            {wishlistCount > 0 && <span className="figma-tab-badge">{wishlistCount}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'completed'}
            className={`figma-dash-tab ${activeTab === 'completed' ? 'figma-dash-tab--active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            {isVi ? 'Đã hoàn thành' : 'Completed'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'metrics'}
            className={`figma-dash-tab ${activeTab === 'metrics' ? 'figma-dash-tab--active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            <span className="material-symbols-outlined figma-tab-icon">query_stats</span>
            {isVi ? 'Tiến độ & SRS' : 'Learning Metrics & Goals'}
          </button>
        </div>

        {/* Right filters */}
        {activeTab !== 'metrics' && (
          <div className="figma-dash-controls">
            <select
              className="figma-select-pill"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              aria-label="Filter by rating"
            >
              <option value="all">{isVi ? 'Tất cả đánh giá' : 'All Rated'}</option>
              <option value="5">5 {isVi ? 'Sao' : 'Stars'}</option>
              <option value="4">4.8+ {isVi ? 'Sao' : 'Stars'}</option>
            </select>

            <select
              className="figma-select-pill"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort courses"
            >
              <option value="recent">{isVi ? 'Mới thêm gần đây' : 'Recently added'}</option>
              <option value="popular">{isVi ? 'Phổ biến nhất' : 'Most popular'}</option>
              <option value="rating">{isVi ? 'Đánh giá cao nhất' : 'Highest rated'}</option>
              <option value="title">{isVi ? 'Theo bảng chữ cái' : 'Alphabetical'}</option>
            </select>
          </div>
        )}
      </div>

      {/* ── 3. MAIN CONTENT AREA ── */}
      {activeTab === 'metrics' ? (
        /* Tab: Learning Metrics, Vocabulary Growth, SRS Due and Weekly Goals */
        <div className="figma-metrics-workspace animate-fade-in">
          {/* Quick stats row */}
          <ResourceNotice resource={overviewResource} label={isVi ? 'thống kê học tập' : 'learning statistics'} />
          {!overviewResource.loading && !overviewResource.error && (
            <div className="figma-stats-grid">
              <StatCard
                label={t('progress.essaysCount', 'Essays Submitted')}
                value={<AnimatedCounter value={overview?.totalEssays || 0} />}
                icon="description"
              />
              <StatCard
                label={t('progress.totalLearned', 'Vocab Growth')}
                value={<>+<AnimatedCounter value={overview?.thisMonthWords || 0} /></>}
                subtitle={`${overview?.growthRate >= 0 ? '+' : ''}${overview?.growthRate || 0}% vs last month`}
                icon="trending_up"
              />
              <StatCard
                label={t('writing.vocabDiversity', 'Lexical Diversity (TTR)')}
                value={<AnimatedCounter value={Math.round((overview?.avgTTR || 0) * 100)} format="percent" />}
                icon="analytics"
                progress={Math.round((overview?.avgTTR || 0) * 100)}
              />
              <StatCard
                label={t('writing.cefrLevel', 'Estimated CEFR')}
                value={<>{overview?.rank || '—'}</>}
                subtitle={t('dashboard.basedOnWriting', 'Based on active writing')}
                icon="equalizer"
              />
            </div>
          )}

          <div className="figma-metrics-layout">
            <div className="figma-metrics-main">
              <VocabGrowthChart />

              {/* Recent essays list */}
              <Card padding="md" style={{ marginTop: 24 }}>
                <CardHeader>
                  <CardTitle subtitle={t('dashboard.recentEssaysDesc', 'Track your completed essays and review feedback')}>
                    {t('dashboard.recentEssays', 'Recent Writing')}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="figma-pill-btn"
                    leftIcon="history_edu"
                    onClick={() => navigate('/student/essays')}
                  >
                    {isVi ? 'Xem tất cả' : 'View All'}
                  </Button>
                </CardHeader>
                <ResourceNotice resource={essaysResource} label={isVi ? 'bài viết gần đây' : 'recent writing'} />
                {!essaysResource.loading && !essaysResource.error && (
                  recentEssays.length === 0 ? (
                    <div className="figma-empty-state">
                      <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#3DCBB1' }}>edit_note</span>
                      <p>{t('dashboard.noEssays', 'No essays yet. Start your first writing exercise!')}</p>
                      <Button variant="primary" size="md" className="figma-pill-cta" onClick={() => navigate('/student/explore')}>
                        {t('dashboard.writeEssay', 'Write Paragraph Now')}
                      </Button>
                    </div>
                  ) : (
                    <div className="figma-essays-list">
                      {recentEssays.map((essay) => (
                        <Link
                          key={essay._id}
                          className="figma-essay-row"
                          to={essay.status === 'draft' ? `/student/write-essay?id=${essay._id}` : `/student/feedback?id=${essay._id}`}
                        >
                          <div className="figma-essay-info">
                            <span className="material-symbols-outlined figma-essay-icon">article</span>
                            <div>
                              <h4 className="figma-essay-title">
                                {essay.title || t('writing.title', 'Vocabulary Practice Essay')}
                              </h4>
                              <span className="figma-essay-meta">
                                {formatDate(essay.createdAt, language)} · {essay.wordCount || 85} {t('dashboard.wordsCount', 'words')}
                              </span>
                            </div>
                          </div>
                          <Badge variant={essay.status === 'evaluated' ? 'success' : 'neutral'}>
                            {essay.status === 'evaluated' ? t('essayHistory.statusGraded', 'AI Evaluated') : t('essayHistory.statusDraft', 'Draft')}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )
                )}
              </Card>
            </div>

            <div className="figma-metrics-side">
              {/* Daily Streak Card */}
              <div className="figma-card figma-streak-card">
                <div className="figma-streak-flame">
                  <span className="material-symbols-outlined">local_fire_department</span>
                </div>
                <div>
                  <div className="figma-streak-val">{user?.streakDays || 0} {isVi ? 'ngày liên tiếp' : 'day streak'}</div>
                  <div className="figma-streak-sub">{isVi ? 'Đạt mục tiêu hàng ngày' : 'Daily goal achieved'}</div>
                </div>
              </div>

              {/* SRS Due Today */}
              {dueSrsCount > 0 && (
                <div className="figma-card figma-srs-card">
                  <div className="figma-srs-header">
                    <span className="material-symbols-outlined figma-srs-icon">style</span>
                    <div>
                      <h4 className="figma-srs-title">{dueSrsCount} {isVi ? 'từ cần ôn tập' : 'words due today'}</h4>
                      <p className="figma-srs-sub">{isVi ? 'Ôn tập ngay theo phương pháp ngắt quãng' : 'Spaced repetition review'}</p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    className="figma-pill-cta"
                    fullWidth
                    rightIcon="arrow_forward"
                    onClick={() => navigate('/student/vocabulary/review')}
                  >
                    {isVi ? 'Ôn tập ngay' : 'Review Now'}
                  </Button>
                </div>
              )}

              {/* Weekly Goals Progress */}
              <div className="figma-card figma-goals-card">
                <div className="figma-goals-header">
                  <h3>{isVi ? 'Mục tiêu tuần' : 'Weekly Goals'}</h3>
                  <Link to="/student/goals" className="figma-goals-link">
                    {isVi ? 'Cài đặt' : 'Settings'}
                  </Link>
                </div>
                <div className="figma-goals-rings">
                  <CircularProgress
                    percentage={wordsPercentage}
                    color="primary"
                    label={t('dashboard.newWordsAcquired', 'New Words')}
                    sublabel={`${wordsGoal?.current ?? 0} / ${wordsGoal?.target ?? '—'}`}
                  />
                  <CircularProgress
                    percentage={lengthPercentage}
                    color="secondary"
                    label={t('dashboard.writingVolume', 'Writing Volume')}
                    sublabel={`${lengthGoal?.current ?? 0} / ${lengthGoal?.target ?? '—'}`}
                  />
                  <CircularProgress
                    percentage={complexityPercentage}
                    color="tertiary"
                    label={t('dashboard.targetLevel', 'Target Level')}
                    sublabel={`Level: ${overview?.rank || '—'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── 4-COLUMN COURSE CARDS GRID (Figma Frames 543:687 & 625:10616) ── */
        <div>
          {filteredCourses.length === 0 ? (
            <div className="figma-wishlist-empty">
              <span className="material-symbols-outlined figma-empty-heart">favorite_border</span>
              <h3>{isVi ? 'Chưa có khoá học nào trong danh sách này' : 'No courses found in this view'}</h3>
              <p>
                {isVi
                  ? 'Hãy khám phá các khoá học mới và lưu vào danh sách yêu thích để luyện tập.'
                  : 'Explore our catalog and find the best writing courses tailored to your level.'}
              </p>
              <Button
                variant="primary"
                size="lg"
                className="figma-pill-cta"
                onClick={() => navigate('/student/explore')}
              >
                {isVi ? 'Khám phá khoá học ngay' : 'Explore Courses'}
              </Button>
            </div>
          ) : (
            <div className="figma-course-grid">
              {filteredCourses.map((course) => {
                const isCompleted = course.status === 'completed'
                const isInProgress = course.status === 'in-progress'
                const progressPercent =
                  course.lessonsTotal > 0
                    ? Math.round((course.lessonsCompleted / course.lessonsTotal) * 100)
                    : 0

                return (
                  <div key={course.id} className="figma-course-card">
                    {/* Thumbnail wrap */}
                    <div className="figma-course-card__media">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="figma-course-card__img"
                        loading="lazy"
                      />

                      {/* Top left badges */}
                      <div className="figma-course-card__badges">
                        {course.isBestSeller && (
                          <span className="figma-badge-bestseller">Best Seller</span>
                        )}
                        {course.discountBadge && (
                          <span className="figma-badge-discount">{course.discountBadge}</span>
                        )}
                      </div>

                      {/* Top right wishlist heart button */}
                      <button
                        type="button"
                        className={`figma-heart-btn ${course.wishlisted ? 'figma-heart-btn--active' : ''}`}
                        aria-label="Wishlist toggle"
                        onClick={(e) => handleToggleWishlist(course.id, e)}
                      >
                        <span className="material-symbols-outlined">
                          {course.wishlisted ? 'favorite' : 'favorite_border'}
                        </span>
                      </button>

                      {/* Progress bar line under thumbnail */}
                      {isInProgress && (
                        <div className="figma-card-progress-bar">
                          <div
                            className="figma-card-progress-fill"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                      {isCompleted && (
                        <div className="figma-card-progress-bar figma-card-progress-bar--completed">
                          <div className="figma-card-progress-fill" style={{ width: '100%' }} />
                        </div>
                      )}
                    </div>

                    {/* Content wrap */}
                    <div className="figma-course-card__content">
                      <h3 className="figma-course-card__title">
                        <Link to={course.link}>{course.title}</Link>
                      </h3>

                      <div className="figma-course-card__instructor">
                        <span className="material-symbols-outlined figma-inst-icon">person</span>
                        <span>{course.instructor}</span>
                      </div>

                      {/* Progress status or Rating */}
                      <div className="figma-course-card__status">
                        {isCompleted && (
                          <span className="figma-status-completed">
                            <span className="material-symbols-outlined">check_circle</span>
                            {isVi ? 'Đã hoàn thành!' : 'Completed!'}
                          </span>
                        )}
                        {isInProgress && (
                          <span className="figma-status-progress">
                            {course.lessonsCompleted}/{course.lessonsTotal}{' '}
                            {isVi ? 'bài học hoàn thành' : 'Lessons Completed'}
                          </span>
                        )}
                        {!isCompleted && !isInProgress && (
                          <span className="figma-status-notstarted">
                            {isVi ? 'Chưa bắt đầu' : 'Not Yet Started'}
                          </span>
                        )}
                      </div>

                      {/* Rating stars & price row */}
                      <div className="figma-course-card__footer">
                        <div className="figma-course-card__rating">
                          <span className="figma-stars">★★★★★</span>
                          <span className="figma-review-count">({course.reviewsCount})</span>
                        </div>

                        <div className="figma-course-card__price">
                          <strong className="figma-price-current">{course.price}</strong>
                          {course.originalPrice && (
                            <span className="figma-price-strike">{course.originalPrice}</span>
                          )}
                        </div>
                      </div>

                      {/* Card Action Button */}
                      <Button
                        variant={isCompleted ? 'outline' : 'primary'}
                        size="sm"
                        className="figma-card-action-btn"
                        onClick={() => navigate(course.link)}
                      >
                        {isCompleted
                          ? (isVi ? 'Xem lại bài' : 'Review Lessons')
                          : isInProgress
                            ? (isVi ? 'Tiếp tục học' : 'Continue Course')
                            : (isVi ? 'Bắt đầu học' : 'Start Lesson')}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── 5. PAGINATION (Figma Frame 543:687) ── */}
          {filteredCourses.length > 0 && (
            <div className="figma-pagination-row">
              <button
                type="button"
                className="figma-page-arrow"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                &lt;
              </button>
              <button
                type="button"
                className={`figma-page-num ${currentPage === 1 ? 'figma-page-num--active' : ''}`}
                onClick={() => setCurrentPage(1)}
              >
                1
              </button>
              <button
                type="button"
                className={`figma-page-num ${currentPage === 2 ? 'figma-page-num--active' : ''}`}
                onClick={() => setCurrentPage(2)}
              >
                2
              </button>
              <button
                type="button"
                className={`figma-page-num ${currentPage === 3 ? 'figma-page-num--active' : ''}`}
                onClick={() => setCurrentPage(3)}
              >
                3
              </button>
              <button
                type="button"
                className={`figma-page-num ${currentPage === 4 ? 'figma-page-num--active' : ''}`}
                onClick={() => setCurrentPage(4)}
              >
                4
              </button>
              <button
                type="button"
                className={`figma-page-num ${currentPage === 5 ? 'figma-page-num--active' : ''}`}
                onClick={() => setCurrentPage(5)}
              >
                5
              </button>
              <span className="figma-page-ellipsis">…</span>
              <button
                type="button"
                className={`figma-page-num ${currentPage === 98 ? 'figma-page-num--active' : ''}`}
                onClick={() => setCurrentPage(98)}
              >
                98
              </button>
              <button
                type="button"
                className="figma-page-arrow"
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 6. BOTTOM DISCOUNT CTA BANNER (Figma Frame 543:687) ── */}
      <section className="figma-newsletter-banner">
        <div className="figma-newsletter-banner__left">
          <h2 className="figma-newsletter-banner__title">
            {isVi ? 'Tham gia và nhận ưu đãi đặc biệt' : 'Join and get amazing discount'}
          </h2>
          <p className="figma-newsletter-banner__subtitle">
            {isVi
              ? 'Tận hưởng khoá học với giao diện tối ưu trên mọi thiết bị di động & máy tính.'
              : 'With our responsive themes and mobile and desktop apps.'}
          </p>
        </div>

        <form
          className="figma-newsletter-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (newsletterEmail.trim()) setNewsletterSubscribed(true)
          }}
        >
          {newsletterSubscribed ? (
            <div className="figma-newsletter-thanks">
              <span className="material-symbols-outlined">check_circle</span>
              <span>{isVi ? 'Đã đăng ký thành công!' : 'Subscribed successfully!'}</span>
            </div>
          ) : (
            <div className="figma-newsletter-input-group">
              <input
                type="email"
                placeholder={isVi ? 'Nhập email của bạn' : 'Email Address'}
                className="figma-newsletter-input"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
              />
              <button type="submit" className="figma-newsletter-btn">
                {isVi ? 'Đăng ký' : 'Subscribe'}
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  )
}
