import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import './WeeklyComparisonWidget.css'

export default function WeeklyComparisonWidget({ studentId }) {
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchComparison() {
      try {
        setLoading(true)
        const url = studentId
          ? `/progress/weekly-comparison?studentId=${studentId}`
          : '/progress/weekly-comparison'
        const res = await api.get(url)
        if (res.success) {
          setComparison(res.data)
        } else {
          setError('Failed to fetch comparison data')
        }
      } catch (err) {
        console.error('Error fetching weekly comparison:', err)
        setError(err.message || 'Error fetching comparison data')
      } finally {
        setLoading(false)
      }
    }

    fetchComparison()
  }, [studentId])

  if (loading) {
    return (
      <div className="weekly-comparison-loading">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        <span className="text-body-sm">Loading comparison metrics...</span>
      </div>
    )
  }

  if (error || !comparison) {
    return (
      <div className="weekly-comparison-error text-body-sm">
        <span className="material-symbols-outlined text-color-error">warning</span>
        <span>{error || 'No comparison data available'}</span>
      </div>
    )
  }

  const renderTrend = (change, positiveIsGood = true) => {
    const isZero = change === 0
    const isPositive = change > 0
    const isGood = positiveIsGood ? isPositive : !isPositive

    let trendClass = 'weekly-comparison__trend'
    let icon = 'trending_flat'

    if (!isZero) {
      if (isGood) {
        trendClass += ' weekly-comparison__trend--up-good'
        icon = 'trending_up'
      } else {
        trendClass += ' weekly-comparison__trend--down-bad'
        icon = 'trending_down'
      }
    } else {
      trendClass += ' weekly-comparison__trend--flat'
    }

    return (
      <span className={trendClass}>
        <span className="material-symbols-outlined">{icon}</span>
        <span>{isZero ? 'No change' : `${isPositive ? '+' : ''}${change}%`}</span>
      </span>
    )
  }

  const metrics = [
    {
      title: 'Vocabulary TTR',
      icon: 'insights',
      color: 'primary',
      thisWeek: comparison.ttr.thisWeek.toFixed(2),
      lastWeek: comparison.ttr.lastWeek.toFixed(2),
      change: comparison.ttr.change,
      positiveIsGood: true,
      desc: 'Vocabulary diversity ratio'
    },
    {
      title: 'New Vocabulary',
      icon: 'dictionary',
      color: 'success',
      thisWeek: comparison.newWords.thisWeek,
      lastWeek: comparison.newWords.lastWeek,
      change: comparison.newWords.change,
      positiveIsGood: true,
      desc: 'Words added to study list'
    },
    {
      title: 'Sentence Complexity',
      icon: 'architecture',
      color: 'secondary',
      thisWeek: comparison.complexity.thisWeek.toFixed(2),
      lastWeek: comparison.complexity.lastWeek.toFixed(2),
      change: comparison.complexity.change,
      positiveIsGood: true,
      desc: 'Average clauses & structure score'
    }
  ]

  return (
    <div className="weekly-comparison">
      <div className="weekly-comparison__header">
        <h4 className="text-title-md">Weekly Progress Comparison</h4>
        <p className="text-body-sm" style={{ color: 'var(--color-outline)' }}>
          Comparing performance (last 7 days vs previous 7 days)
        </p>
      </div>

      <div className="weekly-comparison__grid">
        {metrics.map((metric, i) => (
          <div key={i} className="weekly-comparison__card card-base">
            <div className="weekly-comparison__card-header">
              <div className={`weekly-comparison__icon-wrapper weekly-comparison__icon-wrapper--${metric.color}`}>
                <span className="material-symbols-outlined">{metric.icon}</span>
              </div>
              <span className="text-label-md" style={{ fontWeight: 600 }}>{metric.title}</span>
            </div>

            <div className="weekly-comparison__card-body">
              <div className="weekly-comparison__value-block">
                <span className="text-headline-sm">{metric.thisWeek}</span>
                <span className="text-body-xs" style={{ color: 'var(--color-outline)' }}>this week</span>
              </div>
              
              <div className="weekly-comparison__divider-line"></div>

              <div className="weekly-comparison__value-block">
                <span className="text-title-sm" style={{ color: 'var(--color-outline)' }}>{metric.lastWeek}</span>
                <span className="text-body-xs" style={{ color: 'var(--color-outline)' }}>last week</span>
              </div>
            </div>

            <div className="weekly-comparison__card-footer">
              {renderTrend(metric.change, metric.positiveIsGood)}
              <span className="text-body-xs" style={{ color: 'var(--color-outline)' }}>{metric.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
