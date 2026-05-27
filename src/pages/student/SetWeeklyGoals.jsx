import { useState, useEffect } from 'react'
import api from '../../services/api.js'
import CircularProgress from '../../components/common/CircularProgress'
import './SetWeeklyGoals.css'

export default function SetWeeklyGoals() {
  const [weeklyGoalDoc, setWeeklyGoalDoc] = useState(null)
  const [goals, setGoals] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadGoalsData() {
      try {
        const [goalRes, recRes] = await Promise.all([
          api.get('/goals'),
          api.get('/goals/recommendations'),
        ])
        setWeeklyGoalDoc(goalRes.data)
        setGoals(goalRes.data?.goals || [])
        setRecommendations(recRes.data || [])
      } catch (err) {
        console.error('Error loading goals:', err)
      } finally {
        setLoading(false)
      }
    }
    loadGoalsData()
  }, [])

  function updateTarget(label, value) {
    setGoals(goals.map(g => g.label === label ? { ...g, target: Number(value) } : g))
  }

  async function handleSave() {
    if (!weeklyGoalDoc) return
    setSaving(true)
    try {
      await api.put(`/goals/${weeklyGoalDoc._id}`, { goals })
      alert('Goals updated successfully!')
    } catch (err) {
      alert('Error updating goals: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="weekly-goals" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  return (
    <div className="weekly-goals">
      <section className="weekly-goals__header">
        <div>
          <h2 className="text-headline-lg">Set Weekly Goals</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            Define your targets and track your progress throughout the week
          </p>
        </div>
        <button className="weekly-goals__save-btn" onClick={handleSave} disabled={saving}>
          <span className="material-symbols-outlined">check</span>
          {saving ? 'Saving...' : 'Save Goals'}
        </button>
      </section>

      {/* Progress Overview */}
      <section className="weekly-goals__progress">
        {goals.map(goal => (
          <div key={goal.label} className="weekly-goals__progress-card card-base">
            <CircularProgress
              percentage={Math.min(100, Math.round((goal.current / goal.target) * 100))}
              color={goal.color || 'primary'}
              size={80}
            />
            <div className="weekly-goals__progress-info">
              <span className="text-label-md">{goal.label}</span>
              <span className="text-headline-md">{goal.current}<span className="text-body-md" style={{ color: 'var(--color-outline)' }}>/{goal.target}</span></span>
            </div>
          </div>
        ))}
      </section>

      {/* Goal Configuration */}
      <section className="weekly-goals__config card-base">
        <h3 className="text-title-lg" style={{ marginBottom: 24 }}>Configure Goals</h3>
        <div className="weekly-goals__config-list">
          {goals.map(goal => (
            <div key={goal.label} className="weekly-goals__config-item">
              <div className="weekly-goals__config-label">
                <span className={`material-symbols-outlined`} style={{ color: `var(--color-${goal.color || 'primary'})`, fontSize: 20 }}>{goal.icon || 'star'}</span>
                <span className="text-label-md">{goal.label}</span>
              </div>
              <div className="weekly-goals__config-input-row">
                <input
                  type="range"
                  className="weekly-goals__slider"
                  min={goal.label.includes('Complexity') ? 1 : goal.label.includes('Length') ? 1000 : 1}
                  max={goal.label.includes('Complexity') ? 10 : goal.label.includes('Length') ? 10000 : 100}
                  step={goal.label.includes('Length') ? 500 : 1}
                  value={goal.target}
                  onChange={(e) => updateTarget(goal.label, e.target.value)}
                />
                <input
                  type="number"
                  className="weekly-goals__number-input"
                  value={goal.target}
                  onChange={(e) => updateTarget(goal.label, e.target.value)}
                />
              </div>
              <div className="weekly-goals__config-bar">
                <div
                  className={`weekly-goals__config-fill weekly-goals__config-fill--${goal.color || 'primary'}`}
                  style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="weekly-goals__tips card-base">
        <h3 className="text-title-lg" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>psychology</span>
          AI Recommendations
        </h3>
        <div className="weekly-goals__tips-grid">
          {recommendations.length > 0 ? (
            recommendations.map((rec, i) => (
              <div key={i} className="weekly-goals__tip">
                <span className="material-symbols-outlined" style={{ color: `var(--color-${rec.color || 'primary'})`, fontSize: 20 }}>{rec.icon || 'star'}</span>
                <p className="text-label-md">{rec.text}</p>
              </div>
            ))
          ) : (
            <p className="text-body-md" style={{ color: 'var(--color-outline)' }}>No recommendations available yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
