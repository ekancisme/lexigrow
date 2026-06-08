import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import StatCard from '../../components/common/StatCard'
import './TeacherDashboard.css'

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get('/teacher/dashboard')
        setData(res.data)
      } catch (err) {
        console.error('Error loading teacher dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="teacher-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    )
  }

  const { totalClasses, totalStudents, growing, stagnating, declining, recentAlerts, classes } = data

  const totalGrowthStudents = growing + stagnating + declining || 1
  const growingPct = Math.round((growing / totalGrowthStudents) * 100)
  const stagnatingPct = Math.round((stagnating / totalGrowthStudents) * 100)
  const decliningPct = Math.round((declining / totalGrowthStudents) * 100)

  // Map icon and color for classes decoration
  const getClsDecoration = (index) => {
    const list = [
      { icon: 'menu_book', color: 'primary' },
      { icon: 'history_edu', color: 'secondary' },
      { icon: 'translate', color: 'tertiary' },
    ]
    return list[index % list.length]
  }

  return (
    <div className="teacher-dash">
      <section className="teacher-dash__header">
        <div>
          <h2 className="text-headline-lg">Welcome to Teacher Dashboard</h2>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>Here is your classroom growth summary for today.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="teacher-dash__btn-primary" onClick={() => navigate('/teacher/classes')}>Manage Classes</button>
        </div>
      </section>

      <section className="teacher-dash__stats">
        <StatCard label="Total Classes" value={totalClasses} icon="class" color="primary" />
        <StatCard label="Total Students" value={totalStudents} icon="group" color="secondary" />
        <StatCard label="Growing" value={growing} icon="trending_up" color="primary" progress={growingPct} />
        <StatCard label="Stagnating" value={stagnating} icon="trending_flat" color="tertiary" progress={stagnatingPct} />
        <StatCard label="Declining" value={declining} icon="trending_down" color="error" progress={decliningPct} />
      </section>

      <div className="teacher-dash__body">
        <div className="teacher-dash__classes">
          <div className="teacher-dash__classes-header">
            <h4 className="text-title-lg">Your Classes</h4>
          </div>
          {classes.length === 0 ? (
            <div className="card-base" style={{ padding: 32, textAlign: 'center', color: 'var(--color-outline)' }}>
              No classes created yet. Click "Manage Classes" to create one.
            </div>
          ) : (
            classes.map((cls, idx) => {
              const deco = getClsDecoration(idx)
              return (
                <div key={cls._id} className="teacher-dash__class-card card-base" onClick={() => navigate(`/teacher/class/${cls._id}`)}>
                  <div className="teacher-dash__class-info">
                    <div className={`teacher-dash__class-icon teacher-dash__class-icon--${deco.color}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: 32 }}>{deco.icon}</span>
                    </div>
                    <div>
                      <h5 className="text-title-lg teacher-dash__class-name">{cls.name}</h5>
                      <div className="teacher-dash__class-meta">
                        <span className="text-label-md" style={{ color: 'var(--color-outline)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>group</span> {cls.students} Students
                        </span>
                        <span className="text-label-md" style={{ color: 'var(--color-outline)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>query_stats</span> Avg TTR: {cls.avgTTR?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="teacher-dash__class-actions">
                    <button className="teacher-dash__details-btn">View Details</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <aside className="teacher-dash__alerts">
          <div className="card-base" style={{ height: '100%' }}>
            <div className="teacher-dash__alerts-header">
              <h4 className="text-title-lg" style={{ fontWeight: 700 }}>Recent Alerts</h4>
              {recentAlerts.length > 0 && (
                <span className="teacher-dash__alert-count">{recentAlerts.length} NEW</span>
              )}
            </div>
            <div className="teacher-dash__alerts-list">
              {recentAlerts.length === 0 ? (
                <p className="text-body-md" style={{ color: 'var(--color-outline)', padding: 16, textAlign: 'center' }}>No recent alerts.</p>
              ) : (
                recentAlerts.map((a, i) => {
                  const alertType = a.severity === 'critical' ? 'error' : a.severity === 'warning' ? 'warning' : 'info'
                  const alertIcon = a.severity === 'critical' ? 'warning' : a.severity === 'warning' ? 'assignment_late' : 'info'
                  return (
                    <div key={a._id} className={`teacher-dash__alert teacher-dash__alert--${alertType}`}>
                      <div className="teacher-dash__alert-top">
                        <span className={`material-symbols-outlined teacher-dash__alert-icon--${alertType}`}>{alertIcon}</span>
                        <div>
                          <p className="text-label-md" style={{ fontWeight: 700 }}>{a.student?.name || 'Unknown Student'}</p>
                          <p className="text-label-sm" style={{ color: alertType === 'error' ? 'var(--color-error)' : alertType === 'info' ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
                            {a.message}
                          </p>
                        </div>
                      </div>
                      <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', margin: '8px 0 12px' }}>
                        Alert created on {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                      <button className={`teacher-dash__alert-btn teacher-dash__alert-btn--${alertType}`} onClick={() => navigate(`/teacher/student/${a.student?._id}`)}>
                        Review Profile
                      </button>
                    </div>
                  )
                })
              )}
            </div>
            <button className="teacher-dash__see-all" onClick={() => navigate('/teacher/alerts')}>See All Notifications</button>
          </div>
        </aside>
      </div>
    </div>
  )
}
