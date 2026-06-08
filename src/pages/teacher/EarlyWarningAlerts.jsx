import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './EarlyWarningAlerts.css'

export default function EarlyWarningAlerts() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('') // empty string means "All"

  async function loadAlerts() {
    setLoading(true)
    try {
      const url = activeFilter ? `/alerts?type=${activeFilter}` : '/alerts'
      const res = await api.get(url)
      setAlerts(res.data || [])
    } catch (err) {
      console.error('Error fetching alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [activeFilter])

  async function handleResolve(alertId) {
    try {
      await api.patch(`/alerts/${alertId}/resolve`)
      // Refresh list
      loadAlerts()
    } catch (err) {
      alert('Error resolving alert: ' + err.message)
    }
  }

  return (
    <div className="early-warnings">
      <section className="early-warnings__header">
        <h2 className="text-headline-lg">Early Warning Alerts</h2>
        <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
          Monitor students who need attention based on AI-detected patterns
        </p>
      </section>

      <div className="early-warnings__filters">
        <button
          className={`early-warnings__filter ${activeFilter === '' ? 'early-warnings__filter--active' : ''}`}
          onClick={() => setActiveFilter('')}
        >
          All
        </button>
        <button
          className={`early-warnings__filter ${activeFilter === 'critical' ? 'early-warnings__filter--active' : ''}`}
          onClick={() => setActiveFilter('critical')}
        >
          Critical
        </button>
        <button
          className={`early-warnings__filter ${activeFilter === 'warning' ? 'early-warnings__filter--active' : ''}`}
          onClick={() => setActiveFilter('warning')}
        >
          Warning
        </button>
        <button
          className={`early-warnings__filter ${activeFilter === 'info' ? 'early-warnings__filter--active' : ''}`}
          onClick={() => setActiveFilter('info')}
        >
          Info
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--color-primary)' }}>
            progress_activity
          </span>
        </div>
      ) : (
        <div className="early-warnings__list">
          {alerts.length === 0 ? (
            <div className="card-base" style={{ padding: 32, textAlign: 'center', color: 'var(--color-outline)' }}>
              No active warnings found. Good job!
            </div>
          ) : (
            alerts.map((a) => {
              const alertType = a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'warning' : a.severity === 'info' ? 'info' : 'success'
              const alertIcon = a.severity === 'critical' ? 'warning' : a.severity === 'warning' ? 'assignment_late' : 'info'
              return (
                <div key={a._id} className={`early-warnings__card card-base early-warnings__card--${alertType}`}>
                  <div className="early-warnings__card-top">
                    <div className="early-warnings__card-left">
                      <span className={`material-symbols-outlined early-warnings__icon--${alertType}`}>{alertIcon}</span>
                      <div>
                        <p className="text-label-md" style={{ fontWeight: 700 }}>{a.student?.name || 'Unknown student'}</p>
                        <p className="text-label-sm" style={{ color: 'var(--color-outline)' }}>{a.class?.name || 'No Class'}</p>
                      </div>
                    </div>
                    <div className="early-warnings__card-right">
                      <span className={`early-warnings__type-badge early-warnings__type-badge--${alertType}`}>{a.type || 'Alert'}</span>
                      <span className="text-label-sm" style={{ color: 'var(--color-outline)' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)', margin: '12px 0' }}>{a.message}</p>
                  <div className="early-warnings__card-actions">
                    <button className="early-warnings__action-btn" onClick={() => navigate(`/teacher/student/${a.student?._id}`)}>
                      View Profile
                    </button>
                    {!a.isResolved && (
                      <button className="early-warnings__action-btn early-warnings__action-btn--primary" onClick={() => handleResolve(a._id)}>
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
