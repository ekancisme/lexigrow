import { useNavigate } from 'react-router-dom'
import StatCard from '../../components/common/StatCard'
import './TeacherDashboard.css'

const classes = [
  { id: 1, name: 'English 101 - Advanced', students: 22, avgTTR: 0.68, progress: 82, icon: 'menu_book', color: 'primary' },
  { id: 2, name: 'Creative Writing II', students: 18, avgTTR: 0.74, progress: 65, icon: 'history_edu', color: 'secondary' },
  { id: 3, name: 'Linguistics Intro', students: 45, avgTTR: 0.59, progress: 42, icon: 'translate', color: 'tertiary' },
]

const alerts = [
  { name: 'John Doe', type: 'error', label: 'Declining TTR', desc: 'TTR dropped from 0.72 to 0.55 in the last 7 days.', action: 'Review Profile', icon: 'warning' },
  { name: 'Sarah Smith', type: 'warning', label: 'Activity Inactive', desc: 'No new vocabulary entries recorded in 5 days.', action: 'Send Reminder', icon: 'assignment_late' },
  { name: 'Advanced Group', type: 'info', label: 'Quiz Ready', desc: '22 students reached the vocabulary threshold for Quiz 4.', action: 'Deploy Quiz', icon: 'psychology_alt' },
]

export default function TeacherDashboard() {
  const navigate = useNavigate()
  return (
    <div className="teacher-dash">
      <section className="teacher-dash__header">
        <div>
          <h2 className="text-headline-lg">Welcome, Prof. Elena</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Here is your classroom growth summary for today.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="teacher-dash__btn-outline">Generate Report</button>
          <button className="teacher-dash__btn-primary" onClick={() => navigate('/teacher/classes')}>Manage Classes</button>
        </div>
      </section>

      <section className="teacher-dash__stats">
        <StatCard label="Total Classes" value="4" icon="class" color="primary" />
        <StatCard label="Total Students" value="85" icon="group" color="secondary" />
        <StatCard label="Growing" value="60" icon="trending_up" color="primary" progress={70} />
        <StatCard label="Stagnating" value="15" icon="trending_flat" color="tertiary" progress={17} />
        <StatCard label="Declining" value="10" icon="trending_down" color="error" progress={12} />
      </section>

      <div className="teacher-dash__body">
        <div className="teacher-dash__classes">
          <div className="teacher-dash__classes-header">
            <h4 className="text-title-lg">Your Classes</h4>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="teacher-dash__view-btn"><span className="material-symbols-outlined">grid_view</span></button>
              <button className="teacher-dash__view-btn teacher-dash__view-btn--active"><span className="material-symbols-outlined">list</span></button>
            </div>
          </div>
          {classes.map(cls => (
            <div key={cls.id} className="teacher-dash__class-card card-base" onClick={() => navigate(`/teacher/class/${cls.id}`)}>
              <div className="teacher-dash__class-info">
                <div className={`teacher-dash__class-icon teacher-dash__class-icon--${cls.color}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>{cls.icon}</span>
                </div>
                <div>
                  <h5 className="text-title-lg teacher-dash__class-name">{cls.name}</h5>
                  <div className="teacher-dash__class-meta">
                    <span className="text-label-md" style={{ color: 'var(--color-outline)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>group</span> {cls.students} Students
                    </span>
                    <span className="text-label-md" style={{ color: 'var(--color-outline)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>query_stats</span> Avg TTR: {cls.avgTTR}
                    </span>
                  </div>
                </div>
              </div>
              <div className="teacher-dash__class-actions">
                <div className="teacher-dash__class-progress-wrap">
                  <p className="text-label-sm" style={{ color: 'var(--color-outline)', marginBottom: 4 }}>Progress</p>
                  <div className="teacher-dash__class-progress-bar">
                    <div className={`teacher-dash__class-progress-fill teacher-dash__class-progress-fill--${cls.color}`} style={{ width: `${cls.progress}%` }} />
                  </div>
                </div>
                <button className="teacher-dash__details-btn">View Details</button>
              </div>
            </div>
          ))}
        </div>

        <aside className="teacher-dash__alerts">
          <div className="card-base" style={{ height: '100%' }}>
            <div className="teacher-dash__alerts-header">
              <h4 className="text-title-lg" style={{ fontWeight: 700 }}>Recent Alerts</h4>
              <span className="teacher-dash__alert-count">3 NEW</span>
            </div>
            <div className="teacher-dash__alerts-list">
              {alerts.map((a, i) => (
                <div key={i} className={`teacher-dash__alert teacher-dash__alert--${a.type}`}>
                  <div className="teacher-dash__alert-top">
                    <span className={`material-symbols-outlined teacher-dash__alert-icon--${a.type}`}>{a.icon}</span>
                    <div>
                      <p className="text-label-md" style={{ fontWeight: 700 }}>{a.name}</p>
                      <p className="text-label-sm" style={{ color: a.type === 'error' ? 'var(--color-error)' : a.type === 'info' ? 'var(--color-primary)' : 'var(--color-secondary)' }}>{a.label}</p>
                    </div>
                  </div>
                  <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', margin: '8px 0 12px' }}>{a.desc}</p>
                  <button className={`teacher-dash__alert-btn teacher-dash__alert-btn--${a.type}`}>{a.action}</button>
                </div>
              ))}
            </div>
            <button className="teacher-dash__see-all" onClick={() => navigate('/teacher/alerts')}>See All Notifications</button>
          </div>
        </aside>
      </div>
    </div>
  )
}
