import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './EarlyWarningAlerts.css'

/* ─── helpers ─────────────────────────────────────── */
function formatRelativeTime(dateStr) {
  const now = Date.now()
  const created = new Date(dateStr).getTime()
  const diffMs = now - created
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getAlertMeta(type) {
  switch (type) {
    case 'critical': return { icon: 'warning', label: 'Critical', cls: 'critical' }
    case 'warning': return { icon: 'assignment_late', label: 'Warning', cls: 'warning' }
    case 'info': return { icon: 'info', label: 'Info', cls: 'info' }
    case 'success': return { icon: 'check_circle', label: 'Success', cls: 'success' }
    default: return { icon: 'notifications', label: type || 'Alert', cls: 'info' }
  }
}

const FILTERS = [
  { key: '', label: 'All', icon: 'filter_list' },
  { key: 'critical', label: 'Critical', icon: 'warning' },
  { key: 'warning', label: 'Warning', icon: 'assignment_late' },
  { key: 'info', label: 'Info', icon: 'info' },
]

/* ─── Loading Skeleton ────────────────────────────── */
function AlertSkeleton() {
  return (
    <div className="ewa-skeleton card-base">
      <div className="ewa-skeleton__header">
        <div className="ewa-skeleton__avatar shimmer" />
        <div className="ewa-skeleton__lines">
          <div className="ewa-skeleton__line ewa-skeleton__line--wide shimmer" />
          <div className="ewa-skeleton__line ewa-skeleton__line--narrow shimmer" />
        </div>
        <div className="ewa-skeleton__badge shimmer" />
      </div>
      <div className="ewa-skeleton__body shimmer" />
      <div className="ewa-skeleton__footer">
        <div className="ewa-skeleton__btn shimmer" />
        <div className="ewa-skeleton__btn shimmer" />
      </div>
    </div>
  )
}

/* ─── Alert Card ──────────────────────────────────── */
function AlertCard({ alert, onResolve, resolving }) {
  const navigate = useNavigate()
  const meta = getAlertMeta(alert.type)
  const studentId = alert.student?._id

  return (
    <div
      className={`ewa-card card-base ewa-card--${meta.cls} ${alert.isResolved ? 'ewa-card--resolved' : ''} animate-fade-in`}
      role="article"
      aria-label={`Alert for ${alert.student?.name || 'Unknown student'}`}
    >
      {/* TOP ROW */}
      <div className="ewa-card__top">
        <div className="ewa-card__student">
          <div className={`ewa-card__avatar ewa-card__avatar--${meta.cls}`}>
            <span className="material-symbols-outlined">{meta.icon}</span>
          </div>
          <div className="ewa-card__student-info">
            <p className="text-label-md ewa-card__student-name">
              {alert.student?.name || 'Unknown Student'}
            </p>
            <div className="ewa-card__meta-row">
              {alert.class?.name && (
                <span className="ewa-card__meta-chip">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>class</span>
                  {alert.class.name}
                </span>
              )}
              {alert.metric && (
                <span className="ewa-card__meta-chip ewa-card__meta-chip--metric">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>query_stats</span>
                  {alert.metric}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="ewa-card__badges">
          <span className={`ewa-badge ewa-badge--${meta.cls}`}>{meta.label}</span>
          {alert.isResolved && (
            <span className="ewa-badge ewa-badge--resolved">Resolved</span>
          )}
          <span className="ewa-card__time text-label-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
            {formatRelativeTime(alert.createdAt)}
          </span>
        </div>
      </div>

      {/* DETAIL */}
      <p className="ewa-card__detail text-body-md">{alert.detail}</p>

      {/* ACTIONS */}
      {!alert.isResolved && (
        <div className="ewa-card__actions">
          <button
            id={`view-profile-${alert._id}`}
            className="ewa-btn ewa-btn--outline"
            onClick={() => navigate(`/teacher/student/${studentId}`)}
            disabled={!studentId}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
            View Profile
          </button>
          <button
            id={`resolve-${alert._id}`}
            className="ewa-btn ewa-btn--primary"
            onClick={() => onResolve(alert._id)}
            disabled={resolving === alert._id}
          >
            {resolving === alert._id ? (
              <>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>
                Resolving…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                Mark Resolved
              </>
            )}
          </button>
        </div>
      )}

      {alert.isResolved && (
        <div className="ewa-card__resolved-row">
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-success)' }}>verified</span>
          <span className="text-label-sm" style={{ color: 'var(--color-success)' }}>This alert has been resolved</span>
          <button
            className="ewa-btn ewa-btn--ghost"
            style={{ marginLeft: 'auto' }}
            onClick={() => navigate(`/teacher/student/${studentId}`)}
            disabled={!studentId}
          >
            View Profile
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Main Component ──────────────────────────────── */
export default function EarlyWarningAlerts() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('')
  const [resolving, setResolving] = useState(null)  // id of alert being resolved
  const [showResolved, setShowResolved] = useState(false)

  /* ── Fetch alerts ── */
  const loadAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (activeFilter) params.set('type', activeFilter)
      const url = `/alerts${params.toString() ? `?${params}` : ''}`
      const res = await api.get(url)
      // res = { success, count, total, page, data: [...] }
      setAlerts(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Error fetching alerts:', err)
      setError(err.message || 'Failed to load alerts. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [activeFilter])

  /* ── Fetch stats ── */
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/alerts/stats')
      setStats(res.data || null)
    } catch {
      // stats are non-critical, fail silently
    }
  }, [])

  useEffect(() => {
    loadAlerts()
    loadStats()
  }, [loadAlerts, loadStats])

  /* ── Resolve handler ── */
  async function handleResolve(alertId) {
    setResolving(alertId)
    try {
      await api.patch(`/alerts/${alertId}/resolve`)
      // Optimistic update: mark locally
      setAlerts(prev =>
        prev.map(a => a._id === alertId ? { ...a, isResolved: true, isRead: true } : a)
      )
      // Refresh stats
      loadStats()
    } catch (err) {
      alert('Could not resolve alert: ' + (err.message || 'Unknown error'))
    } finally {
      setResolving(null)
    }
  }

  /* ── Derived lists ── */
  const unresolved = alerts.filter(a => !a.isResolved)
  const resolved = alerts.filter(a => a.isResolved)
  const displayed = showResolved ? alerts : unresolved

  /* ─── RENDER ──────────────────────────────────── */
  return (
    <div className="ewa">

      {/* HEADER */}
      <section className="ewa__header">
        <div className="ewa__header-text">
          <div className="ewa__title-row">
            <div className="ewa__title-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>notifications_active</span>
            </div>
            <div>
              <h2 className="text-headline-lg">Early Warning Alerts</h2>
              <p className="text-body-md ewa__subtitle">
                AI-powered monitoring — identify students who need your attention before it's too late.
              </p>
            </div>
          </div>
        </div>
        <button className="ewa-btn ewa-btn--refresh" onClick={loadAlerts} disabled={loading} title="Refresh alerts">
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`} style={{ fontSize: 20 }}>
            refresh
          </span>
          Refresh
        </button>
      </section>

      {/* STATS BAR */}
      {stats && (
        <div className="ewa__stats animate-fade-in">
          <div className="ewa__stat-item ewa__stat-item--critical">
            <span className="material-symbols-outlined">warning</span>
            <div>
              <span className="ewa__stat-value">{stats.critical ?? 0}</span>
              <span className="ewa__stat-label">Critical</span>
            </div>
          </div>
          <div className="ewa__stat-item ewa__stat-item--warning">
            <span className="material-symbols-outlined">assignment_late</span>
            <div>
              <span className="ewa__stat-value">{stats.warning ?? 0}</span>
              <span className="ewa__stat-label">Warning</span>
            </div>
          </div>
          <div className="ewa__stat-item ewa__stat-item--info">
            <span className="material-symbols-outlined">info</span>
            <div>
              <span className="ewa__stat-value">{stats.info ?? 0}</span>
              <span className="ewa__stat-label">Info</span>
            </div>
          </div>
          <div className="ewa__stat-item ewa__stat-item--unread">
            <span className="material-symbols-outlined">mark_email_unread</span>
            <div>
              <span className="ewa__stat-value">{stats.unread ?? 0}</span>
              <span className="ewa__stat-label">Unread</span>
            </div>
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="ewa__toolbar">
        <div className="ewa__filters" role="tablist" aria-label="Filter alerts by type">
          {FILTERS.map(f => (
            <button
              key={f.key}
              id={`filter-${f.key || 'all'}`}
              role="tab"
              aria-selected={activeFilter === f.key}
              className={`ewa__filter-btn ${activeFilter === f.key ? 'ewa__filter-btn--active' : ''}`}
              onClick={() => setActiveFilter(f.key)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{f.icon}</span>
              {f.label}
              {f.key === '' && alerts.length > 0 && (
                <span className="ewa__filter-count">{unresolved.length}</span>
              )}
            </button>
          ))}
        </div>

        {resolved.length > 0 && (
          <button
            className={`ewa-btn ${showResolved ? 'ewa-btn--outline-active' : 'ewa-btn--ghost'}`}
            onClick={() => setShowResolved(p => !p)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {showResolved ? 'visibility_off' : 'visibility'}
            </span>
            {showResolved ? 'Hide Resolved' : `Show Resolved (${resolved.length})`}
          </button>
        )}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="ewa__list">
          {[1, 2, 3].map(i => <AlertSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="ewa__state-box card-base ewa__state-box--error animate-fade-in">
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-error)' }}>error_outline</span>
          <h3 className="text-title-lg">Something went wrong</h3>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>{error}</p>
          <button className="ewa-btn ewa-btn--primary" onClick={loadAlerts}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            Try Again
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="ewa__state-box card-base animate-fade-in">
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--color-success)' }}>check_circle</span>
          <h3 className="text-title-lg">
            {activeFilter
              ? `No ${activeFilter} alerts found`
              : 'No active alerts — great job!'}
          </h3>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
            {activeFilter
              ? 'Try a different filter or come back later.'
              : 'All students are on track. Keep monitoring for any changes.'}
          </p>
          {activeFilter && (
            <button className="ewa-btn ewa-btn--outline" onClick={() => setActiveFilter('')}>
              View All Alerts
            </button>
          )}
        </div>
      ) : (
        <div className="ewa__list">
          {/* Unresolved section */}
          {unresolved.length > 0 && (
            <>
              <div className="ewa__section-label">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pending_actions</span>
                Pending ({unresolved.length})
              </div>
              {unresolved.map(a => (
                <AlertCard
                  key={a._id}
                  alert={a}
                  onResolve={handleResolve}
                  resolving={resolving}
                />
              ))}
            </>
          )}

          {/* Resolved section (only when toggled) */}
          {showResolved && resolved.length > 0 && (
            <>
              <div className="ewa__section-label ewa__section-label--resolved">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>task_alt</span>
                Resolved ({resolved.length})
              </div>
              {resolved.map(a => (
                <AlertCard
                  key={a._id}
                  alert={a}
                  onResolve={handleResolve}
                  resolving={resolving}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
