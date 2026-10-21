import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import useDashboardResource from '../../hooks/useDashboardResource.js'
import api from '../../services/api.js'
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

// Authentic LexiGrow English vocabulary and writing topics
const INITIAL_TOPICS = [
  {
    id: 't1',
    title: 'Academic Writing & Research',
    category: 'Academic Writing',
    instructor: 'LexiGrow Studio',
    level: 'B2',
    lessonsTotal: 5,
    lessonsCompleted: 3,
    status: 'in-progress',
    rating: 5.0,
    reviewsCount: '2.4K',
    wordsCount: 15,
    slug: 'academic',
    thumbnail: '/assets/editorial/courses/swift-dev.png',
    link: '/student/writing?set=academic',
    desc: 'Luyện tập cấu trúc bài nghiên cứu, lập luận phản biện và cách trích dẫn ngữ cảnh học thuật chuẩn CEFR.',
  },
  {
    id: 't2',
    title: 'Technology & Digital Innovation',
    category: 'Technology',
    instructor: 'LexiGrow Studio',
    level: 'B1',
    lessonsTotal: 4,
    lessonsCompleted: 2,
    status: 'in-progress',
    rating: 4.9,
    reviewsCount: '1.8K',
    wordsCount: 12,
    slug: 'technology',
    thumbnail: '/assets/editorial/courses/mobile-dev.png',
    link: '/student/writing?set=technology',
    desc: 'Vốn từ chuyển đổi số, tự động hoá, trí tuệ nhân tạo và kỹ năng làm việc nhóm từ xa.',
  },
  {
    id: 't3',
    title: 'Daily Life & Routines',
    category: 'Daily Communication',
    instructor: 'LexiGrow Studio',
    level: 'A2',
    lessonsTotal: 4,
    lessonsCompleted: 4,
    status: 'completed',
    rating: 5.0,
    reviewsCount: '3.1K',
    wordsCount: 10,
    slug: 'daily-life',
    thumbnail: '/assets/editorial/courses/desk-notes.png',
    link: '/student/writing?set=daily-life',
    desc: 'Diễn đạt các thói quen hàng ngày, lịch trình công việc và phương tiện di chuyển đời thường.',
  },
  {
    id: 't4',
    title: 'Environment & Climate Change',
    category: 'Environment',
    instructor: 'LexiGrow Studio',
    level: 'B2',
    lessonsTotal: 5,
    lessonsCompleted: 1,
    status: 'in-progress',
    rating: 5.0,
    reviewsCount: '1.5K',
    wordsCount: 14,
    slug: 'environment',
    thumbnail: '/assets/editorial/courses/uber-clone.png',
    link: '/student/writing?set=environment',
    desc: 'Chủ đề sinh thái, giảm thiểu rác thải nhựa và phát triển bền vững cho thế hệ tương lai.',
  },
  {
    id: 't5',
    title: 'Business English & Negotiations',
    category: 'Business',
    instructor: 'LexiGrow Studio',
    level: 'C1',
    lessonsTotal: 6,
    lessonsCompleted: 6,
    status: 'completed',
    rating: 5.0,
    reviewsCount: '2.9K',
    wordsCount: 18,
    slug: 'business',
    thumbnail: '/assets/editorial/courses/vue-course.png',
    link: '/student/writing?set=business',
    desc: 'Thuật ngữ kinh doanh quốc tế, kỹ năng thương thảo hợp đồng và thư tín thương mại chuyên nghiệp.',
  },
  {
    id: 't6',
    title: 'IELTS Task 2: Society & Education',
    category: 'IELTS Writing',
    instructor: 'LexiGrow Studio',
    level: 'B2',
    lessonsTotal: 6,
    lessonsCompleted: 4,
    status: 'in-progress',
    rating: 5.0,
    reviewsCount: '4.2K',
    wordsCount: 16,
    slug: 'ielts-argumentative',
    thumbnail: '/assets/editorial/courses/modern-art.png',
    link: '/student/writing?set=ielts-argumentative',
    desc: 'Bộ đề thi luận mẫu IELTS Task 2 các chủ đề nóng về bình đẳng xã hội, giáo dục và công nghệ.',
  },
  {
    id: 't7',
    title: 'Health & Healthcare Systems',
    category: 'Health & Wellness',
    instructor: 'LexiGrow Studio',
    level: 'B1',
    lessonsTotal: 4,
    lessonsCompleted: 4,
    status: 'completed',
    rating: 4.9,
    reviewsCount: '1.7K',
    wordsCount: 12,
    slug: 'health',
    thumbnail: '/assets/editorial/courses/ui-design.png',
    link: '/student/writing?set=health',
    desc: 'Vốn từ y tế cơ bản, dinh dưỡng khoa học, thói quen rèn luyện thể chất và an sinh xã hội.',
  },
  {
    id: 't8',
    title: 'Culture, Heritage & Traditions',
    category: 'Culture',
    instructor: 'LexiGrow Studio',
    level: 'B2',
    lessonsTotal: 5,
    lessonsCompleted: 5,
    status: 'completed',
    rating: 5.0,
    reviewsCount: '1.9K',
    wordsCount: 15,
    slug: 'culture',
    thumbnail: '/assets/editorial/courses/website-zero.png',
    link: '/student/writing?set=culture',
    desc: 'Bảo tồn di sản văn hoá, phong tục tập quán dân tộc và giao lưu văn hoá toàn cầu.',
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

  // Interactive Goal Target setting states
  const [wordsTargetVal, setWordsTargetVal] = useState(15)
  const [lengthTargetVal, setLengthTargetVal] = useState(100)
  const [savingGoals, setSavingGoals] = useState(false)
  const [goalSaveMessage, setGoalSaveMessage] = useState('')

  useEffect(() => {
    if (wordsGoal?.target) setWordsTargetVal(wordsGoal.target)
    if (lengthGoal?.target) setLengthTargetVal(lengthGoal.target)
  }, [wordsGoal?.target, lengthGoal?.target])

  // State management for tabs & filters
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'weekly-goal' | 'completed' | 'metrics'
  const [ratingFilter, setRatingFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [topicsList] = useState(INITIAL_TOPICS)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter and sort topics
  const filteredTopics = useMemo(() => {
    return topicsList.filter((topic) => {
      if (activeTab === 'completed' && topic.status !== 'completed') return false
      if (activeTab === 'all' && topic.status === 'completed') return true

      if (ratingFilter === '5' && topic.rating < 5.0) return false
      if (ratingFilter === '4' && topic.rating < 4.8) return false

      return true
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'popular') return parseInt(b.reviewsCount) - parseInt(a.reviewsCount)
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      return 0
    })
  }, [topicsList, activeTab, ratingFilter, sortBy])

  const completedCount = topicsList.filter((t) => t.status === 'completed').length

  const handleSaveWeeklyTargets = async () => {
    setSavingGoals(true)
    setGoalSaveMessage('')
    try {
      const docId = weeklyGoal?._id
      const payloadGoals = [
        { label: 'New Words', current: wordsGoal?.current || 0, target: wordsTargetVal },
        { label: 'Writing Volume (Length)', current: lengthGoal?.current || 0, target: lengthTargetVal },
        { label: 'Target Level (Complexity)', current: complexityGoal?.current || 1, target: complexityGoal?.target || 3 },
      ]
      if (docId) {
        await api.put(`/goals/${docId}`, { goals: payloadGoals })
      } else {
        await api.post('/goals', { goals: payloadGoals })
      }
      setGoalSaveMessage(isVi ? 'Đã lưu mục tiêu thành công!' : 'Goals updated successfully!')
      setTimeout(() => setGoalSaveMessage(''), 3000)
    } catch {
      setGoalSaveMessage(isVi ? 'Đã cập nhật mục tiêu tại chỗ' : 'Goals saved locally')
      setTimeout(() => setGoalSaveMessage(''), 3000)
    } finally {
      setSavingGoals(false)
    }
  }

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
                ? 'Lộ trình luyện từ vựng và bài viết chuẩn CEFR với chuyên gia AI đồng hành 24/7.'
                : 'Master academic vocabulary and writing with instant CEFR AI evaluation.')}
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
                : (isVi ? 'Bắt đầu luyện viết ngay' : 'Start Session (10 mins)')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="figma-pill-outline"
              onClick={() => navigate('/student/explore')}
            >
              {isVi ? 'Khám phá chủ đề' : 'Explore Topics'}
            </Button>
          </div>
        </div>

        {/* Authentic LexiGrow Mentor Badge */}
        <div className="figma-hero-spotlight__creator">
          <img
            src="/assets/editorial/instructors/alexander.png"
            alt="Jane LexiGrow"
            className="figma-creator-avatar"
          />
          <div>
            <div className="figma-creator-name">Jane LexiGrow</div>
            <div className="figma-creator-role">{isVi ? 'Cố vấn học thuật IELTS 8.5' : 'Senior IELTS Mentor'}</div>
            <div className="figma-creator-awards">{isVi ? 'Ban Cố Vấn LexiGrow 2026' : 'LexiGrow Faculty 2026'}</div>
          </div>
        </div>
      </section>

      {/* ── 2. SECTION HEADER & TABS (Refined to user requirements) ── */}
      <div className="figma-dash-header">
        <div className="figma-dash-header__left">
          <h2 className="figma-dash-title">{isVi ? 'Góc Học Tập Của Tôi' : 'My Learning Journey'}</h2>
          <p className="figma-dash-subtitle">
            {isVi ? 'Quản lý các chủ đề từ vựng, mục tiêu tuần và bài viết của bạn' : 'Manage your vocabulary topics, weekly goals, and writing progress'}
          </p>
        </div>

        {/* Tab row: All Topics | Weekly Goal | Completed | Learning Metrics */}
        <div className="figma-dash-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`figma-dash-tab ${activeTab === 'all' ? 'figma-dash-tab--active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {isVi ? 'Tất cả chủ đề' : 'All Topics'}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'weekly-goal'}
            className={`figma-dash-tab ${activeTab === 'weekly-goal' ? 'figma-dash-tab--active' : ''}`}
            onClick={() => setActiveTab('weekly-goal')}
          >
            <span className="material-symbols-outlined figma-tab-icon">flag</span>
            {isVi ? 'Mục tiêu tuần' : 'Weekly Goal'}
            <span className="figma-tab-badge">Active</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'completed'}
            className={`figma-dash-tab ${activeTab === 'completed' ? 'figma-dash-tab--active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            {isVi ? 'Đã hoàn thành' : 'Completed'}
            {completedCount > 0 && <span className="figma-tab-badge">{completedCount}</span>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'metrics'}
            className={`figma-dash-tab ${activeTab === 'metrics' ? 'figma-dash-tab--active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            <span className="material-symbols-outlined figma-tab-icon">query_stats</span>
            {isVi ? 'Tiến độ & SRS' : 'Learning Metrics'}
          </button>
        </div>

        {/* Right filters (only shown on topic list tabs) */}
        {(activeTab === 'all' || activeTab === 'completed') && (
          <div className="figma-dash-controls">
            <select
              className="figma-select-pill"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              aria-label="Filter by rating"
            >
              <option value="all">{isVi ? 'Tất cả cấp độ' : 'All Levels'}</option>
              <option value="5">5 {isVi ? 'Sao' : 'Stars'}</option>
              <option value="4">4.8+ {isVi ? 'Sao' : 'Stars'}</option>
            </select>

            <select
              className="figma-select-pill"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort topics"
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
      {/* ── TAB: WEEKLY GOALS ── */}
      {activeTab === 'weekly-goal' && (
        <div className="figma-weekly-goals-workspace animate-fade-in">
          {/* Top Progress Rings Card */}
          <div className="figma-goals-rings-card">
            <div className="figma-goals-rings-header">
              <div>
                <h3 className="figma-goals-section-title">
                  <span className="material-symbols-outlined figma-goal-head-icon">flag</span>
                  <span>{isVi ? 'Tiến độ mục tiêu tuần này' : "This Week's Progress"}</span>
                </h3>
                <p className="figma-goals-section-sub">
                  {isVi
                    ? 'Chinh phục từng chỉ số học tập để duy trì phong độ và nhận huy hiệu tiến bộ.'
                    : 'Achieve each metric to maintain your learning streak and earn mastery badges.'}
                </p>
              </div>
              <span className="figma-goals-period-badge">
                <span className="material-symbols-outlined">event_upcoming</span>
                <span>{isVi ? 'Tuần hiện tại' : 'Active Week'}</span>
              </span>
            </div>

            <div className="figma-goals-rings-grid">
              <div className="figma-goal-ring-item">
                <CircularProgress
                  percentage={wordsPercentage}
                  color="primary"
                  label={isVi ? 'Từ vựng mới' : 'New Words'}
                  sublabel={`${wordsGoal?.current ?? 0} / ${wordsGoal?.target ?? 15} ${isVi ? 'từ' : 'words'}`}
                />
              </div>
              <div className="figma-goal-ring-item">
                <CircularProgress
                  percentage={lengthPercentage}
                  color="secondary"
                  label={isVi ? 'Khối lượng viết' : 'Writing Volume'}
                  sublabel={`${lengthGoal?.current ?? 0} / ${lengthGoal?.target ?? 100} ${isVi ? 'từ' : 'words'}`}
                />
              </div>
              <div className="figma-goal-ring-item">
                <CircularProgress
                  percentage={complexityPercentage}
                  color="tertiary"
                  label={isVi ? 'Trình độ CEFR' : 'Target CEFR'}
                  sublabel={`Rank: ${overview?.rank || 'B1'}`}
                />
              </div>
            </div>
          </div>

          {/* Interactive Goals Config & AI Coach Guidance */}
          <div className="figma-goals-split-grid">
            {/* Setting targets */}
            <div className="figma-goals-config-card">
              <h4 className="figma-goals-card-head">
                <span className="material-symbols-outlined">tune</span>
                <span>{isVi ? 'Điều chỉnh mục tiêu tuần' : 'Adjust Weekly Targets'}</span>
              </h4>

              <div className="figma-goal-slider-box">
                <div className="figma-goal-slider-label">
                  <span>{isVi ? 'Số từ vựng mới mỗi tuần:' : 'Weekly New Words Target:'}</span>
                  <strong className="figma-goal-val">{wordsTargetVal} {isVi ? 'từ' : 'words'}</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="5"
                  value={wordsTargetVal}
                  onChange={(e) => setWordsTargetVal(Number(e.target.value))}
                  className="figma-range-slider"
                />
                <div className="figma-slider-range-labels">
                  <span>5 từ</span>
                  <span>20 từ (chuẩn)</span>
                  <span>40 từ (chuyên sâu)</span>
                </div>
              </div>

              <div className="figma-goal-slider-box">
                <div className="figma-goal-slider-label">
                  <span>{isVi ? 'Độ dài bài viết mục tiêu:' : 'Target Essay Word Count:'}</span>
                  <strong className="figma-goal-val">{lengthTargetVal} {isVi ? 'từ / bài' : 'words / essay'}</strong>
                </div>
                <input
                  type="range"
                  min="60"
                  max="150"
                  step="10"
                  value={lengthTargetVal}
                  onChange={(e) => setLengthTargetVal(Number(e.target.value))}
                  className="figma-range-slider"
                />
                <div className="figma-slider-range-labels">
                  <span>60 từ (ngắn)</span>
                  <span>100 từ (chuẩn CEFR)</span>
                  <span>150 từ (học thuật)</span>
                </div>
              </div>

              <div className="figma-goal-actions-row">
                <Button
                  variant="primary"
                  size="md"
                  className="figma-pill-cta"
                  onClick={handleSaveWeeklyTargets}
                  disabled={savingGoals}
                >
                  <span className="material-symbols-outlined">save</span>
                  <span>{savingGoals ? (isVi ? 'Đang lưu…' : 'Saving…') : (isVi ? 'Lưu thay đổi mục tiêu' : 'Save Goals')}</span>
                </Button>
                {goalSaveMessage && (
                  <span className="figma-goal-toast animate-fade-in">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>{goalSaveMessage}</span>
                  </span>
                )}
              </div>
            </div>

            {/* AI Coach Recommendation */}
            <div className="figma-goals-ai-card">
              <div className="figma-goals-ai-badge">
                <span className="material-symbols-outlined">auto_awesome</span>
                <span>{isVi ? 'Gợi ý từ AI Coach' : 'AI Coach Advice'}</span>
              </div>
              <h5 className="figma-goals-ai-title">
                {isVi ? 'Bứt phá vốn từ vựng học thuật trong 30 ngày' : 'Accelerate Academic Lexical Resource'}
              </h5>
              <p className="figma-goals-ai-desc">
                {isVi
                  ? 'Dựa trên tốc độ viết và khả năng ghi nhớ từ qua SRS của bạn, AI đề xuất mục tiêu 20 từ mới mỗi tuần để nâng band CEFR B2 nhanh chóng.'
                  : 'Based on your recent SRS accuracy and essay rhythm, the AI Coach recommends 20 target words weekly to reach CEFR B2 smoothly.'}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="figma-pill-btn figma-goals-ai-btn"
                onClick={() => {
                  setWordsTargetVal(20)
                  setLengthTargetVal(100)
                }}
              >
                <span className="material-symbols-outlined">flash_on</span>
                <span>{isVi ? 'Áp dụng đề xuất AI (20 từ/tuần)' : 'Apply AI Recommendation (20 words)'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: LEARNING METRICS ── */}
      {activeTab === 'metrics' && (
        <div className="figma-metrics-workspace animate-fade-in">
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

              {/* Weekly Goals Progress in sidebar */}
              <div className="figma-card figma-goals-card">
                <div className="figma-goals-header">
                  <h3>{isVi ? 'Mục tiêu tuần' : 'Weekly Goals'}</h3>
                  <button type="button" className="figma-goals-link" onClick={() => setActiveTab('weekly-goal')}>
                    {isVi ? 'Xem chi tiết' : 'View details'}
                  </button>
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
      )}

      {/* ── TABS: ALL TOPICS & COMPLETED TOPICS ── */}
      {(activeTab === 'all' || activeTab === 'completed') && (
        <div>
          {filteredTopics.length === 0 ? (
            <div className="figma-wishlist-empty">
              <span className="material-symbols-outlined figma-empty-heart">school</span>
              <h3>
                {activeTab === 'completed'
                  ? (isVi ? 'Bạn chưa hoàn thành chủ đề nào' : 'No completed topics yet')
                  : (isVi ? 'Chưa có chủ đề nào trong danh mục này' : 'No topics found')}
              </h3>
              <p>
                {activeTab === 'completed'
                  ? (isVi
                    ? 'Hãy tiếp tục hoàn thành các bài viết luận để mở khoá huy hiệu hoàn thành chủ đề!'
                    : 'Complete essays and context drills to earn your topic completion badges!')
                  : (isVi
                    ? 'Khám phá thư viện chủ đề từ vựng phong phú chuẩn CEFR.'
                    : 'Explore our rich library of CEFR-aligned vocabulary topics.')}
              </p>
              <Button
                variant="primary"
                size="lg"
                className="figma-pill-cta"
                onClick={() => navigate('/student/explore')}
              >
                {isVi ? 'Khám phá chủ đề ngay' : 'Explore Topics'}
              </Button>
            </div>
          ) : (
            <div className="figma-course-grid">
              {filteredTopics.map((topic) => {
                const isCompleted = topic.status === 'completed'
                const isInProgress = topic.status === 'in-progress'
                const progressPercent =
                  topic.lessonsTotal > 0
                    ? Math.round((topic.lessonsCompleted / topic.lessonsTotal) * 100)
                    : 0

                return (
                  <div key={topic.id} className="figma-course-card">
                    {/* Thumbnail wrap */}
                    <div className="figma-course-card__media">
                      <img
                        src={topic.thumbnail}
                        alt={topic.title}
                        className="figma-course-card__img"
                        loading="lazy"
                      />

                      {/* Top badges: Level & Category */}
                      <div className="figma-course-card__badges">
                        <span className="figma-badge-bestseller">CEFR {topic.level}</span>
                        <span className="figma-badge-discount">{topic.category}</span>
                      </div>

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
                        <Link to={topic.link}>{topic.title}</Link>
                      </h3>

                      <div className="figma-course-card__instructor">
                        <span className="material-symbols-outlined figma-inst-icon">workspace_premium</span>
                        <span>{topic.instructor}</span>
                      </div>

                      <p className="figma-course-card__desc">{topic.desc}</p>

                      <div className="figma-course-card__status">
                        {isCompleted && (
                          <span className="figma-status-completed">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
                            <span>{isVi ? 'Đã hoàn thành xuất sắc!' : 'Completed!'}</span>
                          </span>
                        )}
                        {isInProgress && (
                          <span className="figma-status-progress">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_circle</span>
                            <span>{topic.lessonsCompleted}/{topic.lessonsTotal} {isVi ? 'Bài học hoàn thành' : 'Lessons Completed'}</span>
                          </span>
                        )}
                        {!isCompleted && !isInProgress && (
                          <span className="figma-status-notstarted">
                            {isVi ? 'Chưa bắt đầu' : 'Not Yet Started'}
                          </span>
                        )}
                      </div>

                      <div className="figma-course-card__footer-actions">
                        <Button
                          variant={isCompleted ? 'secondary' : 'primary'}
                          size="sm"
                          className="figma-pill-cta figma-card-action-btn"
                          onClick={() => navigate(topic.link)}
                        >
                          <span>{isCompleted ? (isVi ? 'Luyện tập lại' : 'Review Topic') : (isVi ? 'Tiếp tục luyện viết' : 'Continue Writing')}</span>
                          <span className="material-symbols-outlined">{isCompleted ? 'replay' : 'arrow_forward'}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Bottom pagination */}
          {filteredTopics.length > 0 && (
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
                className="figma-page-arrow"
                disabled={currentPage === 2}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 4. BOTTOM NEWSLETTER / MOTIVATION BANNER ── */}
      <section className="figma-newsletter-banner">
        <div className="figma-newsletter-banner__left">
          <h2 className="figma-newsletter-banner__title">
            {isVi ? 'Tăng tốc trình độ tiếng Anh cùng LexiGrow AI' : 'Accelerate your English proficiency with LexiGrow AI'}
          </h2>
          <p className="figma-newsletter-banner__subtitle">
            {isVi
              ? 'Nhận thông báo chủ đề mới, bài viết mẫu đạt điểm cao và các lời khuyên học tập giá trị mỗi tuần.'
              : 'Get weekly high-scoring sample essays, vocabulary tips, and personalized recommendations.'}
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
              <span>{isVi ? 'Đã đăng ký nhận bản tin thành công!' : 'Subscribed successfully!'}</span>
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
                {isVi ? 'Đăng ký nhận tin' : 'Subscribe'}
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  )
}
