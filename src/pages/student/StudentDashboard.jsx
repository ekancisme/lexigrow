import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import api from '../../services/api.js'
import StatCard from '../../components/common/StatCard'
import CircularProgress from '../../components/common/CircularProgress'
import VocabGrowthChart from '../../components/charts/VocabGrowthChart'
import './StudentDashboard.css'

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [weeklyGoal, setWeeklyGoal] = useState(null)
  const [recentEssays, setRecentEssays] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [dueSrsCount, setDueSrsCount] = useState(3)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [overviewRes, goalRes, essaysRes, sessionRes, dueRes] = await Promise.allSettled([
          api.get('/progress/overview'),
          api.get('/goals'),
          api.get('/essays'),
          api.get('/sessions/current'),
          api.get('/srs/due')
        ])

        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data)
        if (goalRes.status === 'fulfilled') setWeeklyGoal(goalRes.value.data)
        if (essaysRes.status === 'fulfilled') setRecentEssays(essaysRes.value.data?.slice(0, 5) || [])
        if (sessionRes.status === 'fulfilled') setCurrentSession(sessionRes.value.data)
        if (dueRes.status === 'fulfilled') setDueSrsCount(dueRes.value.data?.length || 0)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="student-dash student-dash--loading">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  const wordsGoal = weeklyGoal?.goals?.find(g => g.label === 'New Words')
  const lengthGoal = weeklyGoal?.goals?.find(g => g.label?.includes('Length'))
  const complexityGoal = weeklyGoal?.goals?.find(g => g.label?.includes('Complexity'))

  const wordsPercentage = wordsGoal ? Math.min(100, Math.round((wordsGoal.current / wordsGoal.target) * 100)) : 40
  const lengthPercentage = lengthGoal ? Math.min(100, Math.round((lengthGoal.current / lengthGoal.target) * 100)) : 65
  const complexityPercentage = complexityGoal ? Math.min(100, Math.round((complexityGoal.current / complexityGoal.target) * 100)) : 80

  return (
    <div className="student-dash animate-fade-in">
      {/* ── 1. Hero Action Banner: Today's 10-min Session ── */}
      <section className="student-dash__hero card-base">
        <div className="student-dash__hero-content">
          <div className="student-dash__hero-badge">
            <span className="material-symbols-outlined">schedule</span>
            Phiên học vi mô hôm nay · 10 phút
          </div>
          <h2 className="student-dash__hero-title">
            Học & Vận dụng 3 từ mới: <span className="student-dash__hero-words">routine · commute · grocery</span>
          </h2>
          <p className="student-dash__hero-desc">
            Chủ đề <strong>Daily Life (A2)</strong> — Khám phá ngữ cảnh, làm trắc nghiệm nhanh và viết một đoạn văn 60–100 từ để AI nhận xét.
          </p>

          <div className="student-dash__hero-actions">
            <button
              className="btn-primary student-dash__hero-btn"
              onClick={() => navigate('/student/writing?set=daily-life')}
            >
              <span className="material-symbols-outlined">play_circle</span>
              {currentSession ? 'Tiếp tục phiên đang học' : 'Bắt đầu phiên học ngay (10 phút)'}
            </button>

            <Link to="/student/explore" className="btn-secondary">
              <span className="material-symbols-outlined">explore</span>
              Đổi chủ đề khác
            </Link>
          </div>
        </div>

        <div className="student-dash__hero-art">
          <div className="student-dash__streak-pill">
            <span className="material-symbols-outlined student-dash__streak-icon">local_fire_department</span>
            <div>
              <div className="student-dash__streak-count">{user?.streakDays || 4} ngày liên tiếp</div>
              <div className="student-dash__streak-sub">Đạt mục tiêu ngày</div>
            </div>
          </div>

          {dueSrsCount > 0 && (
            <div className="student-dash__srs-pill" onClick={() => navigate('/student/vocabulary/review')}>
              <span className="material-symbols-outlined">style</span>
              <div>
                <div className="student-dash__srs-count">{dueSrsCount} từ đến hạn ôn SRS</div>
                <div className="student-dash__srs-sub">Chạm để lật Flashcard</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. Stat Cards Overview ── */}
      <section className="student-dash__stats">
        <StatCard
          label="Bài viết đã nộp"
          value={overview?.totalEssays || 6}
          icon="description"
        />
        <StatCard
          label="Từ vựng tăng trưởng"
          value={`+${overview?.thisMonthWords || 18}`}
          subtitle={`${overview?.growthRate >= 0 ? '+' : ''}${overview?.growthRate || 15}% so với tháng trước`}
          icon="trending_up"
        />
        <StatCard
          label="Chỉ số đa dạng (TTR)"
          value={overview?.avgTTR ? overview.avgTTR.toFixed(2) : '0.72'}
          icon="analytics"
          progress={Math.round((overview?.avgTTR || 0.72) * 100)}
        />
        <StatCard
          label="Trình độ từ vựng"
          value={<>{overview?.rank || 'B1'}</>}
          subtitle="Khung CEFR ước tính"
          icon="equalizer"
        />
      </section>

      {/* ── 3. Charts & Weekly Goals ── */}
      <section className="student-dash__charts">
        <div className="student-dash__chart-main">
          <VocabGrowthChart />
        </div>

        <div className="student-dash__side-cards">
          <div className="student-dash__goals card-base">
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <h3 className="text-title-lg">Mục tiêu tuần</h3>
              <Link to="/student/goals" className="text-label-md" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                Cài đặt
              </Link>
            </div>
            <div className="student-dash__goals-list">
              <CircularProgress
                percentage={wordsPercentage}
                color="primary"
                label="Từ mới tích lũy"
                sublabel={`${wordsGoal?.current || 12} / ${wordsGoal?.target || 20} từ`}
              />
              <CircularProgress
                percentage={lengthPercentage}
                color="secondary"
                label="Độ dài bài viết"
                sublabel={`${lengthGoal?.current || 650} / ${lengthGoal?.target || 1000} từ`}
              />
              <CircularProgress
                percentage={complexityPercentage}
                color="tertiary"
                label="Hạng mục tiêu"
                sublabel={`Bậc: ${overview?.rank || 'B1'}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Quick Actions & Recent Writing ── */}
      <section className="student-dash__bottom-grid">
        {/* Growth Garden Teaser */}
        <div className="student-dash__garden-teaser card-base" onClick={() => navigate('/student/progress')}>
          <div className="student-dash__garden-info">
            <div className="student-dash__garden-badge">
              <span className="material-symbols-outlined">yard</span>
              Khu vườn từ vựng
            </div>
            <h3 className="text-title-lg">Cây tri thức đang phát triển</h3>
            <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>
              Bạn có 8 từ ở trạng thái Mastered và 14 từ đang ghi nhớ qua SRS. Xem sự phát triển khu vườn của bạn.
            </p>
            <span className="student-dash__garden-link">
              Khám phá khu vườn <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </div>

        {/* Recent Essays */}
        <div className="student-dash__recent-essays card-base">
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <h3 className="text-title-lg">Bài viết gần đây</h3>
            <Link to="/student/essays" className="text-label-md" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
              Tất cả bài viết
            </Link>
          </div>

          {recentEssays.length === 0 ? (
            <div className="student-dash__essays-empty">
              <span className="material-symbols-outlined">edit_note</span>
              <p>Chưa có bài viết nào. Hãy bắt đầu bài viết đầu tiên!</p>
              <button className="btn-primary" onClick={() => navigate('/student/writing?set=daily-life')}>
                Viết đoạn văn ngay
              </button>
            </div>
          ) : (
            <div className="student-dash__essays-list">
              {recentEssays.map(essay => (
                <div
                  key={essay._id}
                  className="student-dash__essay-item"
                  onClick={() => navigate(`/student/feedback?id=${essay._id}`)}
                >
                  <div className="student-dash__essay-item-left">
                    <span className="material-symbols-outlined student-dash__essay-icon">article</span>
                    <div>
                      <h4 className="student-dash__essay-title">{essay.title || 'Bài viết luyện từ vựng'}</h4>
                      <span className="student-dash__essay-date">
                        {new Date(essay.createdAt).toLocaleDateString('vi-VN')} · {essay.wordCount || 85} từ
                      </span>
                    </div>
                  </div>
                  <span className={`student-dash__essay-status student-dash__essay-status--${essay.status || 'evaluated'}`}>
                    {essay.status === 'evaluated' ? 'Đã AI Đánh giá' : 'Bản nháp'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
