import CircularProgress from '../../components/common/CircularProgress'
import './MyProgress.css'

const vocabCategories = [
  { name: 'Academic', count: 145, progress: 85, color: 'primary' },
  { name: 'Business', count: 92, progress: 62, color: 'secondary' },
  { name: 'Scientific', count: 78, progress: 55, color: 'tertiary' },
  { name: 'Daily Use', count: 210, progress: 95, color: 'success' },
]

const milestones = [
  { title: '500 Words Milestone', date: 'Oct 15, 2023', achieved: true },
  { title: 'First C1 Essay', date: 'Oct 10, 2023', achieved: true },
  { title: 'TTR > 0.7', date: 'Oct 20, 2023', achieved: true },
  { title: '1000 Words Milestone', date: 'Target: Nov 15', achieved: false },
]

export default function MyProgress() {
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
            <p className="text-headline-md">525</p>
            <p className="text-label-sm" style={{ color: 'var(--color-primary)' }}>+48 this month</p>
          </div>
        </div>
        <div className="my-progress__stat-card card-base">
          <div className="my-progress__stat-icon" style={{ background: 'rgba(22, 163, 74, 0.08)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-success)' }}>trending_up</span>
          </div>
          <div>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Growth Rate</p>
            <p className="text-headline-md">+12%</p>
            <p className="text-label-sm" style={{ color: 'var(--color-success)' }}>Above average</p>
          </div>
        </div>
        <div className="my-progress__stat-card card-base">
          <div className="my-progress__stat-icon" style={{ background: 'rgba(61, 96, 142, 0.08)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>analytics</span>
          </div>
          <div>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Avg. TTR Score</p>
            <p className="text-headline-md">0.72</p>
            <p className="text-label-sm" style={{ color: 'var(--color-secondary)' }}>+0.05 improvement</p>
          </div>
        </div>
        <div className="my-progress__stat-card card-base">
          <div className="my-progress__stat-icon" style={{ background: 'rgba(82, 95, 112, 0.08)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-tertiary)' }}>military_tech</span>
          </div>
          <div>
            <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>Current Rank</p>
            <p className="text-headline-md">C1</p>
            <p className="text-label-sm" style={{ color: 'var(--color-tertiary)' }}>Advanced</p>
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
              <path d="M0,220 C100,210 150,200 200,185 S350,150 400,130 S550,90 600,75 S750,35 800,20" fill="none" stroke="#005bbf" strokeWidth="3" />
              <path d="M0,220 C100,210 150,200 200,185 S350,150 400,130 S550,90 600,75 S750,35 800,20 L800,250 L0,250 Z" fill="url(#progressGradient)" />
            </svg>
            <div className="my-progress__chart-labels">
              <span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span>
            </div>
          </div>
        </div>

        {/* Vocabulary Categories */}
        <div className="card-base">
          <h3 className="text-title-lg" style={{ marginBottom: 24 }}>Vocabulary Categories</h3>
          <div className="my-progress__categories">
            {vocabCategories.map((cat, i) => (
              <div key={i} className="my-progress__category">
                <div className="my-progress__category-info">
                  <span className="text-label-md">{cat.name}</span>
                  <span className="text-data-mono">{cat.count} words</span>
                </div>
                <div className="my-progress__category-bar">
                  <div
                    className={`my-progress__category-fill my-progress__category-fill--${cat.color}`}
                    style={{ width: `${cat.progress}%` }}
                  />
                </div>
              </div>
            ))}
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
                <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>{m.date}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
