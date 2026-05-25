import { useState } from 'react'
import CircularProgress from '../../components/common/CircularProgress'
import './SetWeeklyGoals.css'

const defaultGoals = [
  { id: 1, label: 'New Words', target: 20, current: 16, icon: 'dictionary', color: 'primary' },
  { id: 2, label: 'Essays Written', target: 3, current: 2, icon: 'edit_note', color: 'secondary' },
  { id: 3, label: 'Writing Length (words)', target: 5000, current: 3250, icon: 'text_fields', color: 'tertiary' },
  { id: 4, label: 'Complexity Score', target: 8, current: 7.5, icon: 'equalizer', color: 'primary' },
]

export default function SetWeeklyGoals() {
  const [goals, setGoals] = useState(defaultGoals)

  function updateTarget(id, value) {
    setGoals(goals.map(g => g.id === id ? { ...g, target: Number(value) } : g))
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
        <button className="weekly-goals__save-btn">
          <span className="material-symbols-outlined">check</span>
          Save Goals
        </button>
      </section>

      {/* Progress Overview */}
      <section className="weekly-goals__progress">
        {goals.map(goal => (
          <div key={goal.id} className="weekly-goals__progress-card card-base">
            <CircularProgress
              percentage={Math.round((goal.current / goal.target) * 100)}
              color={goal.color}
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
            <div key={goal.id} className="weekly-goals__config-item">
              <div className="weekly-goals__config-label">
                <span className={`material-symbols-outlined`} style={{ color: `var(--color-${goal.color})`, fontSize: 20 }}>{goal.icon}</span>
                <span className="text-label-md">{goal.label}</span>
              </div>
              <div className="weekly-goals__config-input-row">
                <input
                  type="range"
                  className="weekly-goals__slider"
                  min={goal.label.includes('Complexity') ? 1 : goal.label.includes('Length') ? 1000 : 1}
                  max={goal.label.includes('Complexity') ? 10 : goal.label.includes('Length') ? 10000 : 50}
                  step={goal.label.includes('Length') ? 500 : 1}
                  value={goal.target}
                  onChange={(e) => updateTarget(goal.id, e.target.value)}
                />
                <input
                  type="number"
                  className="weekly-goals__number-input"
                  value={goal.target}
                  onChange={(e) => updateTarget(goal.id, e.target.value)}
                />
              </div>
              <div className="weekly-goals__config-bar">
                <div
                  className={`weekly-goals__config-fill weekly-goals__config-fill--${goal.color}`}
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
          <div className="weekly-goals__tip">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 20 }}>trending_up</span>
            <p className="text-label-md">Based on your growth rate, consider increasing your word target to 25 next week.</p>
          </div>
          <div className="weekly-goals__tip">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)', fontSize: 20 }}>schedule</span>
            <p className="text-label-md">Your most productive writing time is between 9-11 AM. Try scheduling essays then.</p>
          </div>
          <div className="weekly-goals__tip">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-tertiary)', fontSize: 20 }}>category</span>
            <p className="text-label-md">Focus on academic vocabulary this week—your scientific category needs more attention.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
