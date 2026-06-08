import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import api from '../../services/api.js'
import StatCard from '../../components/common/StatCard'
import CircularProgress from '../../components/common/CircularProgress'
import VocabGrowthChart from '../../components/charts/VocabGrowthChart'
import './StudentDashboard.css'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [weeklyGoal, setWeeklyGoal] = useState(null)
  const [recentEssays, setRecentEssays] = useState([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, goalRes, essaysRes] = await Promise.all([
          api.get('/progress/overview'),
          api.get('/goals'),
          api.get('/essays'),
        ])
        setOverview(overviewRes.data)
        setWeeklyGoal(goalRes.data)
        // Show only first 5 recent essays
        setRecentEssays(essaysRes.data.slice(0, 5))
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
      <div className="student-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  // Calculate weekly goal percentages
  const wordsGoal = weeklyGoal?.goals.find(g => g.label === 'New Words')
  const lengthGoal = weeklyGoal?.goals.find(g => g.label.includes('Length'))
  const complexityGoal = weeklyGoal?.goals.find(g => g.label.includes('Complexity'))

  const wordsPercentage = wordsGoal ? Math.min(100, Math.round((wordsGoal.current / wordsGoal.target) * 100)) : 0
  const lengthPercentage = lengthGoal ? Math.min(100, Math.round((lengthGoal.current / lengthGoal.target) * 100)) : 0
  const complexityPercentage = complexityGoal ? Math.min(100, Math.round((complexityGoal.current / complexityGoal.target) * 100)) : 0

  return (
    <div className="student-dash">
      {/* Welcome */}
      <section className="student-dash__welcome">
        <h2 className="text-headline-lg">Welcome back, {user?.name || 'Student'}</h2>
        <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>
          Keep track of your writing skills. You have completed {wordsPercentage}% of your weekly vocabulary goal.
        </p>
      </section>

      {/* Stat Cards */}
      <section className="student-dash__stats">
        <StatCard label="Total Essays" value={overview?.totalEssays || 0} icon="description" />
        <StatCard label="New Words" value={`+${overview?.thisMonthWords || 0}`} subtitle={`${overview?.growthRate >= 0 ? '+' : ''}${overview?.growthRate || 0}% vs last month`} icon="trending_up" />
        <StatCard label="TTR Score" value={overview?.avgTTR?.toFixed(2) || '0.00'} icon="analytics" progress={Math.round((overview?.avgTTR || 0) * 100)} />
        <StatCard
          label="Complexity"
          value={<>{overview?.rank || 'A1'}</>}
          subtitle="English Level Rank"
          icon="equalizer"
        />
      </section>

      {/* Charts & Goals */}
      <section className="student-dash__charts">
        <div className="student-dash__chart-main">
          <VocabGrowthChart />
        </div>
        <div className="student-dash__goals card-base">
          <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
            <h3 className="text-title-lg">Weekly Goals</h3>
            <Link to="/student/goals" className="text-label-md" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Set Targets</Link>
          </div>
          <div className="student-dash__goals-list">
            <CircularProgress percentage={wordsPercentage} color="primary" label="New Words" sublabel={`${wordsGoal?.current || 0} of ${wordsGoal?.target || 20} target`} />
            <CircularProgress percentage={lengthPercentage} color="secondary" label="Writing Length" sublabel={`${lengthGoal?.current || 0} of ${lengthGoal?.target || 5000} words`} />
            <CircularProgress percentage={complexityPercentage} color="tertiary" label="Complexity Rank" sublabel={`Tier: ${overview?.rank || 'A1'}`} />
          </div>
        </div>
      </section>

      {/* Recent Submissions */}
      <section className="student-dash__table card-base" style={{ padding: 0 }}>
        <div className="student-dash__table-header">
          <h3 className="text-title-lg">Recent Submissions</h3>
          <Link to="/student/progress" className="student-dash__view-all" style={{ textDecoration: 'none' }}>View All</Link>
        </div>
        <div className="student-dash__table-wrap">
          {recentEssays.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-outline)' }}>
              No essays written yet. Go write your first essay!
            </div>
          ) : (
            <table className="student-dash__submissions">
              <thead>
                <tr>
                  <th className="text-label-sm">DATE</th>
                  <th className="text-label-sm">TITLE</th>
                  <th className="text-label-sm">WORDS</th>
                  <th className="text-label-sm">STATUS</th>
                  <th className="text-label-sm">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {recentEssays.map((essay) => (
                  <tr key={essay._id}>
                    <td className="text-body-md">{new Date(essay.submittedAt || essay.createdAt).toLocaleDateString()}</td>
                    <td className="student-dash__essay-title">{essay.title}</td>
                    <td className="text-body-md">{essay.wordCount}</td>
                    <td>
                      <span className={`student-dash__status-badge ${essay.status === 'draft' ? 'student-dash__status-badge--draft' : ''}`}>
                        {essay.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {essay.status === 'draft' ? (
                        <Link to={`/student/write?id=${essay._id}`} className="text-label-md" style={{ color: 'var(--color-primary)' }}>Edit Draft</Link>
                      ) : (
                        <Link to={`/student/analysis/${essay._id}`} className="text-label-md" style={{ color: 'var(--color-primary)' }}>View Feedback</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
