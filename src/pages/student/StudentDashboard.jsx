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
  const [dueSrsCount, setDueSrsCount] = useState(0)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [overviewRes, goalRes, essaysRes, sessionRes, dueRes] = await Promise.allSettled([
          api.get('/progress/overview'),
          api.get('/goals'),
          api.get('/essays'),
          api.get('/sessions/current'),
          api.get('/vocabulary/due-today')
        ])

        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data)
        if (goalRes.status === 'fulfilled') setWeeklyGoal(goalRes.value.data)
        if (essaysRes.status === 'fulfilled') setRecentEssays(essaysRes.value.data?.slice(0, 5) || [])
        if (sessionRes.status === 'fulfilled') setCurrentSession(sessionRes.value.data)
        if (dueRes.status === 'fulfilled') setDueSrsCount(dueRes.value.count || dueRes.value.data?.length || 0)
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

  const wordsPercentage = wordsGoal && wordsGoal.target > 0 ? Math.min(100, Math.round((wordsGoal.current / wordsGoal.target) * 100)) : 0
  const lengthPercentage = lengthGoal && lengthGoal.target > 0 ? Math.min(100, Math.round((lengthGoal.current / lengthGoal.target) * 100)) : 0
  const complexityPercentage = complexityGoal && complexityGoal.target > 0 ? Math.min(100, Math.round((complexityGoal.current / complexityGoal.target) * 100)) : 0

  return (
    <div className="student-dash animate-fade-in">
      {/* ── 1. Hero Action Banner: Today's 10-min Session ── */}
      <section className="student-dash__hero">
        <div className="student-dash__hero-content">
          <div className="student-dash__hero-badge">
            <span className="material-symbols-outlined">schedule</span>
            Today's Micro-Session · 10 Mins
          </div>
          <h2 className="student-dash__hero-title">
            Learn & Apply 3 Target Words: <span className="student-dash__hero-words">routine · commute · grocery</span>
          </h2>
          <p className="student-dash__hero-desc">
            Topic: <strong>Daily Life (A2)</strong> — Explore in context, take quick quizzes, and write a 60–100 word paragraph for instant AI feedback.
          </p>

          <div className="student-dash__hero-actions">
            <button
              className="btn-primary student-dash__hero-btn"
              onClick={() => navigate('/student/writing?set=daily-life')}
            >
              <span className="material-symbols-outlined">play_circle</span>
              {currentSession ? 'Resume Active Session' : 'Start Session Now (10 mins)'}
            </button>

            <Link to="/student/explore" className="btn-secondary">
              <span className="material-symbols-outlined">explore</span>
              Explore other topics
            </Link>
          </div>
        </div>

        <div className="student-dash__hero-art">
          <div className="student-dash__streak-pill">
            <span className="material-symbols-outlined student-dash__streak-icon">local_fire_department</span>
            <div>
              <div className="student-dash__streak-count">{user?.streakDays || 0} day streak</div>
              <div className="student-dash__streak-sub">Daily goal achieved</div>
            </div>
          </div>

          {dueSrsCount > 0 && (
            <div className="student-dash__srs-pill" onClick={() => navigate('/student/vocabulary/review')}>
              <span className="material-symbols-outlined">style</span>
              <div>
                <div className="student-dash__srs-count">{dueSrsCount} words due for SRS review</div>
                <div className="student-dash__srs-sub">Tap to flip flashcards</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. Stat Cards Overview ── */}
      <section className="student-dash__stats">
        <StatCard
          label="Essays Submitted"
          value={overview?.totalEssays || 0}
          icon="description"
        />
        <StatCard
          label="Vocab Growth"
          value={`+${overview?.thisMonthWords || 0}`}
          subtitle={`${overview?.growthRate >= 0 ? '+' : ''}${overview?.growthRate || 0}% vs last month`}
          icon="trending_up"
        />
        <StatCard
          label="Lexical Diversity (TTR)"
          value={overview?.avgTTR ? overview.avgTTR.toFixed(2) : '0.00'}
          icon="analytics"
          progress={Math.round((overview?.avgTTR || 0) * 100)}
        />
        <StatCard
          label="Estimated CEFR"
          value={<>{overview?.rank || 'A1'}</>}
          subtitle="Based on active writing"
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
              <h3 className="text-title-lg">Weekly Goals</h3>
              <Link to="/student/goals" className="text-label-md" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                Settings
              </Link>
            </div>
            <div className="student-dash__goals-list">
              <CircularProgress
                percentage={wordsPercentage}
                color="primary"
                label="New Words Acquired"
                sublabel={`${wordsGoal?.current || 12} / ${wordsGoal?.target || 20} words`}
              />
              <CircularProgress
                percentage={lengthPercentage}
                color="secondary"
                label="Writing Volume"
                sublabel={`${lengthGoal?.current || 650} / ${lengthGoal?.target || 1000} words`}
              />
              <CircularProgress
                percentage={complexityPercentage}
                color="tertiary"
                label="Target Level"
                sublabel={`Level: ${overview?.rank || 'B1'}`}
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
              Vocabulary Garden
            </div>
            <h3 className="text-title-lg">Growing Knowledge Tree</h3>
            <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>
              You have 8 words Mastered and 14 words reinforcing via SRS. Track your garden growth.
            </p>
            <span className="student-dash__garden-link">
              Explore Growth Garden <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </div>

        {/* Recent Essays */}
        <div className="student-dash__recent-essays card-base">
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <h3 className="text-title-lg">Recent Writing</h3>
            <Link to="/student/essays" className="text-label-md" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
              All Essays
            </Link>
          </div>

          {recentEssays.length === 0 ? (
            <div className="student-dash__essays-empty">
              <span className="material-symbols-outlined">edit_note</span>
              <p>No essays yet. Start your first writing exercise!</p>
              <button className="btn-primary" onClick={() => navigate('/student/writing?set=daily-life')}>
                Write Paragraph Now
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
                      <h4 className="student-dash__essay-title">{essay.title || 'Vocabulary Practice Essay'}</h4>
                      <span className="student-dash__essay-date">
                        {new Date(essay.createdAt).toLocaleDateString('en-US')} · {essay.wordCount || 85} words
                      </span>
                    </div>
                  </div>
                  <span className={`student-dash__essay-status student-dash__essay-status--${essay.status || 'evaluated'}`}>
                    {essay.status === 'evaluated' ? 'AI Evaluated' : 'Draft'}
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
