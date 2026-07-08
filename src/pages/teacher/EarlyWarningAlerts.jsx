import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import './EarlyWarningAlerts.css'

/* ─── Helpers ────────────────────────────────────────── */
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

function metricLabel(metric) {
  if (!metric) return null
  const map = {
    vocabulary_stagnation: 'Vocabulary Stagnation',
    grammar_decline: 'Grammar Decline',
  }
  return map[metric] || metric.replace(/_/g, ' ')
}

const TYPE_FILTERS = [
  { key: '', label: 'All', icon: 'filter_list' },
  { key: 'critical', label: 'Critical', icon: 'warning' },
  { key: 'warning', label: 'Warning', icon: 'assignment_late' },
  { key: 'info', label: 'Info', icon: 'info' },
]

const PAGE_SIZE = 15

/* ─── Loading Skeleton ────────────────────────────────── */
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

/* ─── Alert Card ──────────────────────────────────────── */
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
            <div className="ewa-card__student-header">
              <h4 className="ewa-card__student-name">
                {alert.student?.name || 'Unknown Student'}
              </h4>
              {alert.student?.email && (
                <span className="ewa-card__student-email">({alert.student.email})</span>
              )}
            </div>
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
                  {metricLabel(alert.metric)}
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
          {!alert.isRead && !alert.isResolved && (
            <span className="ewa-badge ewa-badge--new">New</span>
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
      {!alert.isResolved ? (
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
      ) : (
        <div className="ewa-card__resolved-row">
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-success)' }}>verified</span>
          <span className="text-label-sm" style={{ color: 'var(--color-success)' }}>This alert has been resolved</span>
          <button
            className="ewa-btn ewa-btn--ghost"
            style={{ marginLeft: 'auto' }}
            onClick={() => navigate(`/teacher/student/${studentId}`)}
            disabled={!studentId}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
            View Profile
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────── */
export default function EarlyWarningAlerts() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [resolving, setResolving] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const hasMore = alerts.length < total

  // Track which alerts we auto-marked as read on mount
  const markedReadRef = useRef(new Set())

  /* ── Auto-mark unread alerts as read ─────────────────── */
  async function markAlertRead(alertId) {
    if (markedReadRef.current.has(alertId)) return
    markedReadRef.current.add(alertId)
    try {
      await api.patch(`/alerts/${alertId}/read`)
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, isRead: true } : a))
    } catch {
      // non-critical, ignore
    }
  }

  /* ── Fetch alerts (first page / filter change) ────────── */
  const loadAlerts = useCallback(async (reset = true) => {
    if (reset) {
      setLoading(true)
      setPage(1)
      setAlerts([])
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams()
      if (activeFilter) params.set('type', activeFilter)
      params.set('limit', PAGE_SIZE)
      params.set('page', reset ? 1 : page + 1)

      const res = await api.get(`/alerts?${params}`)
      // res = { success, count, total, page, data: [...] }
      const incoming = Array.isArray(res.data) ? res.data : []
      setTotal(res.total ?? 0)

      if (reset) {
        setAlerts(incoming)
      } else {
        setAlerts(prev => [...prev, ...incoming])
        setPage(p => p + 1)
      }

      // Auto-mark newly-loaded unread alerts
      incoming.filter(a => !a.isRead && !a.isResolved).forEach(a => {
        setTimeout(() => markAlertRead(a._id), 500)
      })
    } catch (err) {
      console.error('Error fetching alerts:', err)
      setError(err.message || 'Failed to load alerts. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter])

  /* ── Fetch stats ──────────────────────────────────────── */
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/alerts/stats')
      setStats(res.data || null)
    } catch {
      // non-critical
    }
  }, [])

  useEffect(() => {
    loadAlerts(true)
    loadStats()
  }, [loadAlerts, loadStats])

  /* ── Resolve handler ──────────────────────────────────── */
  async function handleResolve(alertId) {
    setResolving(alertId)
    try {
      await api.patch(`/alerts/${alertId}/resolve`)
      setAlerts(prev =>
        prev.map(a => a._id === alertId ? { ...a, isResolved: true, isRead: true } : a)
      )
      loadStats()
    } catch (err) {
      alert('Could not resolve alert: ' + (err.message || 'Unknown error'))
    } finally {
      setResolving(null)
    }
  }

  /* ── Derived lists ────────────────────────────────────── */
  const unresolved = alerts.filter(a => !a.isResolved)
  const resolved   = alerts.filter(a =>  a.isResolved)
  const displayed  = showResolved ? alerts : unresolved

  /* ── Group alerts by class name ──────────────────────── */
  const groupByClass = (list) => {
    const groups = {}
    list.forEach(a => {
      const key = a.class?.name || 'Other / No Class'
      if (!groups[key]) groups[key] = []
      groups[key].push(a)
    })
    return groups
  }
  const unresolvedGroups = groupByClass(unresolved)
  const resolvedGroups   = groupByClass(resolved)

  /* ─── RENDER ──────────────────────────────────────────── */
  return (
    <div className="ewa">

      {/* ── HEADER ── */}
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
        <button
          className="ewa-btn ewa-btn--refresh"
          onClick={() => { loadAlerts(true); loadStats() }}
          disabled={loading}
          title="Refresh alerts"
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`} style={{ fontSize: 20 }}>
            refresh
          </span>
          Refresh
        </button>
      </section>

      {/* ── STATS BAR ── */}
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
          <div className="ewa__stat-item ewa__stat-item--total">
            <span className="material-symbols-outlined">list_alt</span>
            <div>
              <span className="ewa__stat-value">{total}</span>
              <span className="ewa__stat-label">Total</span>
            </div>
          </div>
        </div>
      )}

      {/* ── FILTER BAR ── */}
      <div className="ewa__toolbar">
        <div className="ewa__filters" role="tablist" aria-label="Filter alerts by type">
          {TYPE_FILTERS.map(f => (
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
              {f.key === '' && unresolved.length > 0 && (
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

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="ewa__list">
          {[1, 2, 3].map(i => <AlertSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="ewa__state-box card-base ewa__state-box--error animate-fade-in">
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-error)' }}>error_outline</span>
          <h3 className="text-title-lg">Something went wrong</h3>
          <p className="text-body-md" style={{ color: 'var(--color-on-surface-variant)' }}>{error}</p>
          <button className="ewa-btn ewa-btn--primary" onClick={() => { loadAlerts(true); loadStats() }}>
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

          {/* Pending section — grouped by class */}
          {unresolved.length > 0 && (
            <div className="ewa__section-wrapper">
              <div className="ewa__section-label">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pending_actions</span>
                Pending ({unresolved.length}{hasMore ? '+' : ''})
              </div>
              {Object.entries(unresolvedGroups).map(([className, classAlerts]) => (
                <div key={`pending-${className}`} className="ewa__class-group">
                  <div className="ewa__class-group-header">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>class</span>
                    {className}{' '}
                    <span className="ewa__class-group-count">{classAlerts.length}</span>
                  </div>
                  <div className="ewa__class-group-list">
                    {classAlerts.map(a => (
                      <AlertCard
                        key={a._id}
                        alert={a}
                        onResolve={handleResolve}
                        resolving={resolving}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resolved section — grouped by class (toggle) */}
          {showResolved && resolved.length > 0 && (
            <div className="ewa__section-wrapper">
              <div className="ewa__section-label ewa__section-label--resolved">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>task_alt</span>
                Resolved ({resolved.length})
              </div>
              {Object.entries(resolvedGroups).map(([className, classAlerts]) => (
                <div key={`resolved-${className}`} className="ewa__class-group">
                  <div className="ewa__class-group-header ewa__class-group-header--resolved">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>class</span>
                    {className}{' '}
                    <span className="ewa__class-group-count">{classAlerts.length}</span>
                  </div>
                  <div className="ewa__class-group-list">
                    {classAlerts.map(a => (
                      <AlertCard
                        key={a._id}
                        alert={a}
                        onResolve={handleResolve}
                        resolving={resolving}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}


          {/* Load More */}
          {hasMore && (
            <button
              className="ewa-btn ewa-btn--load-more"
              onClick={() => loadAlerts(false)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span>
                  Loading…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>
                  Load more ({total - alerts.length} remaining)
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
