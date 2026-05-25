import './EarlyWarningAlerts.css'

const alerts = [
  { name: 'John Doe', class: 'English 101', type: 'critical', metric: 'TTR Declining', detail: 'TTR dropped from 0.72 to 0.55 in 7 days', icon: 'warning', time: '2 hours ago' },
  { name: 'Sarah Smith', class: 'Creative Writing II', type: 'warning', metric: 'Inactivity', detail: 'No new entries for 5 days', icon: 'assignment_late', time: '1 day ago' },
  { name: 'James Park', class: 'Linguistics Intro', type: 'warning', metric: 'Low TTR', detail: 'TTR below 0.50 threshold', icon: 'trending_down', time: '2 days ago' },
  { name: 'Emily Tran', class: 'English 101', type: 'info', metric: 'Goal Missed', detail: 'Missed weekly writing goal by 40%', icon: 'flag', time: '3 days ago' },
  { name: 'Advanced Group', class: 'English 101', type: 'success', metric: 'Quiz Ready', detail: '22 students reached vocabulary threshold', icon: 'psychology_alt', time: '3 days ago' },
]

export default function EarlyWarningAlerts() {
  return (
    <div className="early-warnings">
      <section className="early-warnings__header">
        <h2 className="text-headline-lg">Early Warning Alerts</h2>
        <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Monitor students who need attention based on AI-detected patterns</p>
      </section>

      <div className="early-warnings__filters">
        <button className="early-warnings__filter early-warnings__filter--active">All</button>
        <button className="early-warnings__filter">Critical</button>
        <button className="early-warnings__filter">Warning</button>
        <button className="early-warnings__filter">Info</button>
      </div>

      <div className="early-warnings__list">
        {alerts.map((a, i) => (
          <div key={i} className={`early-warnings__card card-base early-warnings__card--${a.type}`}>
            <div className="early-warnings__card-top">
              <div className="early-warnings__card-left">
                <span className={`material-symbols-outlined early-warnings__icon--${a.type}`}>{a.icon}</span>
                <div>
                  <p className="text-label-md" style={{ fontWeight: 700 }}>{a.name}</p>
                  <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>{a.class}</p>
                </div>
              </div>
              <div className="early-warnings__card-right">
                <span className={`early-warnings__type-badge early-warnings__type-badge--${a.type}`}>{a.metric}</span>
                <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>{a.time}</span>
              </div>
            </div>
            <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)', margin: '12px 0' }}>{a.detail}</p>
            <div className="early-warnings__card-actions">
              <button className="early-warnings__action-btn">View Profile</button>
              <button className="early-warnings__action-btn early-warnings__action-btn--primary">Take Action</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
