import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import './MyProgress.css'

export default function MyProgress() {
  const [overview, setOverview] = useState(null)
  const [categories, setCategories] = useState([])
  const [milestones, setMilestones] = useState([])
  const [growthData, setGrowthData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProgress() {
      try {
        const [overviewRes, categoriesRes, milestonesRes, growthRes] = await Promise.all([
          api.get('/progress/overview'),
          api.get('/vocabulary/stats'),
          api.get('/progress/milestones'),
          api.get('/progress/growth-chart'),
        ])
        setOverview(overviewRes.data)
        
        // Map category stats to array format
        const stats = categoriesRes.data || {}
        const mappedCats = [
          { name: 'Academic', count: stats.academic || 0, color: 'primary' },
          { name: 'Business', count: stats.business || 0, color: 'secondary' },
          { name: 'Scientific', count: stats.scientific || 0, color: 'tertiary' },
          { name: 'Daily Use', count: stats.daily || 0, color: 'success' },
        ]
        setCategories(mappedCats)
        setMilestones(milestonesRes.data || [])
        setGrowthData(growthRes.data || [])
      } catch (err) {
        console.error('Error fetching progress:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProgress()
  }, [])

  if (loading) {
    return (
      <div className="my-progress" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  // Draw chart based on real growthData
  const maxCumulative = growthData.length > 0 ? Math.max(...growthData.map(d => d.cumulative)) : 100
  const points = growthData.map((d, index) => {
    const x = (index / Math.max(1, growthData.length - 1)) * 800
    const y = 220 - ((d.cumulative / maxCumulative) * 200)
    return `${x},${y}`
  }).join(' ')

  const pathD = points ? `M 0,220 L ${points} L 800,220` : ''
  const lineD = points ? `M ${points}` : 'M 0,220 L 800,220'

  return (
    <div className="my-progress">
      <section className="my-progress__header">
        <h2 className="text-headline-lg">My Progress</h2>
        <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
          Track your vocabulary growth and writing improvement over time
        </p>
      </section>

      {/* Overview Stats */}
      <section className="my-progress__overview">
        <div className="my-progress__stat-card card-base">
          <div className="my-progress__stat-icon" style={{ background: 'rgba(0, 91, 191, 0.08)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>dictionary</span>
          </div>
          <div>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Total Vocabulary</p>
            <p className="text-headline-md">{overview?.totalVocab || 0}</p>
            <p className="text-label-sm" style={{ color: 'var(--color-primary)' }}>+{overview?.thisMonthWords || 0} this month</p>
          </div>
        </div>
        <div className="my-progress__stat-card card-base">
          <div className="my-progress__stat-icon" style={{ background: 'rgba(22, 163, 74, 0.08)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-success)' }}>trending_up</span>
          </div>
          <div>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Growth Rate</p>
            <p className="text-headline-md">+{overview?.growthRate || 0}%</p>
            <p className="text-label-sm" style={{ color: 'var(--color-success)' }}>vs last month</p>
          </div>
        </div>
        <div className="my-progress__stat-card card-base">
          <div className="my-progress__stat-icon" style={{ background: 'rgba(61, 96, 142, 0.08)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>analytics</span>
          </div>
          <div>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Avg. TTR Score</p>
            <p className="text-headline-md">{overview?.avgTTR?.toFixed(2) || '0.00'}</p>
            <p className="text-label-sm" style={{ color: 'var(--color-secondary)' }}>Vocabulary diversity</p>
          </div>
        </div>
        <div className="my-progress__stat-card card-base">
          <div className="my-progress__stat-icon" style={{ background: 'rgba(82, 95, 112, 0.08)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-tertiary)' }}>military_tech</span>
          </div>
          <div>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Current Rank</p>
            <p className="text-headline-md">{overview?.rank || 'A1'}</p>
            <p className="text-label-sm" style={{ color: 'var(--color-tertiary)' }}>English Level Rank</p>
          </div>
        </div>
      </section>

      <div className="my-progress__grid">
        {/* Growth Chart */}
        <div className="my-progress__chart card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 24 }}>Growth Over Time</h3>
          <div className="my-progress__chart-visual">
            <svg viewBox="0 0 800 250" className="my-progress__svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#005bbf" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#005bbf" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="62" x2="800" y2="62" stroke="#e5eeff" strokeWidth="1" />
              <line x1="0" y1="125" x2="800" y2="125" stroke="#e5eeff" strokeWidth="1" />
              <line x1="0" y1="187" x2="800" y2="187" stroke="#e5eeff" strokeWidth="1" />
              
              {growthData.length > 0 && (
                <>
                  <path d={lineD} fill="none" stroke="#005bbf" strokeWidth="3" />
                  <path d={pathD} fill="url(#progressGradient)" />
                </>
              )}
            </svg>
            <div className="my-progress__chart-labels">
              {growthData.map((d, i) => (
                <span key={i}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Vocabulary Categories */}
        <div className="card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 24 }}>Vocabulary Categories</h3>
          <div className="my-progress__categories">
            {categories.map((cat, i) => {
              const maxCount = overview?.totalVocab || 1
              const percentage = Math.round((cat.count / maxCount) * 100)
              return (
                <div key={i} className="my-progress__category">
                  <div className="my-progress__category-info">
                    <span className="text-label-md">{cat.name}</span>
                    <span className="text-data-mono">{cat.count} words</span>
                  </div>
                  <div className="my-progress__category-bar">
                    <div
                      className={`my-progress__category-fill my-progress__category-fill--${cat.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Milestones */}
      <section className="my-progress__milestones card-base">
        <h3 className="text-title-lg" style={{ marginBottom: 24 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', marginRight: 8 }}>emoji_events</span>
          Milestones
        </h3>
        <div className="my-progress__milestone-list">
          {milestones.map((m, i) => (
            <div key={i} className={`my-progress__milestone ${m.achieved ? 'my-progress__milestone--achieved' : ''}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: m.achieved ? 'var(--color-success)' : 'var(--color-outline)' }}>
                {m.achieved ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <div>
                <p className="text-label-md">{m.title}</p>
                <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Target: {m.target}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
